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

test("la synthèse hérite des fiches de période (last-write-wins)", async ({ page }) => {
  await page.goto('/livret/evaluation-finale');

  // La fixture de Léa contient des évaluations sur les fiches → au moins
  // une cellule porte le badge ✨ "Hérité des fiches".
  await expect(page.getByText(/Hérité des fiches/i).first()).toBeVisible();
});

test("l'onglet Attitudes affiche la grille du référentiel", async ({ page }) => {
  await page.goto('/livret/evaluation-finale');
  await page.getByRole('tab', { name: /Attitudes professionnelles/i }).click();
  // Les attitudes du référentiel CAP Cuisine — au moins une est visible.
  await expect(page.getByRole('heading', { name: 'Attitudes professionnelles' }).first()).toBeVisible();
});

test("en apprenti·e, les grilles sont en lecture seule (R24 + matrice)", async ({ page }) => {
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
