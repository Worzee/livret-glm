import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Extension 3 phase C — Gestion des référentiels (CDC §6, ressource
 * `admin.referentiels.gerer`).
 *
 * Couvre :
 *   - Accès refusé pour les rôles non-coordo/admin
 *   - Présence du référentiel CAP Cuisine livré dans les fixtures
 *   - Import via textarea (CSV 3 colonnes — détection automatique)
 *   - Aperçu (stats) puis import effectif → la nouvelle entrée apparaît
 *   - Suppression bloquée tant qu'une formation rattachée existe
 *   - Apparition du nouveau référentiel dans le select de la modale Formations
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('le formateur voit la page Référentiels en accès refusé', async ({ page }) => {
  await selectRole(page, 'Formateur référent');
  await page.goto('/admin/referentiels');
  await expect(page.getByRole('heading', { name: /Accès réservé/i })).toBeVisible();
});

test('le coordo voit la page et le référentiel CAP Cuisine des fixtures', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/referentiels');
  await expect(page.getByRole('heading', { name: /Gestion des référentiels/i })).toBeVisible();
  const carte = page.locator('article', { hasText: 'CAP Cuisine' });
  await expect(carte).toBeVisible();
  // 3 blocs × 3-4 compétences = 10 dans la fixture
  await expect(carte.getByText(/10 compétences/i)).toBeVisible();
});

test('import via textarea : aperçu puis création effective du référentiel', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/referentiels');
  await page.getByRole('button', { name: /Importer un référentiel/i }).click();

  const modale = page.getByRole('dialog');
  await expect(modale.getByRole('heading', { name: /Importer un référentiel/i })).toBeVisible();
  // Attente explicite sur le textarea pour éviter une race avec le mount React
  // (sinon le 2ᵉ fill pouvait atterrir dans l'input nom).
  await modale.getByTestId('import-ref-csv').waitFor({ state: 'visible' });
  await modale.getByTestId('import-ref-nom').fill('CECRL Anglais B2');
  // 3 colonnes : Bloc;Sous-famille;Compétence
  await modale.getByTestId('import-ref-csv').fill(
    [
      'Domaine;Compétence;Sous-compétence',
      'B2.1;Compréhension orale;Comprendre conférences',
      'B2.1;Compréhension orale;Comprendre films récents',
      'B2.1;Compréhension écrite;Lire articles spécialisés',
      'B2.2;Production écrite;Rédiger essai argumenté',
      'B2.2;Production écrite;Synthétiser sources multiples',
    ].join('\n'),
  );
  // Vérifie que le textarea contient bien le CSV (sinon le test continue avec
  // un état incohérent qui produit une erreur cryptique sur l'aperçu).
  await expect(modale.getByTestId('import-ref-csv')).toHaveValue(/Domaine;Compétence/);

  // Aperçu — affiche les stats
  await modale.getByRole('button', { name: /^Aperçu$/i }).click();
  await expect(modale.getByText(/Aperçu prêt — CECRL Anglais B2/i)).toBeVisible();
  // Cible les <li> de la liste de stats — évite la collision avec le libellé
  // du bouton « Importer (5 compétences) ».
  await expect(modale.locator('li', { hasText: /^2 blocs?$/i })).toBeVisible();
  await expect(modale.locator('li', { hasText: /^5 compétences?$/i })).toBeVisible();
  await expect(modale.locator('li', { hasText: /^3 sous-familles?$/i })).toBeVisible();

  // Import effectif
  await modale.getByRole('button', { name: /Importer \(5 compétences\)/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // La carte du nouveau référentiel apparaît
  const carteNouveau = page.locator('article', { hasText: 'CECRL Anglais B2' });
  await expect(carteNouveau).toBeVisible();
  await expect(carteNouveau.getByText(/référentiel à 3 niveaux/i)).toBeVisible();
});

test("la suppression d'un référentiel rattaché à une formation est bloquée", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/referentiels');
  // CAP Cuisine est rattaché à la formation CAP Cuisine 2025-2026 (fixture)
  const carte = page.locator('article', { hasText: 'CAP Cuisine' });
  const boutonSupprimer = carte.getByRole('button', { name: /^Supprimer CAP Cuisine/i });
  await expect(boutonSupprimer).toBeDisabled();
  await expect(carte.getByText(/réaffectez le référentiel avant suppression/i)).toBeVisible();
});

test("le référentiel importé est sélectionnable dans la modale Formations", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');

  // 1) Importer un référentiel
  await page.goto('/admin/referentiels');
  await page.getByRole('button', { name: /Importer un référentiel/i }).click();
  const modaleRef = page.getByRole('dialog');
  await modaleRef.getByTestId('import-ref-nom').fill('Titre Pro Boulanger');
  await modaleRef
    .getByTestId('import-ref-csv')
    .fill('Bloc;Compétence\nB1;Maîtriser fermentation\nB1;Sélectionner farines');
  await modaleRef.getByRole('button', { name: /^Aperçu$/i }).click();
  await modaleRef.getByRole('button', { name: /Importer \(/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // 2) Aller sur la page Formations et ouvrir la modale de création
  await page.goto('/admin/formations');
  await page.getByRole('button', { name: /Nouvelle formation/i }).click();
  const modaleForm = page.getByRole('dialog');
  // Le select Référentiel doit contenir l'option fraîchement importée
  const selectRef = modaleForm.getByLabel('Référentiel', { exact: false });
  await expect(selectRef).toContainText(/Titre Pro Boulanger/);
});

test('persistance après reload : le référentiel importé survit', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/referentiels');
  await page.getByRole('button', { name: /Importer un référentiel/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('import-ref-nom').fill('CAP Pâtisserie');
  await modale
    .getByTestId('import-ref-csv')
    .fill('Bloc;Compétence\nP1;Réaliser pâtes de base\nP1;Réaliser crèmes');
  await modale.getByRole('button', { name: /^Aperçu$/i }).click();
  await modale.getByRole('button', { name: /Importer \(/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('article', { hasText: 'CAP Pâtisserie' })).toBeVisible();

  await page.reload();
  await expect(page.locator('article', { hasText: 'CAP Pâtisserie' })).toBeVisible();
});
