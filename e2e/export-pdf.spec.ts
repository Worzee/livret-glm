import { expect, test } from '@playwright/test';
import type { Download } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Exports PDF partiels (16 juin 2026) : une période, un entretien tripartite,
 * et les fiches de suivi (événements) — en plus du livret complet existant.
 *
 * Droits : formateur référent + coordo + admin (apprenti·e et maître exclus).
 * Apprenti·e actif·ve par défaut = Léa MARTIN (resetState).
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

/** Lit un téléchargement et renvoie l'en-tête (4 octets) + la taille totale. */
async function lirePdf(download: Download): Promise<{ header: string; size: number }> {
  const stream = await download.createReadStream();
  let size = 0;
  let header = '';
  for await (const chunk of stream) {
    if (header.length < 4) header += chunk.subarray(0, 4 - header.length).toString('utf8');
    size += chunk.length;
  }
  return { header, size };
}

test('les 3 boutons d’export apparaissent pour le formateur (période, entretien, fiches de suivi)', async ({
  page,
}) => {
  // Fiches de suivi (événements)
  await page.goto('/livret/organisation-suivi');
  await expect(page.getByRole('button', { name: /Exporter les fiches de suivi/i })).toBeVisible();

  // Entretien tripartite 1 (Léa : E1 initialisé)
  await page.goto('/livret/entretien/1');
  await expect(page.getByRole('button', { name: /Exporter cet entretien/i })).toBeVisible();

  // Détail d'une période
  await page.goto('/livret/fiches-suivi');
  await page
    .getByRole('link', { name: /Période 1/i })
    .first()
    .click();
  await expect(page.getByRole('button', { name: /Exporter cette période/i })).toBeVisible();
});

test('téléchargement du PDF d’une période : fichier non vide au bon nom', async ({ page }) => {
  await page.goto('/livret/fiches-suivi');
  await page
    .getByRole('link', { name: /Période 1/i })
    .first()
    .click();
  await page.getByRole('button', { name: /Exporter cette période/i }).click();

  const lien = page.getByRole('link', { name: /Télécharger la période 1 au format PDF/i });
  await expect(lien).toBeVisible({ timeout: 30_000 });

  const downloadPromise = page.waitForEvent('download');
  await lien.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^periode-1-MARTIN-Lea-\d{4}-\d{2}-\d{2}\.pdf$/);

  const { header, size } = await lirePdf(download);
  expect(header).toBe('%PDF');
  expect(size).toBeGreaterThan(1024);
});

test('téléchargement du PDF des fiches de suivi : fichier non vide au bon nom', async ({ page }) => {
  await page.goto('/livret/organisation-suivi');
  await page.getByRole('button', { name: /Exporter les fiches de suivi/i }).click();

  const lien = page.getByRole('link', { name: /Télécharger les fiches de suivi au format PDF/i });
  await expect(lien).toBeVisible({ timeout: 30_000 });

  const downloadPromise = page.waitForEvent('download');
  await lien.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^fiches-suivi-MARTIN-Lea-\d{4}-\d{2}-\d{2}\.pdf$/);

  const { header, size } = await lirePdf(download);
  expect(header).toBe('%PDF');
  expect(size).toBeGreaterThan(1024);
});

test('l’export d’un entretien génère bien un lien de téléchargement (PageEntretien)', async ({
  page,
}) => {
  await page.goto('/livret/entretien/1');
  await page.getByRole('button', { name: /Exporter cet entretien/i }).click();
  // L'apparition du lien prouve que le document s'est généré sans erreur.
  await expect(
    page.getByRole('link', { name: /Télécharger l'entretien tripartite 1 au format PDF/i }),
  ).toBeVisible({ timeout: 30_000 });
});

test('apprenti·e et maître ne voient aucun bouton d’export ; le coordo les voit', async ({
  page,
}) => {
  // Apprenti·e : aucun bouton (droit export-pdf exclu).
  await selectRole(page, 'Apprenti·e');
  await page.goto('/livret/organisation-suivi');
  await expect(page.getByRole('button', { name: /Exporter les fiches de suivi/i })).toHaveCount(0);
  await page.goto('/livret/entretien/1');
  await expect(page.getByRole('button', { name: /Exporter cet entretien/i })).toHaveCount(0);

  // Maître / tuteur : aucun bouton non plus.
  await selectRole(page, 'Maître / Tuteur');
  await page.goto('/livret/organisation-suivi');
  await expect(page.getByRole('button', { name: /Exporter les fiches de suivi/i })).toHaveCount(0);

  // Coordo : les exports lui sont ouverts (16 juin 2026).
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/livret/organisation-suivi');
  await expect(page.getByRole('button', { name: /Exporter les fiches de suivi/i })).toBeVisible();
  await page.goto('/livret/entretien/1');
  await expect(page.getByRole('button', { name: /Exporter cet entretien/i })).toBeVisible();
});
