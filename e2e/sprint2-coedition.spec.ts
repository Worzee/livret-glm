import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Scénario sprint 2 (CDC §22.2.3) :
 *   « Co-édition tri-colonnes — bascule apprenti·e → maître → formateur,
 *     chacun renseigne sa colonne, vérifier qu'aucune écriture ne déborde
 *     sur une autre. »
 *
 * Adaptation : le bugfix R21 fige les zones d'un rôle après sa signature.
 * On utilise la Période 3 (1ᵉʳ juillet 2026 : l'apprenti·e a signé, le
 * maître / tuteur pas encore — le formateur ne signe plus les fiches
 * entreprise), et on vérifie :
 *   - le formateur peut éditer SA zone (commentaire global, jamais figé par
 *     signature) ;
 *   - la zone apprenti·e est en lecture seule (signée), celle du maître
 *     reste éditable ;
 *   - en basculant de rôle, on ne peut accéder qu'à ses propres zones.
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('Période 3 — formateur (non signé) peut éditer sa zone', async ({ page }) => {
  await page.goto('/livret/fiches-suivi');
  await page.getByRole('link', { name: /Période 3/i }).click();
  await expect(page.getByRole('heading', { name: /Période 3/i })).toBeVisible();

  // En formateur (rôle par défaut), l'observation formateur a une textarea éditable.
  const carteFormateur = page.locator('article', { hasText: 'Formateur référent' }).first();
  await expect(carteFormateur.locator('textarea')).toBeVisible();
});

test("Période 3 — l'observation apprenti·e est figée par signature (R21)", async ({ page }) => {
  await page.goto('/livret/fiches-suivi');
  await page.getByRole('link', { name: /Période 3/i }).click();

  // Apprenti·e a déjà signé P3 → la mention "Figée par signature" s'affiche
  // côté zone apprenti, et il n'y a plus de textarea pour cette zone.
  const carteApprenti = page.locator('article', { hasText: /Apprenti·e/ }).first();
  await expect(carteApprenti).toBeVisible();
  await expect(carteApprenti.locator('textarea')).toHaveCount(0);
});

test('bascule de rôle : chaque rôle ne voit en édition que ses propres zones', async ({ page }) => {
  await page.goto('/livret/fiches-suivi');
  await page.getByRole('link', { name: /Période 3/i }).click();

  // Bascule en apprenti·e — sa zone est figée (signée), les autres aussi.
  await selectRole(page, 'Apprenti·e');
  // Aucune textarea visible dans la section "Observations de fin de période"
  // car l'apprenti·e a déjà signé et les zones des autres rôles sont en lecture
  // seule par construction (peutEditer renvoie false).
  const sectionObs = page.locator('section', { hasText: 'Observations de fin de période' });
  await expect(sectionObs).toBeVisible();
  await expect(sectionObs.locator('textarea')).toHaveCount(0);

  // Bascule en maître / tuteur — il n'a PAS encore signé P3 (fixture
  // 1ᵉʳ juillet 2026) : sa zone est éditable.
  await selectRole(page, 'Maître / Tuteur');
  await expect(sectionObs.locator('textarea')).toHaveCount(1);

  // Re-bascule en formateur référent — il ne signe plus les fiches
  // entreprise : son commentaire global reste éditable.
  await selectRole(page, 'Formateur référent');
  await expect(sectionObs.locator('textarea')).toHaveCount(1);
});
