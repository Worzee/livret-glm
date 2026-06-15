import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Refonte modulaire de l'organisation du suivi (CDC §5.1, mai 2026).
 *
 * Le formateur référent ajoute à la demande chaque événement (réunion de
 * rentrée, visites multiples, etc.) en choisissant un motif parmi le
 * catalogue. Plusieurs événements peuvent partager le même motif — le titre
 * optionnel sert à les distinguer.
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('le formateur voit les événements scénarisés de Léa MARTIN (10 événements dont 3 visites)', async ({
  page,
}) => {
  // Reset → rôle = formateur, apprenti·e actif·ve = Léa MARTIN.
  await page.goto('/livret/organisation-suivi');
  // Léa a 10 événements dans la fixture (5 standards + 3 visites en entreprise
  // + 2 entretiens tripartites — chantier #2).
  await expect(page.locator('article[data-testid^="org-evt-"]')).toHaveCount(10);
  // Les 3 visites doivent porter chacune un titre custom (« Visite n°1/2/3 »).
  // Côté formateur, le titre est dans un <input> éditable → on lit `value`.
  const titres = await page
    .locator('article[data-testid^="org-evt-"] input[type="text"]')
    .evaluateAll((els) => (els as HTMLInputElement[]).map((el) => el.value));
  expect(titres).toContain('Visite n°1');
  expect(titres).toContain('Visite n°2');
  expect(titres.some((t) => /Visite n°3/.test(t))).toBe(true);
});

test("le sélecteur d'ajout est masqué pour l'apprenti·e (lecture seule)", async ({ page }) => {
  await selectRole(page, 'Apprenti·e');
  await page.goto('/livret/organisation-suivi');
  await expect(page.getByTestId('ajout-evenement')).toHaveCount(0);
  // Le bandeau « Vous consultez en mode … » doit apparaître.
  await expect(page.getByText(/modification réservée au formateur référent/i)).toBeVisible();
});

test('le formateur ne peut créer QUE les motifs entretien tripartite (juin 2026)', async ({
  page,
}) => {
  // Rôle formateur par défaut : le sélecteur ne propose que les entretiens
  // (1..N de la formation), les autres motifs relèvent du coordo.
  await page.goto('/livret/organisation-suivi');
  const select = page.getByTestId('org-motif-ajout');
  await expect(select.locator('option[value="entretien-tripartite-1"]')).toHaveCount(1);
  await expect(select.locator('option[value="entretien-tripartite-2"]')).toHaveCount(1);
  await expect(select.locator('option[value="reunion-rentree"]')).toHaveCount(0);
  await expect(select.locator('option[value="visite-entreprise"]')).toHaveCount(0);
  await expect(select.locator('option[value="autre"]')).toHaveCount(0);
});

test('le coordo peut ajouter un événement « Autre » et y saisir un titre', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/livret/organisation-suivi');
  const cartesAvant = await page.locator('article[data-testid^="org-evt-"]').count();

  // Choisir un motif puis cliquer Ajouter.
  await page.getByTestId('org-motif-ajout').selectOption('autre');
  await page.getByTestId('org-ajouter-evt').click();

  // Une carte de plus.
  await expect(page.locator('article[data-testid^="org-evt-"]')).toHaveCount(cartesAvant + 1);

  // La nouvelle carte (la dernière) est de motif « Autre » et permet d'éditer
  // titre / date / commentaire.
  const nouvelle = page.locator('article[data-testid^="org-evt-"]').last();
  await expect(nouvelle.getByText('Autre', { exact: true })).toBeVisible();
  const titre = nouvelle.locator('input[type="text"]');
  await titre.fill('Conseil de classe trimestriel');
  await expect(titre).toHaveValue('Conseil de classe trimestriel');
});

test('plusieurs événements du même motif sont autorisés (ajout 2× « Visites en entreprise »)', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/livret/organisation-suivi');
  // Léa en a déjà 3 dans la fixture, on en ajoute 2 supplémentaires.
  const visitesAvant = await page
    .locator('article[data-testid^="org-evt-"]', { hasText: 'Visites en entreprise' })
    .count();

  for (let i = 0; i < 2; i++) {
    await page.getByTestId('org-motif-ajout').selectOption('visite-entreprise');
    await page.getByTestId('org-ajouter-evt').click();
  }

  const visitesApres = await page
    .locator('article[data-testid^="org-evt-"]', { hasText: 'Visites en entreprise' })
    .count();
  expect(visitesApres).toBe(visitesAvant + 2);
});

test('le formateur référent ne peut PAS supprimer un événement (réservé coordo/admin — 15 juin 2026)', async ({
  page,
}) => {
  // Rôle formateur par défaut : les cartes existent mais aucun bouton de
  // suppression n'est rendu (le formateur crée / modifie sans supprimer).
  await page.goto('/livret/organisation-suivi');
  await expect(page.locator('article[data-testid^="org-evt-"]').first()).toBeVisible();
  await expect(page.locator('[data-testid^="org-supprimer-"]')).toHaveCount(0);

  // Le coordo, lui, dispose des boutons de suppression.
  await selectRole(page, 'Coordinateur·rice');
  await expect(page.locator('[data-testid^="org-supprimer-"]').first()).toBeVisible();
});

test("suppression d'un événement avec confirmation à 2 clics (coordo)", async ({ page }) => {
  // Suppression réservée au coordo / admin (15 juin 2026).
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/livret/organisation-suivi');
  const cartesAvant = await page.locator('article[data-testid^="org-evt-"]').count();

  // Cible une carte SUPPRIMABLE : les événements « Entretien Tripartite »
  // dont l'entretien est signé sont insupprimables depuis juin 2026 — on
  // prend une visite en entreprise.
  const premiere = page
    .locator('article[data-testid^="org-evt-"]', { hasText: 'Visites en entreprise' })
    .first();
  const idAttr = await premiere.getAttribute('data-testid');
  expect(idAttr).not.toBeNull();
  const evtId = idAttr!.replace('org-evt-', '');
  const bouton = page.getByTestId(`org-supprimer-${evtId}`);

  // 1er clic — entre en mode confirmation
  await bouton.click();
  await expect(bouton).toContainText(/Confirmer/i);
  // Toujours présente
  await expect(page.locator('article[data-testid^="org-evt-"]')).toHaveCount(cartesAvant);

  // 2ᵉ clic — suppression effective
  await bouton.click();
  await expect(page.locator('article[data-testid^="org-evt-"]')).toHaveCount(cartesAvant - 1);
});

test("un événement verrouillé ne peut pas être supprimé tant qu'on ne le déverrouille pas", async ({
  page,
}) => {
  // Coordo : seul rôle (avec l'admin) pouvant créer un motif « Autre »
  // depuis juin 2026.
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/livret/organisation-suivi');

  // Créer un événement frais pour ne dépendre d'aucune fixture.
  await page.getByTestId('org-motif-ajout').selectOption('autre');
  await page.getByTestId('org-ajouter-evt').click();

  const carte = page.locator('article[data-testid^="org-evt-"]').last();
  const idAttr = await carte.getAttribute('data-testid');
  const evtId = idAttr!.replace('org-evt-', '');
  const boutonSupprimer = page.getByTestId(`org-supprimer-${evtId}`);
  const boutonVerrou = carte.getByRole('button', { name: /Verrouiller le champ/i });

  // Verrouiller la carte → le bouton « Supprimer » devient désactivé.
  await boutonVerrou.click();
  await expect(boutonSupprimer).toBeDisabled();
  // Le tooltip explique pourquoi.
  await expect(boutonSupprimer).toHaveAttribute('title', /déverrouillez/i);

  // Déverrouiller → le bouton redevient actif et la suppression fonctionne.
  const boutonDeverrouiller = carte.getByRole('button', {
    name: /Déverrouiller le champ/i,
  });
  await boutonDeverrouiller.click();
  await expect(boutonSupprimer).toBeEnabled();

  // Suppression effective (2 clics — confirmation).
  await boutonSupprimer.click();
  await boutonSupprimer.click();
  await expect(page.locator(`[data-testid="org-evt-${evtId}"]`)).toHaveCount(0);
});

test("l'événement d'un entretien signé par au moins une partie est insupprimable (juin 2026)", async ({
  page,
}) => {
  // Suppression réservée au coordo / admin (15 juin 2026) → on se place en
  // coordo pour voir le bouton, désactivé par le verrou « entretien signé ».
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/livret/organisation-suivi');

  // E1 de Léa est signé 3/3 dans les fixtures → la fiche de suivi
  // correspondante est protégée (bouton désactivé + raison en infobulle).
  const carteE1 = page
    .locator('article[data-testid^="org-evt-"]', { hasText: 'Entretien Tripartite 1' })
    .first();
  const idE1 = (await carteE1.getAttribute('data-testid'))!.replace('org-evt-', '');
  const boutonE1 = page.getByTestId(`org-supprimer-${idE1}`);
  await expect(boutonE1).toBeDisabled();
  await expect(boutonE1).toHaveAttribute('title', /signé par 3 parties/i);

  // L'événement « Entretien Tripartite 2 » (entretien non initialisé, donc
  // sans signature) reste supprimable.
  const carteE2 = page
    .locator('article[data-testid^="org-evt-"]', { hasText: 'Entretien Tripartite 2' })
    .first();
  const idE2 = (await carteE2.getAttribute('data-testid'))!.replace('org-evt-', '');
  await expect(page.getByTestId(`org-supprimer-${idE2}`)).toBeEnabled();
});

test('le coordo peut gérer les événements de suivi (juin 2026)', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/livret/organisation-suivi');

  // Le sélecteur d'ajout est visible (plus de lecture seule pour le coordo).
  await expect(page.getByTestId('ajout-evenement')).toBeVisible();

  // Le liseré des cartes suit la couleur du rôle actif (utility --ring),
  // plus le violet formateur codé en dur.
  await expect(page.locator('article[data-testid^="org-evt-"]').first()).toHaveClass(
    /bordure-gauche-couleur-role/,
  );

  // Ajout d'un événement « Autre ».
  const avant = await page.locator('article[data-testid^="org-evt-"]').count();
  await page.getByTestId('org-motif-ajout').selectOption('autre');
  await page.getByTestId('org-ajouter-evt').click();
  await expect(page.locator('article[data-testid^="org-evt-"]')).toHaveCount(avant + 1);
});

test("l'admin peut aussi gérer les événements de suivi (juin 2026)", async ({ page }) => {
  await selectRole(page, 'Admin');
  await page.goto('/livret/organisation-suivi');
  await expect(page.getByTestId('ajout-evenement')).toBeVisible();
  await expect(page.locator('article[data-testid^="org-evt-"]').first()).toHaveClass(
    /bordure-gauche-couleur-role/,
  );
});

test('le coordo ne peut PAS initialiser un entretien (acte pédagogique du formateur)', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  // Sofia n'a pas d'entretien 1 initialisé — URL directe.
  await page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i }).click();
  await page.goto('/livret/entretien/1');
  await expect(page.getByText(/n'a pas encore été initialisé/i)).toBeVisible();
  await expect(page.getByTestId('init-entretien-1')).toHaveCount(0);
});

test('persistance après reload : un nouvel événement survit', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/livret/organisation-suivi');
  await page.getByTestId('org-motif-ajout').selectOption('bilan-formation');
  await page.getByTestId('org-ajouter-evt').click();

  // Saisir un commentaire dans la nouvelle carte (la dernière).
  const nouvelle = page.locator('article[data-testid^="org-evt-"]').last();
  const com = nouvelle.locator('textarea').first();
  await com.fill('Bilan ajouté via test E2E');

  await page.reload();

  // La carte est toujours là avec son commentaire.
  await expect(
    page.locator('article[data-testid^="org-evt-"]', {
      hasText: 'Bilan ajouté via test E2E',
    }),
  ).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// Modalité présentiel / distanciel + verrou par signature (15 juin 2026)
// ─────────────────────────────────────────────────────────────────────────────

test("entretien tripartite 1 : présentiel imposé et fiche figée quand l'entretien est signé (Minh)", async ({
  page,
}) => {
  // Minh : E1 signé par les 3 parties → sa fiche de suivi E1 est figée (R9).
  await page.getByRole('button', { name: /Ouvrir le livret de Minh NGUYEN/i }).click();
  await page.goto('/livret/organisation-suivi');

  const carte = page.getByTestId('org-evt-evt-minh-6');
  // Modalité E1 : présentiel obligatoire, affiché sans sélecteur (non modifiable).
  await expect(carte.getByTestId('org-modalite-evt-minh-6')).toContainText(/Présentiel/i);
  await expect(carte.getByTestId('org-modalite-presentiel-evt-minh-6')).toHaveCount(0);
  // Verrou par signature : bandeau visible + champs en lecture seule.
  await expect(carte.getByTestId('org-evt-fige-evt-minh-6')).toBeVisible();
  await expect(carte.locator('input[type="date"]')).toBeDisabled();
  // Le bouton « Verrouiller » manuel est masqué (verrou imposé, non basculable).
  await expect(carte.getByRole('button', { name: /Verrouiller le champ/i })).toHaveCount(0);
});

test('entretien tripartite 2 : la modalité présentiel / distanciel est sélectionnable (Léa)', async ({
  page,
}) => {
  // Léa, E2 non initialisé → carte éditable. Fixture : modalité « distanciel ».
  await page.goto('/livret/organisation-suivi');

  const presentiel = page.getByTestId('org-modalite-presentiel-evt-lea-10');
  const distanciel = page.getByTestId('org-modalite-distanciel-evt-lea-10');
  await expect(distanciel).toHaveAttribute('aria-pressed', 'true');
  await expect(presentiel).toHaveAttribute('aria-pressed', 'false');

  // Bascule vers présentiel → l'état suit et persiste au rechargement.
  await presentiel.click();
  await expect(presentiel).toHaveAttribute('aria-pressed', 'true');
  await expect(distanciel).toHaveAttribute('aria-pressed', 'false');

  await page.reload();
  await expect(page.getByTestId('org-modalite-presentiel-evt-lea-10')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
