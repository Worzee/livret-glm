import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Jusqu'à 4 entretiens tripartites par livret (retours coordos juin 2026).
 *
 * Le nombre d'entretiens est défini par le coordo au niveau de la formation
 * (modale Planning, au même endroit que les périodes). Les motifs
 * `entretien-tripartite-{1..N}` de l'organisation du suivi sont filtrés en
 * conséquence, et la réduction est verrouillée si un entretien est déjà
 * engagé dans un livret de la promo.
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test("le coordo règle le nombre d'entretiens dans la modale Planning (défaut 2)", async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  await page.getByRole('button', { name: /Planning des périodes de CAP Cuisine/i }).click();

  const select = page.getByTestId('planning-nb-entretiens');
  await expect(select).toHaveValue('2');

  await select.selectOption('4');
  await expect(select).toHaveValue('4');

  // Persiste après rechargement.
  await page.reload();
  await page.getByRole('button', { name: /Planning des périodes de CAP Cuisine/i }).click();
  await expect(page.getByTestId('planning-nb-entretiens')).toHaveValue('4');
});

test('les motifs entretien 3 et 4 ne sont proposés que si la formation les autorise', async ({
  page,
}) => {
  // Formation au défaut (2 entretiens) : E3/E4 absents du sélecteur de motifs.
  await page.goto('/livret/organisation-suivi');
  const selectMotif = page.locator('#org-motif-ajout');
  await expect(selectMotif.locator('option[value="entretien-tripartite-2"]')).toHaveCount(1);
  await expect(selectMotif.locator('option[value="entretien-tripartite-3"]')).toHaveCount(0);
  await expect(selectMotif.locator('option[value="entretien-tripartite-4"]')).toHaveCount(0);

  // Le coordo passe la formation à 4 entretiens.
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  await page.getByRole('button', { name: /Planning des périodes de CAP Cuisine/i }).click();
  await page.getByTestId('planning-nb-entretiens').selectOption('4');

  // Les motifs E3/E4 apparaissent côté formateur.
  await selectRole(page, 'Formateur référent');
  await page.goto('/livret/organisation-suivi');
  await expect(selectMotif.locator('option[value="entretien-tripartite-3"]')).toHaveCount(1);
  await expect(selectMotif.locator('option[value="entretien-tripartite-4"]')).toHaveCount(1);
});

test('parcours complet E3 : événement → lien sidebar → initialisation avec questions de suivi', async ({
  page,
}) => {
  // 1. Le coordo autorise 4 entretiens.
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  await page.getByRole('button', { name: /Planning des périodes de CAP Cuisine/i }).click();
  await page.getByTestId('planning-nb-entretiens').selectOption('4');

  // 2. Le formateur crée l'événement « Entretien Tripartite 3 » pour Léa.
  await selectRole(page, 'Formateur référent');
  await page.goto('/livret/organisation-suivi');
  await page.locator('#org-motif-ajout').selectOption('entretien-tripartite-3');
  await page.getByTestId('org-ajouter-evt').click();

  // 3. Le lien sidebar « Entretien tripartite 3 » apparaît.
  const lienE3 = page.getByRole('link', { name: /Entretien tripartite 3/i });
  await expect(lienE3).toBeVisible();

  // 4. Initialisation : les questions de suivi (affectées E3 par défaut)
  //    sont injectées — 4 questions apprenti·e.
  await lienE3.click();
  await page.getByTestId('init-entretien-3').click();
  await expect(page.getByTestId('apprenti-choisir-questions')).toContainText('(4)');
});

test("verrou : impossible de réduire en dessous d'un entretien engagé", async ({ page }) => {
  // Le coordo passe à 4, le formateur planifie un E4 pour Léa.
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  await page.getByRole('button', { name: /Planning des périodes de CAP Cuisine/i }).click();
  await page.getByTestId('planning-nb-entretiens').selectOption('4');

  await selectRole(page, 'Formateur référent');
  await page.goto('/livret/organisation-suivi');
  await page.locator('#org-motif-ajout').selectOption('entretien-tripartite-4');
  await page.getByTestId('org-ajouter-evt').click();

  // Retour coordo : la réduction à 2 est refusée avec un message explicite.
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  await page.getByRole('button', { name: /Planning des périodes de CAP Cuisine/i }).click();
  await page.getByTestId('planning-nb-entretiens').selectOption('2');
  await expect(
    page.getByRole('alert').filter({ hasText: /entretien tripartite 4/i }),
  ).toBeVisible();
  // Le nombre reste à 4 dans le store (le select re-rend la valeur du store).
  await expect(page.getByTestId('planning-nb-entretiens')).toHaveValue('4');
});

test('la route /livret/entretien/3 rend un 404 si la formation est à 2 entretiens', async ({
  page,
}) => {
  await page.goto('/livret/entretien/3');
  await expect(page.getByRole('heading', { name: /Page introuvable/i })).toBeVisible();
});
