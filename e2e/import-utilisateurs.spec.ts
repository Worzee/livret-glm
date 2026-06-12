import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';
import { MODELES } from '../src/lib/import-utilisateurs';
import { genererXlsx } from '../src/lib/generer-xlsx-modele';

/**
 * Import XLSX d'utilisateur·rice·s — rattachement au coordo importateur
 * (juin 2026) : les apprenti·e·s importé·e·s par un coordo rejoignent
 * automatiquement son périmètre (`Apprenti.coordoId`), sinon ils lui
 * seraient invisibles. Un admin importe sans coordo (répartition ensuite).
 *
 * Le fichier de test est généré avec la lib de modèles du projet — mêmes
 * en-têtes et formats de date que le modèle téléchargeable.
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

function xlsxApprentie(): Buffer {
  const bytes = genererXlsx({
    ...MODELES.apprenti,
    exemples: [
      ['Nadia', 'BEN SALEM', 'nadia.bensalem@demo.fr', '2007-01-10', '2025-09-02', '2027-09-01'],
    ],
  });
  return Buffer.from(bytes);
}

const FICHIER = {
  name: 'import-apprentis.xlsx',
  mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

test("import par un coordo : l'apprentie rejoint son périmètre (juin 2026)", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/import-utilisateurs');

  await page.getByTestId('input-fichier').setInputFiles({ ...FICHIER, buffer: xlsxApprentie() });
  await page.getByRole('button', { name: /^Importer 1 compte$/i }).click();
  await expect(page.getByText(/Import terminé — 1 compte créé/i)).toBeVisible();

  // Martine (coordo importatrice) voit Nadia sur son tableau de bord.
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Nadia BEN SALEM/i }),
  ).toBeVisible();

  // Bernard, lui, ne la voit pas — le rattachement suit l'importatrice.
  await page.getByRole('button', { name: /Bernard PETIT/i }).click();
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Nadia BEN SALEM/i }),
  ).toHaveCount(0);
});

test('import par un admin : apprentie sans coordo, invisible des coordos', async ({ page }) => {
  await selectRole(page, 'Admin');
  await page.goto('/admin/import-utilisateurs');

  await page.getByTestId('input-fichier').setInputFiles({ ...FICHIER, buffer: xlsxApprentie() });
  await page.getByRole('button', { name: /^Importer 1 compte$/i }).click();
  await expect(page.getByText(/Import terminé — 1 compte créé/i)).toBeVisible();

  // L'admin la voit (il voit tout).
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Nadia BEN SALEM/i }),
  ).toBeVisible();

  // Aucun coordo ne la voit tant que l'admin ne l'a pas répartie.
  await selectRole(page, 'Coordinateur·rice');
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Nadia BEN SALEM/i }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: /Bernard PETIT/i }).click();
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Nadia BEN SALEM/i }),
  ).toHaveCount(0);
});
