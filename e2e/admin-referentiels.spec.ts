import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resetState, selectRole } from './helpers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Extension 3 phases C+D — Gestion des référentiels (CDC §6, ressource
 * `admin.referentiels.gerer`).
 *
 * Workflow finalisé :
 *   - On choisit une formation existante (et non un nom libre).
 *   - Le référentiel est nommé `Referentiel_<intituléFormation>_<YYYY-MM-DD>`.
 *   - Le contenu vient d'un fichier (CSV ou XLSX, séparateur `;`) ou d'un
 *     copier-coller dans le textarea (cas test rapide).
 *   - À l'import, la formation pointe automatiquement vers le nouveau
 *     référentiel (`formation.referentielId` mis à jour).
 *
 * Les vrais fichiers exemples du pilote sont disponibles dans
 * `src/lib/__fixtures__/exemple-{1,2}.{csv,xlsx}`.
 */

const FIXTURES_DIR = path.resolve(__dirname, '..', 'src', 'lib', '__fixtures__');
const EXEMPLE_1_CSV = path.join(FIXTURES_DIR, 'exemple-1.csv');
const EXEMPLE_1_XLSX = path.join(FIXTURES_DIR, 'exemple-1.xlsx');
const EXEMPLE_2_CSV = path.join(FIXTURES_DIR, 'exemple-2.csv');
const EXEMPLE_2_XLSX = path.join(FIXTURES_DIR, 'exemple-2.xlsx');

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

test('import via textarea (3 colonnes) → aperçu, association BTS et nom auto-généré', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/referentiels');
  await page.getByRole('button', { name: /Importer un référentiel/i }).click();

  const modale = page.getByRole('dialog');
  await expect(modale.getByRole('heading', { name: /Importer un référentiel/i })).toBeVisible();
  // Choix de la formation cible — le BTS MHR (mode compétences) : la
  // formation CAP Cuisine est en mode activités, son référentiel est figé
  // (chantier #4, arbitrage Q6 — cf. admin-activites.spec.ts).
  await modale.getByTestId('import-ref-formation').selectOption({ value: "f-bts-mhr-2025" });
  // Le libellé auto-généré est affiché à droite du select
  await expect(modale.getByText(/Referentiel_BTS Management en Hôtellerie-Restauration_\d{4}-\d{2}-\d{2}/)).toBeVisible();

  await modale.getByTestId('import-ref-csv').fill(
    [
      'BLOC;COMPETENCE;SOUS-COMPETENCE',
      'BLOC 1;COMPETENCE 1;Reconnaître mots',
      'BLOC 1;COMPETENCE 1;Comprendre consignes',
      'BLOC 1;COMPETENCE 2;Lire articles',
      'BLOC 2;COMPETENCE 3;Rédiger essai',
    ].join('\n'),
  );
  await expect(modale.getByTestId('import-ref-csv')).toHaveValue(/COMPETENCE/);

  // Aperçu — affiche les stats
  await modale.getByRole('button', { name: /^Aperçu$/i }).click();
  await expect(modale.getByText(/Aperçu prêt — Referentiel_BTS Management/)).toBeVisible();
  await expect(modale.locator('li', { hasText: /^2 blocs?$/i })).toBeVisible();
  await expect(modale.locator('li', { hasText: /^4 compétences?$/i })).toBeVisible();
  // Avertissement de remplacement (la formation BTS MHR est déjà rattachée
  // au référentiel des fixtures)
  await expect(modale.getByText(/L'import remplacera ce rattachement/i)).toBeVisible();

  // Import effectif
  await modale.getByRole('button', { name: /Importer \(4 compétences évaluables\)/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // La carte du nouveau référentiel apparaît avec le nom auto-généré
  await expect(page.locator('article').filter({ hasText: /Referentiel_BTS Management/ })).toBeVisible();
});

test("import d'un fichier CSV réel — exemple-1 (3 colonnes, 16 sous-compétences)", async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/referentiels');
  await page.getByRole('button', { name: /Importer un référentiel/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('import-ref-formation').selectOption({ value: "f-bts-mhr-2025" });
  await modale.locator('input[type="file"]').setInputFiles(EXEMPLE_1_CSV);
  await modale.getByRole('button', { name: /^Aperçu$/i }).click();
  await expect(modale.locator('li', { hasText: /^2 blocs?$/i })).toBeVisible();
  await expect(modale.locator('li', { hasText: /^16 compétences?$/i })).toBeVisible();
  await expect(modale.locator('li', { hasText: /^3 sous-familles?$/i })).toBeVisible();
  await modale.getByRole('button', { name: /Importer \(16 compétences évaluables\)/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test("import d'un fichier XLSX réel — exemple-1 (3 colonnes, format détecté automatiquement)", async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/referentiels');
  await page.getByRole('button', { name: /Importer un référentiel/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('import-ref-formation').selectOption({ value: "f-bts-mhr-2025" });
  await modale.locator('input[type="file"]').setInputFiles(EXEMPLE_1_XLSX);
  await modale.getByRole('button', { name: /^Aperçu$/i }).click();
  await expect(modale.locator('li', { hasText: /^16 compétences?$/i })).toBeVisible();
  // Format détecté = XLSX
  await expect(modale.locator('li', { hasText: /XLSX/ })).toBeVisible();
  await modale.getByRole('button', { name: /Importer \(16 compétences évaluables\)/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test("import d'un fichier XLSX 2 colonnes — exemple-2 (référentiel plat)", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/referentiels');
  await page.getByRole('button', { name: /Importer un référentiel/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('import-ref-formation').selectOption({ value: "f-bts-mhr-2025" });
  await modale.locator('input[type="file"]').setInputFiles(EXEMPLE_2_XLSX);
  await modale.getByRole('button', { name: /^Aperçu$/i }).click();
  // 2 niveaux : pas de ligne « sous-familles » dans l'aperçu
  await expect(modale.locator('li', { hasText: /^2 blocs?$/i })).toBeVisible();
  await expect(modale.locator('li', { hasText: /^16 compétences?$/i })).toBeVisible();
  await expect(modale.locator('li', { hasText: /sous-familles?/i })).toHaveCount(0);
  await modale.getByRole('button', { name: /Importer \(16 compétences évaluables\)/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test("import d'un fichier CSV 2 colonnes — exemple-2 (Pronote, séparateur ;)", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/referentiels');
  await page.getByRole('button', { name: /Importer un référentiel/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('import-ref-formation').selectOption({ value: "f-bts-mhr-2025" });
  await modale.locator('input[type="file"]').setInputFiles(EXEMPLE_2_CSV);
  await modale.getByRole('button', { name: /^Aperçu$/i }).click();
  await expect(modale.locator('li', { hasText: /^16 compétences?$/i })).toBeVisible();
  await modale.getByRole('button', { name: /Importer \(/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
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

test('après import, la formation est rattachée au nouveau référentiel (auto-update)', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  // 1) Importer un référentiel et l'associer à CAP Cuisine
  await page.goto('/admin/referentiels');
  await page.getByRole('button', { name: /Importer un référentiel/i }).click();
  const modaleRef = page.getByRole('dialog');
  await modaleRef.getByTestId('import-ref-formation').selectOption({ value: "f-bts-mhr-2025" });
  await modaleRef.locator('input[type="file"]').setInputFiles(EXEMPLE_2_CSV);
  await modaleRef.getByRole('button', { name: /^Aperçu$/i }).click();
  await modaleRef.getByRole('button', { name: /Importer \(/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // 2) Sur la page Formations, ouvrir l'édition du BTS MHR et vérifier
  //    que le select Référentiel pointe désormais vers le nouveau libellé
  await page.goto('/admin/formations');
  await page.getByRole('button', { name: /^Modifier BTS Management/ }).click();
  const modaleForm = page.getByRole('dialog');
  const selectRef = modaleForm.getByLabel('Référentiel', { exact: false });
  await expect(selectRef).toContainText(/Referentiel_BTS Management/);
});

test("la page Référentiels affiche les compétences en lecture seule (CDC v1.5 — flag retiré)", async ({
  page,
}) => {
  // Depuis le CDC v1.5 addendum, le choix des compétences abordées en
  // entreprise se fait par livret à l'entretien tripartite (cf. spec
  // entretien-selection-competences.spec.ts). La page Référentiels n'expose
  // donc plus de case à cocher par compétence.
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/referentiels');
  const carteCap = page.locator('article', { hasText: 'CAP Cuisine' });
  await carteCap.getByText(/Voir les compétences/i).click();
  // Le libellé de la 1ʳᵉ compétence reste visible mais sans aucune case à cocher
  // (le code n'est plus affiché — seul l'élément, 18 juin 2026).
  await expect(carteCap).toContainText(/Réceptionner et stocker la marchandise/i);
  await expect(carteCap.getByTestId('comp-eval-c1-1')).toHaveCount(0);
});

test("import sans formation — nom libre obligatoire, référentiel orphelin créé", async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/referentiels');
  await page.getByRole('button', { name: /Importer un référentiel/i }).click();
  const modale = page.getByRole('dialog');

  // Aucune formation choisie → champ « Nom du référentiel » apparaît
  await expect(modale.getByTestId('import-ref-nom-libre')).toBeVisible();

  // Tentative d'aperçu sans nom libre → erreur de validation
  await modale.getByTestId('import-ref-csv').fill(
    [
      'BLOC;COMPETENCE',
      'BLOC A;Compétence 1',
      'BLOC A;Compétence 2',
      'BLOC B;Compétence 3',
    ].join('\n'),
  );
  await modale.getByRole('button', { name: /^Aperçu$/i }).click();
  await expect(modale.getByText(/Sans formation choisie, donnez un nom/i)).toBeVisible();

  // Saisie du nom libre → import effectif
  await modale.getByTestId('import-ref-nom-libre').fill('Référentiel CAP Boulanger 2026');
  await modale.getByRole('button', { name: /^Aperçu$/i }).click();
  await expect(modale.getByText(/Aperçu prêt — Référentiel CAP Boulanger 2026/)).toBeVisible();
  await modale.getByRole('button', { name: /Importer \(/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // La nouvelle carte affiche « Aucune formation rattachée »
  const carte = page.locator('article', { hasText: 'Référentiel CAP Boulanger 2026' });
  await expect(carte).toBeVisible();
  await expect(
    carte.getByTestId('ref-formations-rattachees'),
  ).toContainText(/Aucune formation rattachée/i);
});

test("la carte du CAP Cuisine affiche la formation rattachée (relation N:1)", async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/referentiels');
  const carte = page.locator('article', { hasText: 'CAP Cuisine' });
  await expect(carte.getByTestId('ref-formations-rattachees')).toContainText(
    /Utilisé par 1 formation : CAP Cuisine \(2025-2026\)/i,
  );
});

test('persistance après reload : le référentiel importé survit', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/referentiels');
  await page.getByRole('button', { name: /Importer un référentiel/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('import-ref-formation').selectOption({ value: "f-bts-mhr-2025" });
  await modale.locator('input[type="file"]').setInputFiles(EXEMPLE_1_CSV);
  await modale.getByRole('button', { name: /^Aperçu$/i }).click();
  await modale.getByRole('button', { name: /Importer \(/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('article').filter({ hasText: /Referentiel_BTS Management/ })).toBeVisible();

  await page.reload();
  await expect(page.locator('article').filter({ hasText: /Referentiel_BTS Management/ })).toBeVisible();
});
