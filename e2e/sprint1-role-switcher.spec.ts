import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Scénario sprint 1 (CDC §22.2.3) :
 *   « Tester le role switcher (3 clics, 3 états vérifiés) et la présence
 *     du bandeau de démonstration sur toutes les routes. »
 *
 * Vérifie en bonus le 4ᵉ et 5ᵉ rôle (Coordo / Admin) ajoutés en extension métier.
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('le bandeau de démonstration est visible au chargement initial', async ({ page }) => {
  await expect(page.getByText(/MAQUETTE DE DÉMONSTRATION/i)).toBeVisible();
});

test('le rôle Formateur référent est actif par défaut', async ({ page }) => {
  const formateur = page.getByRole('radio', { name: 'Formateur référent' });
  await expect(formateur).toHaveAttribute('aria-checked', 'true');
});

test("bascule entre les 5 rôles et l'aria-checked suit", async ({ page }) => {
  for (const label of [
    'Apprenti·e',
    "Maître d'apprentissage",
    'Coordinateur·rice',
    'Admin',
    'Formateur référent',
  ] as const) {
    await selectRole(page, label);
    await expect(page.getByRole('radio', { name: label })).toHaveAttribute('aria-checked', 'true');
    // Le bandeau démo doit rester visible quoi qu'il arrive (CDC §21.6).
    await expect(page.getByText(/MAQUETTE DE DÉMONSTRATION/i)).toBeVisible();
  }
});

test('le bandeau démo est présent aussi sur la page Évaluation finale', async ({ page }) => {
  await page.getByRole('link', { name: /Évaluation finale/i }).click();
  await expect(page).toHaveURL(/\/livret\/evaluation-finale/);
  await expect(page.getByText(/MAQUETTE DE DÉMONSTRATION/i)).toBeVisible();
});
