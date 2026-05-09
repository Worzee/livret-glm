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

test('le coordo accède à la page et voit les 6 apprenti·e·s', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/affectations');
  await expect(page.getByRole('heading', { name: /Gestion des affectations/i })).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(6);
});

/**
 * Déverrouille temporairement la ligne d'un·e apprenti·e (verrou actif quand
 * son contrat a démarré ou des fiches existent — fixtures démo).
 * 2 clics : « Déverrouiller » puis « Confirmer ».
 */
async function deverrouillerLigne(page: import('@playwright/test').Page, nomComplet: string | RegExp) {
  const ligne = page.locator('tbody tr', { hasText: nomComplet });
  await ligne.getByRole('button', { name: /^Déverrouiller temporairement/i }).click();
  await ligne.getByRole('button', { name: /^Confirmer le déverrouillage/i }).click();
}

test('verrou par défaut : tous les apprenti·e·s des fixtures sont verrouillé·e·s', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/affectations');
  // Bandeau d'info global.
  await expect(page.getByText(/6 apprenti·es verrouillé·es par défaut/i)).toBeVisible();
  // Les selects de Léa sont disabled.
  const selectMaitreLea = page
    .locator('tbody tr', { hasText: /Léa MARTIN/ })
    .getByLabel(/Maître d'apprentissage de Léa MARTIN/i);
  await expect(selectMaitreLea).toBeDisabled();
});

test('réaffecter Léa de Karim vers Hélène — synchronisation des compteurs', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/affectations');

  // Verrou actif : déverrouiller Léa avant modification.
  await deverrouillerLigne(page, /Léa MARTIN/);

  // Ligne de Léa : on change son maître pour Hélène
  const ligneLea = page.locator('tbody tr', { hasText: /Léa MARTIN/ });
  await ligneLea.getByLabel(/Maître d'apprentissage de Léa MARTIN/i).selectOption({
    label: 'Hélène ROCHE',
  });

  // Bascule en rôle maître Karim — il ne doit plus avoir Léa (2 apprenti·e·s).
  await selectRole(page, "Maître d'apprentissage");
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: /Karim BENALI/i }).getByText(/2 apprenti·e·s/i),
  ).toBeVisible();
  // Léa n'est plus dans la liste (seulement Théo et Sofia)
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Léa MARTIN/i })).toHaveCount(0);

  // Bascule sur Hélène : 4 apprenti·e·s, dont Léa
  await page.getByRole('button', { name: /Hélène ROCHE/i }).click();
  await expect(
    page.getByRole('button', { name: /Hélène ROCHE/i }).getByText(/4 apprenti·e·s/i),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Léa MARTIN/i })).toBeVisible();
});

test('cas final : déplacer tous les apprenti·e·s de Karim débloque sa suppression', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/affectations');

  // Réaffecte les 3 apprenti·e·s de Karim vers Hélène (verrou levé pour chacun·e)
  for (const nom of ['Léa MARTIN', 'Théo DUBOIS', 'Sofia PEREIRA']) {
    await deverrouillerLigne(page, new RegExp(nom));
    await page
      .locator('tbody tr', { hasText: nom })
      .getByLabel(new RegExp(`Maître d'apprentissage de ${nom}`, 'i'))
      .selectOption({ label: 'Hélène ROCHE' });
  }

  // Sur la page Utilisateurs, le bouton supprimer Karim doit maintenant être actif.
  await page.goto('/admin/utilisateurs');
  const ligneKarim = page.locator('tbody tr', { hasText: /Karim BENALI/ });
  await expect(ligneKarim.getByText(/apprenti·e·s rattaché·e·s/i)).toHaveCount(0);
  const boutonSupprimer = ligneKarim.getByRole('button', { name: /^Supprimer Karim BENALI/i });
  await expect(boutonSupprimer).toBeEnabled();

  // Suppression : 2 clics
  await boutonSupprimer.click();
  await ligneKarim.getByRole('button', { name: /Confirmer la suppression de Karim BENALI/i }).click();
  await expect(page.locator('tbody tr', { hasText: /Karim BENALI/ })).toHaveCount(0);
});

test("le changement de formateur référent est persisté", async ({ page }) => {
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
  const select = page.locator('tbody tr', { hasText: /Léa MARTIN/ }).getByLabel(/Formateur référent de Léa MARTIN/i);
  await expect(select).toHaveValue(/u-formateur-/);
  // Vérifie que le label sélectionné est bien Marc HUBERT.
  const valeur = await select.inputValue();
  const optionTexte = await page
    .locator('tbody tr', { hasText: /Léa MARTIN/ })
    .getByRole('option', { name: 'Marc HUBERT' })
    .getAttribute('value');
  expect(valeur).toBe(optionTexte);
});
