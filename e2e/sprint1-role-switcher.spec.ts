import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Scénario sprint 1 (CDC §22.2.3) : role switcher (5 rôles, aria-checked).
 *
 * Le bandeau « MAQUETTE DE DÉMONSTRATION » (CDC §21.6) a été retiré le
 * 12 juin 2026 (retours coordos) — on vérifie désormais son ABSENCE.
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('le bandeau de démonstration a été retiré (retours coordos juin 2026)', async ({ page }) => {
  // L'application a bien chargé…
  await expect(
    page.getByRole('link', { name: /Accueil — Livret d'apprentissage/i }),
  ).toBeVisible();
  // …sans le bandeau, ni à l'accueil ni sur une page intérieure.
  await expect(page.getByText(/MAQUETTE DE DÉMONSTRATION/i)).toHaveCount(0);
  await page.getByRole('link', { name: /Évaluation finale/i }).click();
  await expect(page).toHaveURL(/\/livret\/evaluation-finale/);
  await expect(page.getByText(/MAQUETTE DE DÉMONSTRATION/i)).toHaveCount(0);
});

test('le rôle Formateur référent est actif par défaut', async ({ page }) => {
  const formateur = page.getByRole('radio', { name: 'Formateur référent' });
  await expect(formateur).toHaveAttribute('aria-checked', 'true');
});

test("bascule entre les 5 rôles et l'aria-checked suit", async ({ page }) => {
  for (const label of [
    'Apprenti·e',
    'Maître / Tuteur',
    'Coordinateur·rice',
    'Admin',
    'Formateur référent',
  ] as const) {
    await selectRole(page, label);
    await expect(page.getByRole('radio', { name: label })).toHaveAttribute('aria-checked', 'true');
  }
});
