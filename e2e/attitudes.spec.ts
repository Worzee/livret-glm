import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Attitudes professionnelles (retours coordos juin 2026, refonte juillet
 * 2026 — chantier référentiels/compétences #3).
 *
 * - Catalogue global géré par l'admin uniquement (/admin/attitudes).
 * - CHOISIES à l'entretien tripartite (figées à la 3ᵉ signature), puis
 *   évaluées par le maître / tuteur à CHAQUE période en entreprise.
 * - R20 : TOUTES les attitudes retenues évaluées pour que le maître signe
 *   la fiche de période.
 * - La Synthèse présente une agrégation last-write-wins en lecture seule
 *   (cf. sprint4-evaluation-finale.spec.ts).
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

  // a5 est évaluée dans les fiches de période entreprise des fixtures
  // (juillet 2026) → suppression bloquée.
  const ligneA5 = page.locator('[data-testid="attitude-row-a5"]');
  await expect(ligneA5.getByRole('button', { name: /Supprimer l'attitude/i })).toBeDisabled();
  await expect(ligneA5.getByText(/Évaluée ou retenue dans au moins un livret/i)).toBeVisible();

  // a9 est RETENUE (choix fait à l'entretien, fixtures) → bloquée aussi
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

test("le choix des attitudes se fait à l'entretien et alimente la fiche de période du maître (juillet 2026)", async ({
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

  // Côté maître, sur la fiche de période ENTREPRISE : la section
  // « Attitudes professionnelles » ne montre QUE les 2 retenues
  // (juillet 2026 — l'évaluation a quitté l'entretien).
  await selectRole(page, 'Maître / Tuteur');
  await page.goto('/livret/fiches-suivi');
  await page
    .getByRole('link', { name: /Période 1/i })
    .first()
    .click();
  const grille = page.getByTestId('attitudes-fiche');
  await expect(grille.getByRole('radiogroup')).toHaveCount(2);
  await expect(
    grille.getByRole('radiogroup', { name: "Attitude : Prise d'initiative et autonomie" }),
  ).toBeVisible();
});

test("le choix est figé dès que l'entretien est signé par les 3 parties", async ({ page }) => {
  // Léa (par défaut) : entretien signé 3/3 dans les fixtures.
  await page.goto('/livret/entretien');
  const section = page.getByTestId('selection-attitudes');
  await expect(section.getByText(/Choix figé/i)).toBeVisible();
  await expect(page.getByTestId('selection-attitude-a5')).toBeDisabled();
});

test('le maître évalue les attitudes sur la fiche de période — R20 exige TOUTES les retenues (juillet 2026)', async ({
  page,
}) => {
  // 1. Le formateur initialise l'entretien de Sofia et retient 2 attitudes.
  await page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i }).click();
  await page.goto('/livret/entretien');
  await page.getByTestId('init-entretien').click();
  await page.getByTestId('selection-attitude-a5').check();
  await page.getByTestId('selection-attitude-a9').check();

  // 2. Côté maître, sur la fiche P1 (éval entreprise + observation déjà
  //    remplies dans la fixture) : la signature reste bloquée tant que les
  //    2 attitudes retenues ne sont pas toutes évaluées.
  await selectRole(page, 'Maître / Tuteur');
  await page.goto('/livret/fiches-suivi');
  await page
    .getByRole('link', { name: /Période 1/i })
    .first()
    .click();
  const grille = page.getByTestId('attitudes-fiche');
  await expect(grille.getByText(/Il reste 2 attitudes à évaluer/i)).toBeVisible();
  await expect(
    page.getByText(/Évaluez toutes les attitudes professionnelles retenues \(2 restantes\)/i),
  ).toBeVisible();

  // 3. Évalue la 1ʳᵉ attitude → il en reste une seule.
  await grille
    .getByRole('radiogroup', { name: "Attitude : Prise d'initiative et autonomie" })
    .getByRole('radio', { name: '+', exact: true })
    .click();
  await expect(
    page.getByText(/Évaluez toutes les attitudes professionnelles retenues \(1 restante\)/i),
  ).toBeVisible();

  // 4. Évalue la 2ᵉ → la raison R20 disparaît.
  await grille
    .getByRole('radiogroup', { name: 'Attitude : Motivation et implication' })
    .getByRole('radio', { name: '++', exact: true })
    .click();
  await expect(
    page.getByText(/Évaluez toutes les attitudes professionnelles retenues/i),
  ).toHaveCount(0);
});
