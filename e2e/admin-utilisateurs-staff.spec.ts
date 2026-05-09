import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Étape 2 — CRUD maître / formateur / coordo (CDC §6 + §24.6).
 *
 * Couvre :
 *   - Menu de création « Nouveau · nouvelle… » avec les 4 entrées
 *   - Création d'un maître + apparition dans le sélecteur de maître du tableau
 *     de bord en mode maître
 *   - Création d'un formateur
 *   - Coordo réservé admin (invisible côté coordo, visible côté admin)
 *   - Suppression bloquée d'un maître ayant des apprenti·e·s
 *   - Suppression d'un formateur sans apprenti·e
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('le menu de création propose apprenti·e + maître + formateur en coordo (pas coordo)', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');
  await page.getByRole('button', { name: /Nouveau · nouvelle/i }).click();
  await expect(page.getByRole('menuitem', { name: /^Apprenti·e/i })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /^Maître d'apprentissage/i })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /^Formateur référent/i })).toBeVisible();
  // Coordo masqué en rôle coordo (droit exclusif admin).
  await expect(page.getByRole('menuitem', { name: /^Coordinateur·rice/i })).toHaveCount(0);
});

test("l'admin a accès en plus à l'option de création coordo", async ({ page }) => {
  await selectRole(page, 'Admin');
  await page.goto('/admin/utilisateurs');
  await page.getByRole('button', { name: /Nouveau · nouvelle/i }).click();
  await expect(page.getByRole('menuitem', { name: /^Coordinateur·rice/i })).toBeVisible();
});

test("création d'un maître — apparaît dans la table et dans le sélecteur de maître", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');

  await page.getByRole('button', { name: /Nouveau · nouvelle/i }).click();
  await page.getByRole('menuitem', { name: /^Maître d'apprentissage/i }).click();

  const modale = page.getByRole('dialog');
  await modale.getByLabel(/^Prénom/).fill('Antoine');
  await modale.getByLabel(/^Nom/).fill('Marchand');
  await modale.getByLabel(/^Email/).fill('antoine.marchand@chez-tony.demo');
  await modale.getByLabel(/^Identifiant entreprise/).fill('e-chez-tony');
  await modale.getByRole('button', { name: /Créer maître/i }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Le maître apparaît dans le tableau de bord en mode maître (3ᵉ bouton du sélecteur).
  await selectRole(page, "Maître d'apprentissage");
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Antoine MARCHAND/i })).toBeVisible();
  // 0 apprenti·e à ce stade (pas d'affectation).
  await expect(
    page.getByRole('button', { name: /Antoine MARCHAND/i }).getByText(/0 apprenti·e·s/i),
  ).toBeVisible();
});

test('suppression bloquée pour un maître avec apprenti·e·s rattaché·e·s', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');
  // Karim a 3 apprenti·e·s dans la fixture → suppression désactivée
  const ligneKarim = page.locator('tbody tr', { hasText: /Karim BENALI/ });
  const boutonSupprimer = ligneKarim.getByRole('button', { name: /^Supprimer/i });
  await expect(boutonSupprimer).toBeDisabled();
  await expect(ligneKarim.getByText(/3 apprenti·e·s rattaché·e·s/i)).toBeVisible();
});

test("suppression d'un maître sans apprenti·e — succès", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');

  // Crée un maître éphémère sans apprenti·e
  await page.getByRole('button', { name: /Nouveau · nouvelle/i }).click();
  await page.getByRole('menuitem', { name: /^Maître d'apprentissage/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByLabel(/^Prénom/).fill('Test');
  await modale.getByLabel(/^Nom/).fill('Eph');
  await modale.getByLabel(/^Email/).fill('test.eph@demo.fr');
  await modale.getByLabel(/^Identifiant entreprise/).fill('e-test');
  await modale.getByRole('button', { name: /Créer maître/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Suppression : 2 clics
  await page.getByRole('button', { name: /^Supprimer Test EPH/i }).click();
  await page.getByRole('button', { name: /Confirmer la suppression de Test EPH/i }).click();
  await expect(page.locator('tbody tr', { hasText: /Test EPH/ })).toHaveCount(0);
});

test("création d'un formateur — accessible côté coordo", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');
  await page.getByRole('button', { name: /Nouveau · nouvelle/i }).click();
  await page.getByRole('menuitem', { name: /^Formateur référent/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByLabel(/^Prénom/).fill('Marie');
  await modale.getByLabel(/^Nom/).fill('Lefebvre');
  await modale.getByLabel(/^Email/).fill('marie.lefebvre@greta-demo.fr');
  await modale.getByRole('button', { name: /Créer formateur/i }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  // Présent dans la table
  await expect(page.locator('tbody tr', { hasText: /Marie LEFEBVRE/ })).toBeVisible();
});

test("création d'un coordo — admin uniquement", async ({ page }) => {
  await selectRole(page, 'Admin');
  await page.goto('/admin/utilisateurs');
  await page.getByRole('button', { name: /Nouveau · nouvelle/i }).click();
  await page.getByRole('menuitem', { name: /^Coordinateur·rice/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByLabel(/^Prénom/).fill('Paul');
  await modale.getByLabel(/^Nom/).fill('Durand');
  await modale.getByLabel(/^Email/).fill('paul.durand@greta-demo.fr');
  await modale.getByRole('button', { name: /Créer coordinateur/i }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('tbody tr', { hasText: /Paul DURAND/ })).toBeVisible();
});

test("édition d'un maître — modifie l'identité affichée dans la liste", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');

  await page.getByRole('button', { name: /Modifier Hélène ROCHE/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByLabel(/^Prénom/).fill('Héloïse');
  await modale.getByRole('button', { name: /Enregistrer/i }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('tbody tr', { hasText: /Héloïse ROCHE/ })).toBeVisible();
});

test("le compte admin n'est ni modifiable ni supprimable depuis la page", async ({ page }) => {
  await selectRole(page, 'Admin');
  await page.goto('/admin/utilisateurs');
  const ligneAdmin = page.locator('tbody tr', { hasText: /Guillaume FERRERI/ });
  await expect(ligneAdmin.getByRole('button', { name: /Modifier/i })).toHaveCount(0);
  await expect(ligneAdmin.getByRole('button', { name: /Supprimer/i })).toHaveCount(0);
});
