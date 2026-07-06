import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Attitudes professionnelles (retours coordos juin 2026).
 *
 * - Catalogue global géré par l'admin uniquement (/admin/attitudes).
 * - Évaluées par le maître / tuteur à CHAQUE entretien tripartite.
 * - R20 : au moins une attitude évaluée pour que le maître signe.
 * - L'évaluation finale présente une synthèse en lecture seule (cf.
 *   sprint4-evaluation-finale.spec.ts).
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test("seul l'admin accède au catalogue des attitudes", async ({ page }) => {
  // Le coordo n'a pas le lien ni l'accès.
  await selectRole(page, 'Coordinateur·rice');
  await expect(page.getByRole('link', { name: /^Attitudes$/i })).toHaveCount(0);
  await page.goto('/admin/attitudes');
  await expect(
    page.getByRole('heading', { name: /Accès réservé à l'administration/i }),
  ).toBeVisible();

  // L'admin voit le catalogue pré-rempli (12 attitudes — a1..a4 retirées le
  // 18 juin 2026 car redondantes avec les critères de l'appréciation maître).
  await selectRole(page, 'Admin');
  await page.goto('/admin/attitudes');
  await expect(page.getByRole('heading', { name: /Attitudes professionnelles/i })).toBeVisible();
  await expect(page.locator('tr[data-testid^="attitude-row-"]')).toHaveCount(12);
});

test("l'admin peut créer puis modifier une attitude", async ({ page }) => {
  await selectRole(page, 'Admin');
  await page.goto('/admin/attitudes');

  // Création.
  await page.getByTestId('attitude-nouvelle').click();
  await page.getByTestId('attitude-libelle').fill('Respect des règles de sécurité');
  await page.getByTestId('attitude-valider').click();
  await expect(page.getByText('Respect des règles de sécurité')).toBeVisible();
  await expect(page.locator('tr[data-testid^="attitude-row-"]')).toHaveCount(13);

  // Modification.
  const ligne = page.locator('tr', { hasText: 'Respect des règles de sécurité' });
  await ligne.getByRole('button', { name: /Modifier l'attitude/i }).click();
  await page.getByTestId('attitude-libelle').fill('Respect strict des règles de sécurité');
  await page.getByTestId('attitude-valider').click();
  await expect(page.getByText('Respect strict des règles de sécurité')).toBeVisible();
});

test('suppression : libre pour une attitude non utilisée, bloquée sinon', async ({ page }) => {
  await selectRole(page, 'Admin');
  await page.goto('/admin/attitudes');

  // a5 est évaluée dans les entretiens des fixtures → suppression bloquée.
  const ligneA5 = page.locator('[data-testid="attitude-row-a5"]');
  await expect(ligneA5.getByRole('button', { name: /Supprimer l'attitude/i })).toBeDisabled();
  await expect(ligneA5.getByText(/Évaluée ou retenue dans au moins un livret/i)).toBeVisible();

  // a9 est RETENUE (choix fait à l'entretien, fixtures) sans être évaluée → bloquée aussi
  // (13 juin 2026 : une attitude référencée par un livret est protégée).
  const ligneA9 = page.locator('[data-testid="attitude-row-a9"]');
  await expect(ligneA9.getByRole('button', { name: /Supprimer l'attitude/i })).toBeDisabled();

  // Une attitude fraîchement créée se supprime librement (2 clics).
  await page.getByTestId('attitude-nouvelle').click();
  await page.getByTestId('attitude-libelle').fill('Attitude éphémère de test');
  await page.getByTestId('attitude-valider').click();
  const ligne = page.locator('tr', { hasText: 'Attitude éphémère de test' });
  const supprimer = ligne.getByRole('button', { name: /Supprimer l'attitude/i });
  await supprimer.click();
  await ligne.getByRole('button', { name: /Confirmer la suppression/i }).click();
  await expect(page.getByText('Attitude éphémère de test')).toHaveCount(0);
});

test("le choix des attitudes se fait à l'entretien et filtre la grille du maître (13 juin 2026)", async ({
  page,
}) => {
  // Sofia : entretien pas encore initialisé — le formateur l'initialise.
  await page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i }).click();
  await page.goto('/livret/entretien');
  await page.getByTestId('init-entretien').click();

  // La section de choix apparaît, vide au départ.
  const section = page.getByTestId('selection-attitudes');
  await expect(section).toBeVisible();
  await expect(section.getByText(/0 attitude retenue sur 12/i)).toBeVisible();

  // Le formateur retient 2 attitudes (choix partagé maître + formateur).
  await page.getByTestId('selection-attitude-a5').check();
  await page.getByTestId('selection-attitude-a9').check();
  await expect(section.getByText(/2 attitudes retenues sur 12/i)).toBeVisible();

  // Côté maître : la grille d'évaluation ne montre QUE les 2 retenues.
  await selectRole(page, 'Maître / Tuteur');
  const grille = page.getByTestId('attitudes-entretien');
  await expect(grille.getByRole('radiogroup')).toHaveCount(2);
  await expect(
    grille.getByRole('radiogroup', { name: "Attitude — Prise d'initiative et autonomie" }),
  ).toBeVisible();
});

test("le choix est figé dès que l'entretien est signé par les 3 parties", async ({ page }) => {
  // Léa (par défaut) : entretien signé 3/3 dans les fixtures.
  await page.goto('/livret/entretien');
  const section = page.getByTestId('selection-attitudes');
  await expect(section.getByText(/Choix figé/i)).toBeVisible();
  await expect(page.getByTestId('selection-attitude-a5')).toBeDisabled();
});

test("le maître évalue les attitudes dans l'entretien — R20 bloque la signature sans évaluation", async ({
  page,
}) => {
  // 1. Le formateur initialise l'entretien de Sofia et retient une attitude.
  await page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i }).click();
  await page.goto('/livret/entretien');
  await page.getByTestId('init-entretien').click();
  await expect(page.getByTestId('attitudes-entretien')).toBeVisible();
  await page.getByTestId('selection-attitude-a5').check();

  // 2. Côté maître : appréciation remplie mais aucune attitude → signature
  //    bloquée avec la raison R20 dédiée (grille enrichie de la trame).
  await selectRole(page, 'Maître / Tuteur');
  await page.getByTestId('appreciation-ponctualite-plus').click();
  await expect(page.getByText(/Évaluez au moins une attitude professionnelle/i)).toBeVisible();

  // 3. Évalue l'attitude retenue → la raison disparaît.
  await page
    .getByRole('radiogroup', { name: "Attitude — Prise d'initiative et autonomie" })
    .getByRole('radio', { name: '+', exact: true })
    .click();
  await expect(page.getByText(/Évaluez au moins une attitude professionnelle/i)).toHaveCount(0);
});
