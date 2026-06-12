import { expect, test } from '@playwright/test';
import { resetState } from './helpers';

/**
 * Scénario sprint 5 (CDC §22.2.3) :
 *   « Test de bout en bout : création livret → entretien complet → 2 fiches
 *     de période → export PDF téléchargeable et non vide. »
 *
 * Adaptation : la création de livret n'est pas implémentée en étape 1 (fixture
 * unique de Léa). On valide donc :
 *   - le parcours navigationnel complet (organisation → entretien → fiches → éval),
 *   - le bouton "Exporter le livret" déclenche un téléchargement,
 *   - le PDF téléchargé n'est pas vide (taille > 1 KB).
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('parcours formateur : navigation complète + signature R10/R22 visibles', async ({ page }) => {
  // 1. Page d'accueil chargée (le bandeau démo a été retiré en juin 2026)
  await expect(
    page.getByRole('link', { name: /Accueil — Livret d'apprentissage/i }),
  ).toBeVisible();

  // 2. Fiches de suivi (anciennement « Organisation du suivi »)
  await page.getByRole('link', { name: /^Fiches de suivi$/i }).click();
  await expect(page).toHaveURL(/\/livret\/organisation-suivi/);

  // 3. Entretien tripartite 1 (signé dans la fixture — Léa a aussi un lien E2)
  await page.getByRole('link', { name: /Entretien tripartite 1/i }).click();
  await expect(page).toHaveURL(/\/livret\/entretien/);
  await expect(page.getByRole('heading', { name: /Entretien tripartite/i })).toBeVisible();

  // 4. Période en Entreprise — au moins 3 fiches listées
  await page.getByRole('link', { name: /Période en Entreprise/i }).click();
  await expect(page.getByRole('link', { name: /Période 1/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Période 2/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Période 3/i })).toBeVisible();

  // 5. Détail période 1 — verrouillée, bouton Déverrouiller R10 présent
  await page.getByRole('link', { name: /Période 1/i }).click();
  await expect(page.getByRole('button', { name: /Déverrouiller/i })).toBeVisible();

  // 6. Évaluation finale — bandeau R22 et bouton Export PDF présents
  await page.getByRole('link', { name: /Évaluation finale/i }).click();
  await expect(page.getByText(/Clôture du livret indisponible/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Exporter le livret/i })).toBeVisible();
});

test("export PDF : le téléchargement est déclenché et le fichier est non vide", async ({ page }) => {
  await page.goto('/livret/evaluation-finale');

  // Clic sur "Exporter le livret" → l'app charge le chunk lazy et expose un
  // PDFDownloadLink dont l'aria-label est « Télécharger le livret au format PDF ».
  // La génération est asynchrone — on laisse jusqu'à 30 s.
  await page.getByRole('button', { name: /Exporter le livret/i }).click();
  const lienTelecharger = page.getByRole('link', {
    name: /Télécharger le livret au format PDF/i,
  });
  await expect(lienTelecharger).toBeVisible({ timeout: 30_000 });

  // Capture du téléchargement déclenché par le clic sur le lien.
  const downloadPromise = page.waitForEvent('download');
  await lienTelecharger.click();
  const download = await downloadPromise;

  // Le nom suit le pattern attendu (CDC §5.6).
  expect(download.suggestedFilename()).toMatch(
    /^livret-apprentissage-MARTIN-Lea-\d{4}-\d{2}-\d{2}\.pdf$/,
  );

  // Le fichier est non vide (un PDF minimal commence par "%PDF" et fait > 1 KB).
  const stream = await download.createReadStream();
  let size = 0;
  let header = '';
  for await (const chunk of stream) {
    if (header.length < 4) header += chunk.subarray(0, 4 - header.length).toString('utf8');
    size += chunk.length;
  }
  expect(header).toBe('%PDF');
  expect(size).toBeGreaterThan(1024);
});

test("le bouton d'export n'est PAS visible côté apprenti·e (matrice droits)", async ({ page }) => {
  await page.getByRole('radio', { name: 'Apprenti·e' }).click();
  await page.goto('/livret/evaluation-finale');
  // CDC §6 : seul le formateur référent a le droit `export-pdf`.
  await expect(page.getByRole('button', { name: /Exporter le livret/i })).toHaveCount(0);
});
