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

test('le sélecteur d\'ajout est masqué pour l\'apprenti·e (lecture seule)', async ({
  page,
}) => {
  await selectRole(page, 'Apprenti·e');
  await page.goto('/livret/organisation-suivi');
  await expect(page.getByTestId('ajout-evenement')).toHaveCount(0);
  // Le bandeau « Vous consultez en mode … » doit apparaître.
  await expect(page.getByText(/modification réservée au formateur référent/i)).toBeVisible();
});

test('le formateur peut ajouter un événement « Autre » et y saisir un titre', async ({
  page,
}) => {
  await page.goto('/livret/organisation-suivi');
  const cartesAvant = await page
    .locator('article[data-testid^="org-evt-"]')
    .count();

  // Choisir un motif puis cliquer Ajouter.
  await page.getByTestId('org-motif-ajout').selectOption('autre');
  await page.getByTestId('org-ajouter-evt').click();

  // Une carte de plus.
  await expect(page.locator('article[data-testid^="org-evt-"]')).toHaveCount(
    cartesAvant + 1,
  );

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

test('suppression d\'un événement avec confirmation à 2 clics', async ({ page }) => {
  await page.goto('/livret/organisation-suivi');
  const cartesAvant = await page
    .locator('article[data-testid^="org-evt-"]')
    .count();

  // Cible la première carte (n'importe laquelle convient pour le scénario)
  const premiere = page.locator('article[data-testid^="org-evt-"]').first();
  const idAttr = await premiere.getAttribute('data-testid');
  expect(idAttr).not.toBeNull();
  const evtId = idAttr!.replace('org-evt-', '');
  const bouton = page.getByTestId(`org-supprimer-${evtId}`);

  // 1er clic — entre en mode confirmation
  await bouton.click();
  await expect(bouton).toContainText(/Confirmer/i);
  // Toujours présente
  await expect(page.locator('article[data-testid^="org-evt-"]')).toHaveCount(
    cartesAvant,
  );

  // 2ᵉ clic — suppression effective
  await bouton.click();
  await expect(page.locator('article[data-testid^="org-evt-"]')).toHaveCount(
    cartesAvant - 1,
  );
});

test('un événement verrouillé ne peut pas être supprimé tant qu\'on ne le déverrouille pas', async ({
  page,
}) => {
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

test('persistance après reload : un nouvel événement survit', async ({ page }) => {
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
