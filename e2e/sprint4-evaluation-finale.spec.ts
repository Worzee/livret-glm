import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Scénario sprint 4 (CDC §22.2.3) :
 *   « Remplir et visualiser les grilles d'évaluation finales, vérifier le
 *     calcul de synthèse. »
 *
 * Les fiches de période contiennent déjà des évaluations (last-write-wins),
 * la synthèse doit donc afficher des compteurs non nuls dès le chargement.
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('la page Évaluation finale affiche les deux onglets et la synthèse', async ({ page }) => {
  await page.goto('/livret/evaluation-finale');
  await expect(page.getByRole('heading', { name: 'Évaluation finale' })).toBeVisible();

  // Les 2 onglets sont présents.
  await expect(page.getByRole('tab', { name: /Compétences/i })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Attitudes professionnelles/i })).toBeVisible();

  // La synthèse par bloc est affichée par défaut (onglet Compétences actif).
  await expect(page.getByRole('heading', { name: /Synthèse par bloc/i })).toBeVisible();
});

test('la synthèse hérite des fiches de période (last-write-wins)', async ({ page }) => {
  await page.goto('/livret/evaluation-finale');

  // La fixture de Léa contient des évaluations sur les fiches → au moins
  // une cellule porte le badge ✨ "Vue en Période N" (N = dernière période
  // où la cellule a été évaluée, last-write-wins).
  await expect(page.getByText(/Vue en Période \d+/i).first()).toBeVisible();
});

test("l'onglet Attitudes affiche la synthèse lecture seule des entretiens (juin 2026)", async ({
  page,
}) => {
  await page.goto('/livret/evaluation-finale');
  await page.getByRole('tab', { name: /Attitudes professionnelles/i }).click();
  await expect(
    page.getByRole('heading', { name: 'Attitudes professionnelles' }).first(),
  ).toBeVisible();
  // Synthèse par entretien : la colonne « Entretien 1 » porte les évaluations
  // de la fixture de Léa (E1 signé) — au moins un badge « ++ » visible.
  await expect(page.getByRole('columnheader', { name: /Entretien 1/i })).toBeVisible();
  await expect(page.getByText('++', { exact: true }).first()).toBeVisible();
});

test('maître : remplacer une évaluation entreprise héritée exige une confirmation (juin 2026)', async ({
  page,
}) => {
  await selectRole(page, 'Maître / Tuteur');
  await page.goto('/livret/evaluation-finale');

  // Précondition fixture : C1.1 de Léa est héritée de la Période 1 (Maîtrisé).
  // On scope la cellule entreprise — la colonne centre porte son propre badge.
  const cellule = page
    .getByRole('cell')
    .filter({ has: page.getByRole('radiogroup', { name: 'Acquis en entreprise pour C1.1' }) });
  await expect(cellule.getByText(/Vue en Période 1/i)).toBeVisible();

  // 1. Cliquer un autre niveau ouvre la modale — la valeur ne change PAS encore.
  await cellule.getByRole('radio', { name: 'Partiel', exact: true }).click();
  const modale = page.getByTestId('confirmation-heritage');
  await expect(modale).toBeVisible();
  await expect(modale.getByText(/provient de la fiche de la Période 1/i)).toBeVisible();

  // 2. Annuler → l'héritage est conservé.
  await page.getByTestId('confirmation-heritage-annuler').click();
  await expect(modale).toHaveCount(0);
  await expect(cellule.getByRole('radio', { name: 'Maîtrisé', exact: true })).toBeChecked();
  await expect(cellule.getByText(/Vue en Période 1/i)).toBeVisible();

  // 3. Re-cliquer puis confirmer → la saisie manuelle remplace l'héritage.
  await cellule.getByRole('radio', { name: 'Partiel', exact: true }).click();
  await page.getByTestId('confirmation-heritage-confirmer').click();
  await expect(modale).toHaveCount(0);
  await expect(cellule.getByRole('radio', { name: 'Partiel', exact: true })).toBeChecked();
  await expect(cellule.getByText(/Vue en Période 1/i)).toHaveCount(0);
});

test('en apprenti·e, les grilles sont en lecture seule (R24 + matrice)', async ({ page }) => {
  await selectRole(page, 'Apprenti·e');
  await page.goto('/livret/evaluation-finale');
  // Le bandeau d'avertissement « lecture seule » apparaît pour l'apprenti·e.
  await expect(page.getByText(/toutes les cellules.*lecture seule/i)).toBeVisible();
});

test('le bandeau de clôture R22 indique les fiches encore à verrouiller', async ({ page }) => {
  await page.goto('/livret/evaluation-finale');
  // Fixture initiale : P1 verrouillée, P2 signée (pas verrouillée), P3 en cours.
  // → le bandeau gris doit indiquer que la clôture est indisponible.
  await expect(page.getByText(/Clôture du livret indisponible/i)).toBeVisible();
});
