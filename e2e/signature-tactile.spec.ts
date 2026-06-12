import { expect, test, type Page } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Signature manuscrite tactile (CDC v1.5 §14.C — juin 2026).
 *
 * Le 1er clic sur « Signer » ouvre l'encart d'engagement avec une zone de
 * dessin (canvas pointer events — doigt / stylet / souris). « Confirmer »
 * reste désactivé tant que le tracé n'est pas significatif (≥ 60 px). Le PNG
 * est stocké avec la signature et affiché dans la carte (R19/R21 inchangées).
 *
 * Terrain de jeu : l'entretien 2 de Léa, initialisable (E1 signé 3/3) et
 * signable immédiatement par l'apprenti·e (aucune question obligatoire E2
 * dans la banque par défaut).
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

/** Trace un zigzag (~2 segments) sur la zone de signature. */
async function tracerSignature(page: Page) {
  const canvas = page.getByTestId('zone-signature');
  await expect(canvas).toBeVisible();
  // page.mouse opère en coordonnées viewport : le canvas doit y être visible.
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 15, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 90, { steps: 8 });
  await page.mouse.move(box.x + box.width - 15, box.y + 40, { steps: 8 });
  await page.mouse.up();
}

async function initialiserE2CommeFormateur(page: Page) {
  await page.goto('/livret/entretien/2');
  await page.getByTestId('init-entretien-2').click();
  await expect(page.getByTestId('attitudes-entretien')).toBeVisible();
}

/** Bascule côté apprenti·e et débloque R20 (au moins une réponse renseignée). */
async function preparerSignatureApprenti(page: Page) {
  await selectRole(page, 'Apprenti·e');
  await page
    .getByLabel(/Comment vous sentez-vous au sein de votre équipe/i)
    .fill("L'équipe m'a bien accueillie.");
}

test('le tracé manuscrit est exigé pour confirmer une signature', async ({ page }) => {
  await initialiserE2CommeFormateur(page);

  // Côté apprenti·e : le 1er clic ouvre la zone de signature.
  await preparerSignatureApprenti(page);
  await page.getByRole('button', { name: /Signer en tant que Léa/i }).click();
  await expect(page.getByTestId('zone-signature')).toBeVisible();

  // Sans tracé, « Confirmer » est désactivé.
  const confirmer = page.getByRole('button', { name: /^Confirmer$/ });
  await expect(confirmer).toBeDisabled();

  // Un tracé l'active ; « Effacer » le re-désactive.
  await tracerSignature(page);
  await expect(confirmer).toBeEnabled();
  await page.getByRole('button', { name: /^Effacer$/ }).click();
  await expect(confirmer).toBeDisabled();

  // Nouveau tracé + confirmation → signé, l'image manuscrite est affichée.
  await tracerSignature(page);
  await confirmer.click();
  await expect(page.getByText(/^Signé$/).first()).toBeVisible();
  const image = page.getByAltText(/Signature manuscrite — Apprenti·e/i);
  await expect(image).toBeVisible();
  // Le PNG est bien embarqué en data-URL (stocké dans la signature).
  await expect(image).toHaveAttribute('src', /^data:image\/png/);
});

test('la signature manuscrite persiste au rechargement (localStorage)', async ({ page }) => {
  await initialiserE2CommeFormateur(page);
  await preparerSignatureApprenti(page);
  await page.getByRole('button', { name: /Signer en tant que Léa/i }).click();
  await tracerSignature(page);
  await page.getByRole('button', { name: /^Confirmer$/ }).click();
  await expect(page.getByAltText(/Signature manuscrite — Apprenti·e/i)).toBeVisible();

  await page.reload();
  await expect(page.getByAltText(/Signature manuscrite — Apprenti·e/i)).toBeVisible();
  // R21 : aucune action de retrait — le bouton « Signer » a disparu pour ce rôle.
  await expect(page.getByRole('button', { name: /Signer en tant que Léa/i })).toHaveCount(0);
});

test("« Annuler » abandonne le tracé sans signer (l'encart se referme)", async ({ page }) => {
  await initialiserE2CommeFormateur(page);
  await preparerSignatureApprenti(page);
  await page.getByRole('button', { name: /Signer en tant que Léa/i }).click();
  await tracerSignature(page);
  await page.getByRole('button', { name: /^Annuler$/ }).click();

  // Retour au bouton initial, rien n'est signé.
  await expect(page.getByRole('button', { name: /Signer en tant que Léa/i })).toBeVisible();
  await expect(page.getByAltText(/Signature manuscrite/i)).toHaveCount(0);

  // Et en rouvrant, le tracé précédent n'a pas survécu (Confirmer désactivé).
  await page.getByRole('button', { name: /Signer en tant que Léa/i }).click();
  await expect(page.getByRole('button', { name: /^Confirmer$/ })).toBeDisabled();
});

test('les signatures historiques (fixtures) restent valides sans tracé', async ({ page }) => {
  // E1 de Léa est signé 3/3 dans les fixtures, sans signature manuscrite :
  // les cartes affichent « Signé » sans image — pas de régression.
  await page.goto('/livret/entretien/1');
  await expect(page.getByText(/^Signé$/)).toHaveCount(3);
  await expect(page.getByAltText(/Signature manuscrite/i)).toHaveCount(0);
});
