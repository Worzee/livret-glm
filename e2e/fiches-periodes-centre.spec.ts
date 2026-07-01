import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Périodes EN CENTRE de formation (17 juin 2026) — miroir des périodes en
 * entreprise. Le planning est géré dans la modale « Planning des périodes »
 * (section « Périodes en centre »), et chaque apprenti·e dispose d'une page
 * « Période en Centre » où le formateur référent évalue les compétences ; la
 * signature ne concerne que l'apprenti·e et le formateur (2 parties).
 *
 * Fixtures Léa : C1 « Regroupement d'automne » signée (2/2), C2 « Regroupement
 * d'hiver » en cours.
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('le coordo voit le planning des périodes en centre', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  await page.getByRole('button', { name: /Planning des périodes de CAP Cuisine/i }).click();
  const modale = page.getByRole('dialog');
  const sectionCentre = modale.getByTestId('section-periodes-centre');
  await expect(sectionCentre.getByText(/Périodes en centre définies/i)).toBeVisible();
  // Les 2 regroupements fixtures (automne + hiver).
  await expect(sectionCentre.getByText(/Regroupement d.automne/i)).toBeVisible();
  await expect(sectionCentre.getByText(/Regroupement d.hiver/i)).toBeVisible();
});

test('le coordo ajoute une période en centre via le formulaire dédié', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  await page.getByRole('button', { name: /Planning des périodes de CAP Cuisine/i }).click();
  const modale = page.getByRole('dialog');
  // Le formulaire d'ajout est masqué derrière un bouton (1ᵉʳ juillet 2026).
  await modale.getByTestId('planning-centre-ouvrir-ajout').click();
  await modale.getByTestId('planning-centre-titre').fill('Regroupement de printemps');
  await modale.getByTestId('planning-centre-debut').fill('2026-04-13');
  await modale.getByTestId('planning-centre-fin').fill('2026-04-24');
  await modale.getByTestId('planning-centre-soumettre').click();
  await expect(
    modale.getByTestId('section-periodes-centre').getByText(/Regroupement de printemps/i),
  ).toBeVisible();
});

test('la page « Période en Centre » liste les regroupements et ouvre le détail', async ({ page }) => {
  // resetState → rôle formateur, livret de Léa MARTIN actif.
  await page.getByRole('link', { name: /Période en Centre/i }).click();
  await expect(page).toHaveURL(/\/livret\/fiches-suivi-centre/);
  await expect(page.getByRole('heading', { name: /Période en Centre/i })).toBeVisible();

  // C1 signée (2/2) débloque C2 (séquencement) → les deux regroupements visibles.
  await expect(page.getByRole('link', { name: /Regroupement d.automne/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Regroupement d.hiver/i })).toBeVisible();

  // Détail de C1 — intitulé de la fiche + colonne d'évaluation centre.
  await page.getByRole('link', { name: /Regroupement d.automne/i }).click();
  await expect(
    page.getByRole('heading', { name: /Période 1.*Regroupement d.automne/i }),
  ).toBeVisible();
  await expect(page.getByText(/Suivi de la formation en centre/i)).toBeVisible();
  // Signatures à 2 parties (apprenti·e + formateur), pas de maître au centre.
  await expect(page.getByText(/lorsque les deux parties ont apposé/i)).toBeVisible();
});

test('le formateur peut exporter une période en centre en PDF', async ({ page }) => {
  // resetState → rôle formateur (droit export-pdf), livret de Léa.
  await page.getByRole('link', { name: /Période en Centre/i }).click();
  await page.getByRole('link', { name: /Regroupement d.automne/i }).click();
  // Le bouton d'export de la période centre est disponible.
  await expect(page.getByRole('button', { name: /Exporter cette période/i })).toBeVisible();
});
