import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Lien Pronote WEB (refonte mai 2026).
 *
 * - Page utilisateur `/livret/pronote` visible pour TOUS les rôles.
 * - Page admin `/admin/pronote` réservée aux rôles `coordo` et `admin`.
 * - Les liens ouvrent Pronote dans un nouvel onglet ; l'authentification se
 *   fait côté Pronote (pas de SSO côté maquette).
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('tous les rôles voient le menu « Pronote WEB » dans Livret', async ({ page }) => {
  // Formateur par défaut au reset.
  await page.goto('/');
  await expect(
    page.getByRole('link', { name: /^Pronote WEB$/i }).first(),
  ).toBeVisible();

  // Apprenti·e
  await selectRole(page, 'Apprenti·e');
  await expect(
    page.getByRole('link', { name: /^Pronote WEB$/i }).first(),
  ).toBeVisible();

  // Maître d'apprentissage
  await selectRole(page, "Maître d'apprentissage");
  await expect(
    page.getByRole('link', { name: /^Pronote WEB$/i }).first(),
  ).toBeVisible();
});

test('seuls coordo et admin voient « Pronote » dans Administration', async ({ page }) => {
  await page.goto('/');
  // Formateur : pas de lien admin Pronote (pas dans sa liste Administration)
  // Note : le lien « Pronote WEB » du Livret reste visible — c'est attendu.
  await expect(page.getByRole('link', { name: /^Pronote$/ })).toHaveCount(0);

  await selectRole(page, 'Coordinateur·rice');
  await expect(page.getByRole('link', { name: /^Pronote$/ }).first()).toBeVisible();
});

test("page /livret/pronote : message vide + indication pour rôles non-admin", async ({
  page,
}) => {
  // Apprenti·e (pas admin)
  await selectRole(page, 'Apprenti·e');
  await page.goto('/livret/pronote');
  await expect(page.getByRole('heading', { name: /Pronote WEB/i })).toBeVisible();
  await expect(page.getByText(/Aucun lien Pronote n'est configuré/i)).toBeVisible();
  await expect(
    page.getByText(/Contactez un coordinateur·rice ou administrateur·rice/i),
  ).toBeVisible();
});

test("coordo configure un lien Pronote, qui apparaît côté utilisateur", async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/pronote');
  await expect(page.getByRole('heading', { name: /Liens Pronote WEB/i })).toBeVisible();

  // Nouveau lien
  await page.getByTestId('pronote-nouveau').click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('pronote-libelle').fill('Espace élèves');
  await modale.getByTestId('pronote-url').fill('https://pronote.greta-lyon-metropole.fr/eleves');
  await modale.getByTestId('pronote-valider').click();

  // La ligne apparaît
  await expect(page.getByText('Espace élèves')).toBeVisible();

  // Côté utilisateur : le lien apparaît, avec target=_blank
  await page.goto('/livret/pronote');
  const lien = page.locator('[data-testid^="pronote-lien-"]').first();
  await expect(lien).toBeVisible();
  await expect(lien).toHaveAttribute('target', '_blank');
  await expect(lien).toHaveAttribute('rel', /noopener/);
});

test("validation : URL invalide rejetée à la création", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/pronote');
  await page.getByTestId('pronote-nouveau').click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('pronote-libelle').fill('Test');
  await modale.getByTestId('pronote-url').fill('pasunevraieurl');
  await modale.getByTestId('pronote-valider').click();
  await expect(modale.getByText(/L'URL doit commencer par/i)).toBeVisible();
  // La modale reste ouverte
  await expect(modale).toBeVisible();
});

test("formateur référent : accès refusé à /admin/pronote", async ({ page }) => {
  await page.goto('/admin/pronote');
  await expect(
    page.getByRole('heading', { name: /Accès réservé à l'administration/i }),
  ).toBeVisible();
});
