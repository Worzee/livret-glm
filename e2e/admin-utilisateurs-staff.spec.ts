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
  await expect(page.getByRole('menuitem', { name: /^Maître \/ Tuteur/i })).toBeVisible();
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
  await page.getByRole('menuitem', { name: /^Maître \/ Tuteur/i }).click();

  const modale = page.getByRole('dialog');
  await modale.getByTestId('staff-entreprise').waitFor({ state: 'visible' });
  await modale.getByTestId('staff-prenom').fill('Antoine');
  await modale.getByTestId('staff-nom').fill('Marchand');
  await modale.getByTestId('staff-email').fill('antoine.marchand@chez-tony.demo');
  await modale.getByTestId('staff-entreprise').fill('Chez Tony');
  await modale.getByTestId('staff-fonction').fill('Responsable de salle');
  await modale.getByRole('button', { name: /Créer maître/i }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Le maître apparaît dans le tableau de bord en mode maître (3ᵉ bouton du sélecteur).
  await selectRole(page, 'Maître / Tuteur');
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
  // Karim a 4 apprenti·e·s dans la fixture (3 en principal + Luca en second
  // — juin 2026) → suppression désactivée
  const ligneKarim = page.locator('tbody tr', { hasText: /Karim BENALI/ });
  const boutonSupprimer = ligneKarim.getByRole('button', { name: /^Supprimer/i });
  await expect(boutonSupprimer).toBeDisabled();
  await expect(ligneKarim.getByText(/4 apprenti·e·s rattaché·e·s/i)).toBeVisible();
});

test("suppression d'un maître sans apprenti·e — succès", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');

  // Crée un maître éphémère sans apprenti·e
  await page.getByRole('button', { name: /Nouveau · nouvelle/i }).click();
  await page.getByRole('menuitem', { name: /^Maître \/ Tuteur/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('staff-entreprise').waitFor({ state: 'visible' });
  await modale.getByTestId('staff-prenom').fill('Test');
  await modale.getByTestId('staff-nom').fill('Eph');
  await modale.getByTestId('staff-email').fill('test.eph@demo.fr');
  await modale.getByTestId('staff-entreprise').fill('Test SARL');
  await modale.getByTestId('staff-fonction').fill('Gérant');
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
  await modale.getByTestId('staff-email').waitFor({ state: 'visible' });
  await modale.getByTestId('staff-prenom').fill('Marie');
  await modale.getByTestId('staff-nom').fill('Lefebvre');
  await modale.getByTestId('staff-email').fill('marie.lefebvre@greta-demo.fr');
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
  await modale.getByTestId('staff-email').waitFor({ state: 'visible' });
  await modale.getByTestId('staff-prenom').fill('Paul');
  await modale.getByTestId('staff-nom').fill('Durand');
  await modale.getByTestId('staff-email').fill('paul.durand@greta-demo.fr');
  await modale.getByRole('button', { name: /Créer coordinateur/i }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('tbody tr', { hasText: /Paul DURAND/ })).toBeVisible();
});

test("édition d'un maître — modifie l'identité affichée dans la liste", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');

  await page.getByRole('button', { name: /Modifier Hélène ROCHE/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('staff-prenom').fill('Héloïse');
  await modale.getByRole('button', { name: /Enregistrer/i }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('tbody tr', { hasText: /Héloïse ROCHE/ })).toBeVisible();
});

test("le formateur référent peut créer un·e apprenti·e et un maître (pas formateur ni coordo)", async ({ page }) => {
  await selectRole(page, 'Formateur référent');
  // L'entrée « Utilisateurs » doit apparaître dans la sidebar Administration.
  await expect(page.getByRole('link', { name: /^Utilisateurs/i })).toBeVisible();
  // Mais Formations et Affectations restent réservés coordo + admin.
  await expect(page.getByRole('link', { name: /^Formations/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /^Affectations/i })).toHaveCount(0);

  await page.goto('/admin/utilisateurs');
  // Pas d'écran « Accès refusé » — la page s'affiche.
  await expect(page.getByRole('heading', { name: /^Gestion des utilisateurs/i })).toBeVisible();

  // Le menu de création propose Apprenti·e + Maître, mais pas Formateur ni Coordo.
  await page.getByRole('button', { name: /Nouveau · nouvelle/i }).click();
  await expect(page.getByRole('menuitem', { name: /^Apprenti·e/i })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /^Maître \/ Tuteur/i })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /^Formateur référent/i })).toHaveCount(0);
  await expect(page.getByRole('menuitem', { name: /^Coordinateur·rice/i })).toHaveCount(0);

  // Le formateur n'a pas le droit de modifier ni supprimer — boutons absents.
  await page.keyboard.press('Escape');
  const ligneLea = page.locator('tbody tr', { hasText: /Léa MARTIN/ });
  await expect(ligneLea.getByRole('button', { name: /^Modifier/i })).toHaveCount(0);
  await expect(ligneLea.getByRole('button', { name: /^Supprimer/i })).toHaveCount(0);
});

test("le compte admin n'est ni modifiable ni supprimable depuis la page", async ({ page }) => {
  await selectRole(page, 'Admin');
  await page.goto('/admin/utilisateurs');
  const ligneAdmin = page.locator('tbody tr', { hasText: /Guillaume FERRERI/ });
  await expect(ligneAdmin.getByRole('button', { name: /Modifier/i })).toHaveCount(0);
  await expect(ligneAdmin.getByRole('button', { name: /Supprimer/i })).toHaveCount(0);
});
