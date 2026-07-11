import { expect, test, type Page } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Documents administratifs nominatifs (10 juillet 2026 — demande direction).
 *
 * Fixtures : Léa porte 2 documents (« Partie 1 » attesté ; « Convention »
 * RÉSERVÉE à l'apprentie, non attestée) ; Yanis 1 document public non attesté.
 *
 * Couvre : visibilité par rôle (flag « réservé »), dépôt par le coordo,
 * attestation par signature manuscrite tactile de l'apprentie, verrou de
 * suppression d'un document attesté, alertes « À traiter » (coordo + formateur
 * de Yanis, filtrées pour le formateur sur les documents réservés) et bandeau
 * du tableau de bord apprenti·e.
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

/** Trace un zigzag (~2 segments) sur la zone de signature (pattern tactile). */
async function tracerSignature(page: Page) {
  const canvas = page.getByTestId('zone-signature');
  await expect(canvas).toBeVisible();
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 15, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 90, { steps: 8 });
  await page.mouse.move(box.x + box.width - 15, box.y + 40, { steps: 8 });
  await page.mouse.up();
}

test('visibilité par rôle : le formateur ne voit pas le document réservé de Léa, le coordo si', async ({
  page,
}) => {
  // Formateur (rôle par défaut, Léa active) : seul le document public apparaît.
  await page.goto('/livret/documents');
  await expect(page.getByTestId('document-docadm-lea-engagements')).toBeVisible();
  await expect(page.getByTestId('document-docadm-lea-convention')).toHaveCount(0);

  // Coordo : les 2 documents, avec le badge « Réservé à l'apprenti·e ».
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/livret/documents');
  const reserve = page.getByTestId('document-docadm-lea-convention');
  await expect(reserve).toBeVisible();
  await expect(reserve.getByText(/Réservé à l'apprenti·e/i)).toBeVisible();
  // Le document attesté affiche la date de prise de connaissance.
  await expect(page.getByTestId('attestation-docadm-lea-engagements')).toContainText(
    /attestée par l'apprenti·e le/i,
  );
});

test("l'apprentie signe un document (signature tactile) : attestation horodatée + image, bandeau disparu", async ({
  page,
}) => {
  await selectRole(page, 'Apprenti·e');
  await page.goto('/livret/documents');

  // 1 document à signer (la convention réservée) → bandeau visible.
  await expect(page.getByTestId('bandeau-documents-a-signer')).toContainText(
    /1 document à signer/i,
  );

  // Signature tactile sur la carte de la convention.
  const carte = page.getByTestId('document-docadm-lea-convention');
  await carte.getByRole('button', { name: /J'atteste en avoir pris connaissance/i }).click();
  await tracerSignature(page);
  await carte.getByRole('button', { name: /^Confirmer$/i }).click();

  // Attestation horodatée + image de la signature manuscrite.
  const attestation = page.getByTestId('attestation-docadm-lea-convention');
  await expect(attestation).toContainText(/attestée par l'apprenti·e le/i);
  await expect(attestation.locator('img')).toBeVisible();
  await expect(page.getByTestId('bandeau-documents-a-signer')).toHaveCount(0);

  // Persistance après rechargement.
  await page.reload();
  await expect(page.getByTestId('attestation-docadm-lea-convention')).toContainText(/attestée/i);
});

test('le coordo dépose un document nominatif : carte visible, supprimable tant que non attesté', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/livret/documents');
  await page.getByTestId('ouvrir-depot-document').click();

  const modale = page.getByRole('dialog');
  await expect(modale.getByText(/Document nominatif pour/i)).toContainText(/Léa MARTIN/);
  await modale.getByTestId('depot-doc-fichier').setInputFiles({
    name: 'reglement-interieur.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n%document de test e2e\n%%EOF'),
  });
  // Titre pré-rempli depuis le nom de fichier, ajustable.
  await expect(modale.getByTestId('depot-doc-titre')).toHaveValue(/reglement interieur/i);
  await modale.getByTestId('depot-doc-titre').fill('Règlement intérieur du CFA');
  await modale.getByTestId('depot-doc-valider').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // La carte apparaît, en attente de signature, et reste supprimable.
  const carte = page.locator('li').filter({ hasText: 'Règlement intérieur du CFA' });
  await expect(carte).toBeVisible();
  await expect(carte.getByText(/En attente de la signature de l'apprenti·e/i)).toBeVisible();
  await carte.getByRole('button', { name: /Supprimer le document Règlement/i }).click();
  await carte.getByRole('button', { name: /Confirmer la suppression/i }).click();
  await expect(page.locator('li').filter({ hasText: 'Règlement intérieur du CFA' })).toHaveCount(0);

  // Le document ATTESTÉ de Léa, lui, est insupprimable (acte engagé).
  const bloque = page
    .getByTestId('document-docadm-lea-engagements')
    .getByRole('button', { name: /Supprimer le document Partie 1/i });
  await expect(bloque).toBeDisabled();
});

test('alertes « À traiter » : le coordo suit tous les documents, le formateur seulement les non réservés', async ({
  page,
}) => {
  // Coordo Martine : Yanis (public) + Léa (réservé) non attestés.
  await selectRole(page, 'Coordinateur·rice');
  const centre = page.getByTestId('centre-alertes');
  await expect(centre.getByTestId('alerte-document-docadm-yanis-engagements')).toContainText(
    /signature de l'apprenti·e attendue/i,
  );
  await expect(centre.getByTestId('alerte-document-docadm-lea-convention')).toBeVisible();

  // Formatrice Sophie (CAP) : le document réservé de Léa lui est invisible.
  await selectRole(page, 'Formateur référent');
  await expect(page.getByTestId('alerte-document-docadm-lea-convention')).toHaveCount(0);

  // Formateur Marc (BTS) : l'alerte du document public de Yanis, cliquable.
  await page.getByRole('button', { name: /Marc TISSIER/i }).click();
  await page.getByTestId('alerte-document-docadm-yanis-engagements').click();
  await expect(page).toHaveURL(/\/livret\/documents/);
  await expect(page.getByTestId('document-docadm-yanis-engagements')).toBeVisible();
});

test('tableau de bord apprenti·e : bandeau « documents à signer » avec navigation', async ({
  page,
}) => {
  await selectRole(page, 'Apprenti·e');
  await page.goto('/');
  const bandeau = page.getByTestId('bandeau-apprenti-documents');
  await expect(bandeau).toContainText(/1 document administratif à signer/i);
  await bandeau.click();
  await expect(page).toHaveURL(/\/livret\/documents/);
});
