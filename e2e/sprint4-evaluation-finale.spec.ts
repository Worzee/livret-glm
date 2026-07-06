import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Scénario sprint 4 (CDC §22.2.3), refondu en juillet 2026 (chantier
 * référentiels/compétences #3) :
 *   « Remplir et visualiser la grille de synthèse, vérifier le calcul. »
 *
 * Le menu « Évaluation finale » est devenu « Synthèse » : il ne présente que
 * les compétences abordées en stage (sélection entreprise, colonne unique
 * « Acquis en entreprise ») et les attitudes professionnelles, évaluées à
 * chaque période en entreprise (agrégation last-write-wins).
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('la page Synthèse affiche les deux onglets et la synthèse par bloc', async ({ page }) => {
  await page.goto('/livret/synthese');
  await expect(page.getByRole('heading', { name: 'Synthèse', exact: true })).toBeVisible();

  // Les 2 onglets sont présents.
  await expect(page.getByRole('tab', { name: /Compétences/i })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Attitudes professionnelles/i })).toBeVisible();

  // La synthèse par bloc est affichée par défaut (onglet Compétences actif).
  await expect(page.getByRole('heading', { name: /Synthèse par bloc/i })).toBeVisible();
});

test("l'ancienne URL « evaluation-finale » redirige vers la Synthèse", async ({ page }) => {
  await page.goto('/livret/evaluation-finale');
  await expect(page).toHaveURL(/\/livret\/synthese/);
  await expect(page.getByRole('heading', { name: 'Synthèse', exact: true })).toBeVisible();
});

test('la synthèse hérite des fiches de période (last-write-wins)', async ({ page }) => {
  await page.goto('/livret/synthese');

  // La fixture de Léa contient des évaluations sur les fiches → au moins
  // une cellule porte le badge ✨ "Vue en Période N" (N = dernière période
  // où la cellule a été évaluée, last-write-wins).
  await expect(page.getByText(/Vue en Période \d+/i).first()).toBeVisible();
});

test('la grille ne montre plus de colonne « Acquis en centre » (juillet 2026)', async ({
  page,
}) => {
  await page.goto('/livret/synthese');
  await expect(page.getByRole('columnheader', { name: /Acquis en entreprise/i }).first()).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /Acquis en centre/i })).toHaveCount(0);
});

test("l'onglet Attitudes agrège les évaluations des périodes en entreprise (juillet 2026)", async ({
  page,
}) => {
  await page.goto('/livret/synthese');
  await page.getByRole('tab', { name: /Attitudes professionnelles/i }).click();
  await expect(
    page.getByRole('heading', { name: 'Attitudes professionnelles' }).first(),
  ).toBeVisible();
  // La colonne « Dernier niveau évalué » porte les évaluations issues des
  // fiches de période de Léa — au moins un badge « ++ » visible.
  await expect(page.getByRole('columnheader', { name: /Dernier niveau évalué/i })).toBeVisible();
  await expect(page.getByText('++', { exact: true }).first()).toBeVisible();

  // Le last-write-wins mentionne la période d'origine : a5 a été réévaluée
  // en Période 3 (fixture Léa — P1 « + », P2/P3 « ++ »).
  const optionnelle = page.getByTestId('synthese-attitude-a5');
  await expect(optionnelle.getByText(/Période 3/i)).toBeVisible();
});

test('la synthèse récapitule les 4 attitudes obligatoires au-dessus des optionnelles (3 juillet 2026)', async ({
  page,
}) => {
  await page.goto('/livret/synthese');
  await page.getByRole('tab', { name: /Attitudes professionnelles/i }).click();

  // Les 4 obligatoires (critères de l'appréciation générale du maître, trame
  // officielle — évaluées à l'entretien) ouvrent le tableau, avec leur badge.
  const lignes = page.locator('tbody tr');
  await expect(lignes.nth(0)).toHaveAttribute(
    'data-testid',
    'synthese-attitude-oblig-ponctualite',
  );
  await expect(lignes.nth(1)).toHaveAttribute(
    'data-testid',
    'synthese-attitude-oblig-comprehensionConsignes',
  );
  await expect(lignes.nth(2)).toHaveAttribute(
    'data-testid',
    'synthese-attitude-oblig-qualiteTravail',
  );
  await expect(lignes.nth(3)).toHaveAttribute('data-testid', 'synthese-attitude-oblig-integration');
  await expect(lignes.nth(0).getByText('Obligatoire', { exact: true })).toBeVisible();

  // Le niveau des obligatoires vient de l'appréciation portée par Karim sur
  // Léa à l'entretien (fixture : ponctualité « ++ », source « Entretien »).
  await expect(lignes.nth(0).getByText('++', { exact: true })).toBeVisible();
  await expect(lignes.nth(0).getByText(/Entretien tripartite/i)).toBeVisible();

  // Les attitudes optionnelles retenues suivent, sans badge « Obligatoire ».
  const optionnelle = page.getByTestId('synthese-attitude-a5');
  await expect(optionnelle).toBeVisible();
  await expect(optionnelle.getByText('Obligatoire', { exact: true })).toHaveCount(0);
});

test('maître : remplacer une évaluation entreprise héritée exige une confirmation (juin 2026)', async ({
  page,
}) => {
  await selectRole(page, 'Maître / Tuteur');
  await page.goto('/livret/synthese');

  // Précondition fixture : C1.1 de Léa est héritée de la Période 1 (Maîtrisé).
  // (Affichage « libellé seul » depuis le 18 juin 2026 : l'aria-label porte le libellé.)
  const cellule = page.getByRole('cell').filter({
    has: page.getByRole('radiogroup', {
      name: 'Acquis en entreprise pour Réceptionner et stocker la marchandise',
    }),
  });
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

test('en apprenti·e, la grille est en lecture seule (R24 + matrice)', async ({ page }) => {
  await selectRole(page, 'Apprenti·e');
  await page.goto('/livret/synthese');
  // Le bandeau d'avertissement « lecture seule » apparaît pour l'apprenti·e.
  await expect(page.getByText(/toutes les cellules.*lecture seule/i)).toBeVisible();
});

test('le bandeau de clôture R22 indique les fiches encore à verrouiller', async ({ page }) => {
  await page.goto('/livret/synthese');
  // Fixture initiale : P1 verrouillée, P2 signée (pas verrouillée), P3 en cours.
  // → le bandeau gris doit indiquer que la clôture est indisponible.
  await expect(page.getByText(/Clôture du livret indisponible/i)).toBeVisible();
});
