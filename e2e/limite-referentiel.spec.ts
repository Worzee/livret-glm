import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Limite du nombre de lignes évaluables par référentiel (juillet 2026 —
 * chantier référentiels/compétences #2).
 *
 *   - au-delà du seuil (40 par défaut), l'import est bloqué et propose
 *     l'agrégation au niveau supérieur (3 niveaux) ou le cochage manuel ;
 *   - les compétences décochées sont conservées (`exclue`) et gérables
 *     depuis la carte du référentiel (« Lignes évaluables ») ;
 *   - le seuil est modifiable par l'admin uniquement.
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

/** CSV 2 colonnes : `nb` compétences réparties sur 2 blocs. */
function csv2Niveaux(nb: number): string {
  const lignes = ['BLOC;COMPETENCE'];
  for (let i = 1; i <= nb; i++) {
    lignes.push(`B${i <= Math.ceil(nb / 2) ? 1 : 2};Compétence n°${i}`);
  }
  return lignes.join('\n');
}

/** CSV 3 colonnes : 3 blocs × 5 sous-familles × 3 feuilles = 45 feuilles. */
function csv3Niveaux(): string {
  const lignes = ['BLOC;COMPETENCE;COMPETENCE DETAILLEE'];
  for (let b = 1; b <= 3; b++) {
    for (let s = 1; s <= 5; s++) {
      for (let f = 1; f <= 3; f++) {
        lignes.push(`B${b};Sous-famille ${b}.${s};Feuille ${b}.${s}.${f}`);
      }
    }
  }
  return lignes.join('\n');
}

/** Ouvre la modale d'import, colle `csv` sous un nom libre, clique Aperçu. */
async function preparerImport(page: import('@playwright/test').Page, nom: string, csv: string) {
  await page.goto('/admin/referentiels');
  await page.getByRole('button', { name: /Importer un référentiel/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('import-ref-nom-libre').fill(nom);
  await modale.getByTestId('import-ref-csv').fill(csv);
  await modale.getByRole('button', { name: /^Aperçu$/i }).click();
  return modale;
}

test("le seuil est éditable par l'admin et en lecture seule pour le coordo", async ({ page }) => {
  await selectRole(page, 'Admin');
  await page.goto('/admin/referentiels');
  const encart = page.getByTestId('encart-seuil');
  await expect(encart.getByTestId('param-seuil-input')).toHaveValue('40');

  await selectRole(page, 'Coordinateur·rice');
  await expect(encart.getByTestId('param-seuil-input')).toHaveCount(0);
  await expect(encart.getByTestId('param-seuil-lecture')).toHaveText('40');
  await expect(encart.getByText(/Modifiable par l’administrateur·rice uniquement/i)).toBeVisible();
});

test('import 2 niveaux > 40 : pas d’agrégation proposée, cochage manuel jusqu’au seuil', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  const modale = await preparerImport(page, 'Ref Limite Deux Niveaux', csv2Niveaux(43));

  // Dépassement : bandeau + import bloqué + pas d'option d'agrégation (2 niveaux).
  const bandeau = modale.getByTestId('import-ref-depassement');
  await expect(bandeau).toBeVisible();
  await expect(bandeau.getByText(/43 compétences évaluables/i)).toBeVisible();
  await expect(bandeau.getByTestId('import-ref-agreger')).toHaveCount(0);
  await expect(bandeau.getByText(/Référentiel à 2 niveaux/i)).toBeVisible();
  await expect(modale.getByTestId('import-ref-importer')).toBeDisabled();
  await expect(bandeau.getByTestId('import-ref-compteur')).toContainText('43 / 40');

  // Décocher 3 compétences → 40/40, import possible.
  for (const id of ['bloc-b1-c1', 'bloc-b1-c2', 'bloc-b1-c3']) {
    await bandeau.getByTestId(`import-ref-coche-${id}`).uncheck();
  }
  await expect(bandeau.getByTestId('import-ref-compteur')).toContainText('40 / 40');
  const importer = modale.getByTestId('import-ref-importer');
  await expect(importer).toBeEnabled();
  await importer.click();

  // La carte affiche le compte évaluable + les exclues conservées.
  const carte = page.locator('article', { hasText: 'Ref Limite Deux Niveaux' });
  await expect(carte.getByText(/40 compétences évaluables \(\+3 exclues/i)).toBeVisible();
});

test('import 3 niveaux > 40 : « garder le niveau supérieur » agrège les sous-familles', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  const modale = await preparerImport(page, 'Ref Limite Trois Niveaux', csv3Niveaux());

  const bandeau = modale.getByTestId('import-ref-depassement');
  await expect(bandeau.getByText(/45 compétences évaluables/i)).toBeVisible();

  // Option A : agrégation → 15 lignes (5 sous-familles × 3 blocs).
  await bandeau.getByTestId('import-ref-agreger').click();
  await expect(bandeau.getByTestId('import-ref-agregation-active')).toBeVisible();
  await expect(bandeau.getByTestId('import-ref-compteur')).toContainText('15 / 40');
  await modale.getByTestId('import-ref-importer').click();

  const carte = page.locator('article', { hasText: 'Ref Limite Trois Niveaux' });
  await expect(carte.getByText(/15 compétences évaluables/i)).toBeVisible();
  // Les libellés fins restent lisibles dans la description de la ligne agrégée.
  await carte.getByText(/Voir les compétences/i).click();
  await expect(carte.getByText('Sous-famille 1.1').first()).toBeVisible();
});

test("seuil abaissé par l'admin + gestion post-import des lignes évaluables", async ({ page }) => {
  // 1. L'admin abaisse le seuil à 3.
  await selectRole(page, 'Admin');
  await page.goto('/admin/referentiels');
  await page.getByTestId('param-seuil-input').fill('3');
  await page.getByTestId('param-seuil-enregistrer').click();

  // 2. Import de 4 compétences → dépassement à 3, on en décoche une.
  const modale = await preparerImport(page, 'Ref Limite Basse', csv2Niveaux(4));
  const bandeau = modale.getByTestId('import-ref-depassement');
  await expect(bandeau.getByTestId('import-ref-compteur')).toContainText('4 / 3');
  await bandeau.getByTestId('import-ref-coche-bloc-b1-c1').uncheck();
  await expect(bandeau.getByTestId('import-ref-compteur')).toContainText('3 / 3');
  await modale.getByTestId('import-ref-importer').click();

  const carte = page.locator('article', { hasText: 'Ref Limite Basse' });
  await expect(carte.getByText(/3 compétences évaluables \(\+1 exclue/i)).toBeVisible();

  // 3. Gestion post-import : réactivation refusée tant que le seuil est atteint.
  // (`click` et non `check` : le store refuse la bascule, la case reste décochée.)
  await carte.getByTestId('ref-lignes-evaluables-ref-ref-limite-basse').click();
  const gestion = page.getByRole('dialog');
  await expect(gestion.getByTestId('excl-compteur')).toContainText('3 / 3');
  await gestion.getByTestId('excl-bloc-b1-c1').click();
  await expect(gestion.getByTestId('excl-refus')).toContainText(/limite de 3/i);
  await expect(gestion.getByTestId('excl-compteur')).toContainText('3 / 3');

  // 4. On libère une place → la réactivation passe.
  await gestion.getByTestId('excl-bloc-b1-c2').uncheck();
  await expect(gestion.getByTestId('excl-compteur')).toContainText('2 / 3');
  await gestion.getByTestId('excl-bloc-b1-c1').check();
  await expect(gestion.getByTestId('excl-compteur')).toContainText('3 / 3');
});
