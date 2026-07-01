import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Banque de questions de l'entretien tripartite — refonte 13 juin 2026.
 *
 * - La banque est un **pur catalogue** (admin uniquement depuis le 18 juin
 *   2026) : libellé, cible, type. Plus de colonnes d'affectation E1..E4 ni
 *   « obligatoire ».
 * - Par défaut, TOUTE question est posée et obligatoire dans tous les
 *   entretiens. Le coordo **retire** les questions non pertinentes
 *   **par formation** (modale Planning).
 * - Le formateur référent ne compose plus les questions (lecture seule).
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('ni le formateur ni le coordo ne voient le lien « Banque de questions » (admin only)', async ({
  page,
}) => {
  // Formateur (rôle par défaut) : pas de lien.
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Banque de questions/i })).toHaveCount(0);
  // Coordo : plus d'accès depuis le 18 juin 2026 — lien absent + écran réservé.
  await selectRole(page, 'Coordinateur·rice');
  await expect(page.getByRole('link', { name: /Banque de questions/i })).toHaveCount(0);
  await page.goto('/admin/banque-questions');
  await expect(
    page.getByRole('heading', { name: /Accès réservé à l'administration/i }),
  ).toBeVisible();
});

test("l'admin voit la banque comme un pur catalogue (11 questions, sans affectation)", async ({
  page,
}) => {
  await selectRole(page, 'Admin');
  await page.goto('/admin/banque-questions');
  await expect(page.getByRole('heading', { name: /Banque de questions/i })).toBeVisible();
  // 7 questions apprenti + 4 questions maître = 11 lignes.
  await expect(page.locator('tr[data-testid^="banque-q-row-"]')).toHaveCount(11);
  // Les colonnes d'affectation ont disparu (13 juin 2026).
  await expect(page.getByRole('columnheader', { name: /Entretiens/i })).toHaveCount(0);
  await expect(page.getByRole('columnheader', { name: /Obligatoire/i })).toHaveCount(0);
});

test("ajout d'une nouvelle question apprenti·e (texte long)", async ({ page }) => {
  await selectRole(page, 'Admin');
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
  await selectRole(page, 'Admin');
  await page.goto('/admin/banque-questions');

  // Les questions par défaut sont toutes référencées par les entretiens des
  // fixtures (snapshot à l'initialisation).
  const ligneMotivations = page.locator('tr', { hasText: 'motivations pour cette formation' });
  const boutonSupprimer = ligneMotivations.getByRole('button', { name: /Supprimer la question/i });
  await expect(boutonSupprimer).toBeDisabled();
  await expect(ligneMotivations.getByText(/Utilisée dans au moins un entretien/i)).toBeVisible();
});

test("la modale Planning n'expose plus le retrait de questions par formation (1ᵉʳ juillet 2026)", async ({
  page,
}) => {
  // Réunion direction : les questions se gèrent uniquement dans la banque de
  // questions côté admin — la section « Questions de l'entretien tripartite »
  // a été retirée de la modale Planning (le mécanisme `questionsRetirees`
  // reste dans le modèle, sans UI pour le moment).
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  await page.getByRole('button', { name: /Planning des périodes de CAP Cuisine/i }).click();
  const modale = page.getByRole('dialog');
  await expect(modale.getByText(/Questions de l'entretien tripartite/i)).toHaveCount(0);
  await expect(modale.getByTestId('planning-question-q-app-ressenti-equipe')).toHaveCount(0);
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
