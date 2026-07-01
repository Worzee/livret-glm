import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Scénario sprint 3 (CDC §22.2.3) :
 *   « Tester les droits granulaires de l'entretien tripartite : vérifier qu'un
 *     rôle ne peut pas éditer un champ hors de ses droits, même en manipulant
 *     le DOM. »
 *
 * Notre entretien est complètement signé (R9 — toutes les sections en lecture
 * seule pour tous), ce qui simplifie le test : aucune textarea ne doit être
 * accessible quel que soit le rôle.
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test("la page Entretien tripartite charge avec les fixtures de Léa", async ({ page }) => {
  await page.getByRole('link', { name: /Entretien tripartite 1/i }).click();
  await expect(page).toHaveURL(/\/livret\/entretien/);
  await expect(page.getByRole('heading', { name: /Entretien tripartite/i })).toBeVisible();
  // La fixture renseigne motivations / contact entreprise → on s'appuie sur
  // un libellé stable affiché peu importe la locale du navigateur de test.
  await expect(page.getByText(/Date de l['’]entretien/i)).toBeVisible();
  // Les 3 signatures de l'entretien fixture sont apposées → un texte « Signé »
  // avec « le » apparaît au moins 3 fois (1 par rôle).
  const indicesSigne = page.getByText(/^Signé$/);
  expect(await indicesSigne.count()).toBeGreaterThanOrEqual(3);
});

test("un entretien signé par 3 parties est en lecture seule pour tous (R9)", async ({ page }) => {
  await page.getByRole('link', { name: /Entretien tripartite 1/i }).click();

  // En formateur (par défaut) : aucune textarea ni input éditable, l'entretien est figé.
  const sectionsEditablesFormateur = await page.locator('textarea, input[type="text"]').count();
  expect(sectionsEditablesFormateur).toBe(0);

  // En apprenti·e : idem.
  await selectRole(page, 'Apprenti·e');
  const sectionsEditablesApprenti = await page.locator('textarea, input[type="text"]').count();
  expect(sectionsEditablesApprenti).toBe(0);

  // En maître d'apprentissage : idem.
  await selectRole(page, 'Maître / Tuteur');
  const sectionsEditablesMaitre = await page.locator('textarea, input[type="text"]').count();
  expect(sectionsEditablesMaitre).toBe(0);
});

test('le formateur co-saisit les champs du maître sur un entretien non signé (1ᵉʳ juillet 2026)', async ({
  page,
}) => {
  // L'E1 suit la trame officielle (pas de grille d'appréciation) : on passe
  // par l'E2 de Léa (E1 signé 3/3 → initialisable), entretien vierge.
  await page.goto('/livret/entretien/2');
  await page.getByTestId('init-entretien-2').click();
  await expect(page.getByTestId('attitudes-entretien')).toBeVisible();

  // En formateur, la grille d'appréciation du maître est éditable (co-saisie).
  await page
    .getByRole('radiogroup', { name: 'Ponctualité et assiduité', exact: true })
    .getByRole('radio', { name: '+', exact: true })
    .click();
  await expect(
    page
      .getByRole('radiogroup', { name: 'Ponctualité et assiduité', exact: true })
      .getByRole('radio', { name: '+', exact: true }),
  ).toBeChecked();

  // La signature du maître reste exclusive : aucun bouton « Signer en tant
  // que Karim » côté formateur (seul son propre slot est actionnable).
  await expect(page.getByRole('button', { name: /Signer en tant que Karim/i })).toHaveCount(0);
});

test("le coordinateur·rice consulte l'entretien sans aucun bouton de signature", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.getByRole('link', { name: /Entretien tripartite 1/i }).click();

  // Le coordo n'a pas de slot de signature personnel — il ne voit aucun bouton
  // « Signer en tant que … » même sur les rôles qui auraient des données.
  const boutonsSignature = await page.getByRole('button', { name: /Signer en tant que/i }).count();
  expect(boutonsSignature).toBe(0);
});
