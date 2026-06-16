import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Banque de questions de l'entretien tripartite — refonte 13 juin 2026.
 *
 * - La banque est un **pur catalogue** (coordo + admin) : libellé, cible,
 *   type. Plus de colonnes d'affectation E1..E4 ni « obligatoire ».
 * - Par défaut, TOUTE question est posée et obligatoire dans tous les
 *   entretiens. Le coordo **retire** les questions non pertinentes
 *   **par formation** (modale Planning).
 * - Le formateur référent ne compose plus les questions (lecture seule).
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('le formateur référent ne voit pas le lien « Banque de questions »', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Banque de questions/i })).toHaveCount(0);
});

test('le coordo voit la banque comme un pur catalogue (11 questions, sans affectation)', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/banque-questions');
  await expect(page.getByRole('heading', { name: /Banque de questions/i })).toBeVisible();
  // 7 questions apprenti + 4 questions maître = 11 lignes.
  await expect(page.locator('tr[data-testid^="banque-q-row-"]')).toHaveCount(11);
  // Les colonnes d'affectation ont disparu (13 juin 2026).
  await expect(page.getByRole('columnheader', { name: /Entretiens/i })).toHaveCount(0);
  await expect(page.getByRole('columnheader', { name: /Obligatoire/i })).toHaveCount(0);
});

test("ajout d'une nouvelle question apprenti·e (texte long)", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/banque-questions');

  await page.getByTestId('banque-q-nouveau').click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('q-cible-apprenti').click();
  await modale.getByTestId('q-type').selectOption('texte-long');
  await modale
    .getByTestId('q-libelle')
    .fill('Avez-vous identifié un projet professionnel à 5 ans ?');
  await modale.getByTestId('q-valider').click();

  await expect(
    page.getByText('Avez-vous identifié un projet professionnel à 5 ans ?'),
  ).toBeVisible();
  await expect(page.locator('tr[data-testid^="banque-q-row-"]')).toHaveCount(12);
});

test('suppression bloquée si la question est utilisée par un entretien', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/banque-questions');

  // Les questions par défaut sont toutes référencées par les entretiens des
  // fixtures (snapshot à l'initialisation).
  const ligneMotivations = page.locator('tr', { hasText: 'motivations pour cette formation' });
  const boutonSupprimer = ligneMotivations.getByRole('button', { name: /Supprimer la question/i });
  await expect(boutonSupprimer).toBeDisabled();
  await expect(ligneMotivations.getByText(/Utilisée dans au moins un entretien/i)).toBeVisible();
});

test('le coordo retire une question pour la formation — absente du futur entretien (13 juin 2026)', async ({
  page,
}) => {
  // 1. Le coordo retire « ressenti équipe » pour la formation CAP Cuisine
  //    via la modale Planning.
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  await page.getByRole('button', { name: /Planning des périodes de CAP Cuisine/i }).click();
  const caseQuestion = page.getByTestId('planning-question-q-app-ressenti-equipe');
  await expect(caseQuestion).toBeChecked(); // incluse par défaut
  await caseQuestion.uncheck();
  // Persiste après réouverture (Échap ferme la modale).
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Planning des périodes de CAP Cuisine/i }).click();
  await expect(page.getByTestId('planning-question-q-app-ressenti-equipe')).not.toBeChecked();
  await page.keyboard.press('Escape');

  // 2. Le formateur initialise l'entretien 2 de Léa (E1 signé 3/3).
  await selectRole(page, 'Formateur référent');
  await page.goto('/livret/entretien/2');
  await page.getByTestId('init-entretien-2').click();

  // 3. La question retirée n'apparaît pas ; une autre question apprenti, oui.
  await expect(page.getByText(/Comment vous sentez-vous au sein de votre équipe/i)).toHaveCount(0);
  await expect(page.getByText(/Quelles sont vos motivations pour cette formation/i)).toBeVisible();
});

test('le formateur ne compose plus les questions, présentes à E2 (aucun bouton de sélection)', async ({
  page,
}) => {
  // 16 juin 2026 : E1 utilise la trame officielle ; les questions de la banque
  // concernent les entretiens 2 à 4. E2 de Léa peut être initialisé (E1 signé).
  await page.goto('/livret/entretien/2');
  await page.getByTestId('init-entretien-2').click();
  await expect(page.getByTestId('apprenti-choisir-questions')).toHaveCount(0);
  await expect(page.getByTestId('maitre-choisir-questions')).toHaveCount(0);
  // Les questions imposées sont bien affichées (lecture / réponse).
  await expect(page.getByText(/Quelles sont vos motivations pour cette formation/i)).toBeVisible();
});

test('les réponses indexées par questionId sont préservées entre les rendus (E2)', async ({
  page,
}) => {
  // E1 utilise la trame ; les questions/réponses de la banque concernent E2-E4.
  await page.goto('/livret/entretien/2');
  await page.getByTestId('init-entretien-2').click();
  await selectRole(page, 'Apprenti·e');
  await page.goto('/livret/entretien/2');
  const champ = page.getByLabel(/Quelles sont vos motivations pour cette formation/i);
  await champ.fill('Projet de cuisine traditionnelle.');
  await page.reload();
  await expect(page.getByLabel(/Quelles sont vos motivations pour cette formation/i)).toHaveValue(
    'Projet de cuisine traditionnelle.',
  );
});
