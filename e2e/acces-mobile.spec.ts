import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Accès mobile (3 juillet 2026) — QR code d'accès à l'application.
 *
 * Réservé à l'encadrement (formateur / coordo / admin) : en visite
 * d'entreprise, le formateur affiche le QR ; le tuteur le scanne et arrive
 * sur l'application sans saisir d'URL.
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test("le formateur voit le menu « Accès mobile » et la page affiche le QR code de l'application", async ({
  page,
}) => {
  // Rôle par défaut = formateur : lien visible dans la sidebar.
  await page.getByRole('link', { name: /Accès mobile/i }).click();
  await expect(page).toHaveURL(/\/livret\/acces-mobile/);
  await expect(page.getByRole('heading', { name: /Accès mobile/i })).toBeVisible();

  // Le QR code SVG encode l'URL courante de l'application, affichée en clair.
  await expect(page.getByTestId('acces-mobile-qr')).toBeVisible();
  const origin = await page.evaluate(() => window.location.origin);
  await expect(page.getByTestId('acces-mobile-url')).toHaveText(origin);

  // Les identifiants ne sont PAS affichés — une mention explique la marche à suivre.
  await expect(page.getByText(/se communiquent oralement/i)).toBeVisible();

  // Le coordo et l'admin y accèdent aussi.
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/livret/acces-mobile');
  await expect(page.getByTestId('acces-mobile-qr')).toBeVisible();
  await selectRole(page, 'Admin');
  await page.goto('/livret/acces-mobile');
  await expect(page.getByTestId('acces-mobile-qr')).toBeVisible();
});

test("l'apprenti·e et le maître / tuteur n'ont ni le menu ni l'accès direct", async ({ page }) => {
  await selectRole(page, 'Maître / Tuteur');
  await expect(page.getByRole('link', { name: /Accès mobile/i })).toHaveCount(0);
  await page.goto('/livret/acces-mobile');
  await expect(page.getByRole('heading', { name: /Accès réservé à l'encadrement/i })).toBeVisible();
  await expect(page.getByTestId('acces-mobile-qr')).toHaveCount(0);

  await selectRole(page, 'Apprenti·e');
  await expect(page.getByRole('link', { name: /Accès mobile/i })).toHaveCount(0);
  await page.goto('/livret/acces-mobile');
  await expect(page.getByRole('heading', { name: /Accès réservé à l'encadrement/i })).toBeVisible();
});
