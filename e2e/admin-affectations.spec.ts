import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Étape 3 — Gestion des affectations (CDC §6 + §10.4).
 *
 * Couvre :
 *   - Accès refusé pour les rôles non-coordo/admin (formateur inclus)
 *   - Réaffectation d'un·e apprenti·e d'un maître à l'autre
 *   - Synchronisation des `apprentiIds` (compteurs corrects sur le tableau de bord)
 *   - Cas d'usage final : déplacer tous les apprenti·e·s de Karim → débloque
 *     la suppression de Karim (cohérence référentielle)
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('le formateur voit la page Affectations en accès refusé', async ({ page }) => {
  await selectRole(page, 'Formateur référent');
  await page.goto('/admin/affectations');
  await expect(page.getByRole('heading', { name: /Accès réservé/i })).toBeVisible();
});

test('le coordo accède à la page, restreinte à son périmètre (juin 2026)', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/affectations');
  await expect(page.getByRole('heading', { name: /Gestion des affectations/i })).toBeVisible();
  // Martine voit son périmètre : Léa, Théo, Sofia + la promo BTS (Camille, Yanis).
  await expect(page.locator('tbody tr')).toHaveCount(5);
  // La colonne Coordinateur·rice est en lecture seule pour le coordo.
  await expect(page.getByLabel(/Coordinateur·rice de Léa MARTIN/i)).toHaveCount(0);
  await expect(
    page.locator('tbody tr', { hasText: 'Léa MARTIN' }).getByText('Martine LEFÈVRE'),
  ).toBeVisible();

  // L'admin voit les 8 apprenti·e·s et peut éditer la colonne.
  await selectRole(page, 'Admin');
  await page.goto('/admin/affectations');
  await expect(page.locator('tbody tr')).toHaveCount(8);
  await expect(page.getByLabel(/Coordinateur·rice de Léa MARTIN/i)).toBeVisible();
});

/**
 * Déverrouille temporairement la ligne d'un·e apprenti·e (verrou actif quand
 * son contrat a démarré ou des fiches existent — fixtures démo).
 * 2 clics : « Déverrouiller » puis « Confirmer ».
 */
async function deverrouillerLigne(
  page: import('@playwright/test').Page,
  nomComplet: string | RegExp,
) {
  const ligne = page.locator('tbody tr', { hasText: nomComplet });
  await ligne.getByRole('button', { name: /^Déverrouiller temporairement/i }).click();
  await ligne.getByRole('button', { name: /^Confirmer le déverrouillage/i }).click();
}

test('verrou par défaut : tous les apprenti·e·s des fixtures sont verrouillé·e·s', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/affectations');
  // Bandeau d'info global.
  // Le bandeau compte le périmètre du coordo (Martine : 5 apprenti·e·s).
  await expect(page.getByText(/5 apprenti·es verrouillé·es par défaut/i)).toBeVisible();
  // Les selects de Léa sont disabled.
  const selectMaitreLea = page
    .locator('tbody tr', { hasText: /Léa MARTIN/ })
    .getByLabel(/^Maître \/ Tuteur de Léa MARTIN$/i);
  await expect(selectMaitreLea).toBeDisabled();
});

test('réaffecter Léa de Karim vers Hélène — synchronisation des compteurs', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/affectations');

  // Verrou actif : déverrouiller Léa avant modification.
  await deverrouillerLigne(page, /Léa MARTIN/);

  // Ligne de Léa : on change son maître pour Hélène
  const ligneLea = page.locator('tbody tr', { hasText: /Léa MARTIN/ });
  await ligneLea.getByLabel(/^Maître \/ Tuteur de Léa MARTIN$/i).selectOption({
    label: 'Hélène ROCHE',
  });

  // Bascule en rôle maître Karim — il ne doit plus avoir Léa.
  // 3 apprenti·e·s restants : Théo, Sofia + Luca (second maître — juin 2026).
  await selectRole(page, 'Maître / Tuteur');
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: /Karim BENALI/i }).getByText(/3 apprenti·e·s/i),
  ).toBeVisible();
  // Léa n'est plus dans la liste (seulement Théo et Sofia)
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Léa MARTIN/i })).toHaveCount(
    0,
  );

  // Bascule sur Hélène : 4 apprenti·e·s, dont Léa
  await page.getByRole('button', { name: /Hélène ROCHE/i }).click();
  await expect(
    page.getByRole('button', { name: /Hélène ROCHE/i }).getByText(/4 apprenti·e·s/i),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Léa MARTIN/i })).toBeVisible();
});

test('cas final : déplacer tous les apprenti·e·s de Karim débloque sa suppression', async ({
  page,
}) => {
  // En admin : Luca (second maître Karim) est hors du périmètre de Martine.
  await selectRole(page, 'Admin');
  await page.goto('/admin/affectations');

  // Réaffecte les 3 apprenti·e·s de Karim vers Hélène (verrou levé pour chacun·e)
  for (const nom of ['Léa MARTIN', 'Théo DUBOIS', 'Sofia PEREIRA']) {
    await deverrouillerLigne(page, new RegExp(nom));
    await page
      .locator('tbody tr', { hasText: nom })
      .getByLabel(new RegExp(`^Maître / Tuteur de ${nom}$`, 'i'))
      .selectOption({ label: 'Hélène ROCHE' });
  }

  // Karim est aussi SECOND maître de Luca (fixture juin 2026) — il faut
  // retirer ce rattachement pour libérer complètement Karim.
  await deverrouillerLigne(page, /Luca BIANCHI/);
  await page
    .locator('tbody tr', { hasText: 'Luca BIANCHI' })
    .getByLabel(/Second maître \/ tuteur de Luca BIANCHI/i)
    .selectOption({ label: '— Second (optionnel) —' });

  // Sur la page Utilisateurs, le bouton supprimer Karim doit maintenant être actif.
  await page.goto('/admin/utilisateurs');
  const ligneKarim = page.locator('tbody tr', { hasText: /Karim BENALI/ });
  await expect(ligneKarim.getByText(/apprenti·e·s rattaché·e·s/i)).toHaveCount(0);
  const boutonSupprimer = ligneKarim.getByRole('button', { name: /^Supprimer Karim BENALI/i });
  await expect(boutonSupprimer).toBeEnabled();

  // Suppression : 2 clics
  await boutonSupprimer.click();
  await ligneKarim
    .getByRole('button', { name: /Confirmer la suppression de Karim BENALI/i })
    .click();
  await expect(page.locator('tbody tr', { hasText: /Karim BENALI/ })).toHaveCount(0);
});

test("l'admin répartit les apprenti·e·s entre coordos — chaque coordo voit son périmètre (juin 2026)", async ({
  page,
}) => {
  // 1. L'admin réaffecte Léa (Martine → Bernard). Hors verrou : la
  //    répartition entre coordos est purement administrative.
  await selectRole(page, 'Admin');
  await page.goto('/admin/affectations');
  await page
    .locator('tbody tr', { hasText: 'Léa MARTIN' })
    .getByLabel(/Coordinateur·rice de Léa MARTIN/i)
    .selectOption({ label: 'Bernard PETIT' });

  // 2. Côté coordo : Martine (par défaut) perd Léa — reste Théo, Sofia + la
  //    promo BTS (Camille, Yanis).
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: /Martine LEFÈVRE/i }).getByText(/4 apprenti·e·s/i),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Léa MARTIN/i })).toHaveCount(
    0,
  );

  // 3. Bascule sur Bernard : 4 apprenti·e·s, dont Léa.
  await page.getByRole('button', { name: /Bernard PETIT/i }).click();
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Léa MARTIN/i })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Minh NGUYEN/i }),
  ).toBeVisible();
});

test('le coordo bascule de périmètre directement depuis la page Affectations (juin 2026)', async ({
  page,
}) => {
  // Reproduit le signalement « même en changeant de coordo actif·ve, je vois
  // toujours les mêmes 3 apprenti·e·s sur la page Affectations ». Le sélecteur
  // de périmètre était cantonné au tableau de bord : impossible de basculer
  // sans quitter la page. Il est désormais présent ici aussi.
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/affectations');

  // Périmètre par défaut (Martine) : Léa, Théo, Sofia + Camille, Yanis (BTS).
  await expect(page.locator('tbody tr')).toHaveCount(5);
  await expect(page.locator('tbody tr', { hasText: 'Léa MARTIN' })).toBeVisible();

  // Bascule sur Bernard sans quitter la page → son périmètre (Minh, Aya, Luca).
  await page.getByRole('button', { name: /Bernard PETIT/i }).click();
  await expect(page.locator('tbody tr')).toHaveCount(3);
  await expect(page.locator('tbody tr', { hasText: 'Minh NGUYEN' })).toBeVisible();
  await expect(page.locator('tbody tr', { hasText: 'Léa MARTIN' })).toHaveCount(0);
});

test("affecter un second maître ouvre l'accès au livret (double tutorat — juin 2026)", async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/affectations');

  // Théo n'a qu'un maître (Karim). On lui affecte Hélène en second.
  await deverrouillerLigne(page, /Théo DUBOIS/);
  const ligneTheo = page.locator('tbody tr', { hasText: 'Théo DUBOIS' });
  await ligneTheo
    .getByLabel(/Second maître \/ tuteur de Théo DUBOIS/i)
    .selectOption({ label: 'Hélène ROCHE' });

  // Côté maître : Hélène voit désormais Théo (Minh, Aya, Luca + Théo).
  await selectRole(page, 'Maître / Tuteur');
  await page.goto('/');
  await page.getByRole('button', { name: /Hélène ROCHE/i }).click();
  await expect(
    page.getByRole('button', { name: /Hélène ROCHE/i }).getByText(/4 apprenti·e·s/i),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Théo DUBOIS/i }),
  ).toBeVisible();
  // Karim (principal) garde évidemment Théo aussi.
  await page.getByRole('button', { name: /Karim BENALI/i }).click();
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Théo DUBOIS/i }),
  ).toBeVisible();
});

test('le changement de formateur référent est persisté', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/affectations');
  // Crée d'abord un nouveau formateur via la page Utilisateurs.
  await page.goto('/admin/utilisateurs');
  await page.getByRole('button', { name: /Nouveau · nouvelle/i }).click();
  await page.getByRole('menuitem', { name: /^Formateur référent/i }).click();
  const modale = page.getByRole('dialog');
  // pressSequentially au lieu de fill pour résister aux re-renders React
  // pendant la suite full (cf. discussion bug ModaleFormation).
  await modale.getByTestId('staff-email').waitFor({ state: 'visible' });
  await modale.getByTestId('staff-prenom').click();
  await modale.getByTestId('staff-prenom').pressSequentially('Marc');
  await modale.getByTestId('staff-nom').click();
  await modale.getByTestId('staff-nom').pressSequentially('Hubert');
  await modale.getByTestId('staff-email').click();
  await modale.getByTestId('staff-email').pressSequentially('marc.hubert@greta-demo.fr');
  await expect(modale.getByTestId('staff-email')).toHaveValue('marc.hubert@greta-demo.fr');
  await modale.getByRole('button', { name: /Créer formateur/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Retour aux affectations : on peut maintenant choisir Marc HUBERT pour Léa.
  await page.goto('/admin/affectations');
  await deverrouillerLigne(page, /Léa MARTIN/);
  await page
    .locator('tbody tr', { hasText: /Léa MARTIN/ })
    .getByLabel(/Formateur référent de Léa MARTIN/i)
    .selectOption({ label: 'Marc HUBERT' });

  // Recharge — le state persiste.
  await page.reload();
  const select = page
    .locator('tbody tr', { hasText: /Léa MARTIN/ })
    .getByLabel(/Formateur référent de Léa MARTIN/i);
  await expect(select).toHaveValue(/u-formateur-/);
  // Vérifie que le label sélectionné est bien Marc HUBERT.
  const valeur = await select.inputValue();
  const optionTexte = await page
    .locator('tbody tr', { hasText: /Léa MARTIN/ })
    .getByRole('option', { name: 'Marc HUBERT' })
    .getAttribute('value');
  expect(valeur).toBe(optionTexte);
});
