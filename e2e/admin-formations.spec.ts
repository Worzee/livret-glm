import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * CRUD formations (CDC §6 + §7.1).
 *
 * Couvre :
 *   - Accès refusé pour les rôles non-coordo/admin (formateur inclus)
 *   - Création d'une nouvelle formation via la modale
 *   - Édition d'une formation existante
 *   - Suppression bloquée tant qu'un·e apprenti·e est rattaché·e
 *   - Suppression effective d'une formation libre (créée puis supprimée)
 *   - Persistance après reload
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('le formateur voit la page Formations en accès refusé', async ({ page }) => {
  await selectRole(page, 'Formateur référent');
  await page.goto('/admin/formations');
  await expect(page.getByRole('heading', { name: /Accès réservé/i })).toBeVisible();
});

test("le coordo accède à la page et voit la formation des fixtures", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  await expect(page.getByRole('heading', { name: /Gestion des formations/i })).toBeVisible();
  const carte = page.locator('article', { hasText: 'CAP Cuisine' });
  await expect(carte.getByRole('heading', { name: 'CAP Cuisine' })).toBeVisible();
  // Compteur des apprenti·e·s rattaché·e·s (6 dans les fixtures) — cible la
  // <dd> et non le bandeau d'erreur de suppression qui contient le même texte.
  await expect(carte.locator('dd', { hasText: /^6 apprenti·e·s rattaché·e·s$/ })).toBeVisible();
});

/**
 * Helper de remplissage de la modale formation. Utilise des `data-testid`
 * stables pour éviter les races qu'on observait avec les sélecteurs par label
 * (sous charge longue, le 2ᵉ fill atterrissait dans le 1ᵉʳ champ).
 */
async function remplirModaleFormation(
  page: import('@playwright/test').Page,
  champs: {
    intitule: string;
    niveau: string;
    annee: string;
    dateDebut: string;
    dateFin: string;
    /**
     * Id de l'établissement à sélectionner dans le select « Lieu de formation ».
     * Par défaut : `eta-site-diderot` (le seul présent dans les fixtures).
     * Refonte mai 2026 : remplace l'ancien champ texte `nomLieu`.
     */
    lieuId?: string;
  },
) {
  const modale = page.getByRole('dialog');
  await modale.getByTestId('formation-lieu-id').waitFor({ state: 'visible' });
  await modale.getByTestId('formation-intitule').fill(champs.intitule);
  await modale.getByTestId('formation-niveau').fill(champs.niveau);
  await modale.getByTestId('formation-annee').fill(champs.annee);
  await modale.getByTestId('formation-date-debut').fill(champs.dateDebut);
  await modale.getByTestId('formation-date-fin').fill(champs.dateFin);
  await modale
    .getByTestId('formation-lieu-id')
    .selectOption(champs.lieuId ?? 'eta-site-diderot');
}

test("création d'une nouvelle formation via la modale", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  await page.getByRole('button', { name: /Nouvelle formation/i }).click();

  const modale = page.getByRole('dialog');
  await expect(modale.getByRole('heading', { name: /Nouvelle formation/i })).toBeVisible();
  await remplirModaleFormation(page, {
    intitule: 'BAC PRO Commerce',
    niveau: 'BAC PRO',
    annee: '2026-2028',
    dateDebut: '2026-09-01',
    dateFin: '2028-06-30',
    // (lieuId par défaut = eta-site-diderot)
  });
  await modale.getByRole('button', { name: /Créer la formation/i }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'BAC PRO Commerce' })).toBeVisible();
});

test("la suppression d'une formation avec apprenti·e·s rattaché·e·s est bloquée", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  const carte = page.locator('article', { hasText: 'CAP Cuisine' });
  const boutonSupprimer = carte.getByRole('button', { name: /^Supprimer CAP Cuisine/i });
  await expect(boutonSupprimer).toBeDisabled();
  await expect(carte.getByText(/réaffectez-les avant suppression/i)).toBeVisible();
});

test('création + suppression effective (2 clics) d\'une formation libre', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  // Crée une formation neutre, sans apprenti·e rattaché·e
  await page.getByRole('button', { name: /Nouvelle formation/i }).click();
  const modale = page.getByRole('dialog');
  await remplirModaleFormation(page, {
    intitule: 'CAP Pâtisserie',
    niveau: 'CAP',
    annee: '2026-2027',
    dateDebut: '2026-09-01',
    dateFin: '2027-06-30',
    // (lieuId par défaut = eta-site-diderot)
  });
  await modale.getByRole('button', { name: /Créer la formation/i }).click();

  const carte = page.locator('article', { hasText: 'CAP Pâtisserie' });
  await expect(carte).toBeVisible();
  await expect(carte.getByText(/Aucun·e apprenti·e rattaché·e/i)).toBeVisible();

  // Suppression : 2 clics (la confirmation se déclenche par le 1er, exécutée par le 2ᵉ)
  const boutonSupprimer = carte.getByRole('button', { name: /^Supprimer CAP Pâtisserie/i });
  await expect(boutonSupprimer).toBeEnabled();
  await boutonSupprimer.click();
  await carte.getByRole('button', { name: /^Confirmer la suppression de CAP Pâtisserie/i }).click();

  await expect(page.locator('article', { hasText: 'CAP Pâtisserie' })).toHaveCount(0);
});

test("édition d'une formation existante (intitulé)", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  const carte = page.locator('article', { hasText: 'CAP Cuisine' });
  await carte.getByRole('button', { name: /^Modifier CAP Cuisine/i }).click();

  const modale = page.getByRole('dialog');
  await expect(modale.getByRole('heading', { name: /Modifier CAP Cuisine/i })).toBeVisible();
  await modale.getByTestId('formation-intitule').fill('CAP Cuisine Restauration');
  await modale.getByRole('button', { name: /Enregistrer les modifications/i }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'CAP Cuisine Restauration' })).toBeVisible();
});

test('création + persistance reload + visibilité dans la page Affectations', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  // 1) Créer la formation
  await page.goto('/admin/formations');
  await page.getByRole('button', { name: /Nouvelle formation/i }).click();
  const modale = page.getByRole('dialog');
  await remplirModaleFormation(page, {
    intitule: 'Titre Pro Cuisinier',
    niveau: 'TP',
    annee: '2026-2027',
    dateDebut: '2026-09-01',
    dateFin: '2027-06-30',
    // (lieuId par défaut = eta-site-diderot)
  });
  await modale.getByRole('button', { name: /Créer la formation/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Titre Pro Cuisinier' })).toBeVisible();

  // 2) Persistance après reload : la formation créée survit
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Titre Pro Cuisinier' })).toBeVisible();

  // 3) La nouvelle formation est visible dans le filtre de la page Affectations
  await page.goto('/admin/affectations');
  await expect(page.getByLabel(/Filtrer par formation/i)).toContainText(/Titre Pro Cuisinier/);
});
