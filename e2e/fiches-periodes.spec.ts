import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Gestion du planning des périodes au niveau formation
 * (refonte mai 2026 — chantier #1).
 *
 * Le planning (nombre, titre, dates) est désormais défini par le coordo/admin
 * dans la modale « Planning des périodes » accessible depuis chaque carte
 * formation. La création/modification/suppression propage en cascade dans
 * tous les livrets de la promo.
 *
 * Côté livret (page `/livret/fiches-suivi`), il n'y a plus de bouton de
 * création — uniquement la consultation et un bandeau d'info qui renvoie
 * vers la formation.
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test("le coordo accède au planning d'une formation depuis sa carte", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  await page
    .getByRole('button', { name: /Planning des périodes de CAP Cuisine/i })
    .click();
  const modale = page.getByRole('dialog');
  await expect(
    modale.getByRole('heading', { name: /Planning des périodes — CAP Cuisine/i }),
  ).toBeVisible();
  // Les 3 périodes fixtures de la CAP Cuisine 2025-2026 sont affichées.
  await expect(modale.getByText(/Période 1/i)).toBeVisible();
  await expect(modale.getByText(/Période 2/i)).toBeVisible();
  await expect(modale.getByText(/Période 3/i)).toBeVisible();
});

test("le coordo ajoute une nouvelle période et la voit apparaître dans le livret", async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  await page
    .getByRole('button', { name: /Planning des périodes de CAP Cuisine/i })
    .click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('planning-titre').fill('Période bilan');
  await modale.getByTestId('planning-debut').fill('2026-05-04');
  await modale.getByTestId('planning-fin').fill('2026-06-30');
  await modale.getByTestId('planning-soumettre').click();
  await expect(modale.getByText(/Période 4 — Période bilan/i)).toBeVisible();

  // Ferme la modale (bouton du footer — le X d'en-tête porte le même nom
  // accessible, d'où le .last() pour éviter la violation strict mode)
  await modale.getByRole('button', { name: /^Fermer$/i }).last().click();
  await page.goto('/');
  // Théo a ses 3 périodes signées et verrouillées → avec le séquencement
  // (16 juin 2026), la P4 héritée du planning via cascade est immédiatement
  // visible (toutes les périodes précédentes sont signées par les 3 parties).
  await page
    .getByRole('button', { name: /Ouvrir le livret de Théo DUBOIS/i })
    .click();
  await page.goto('/livret/fiches-suivi');
  await expect(page.locator('li', { hasText: /Période 4 — Période bilan/i })).toBeVisible();
});

test("le formateur référent ne peut PAS gérer le planning des périodes", async ({ page }) => {
  await selectRole(page, 'Formateur référent');
  await page.goto('/admin/formations');
  // Refonte mai 2026 : la page Formations n'est plus accessible aux
  // formateurs (gestion calendaire = coordo/admin uniquement). Le lien
  // n'apparaît pas dans la sidebar et la page affiche l'écran d'accès refusé.
  await expect(
    page.getByRole('heading', { name: /Accès réservé à l'administration/i }),
  ).toBeVisible();
});

test("la page « Période en Entreprise » n'expose plus le bouton de création", async ({ page }) => {
  await selectRole(page, 'Formateur référent');
  await page.goto('/livret/fiches-suivi');
  // Plus de bouton « Nouvelle période » côté livret — c'est désormais au
  // niveau formation que cela se gère.
  await expect(page.getByTestId('btn-nouvelle-periode')).toHaveCount(0);
  // Le bandeau d'info renvoie l'utilisateur vers la formation.
  await expect(page.getByText(/calendrier.*défini au niveau de la formation/i)).toBeVisible();
});

test("la modification d'une période est refusée si une fiche est signée", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  await page
    .getByRole('button', { name: /Planning des périodes de CAP Cuisine/i })
    .click();
  const modale = page.getByRole('dialog');
  // Léa a sa Période 1 signée et verrouillée → modification refusée
  const lignePeriode1 = modale.locator('li').filter({ hasText: /Période 1/i });
  const bouton = lignePeriode1.getByRole('button', { name: /^Modifier Période 1/i });
  await expect(bouton).toBeDisabled();
  // Le motif du verrou est affiché
  await expect(lignePeriode1.getByText(/déjà signée|verrouillée/i)).toBeVisible();
});

test("la suppression d'une période est refusée si une fiche est signée", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  await page
    .getByRole('button', { name: /Planning des périodes de CAP Cuisine/i })
    .click();
  const modale = page.getByRole('dialog');
  const lignePeriode1 = modale.locator('li').filter({ hasText: /Période 1/i });
  const bouton = lignePeriode1.getByRole('button', { name: /^Supprimer Période 1/i });
  await expect(bouton).toBeDisabled();
});

test("rejet de saisie : date de fin antérieure au début (R11)", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  await page
    .getByRole('button', { name: /Planning des périodes de CAP Cuisine/i })
    .click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('planning-debut').fill('2026-09-01');
  await modale.getByTestId('planning-fin').fill('2026-08-01'); // antérieur
  await expect(modale.getByText(/R11/i)).toBeVisible();
  // Le bouton soumettre reste désactivé tant que la validation échoue
  await expect(modale.getByTestId('planning-soumettre')).toBeDisabled();
});

test("rejet de saisie : chevauchement avec une période existante (R12)", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  await page
    .getByRole('button', { name: /Planning des périodes de CAP Cuisine/i })
    .click();
  const modale = page.getByRole('dialog');
  // P1 fixture : 2025-09-02 → 2025-12-20. On chevauche dessus.
  await modale.getByTestId('planning-debut').fill('2025-11-01');
  await modale.getByTestId('planning-fin').fill('2026-02-15');
  await expect(modale.getByText(/chevauchent/i)).toBeVisible();
});
