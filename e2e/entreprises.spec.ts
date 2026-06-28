import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Entreprises d'accueil des apprenti·e·s (juin 2026).
 *
 * Couvre :
 *   - CRUD /admin/entreprises (coordo + admin) + accès refusé au formateur
 *   - Verrou de suppression d'une entreprise rattachée à un·e apprenti·e
 *   - Choix de l'entreprise dans la modale apprenti·e (liste déroulante)
 *   - Récapitulatif « Entreprise d'accueil » au tableau de bord apprenti·e
 *   - Traçabilité : Luca a un changement d'entreprise en cours de contrat
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

// ─────────────────────────────────────────────────────────────────────────────
// Accès + CRUD
// ─────────────────────────────────────────────────────────────────────────────

test('le formateur n\'a pas accès à la gestion des entreprises', async ({ page }) => {
  await selectRole(page, 'Formateur référent');
  await page.goto('/admin/entreprises');
  await expect(
    page.getByRole('heading', { name: /Accès réservé à l'administration/i }),
  ).toBeVisible();
});

test('le coordo voit la page et les entreprises des fixtures', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/entreprises');
  await expect(page.getByRole('heading', { name: /Gestion des entreprises/i })).toBeVisible();
  await expect(
    page.locator('[data-testid="entreprise-row-e-le-gourmet"]', {
      hasText: 'Restaurant Le Gourmet',
    }),
  ).toBeVisible();
  await expect(page.getByText('La Brasserie du Rhône')).toBeVisible();
});

test('le coordo crée une entreprise — elle apparaît dans la liste', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/entreprises');
  await page.getByTestId('entreprise-nouvelle').click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('ent-raison').fill('Boulangerie du Coin');
  await modale.getByTestId('ent-valider').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('li', { hasText: 'Boulangerie du Coin' })).toBeVisible();
});

test('suppression bloquée si une entreprise est rattachée, autorisée sinon', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/entreprises');

  // Le Gourmet héberge Léa/Théo/Sofia → suppression bloquée.
  const carteGourmet = page.locator('[data-testid="entreprise-row-e-le-gourmet"]');
  await expect(
    carteGourmet.getByRole('button', { name: /^Supprimer Restaurant Le Gourmet/i }),
  ).toBeDisabled();

  // Le Bistrot des Canuts n'héberge personne → supprimable.
  const carteBistrot = page.locator('[data-testid="entreprise-row-e-bistrot-canuts"]');
  await carteBistrot.getByRole('button', { name: /^Supprimer Le Bistrot des Canuts/i }).click();
  await carteBistrot
    .getByRole('button', { name: /Confirmer la suppression de Le Bistrot des Canuts/i })
    .click();
  await expect(page.locator('[data-testid="entreprise-row-e-bistrot-canuts"]')).toHaveCount(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// Choix dans la modale apprenti·e
// ─────────────────────────────────────────────────────────────────────────────

test('la modale apprenti·e propose l\'entreprise dans une liste déroulante', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');
  await page.getByRole('button', { name: /Nouveau · nouvelle/i }).click();
  await page.getByRole('menuitem', { name: /^Apprenti·e/i }).click();
  const modale = page.getByRole('dialog');
  const select = modale.getByLabel("Entreprise d'accueil");
  await expect(select).toBeVisible();
  // Les entreprises des fixtures sont proposées.
  await expect(select.locator('option', { hasText: 'Restaurant Le Gourmet' })).toHaveCount(1);
  await expect(select.locator('option', { hasText: 'La Brasserie du Rhône' })).toHaveCount(1);
});

// ─────────────────────────────────────────────────────────────────────────────
// Récap tableau de bord + traçabilité
// ─────────────────────────────────────────────────────────────────────────────

test('le tableau de bord apprenti·e affiche son entreprise d\'accueil', async ({ page }) => {
  // Léa (apprenti·e actif·ve par défaut) est au Restaurant Le Gourmet.
  await selectRole(page, 'Apprenti·e');
  await page.goto('/');
  // Scopé à la ligne « Entreprise d'accueil » (l'entreprise du maître est aussi
  // affichée sur la ligne « Maître / tuteur »).
  const blocEntreprise = page.getByText("Entreprise d'accueil").locator('xpath=..');
  await expect(blocEntreprise.getByText(/Restaurant Le Gourmet/)).toBeVisible();
});

test('un changement d\'entreprise en cours de contrat est signalé (Luca)', async ({ page }) => {
  // Luca a un historique à 2 entreprises (Le Gourmet → La Brasserie du Rhône).
  await page.getByRole('button', { name: /Ouvrir le livret de Luca BIANCHI/i }).click();
  await selectRole(page, 'Apprenti·e');
  await page.goto('/');
  const blocEntreprise = page.getByText("Entreprise d'accueil").locator('xpath=..');
  await expect(blocEntreprise.getByText(/La Brasserie du Rhône/)).toBeVisible();
  await expect(blocEntreprise.getByText(/changement en cours de contrat/i)).toBeVisible();
});
