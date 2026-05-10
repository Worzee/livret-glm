import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Banque de questions de l'entretien tripartite (refonte mai 2026).
 *
 * - CRUD admin : seuls coordo + admin y accèdent.
 * - Le formateur référent sélectionne les questions à poser pour chaque
 *   livret depuis la page Entretien.
 * - Les réponses sont indexées par questionId.
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('le formateur référent ne voit pas le lien « Banque de questions »', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Banque de questions/i })).toHaveCount(0);
});

test('le coordo voit la banque pré-remplie (11 questions par défaut)', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/banque-questions');
  await expect(page.getByRole('heading', { name: /Banque de questions/i })).toBeVisible();
  // 7 questions apprenti + 4 questions maître = 11 lignes dans le tableau.
  const rows = page.locator('tr[data-testid^="banque-q-row-"]');
  await expect(rows).toHaveCount(11);
});

test("ajout d'une nouvelle question apprenti·e (texte long)", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/banque-questions');

  await page.getByTestId('banque-q-nouveau').click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('q-cible-apprenti').click();
  await modale.getByTestId('q-type').selectOption('texte-long');
  await modale.getByTestId('q-libelle').fill(
    'Avez-vous identifié un projet professionnel à 5 ans ?',
  );
  await modale.getByTestId('q-valider').click();

  // La nouvelle question apparaît dans la liste.
  await expect(
    page.getByText("Avez-vous identifié un projet professionnel à 5 ans ?"),
  ).toBeVisible();
});

test('suppression bloquée si la question est utilisée par un entretien', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/banque-questions');

  // Les 11 questions par défaut sont toutes utilisées par les fixtures
  // (chaque entretien a `questionsApprentiSelectionnees: idsQuestionsInitiales(...)`).
  const ligneMotivations = page.locator('tr', { hasText: 'motivations pour cette formation' });
  const boutonSupprimer = ligneMotivations.getByRole('button', {
    name: /Supprimer la question/i,
  });
  await expect(boutonSupprimer).toBeDisabled();
  await expect(ligneMotivations.getByText(/Utilisée dans au moins un entretien/i)).toBeVisible();
});

test('le formateur référent peut sélectionner les questions pour un livret', async ({
  page,
}) => {
  // Reset → rôle = formateur, apprenti·e = Léa MARTIN.
  await page.goto('/livret/entretien');

  // Bouton « Choisir les questions » côté apprenti·e (visible formateur).
  const boutonApp = page.getByTestId('apprenti-choisir-questions');
  await expect(boutonApp).toBeVisible();
  await expect(boutonApp).toContainText('(7)'); // 7 sélectionnées par défaut

  // Ouvre la modale de sélection.
  await boutonApp.click();
  const modale = page.getByRole('dialog');
  await expect(modale.getByRole('heading', { name: /Choisir les questions/i })).toBeVisible();

  // Décocher 2 questions au hasard (motivations + ressenti).
  await modale.getByTestId('selecteur-q-q-app-motivations').locator('input[type="checkbox"]').uncheck();
  await modale.getByTestId('selecteur-q-q-app-ressenti-equipe').locator('input[type="checkbox"]').uncheck();

  // Enregistrer.
  await modale.getByTestId('selecteur-q-valider').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Le bouton « Choisir » affiche maintenant 5 sélectionnées.
  await expect(boutonApp).toContainText('(5)');
});

test("l'apprenti·e ne voit pas le bouton « Choisir les questions »", async ({
  page,
}) => {
  await selectRole(page, 'Apprenti·e');
  await page.goto('/livret/entretien');
  await expect(page.getByTestId('apprenti-choisir-questions')).toHaveCount(0);
  await expect(page.getByTestId('maitre-choisir-questions')).toHaveCount(0);
});

test('les réponses indexées par questionId sont préservées entre les rendus', async ({
  page,
}) => {
  // Reset → rôle = formateur, apprenti·e = Léa MARTIN.
  await page.goto('/livret/entretien');
  // La fixture Léa contient une réponse pré-saisie pour `q-app-motivations`.
  // On vérifie qu'elle est rendue dans la section apprenti·e.
  // (En lecture seule pour le formateur — la question est éditable apprenti.)
  await expect(
    page.getByText(
      'Devenir cuisinière dans la restauration traditionnelle',
      { exact: false },
    ),
  ).toBeVisible();
});
