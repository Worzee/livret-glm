import { expect, test, type Page } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Documents administratifs nominatifs (10 juillet 2026 — demande direction ;
 * v2 le 13 juillet 2026 — réunion DG : typologie de 4 documents OBLIGATOIRES
 * + « Autre », attestation simple après lecture, anomalie « manquant »).
 *
 * Fixtures : Léa porte contrat pédagogique + règlement intérieur ATTESTÉS,
 * protection des données NON attestée, droit à l'image MANQUANT, et une
 * convention « Autre » RÉSERVÉE non attestée ; Yanis a son contrat pédagogique
 * public NON attesté (3 autres types attestés) ; les 6 autres apprenti·e·s ont
 * un dossier complet attesté.
 *
 * Couvre : visibilité par rôle (flag « réservé »), bandeau d'état des 4
 * obligatoires, dépôt typé par le coordo (titre seulement pour « Autre »),
 * remplacement d'un type attesté (attestation remise à zéro), attestation
 * après lecture (bouton grisé avant consultation), verrou de suppression,
 * alertes « À traiter » (manquants coordo/admin, attestations attendues) et
 * bandeau du tableau de bord apprenti·e.
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

/** Consulte un document (ouvre le PDF dans un onglet — refermé aussitôt). */
async function consulterDocument(page: Page, docId: string) {
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId(`consulter-${docId}`).click(),
  ]);
  await popup.close();
}

test("visibilité par rôle + état des obligatoires : le formateur ne voit pas la convention réservée de Léa, le coordo si", async ({
  page,
}) => {
  // Formateur (rôle par défaut, Léa active) : les 3 documents publics, pas la
  // convention réservée.
  await page.goto('/livret/documents');
  await expect(page.getByTestId('document-docadm-lea-contrat-pedagogique')).toBeVisible();
  await expect(page.getByTestId('document-docadm-lea-protection-donnees')).toBeVisible();
  await expect(page.getByTestId('document-docadm-lea-reglement-interieur')).toBeVisible();
  await expect(page.getByTestId('document-docadm-lea-convention')).toHaveCount(0);

  // Bandeau d'état des 4 obligatoires : droit à l'image manquant.
  await expect(page.getByTestId('etat-doc-droit-image')).toContainText(/Non déposé/i);
  await expect(page.getByTestId('etat-doc-contrat-pedagogique')).toContainText(/^.*Attesté/);
  await expect(page.getByTestId('etat-doc-protection-donnees')).toContainText(
    /Attestation de l'apprenti·e attendue/i,
  );

  // Coordo : la convention réservée apparaît, avec son badge.
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/livret/documents');
  const reserve = page.getByTestId('document-docadm-lea-convention');
  await expect(reserve).toBeVisible();
  await expect(reserve.getByText(/Réservé à l'apprenti·e/i)).toBeVisible();
  // Le document attesté affiche la date de prise de connaissance.
  await expect(page.getByTestId('attestation-docadm-lea-contrat-pedagogique')).toContainText(
    /attestée par l'apprenti·e le/i,
  );
});

test("l'apprentie atteste après lecture : bouton grisé avant consultation, attestation horodatée, bandeau décrémenté", async ({
  page,
}) => {
  await selectRole(page, 'Apprenti·e');
  await page.goto('/livret/documents');

  // 2 documents à attester (protection des données + convention réservée).
  await expect(page.getByTestId('bandeau-documents-a-attester')).toContainText(
    /2 documents à attester/i,
  );

  // « Lu et attesté » : le bouton est grisé tant que le document n'est pas lu.
  const bouton = page.getByTestId('attester-docadm-lea-protection-donnees');
  await expect(bouton).toBeDisabled();
  await consulterDocument(page, 'docadm-lea-protection-donnees');
  await expect(bouton).toBeEnabled();

  // Attestation à confirmation explicite (sans signature manuscrite).
  await bouton.click();
  await expect(page.getByText(/Vous allez attester/i)).toBeVisible();
  await page.getByTestId('confirmer-attester-docadm-lea-protection-donnees').click();

  const attestation = page.getByTestId('attestation-docadm-lea-protection-donnees');
  await expect(attestation).toContainText(/attestée par l'apprenti·e le/i);
  await expect(page.getByTestId('etat-doc-protection-donnees')).toContainText(/Attesté/);
  await expect(page.getByTestId('bandeau-documents-a-attester')).toContainText(
    /1 document à attester/i,
  );

  // Persistance après rechargement.
  await page.reload();
  await expect(page.getByTestId('attestation-docadm-lea-protection-donnees')).toContainText(
    /attestée/i,
  );
});

test('le coordo dépose le type manquant (droit à l\'image) : pas de titre à saisir, carte visible, supprimable tant que non attesté', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/livret/documents');
  await page.getByTestId('ouvrir-depot-document').click();

  const modale = page.getByRole('dialog');
  await expect(modale.getByText(/Document nominatif pour/i)).toContainText(/Léa MARTIN/);

  // Type obligatoire → pas de champ titre ni de flag « réservé ».
  await modale.getByTestId('depot-doc-type').selectOption('droit-image');
  await expect(modale.getByTestId('depot-doc-titre')).toHaveCount(0);
  await expect(modale.getByTestId('depot-doc-reserve')).toHaveCount(0);
  // « Autre » → titre + flag réapparaissent.
  await modale.getByTestId('depot-doc-type').selectOption('autre');
  await expect(modale.getByTestId('depot-doc-titre')).toBeVisible();
  await expect(modale.getByTestId('depot-doc-reserve')).toBeVisible();
  await modale.getByTestId('depot-doc-type').selectOption('droit-image');

  await modale.getByTestId('depot-doc-fichier').setInputFiles({
    name: 'droit-image-lea.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n%document de test e2e\n%%EOF'),
  });
  await modale.getByTestId('depot-doc-valider').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // La carte apparaît sous le libellé de la typologie, en attente d'attestation.
  const carte = page.locator('li').filter({ hasText: "Droit à l'image" });
  await expect(carte).toBeVisible();
  await expect(carte.getByText(/En attente de l'attestation de l'apprenti·e/i)).toBeVisible();
  await expect(page.getByTestId('etat-doc-droit-image')).toContainText(
    /Attestation de l'apprenti·e attendue/i,
  );

  // Supprimable tant que non attesté — l'état repasse à « Non déposé ».
  await carte.getByRole('button', { name: /Supprimer le document Droit/i }).click();
  await carte.getByRole('button', { name: /Confirmer la suppression/i }).click();
  await expect(page.locator('li').filter({ hasText: "Droit à l'image" })).toHaveCount(0);
  await expect(page.getByTestId('etat-doc-droit-image')).toContainText(/Non déposé/i);

  // Le contrat ATTESTÉ de Léa, lui, est insupprimable (acte engagé).
  const bloque = page
    .getByTestId('document-docadm-lea-contrat-pedagogique')
    .getByRole('button', { name: /Supprimer le document Contrat/i });
  await expect(bloque).toBeDisabled();
});

test('remplacement d\'un type déjà attesté : avertissement, document remplacé, attestation remise à zéro', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/livret/documents');
  await page.getByTestId('ouvrir-depot-document').click();

  const modale = page.getByRole('dialog');
  await modale.getByTestId('depot-doc-type').selectOption('contrat-pedagogique');
  // Avertissement : un contrat attesté existe déjà pour Léa.
  await expect(modale.getByTestId('depot-doc-remplacement')).toContainText(
    /remplacera et l'attestation de l'apprenti·e repartira de zéro/i,
  );
  await modale.getByTestId('depot-doc-fichier').setInputFiles({
    name: 'contrat-pedagogique-lea-v2.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n%version corrigee e2e\n%%EOF'),
  });
  await modale.getByTestId('depot-doc-valider').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Une seule carte « Contrat pédagogique », plus attestée (remise à zéro).
  const cartes = page.locator('li').filter({ hasText: 'Contrat pédagogique' });
  await expect(cartes).toHaveCount(1);
  await expect(cartes.getByText(/En attente de l'attestation de l'apprenti·e/i)).toBeVisible();
  await expect(page.getByTestId('etat-doc-contrat-pedagogique')).toContainText(
    /Attestation de l'apprenti·e attendue/i,
  );
});

test('alertes « À traiter » : manquants pour le coordo, attestations pour l\'encadrement (réservés filtrés)', async ({
  page,
}) => {
  // Coordo Martine : anomalie « dépôt à effectuer » (droit à l'image de Léa)
  // + attestations attendues (Léa ×2 dont la réservée, Yanis).
  await selectRole(page, 'Coordinateur·rice');
  const centre = page.getByTestId('centre-alertes');
  await expect(
    centre.getByTestId('alerte-document-manquant-u-apprenti-lea-droit-image'),
  ).toContainText(/dépôt à effectuer/i);
  await expect(
    centre.getByTestId('alerte-document-docadm-lea-protection-donnees'),
  ).toContainText(/attestation de l'apprenti·e attendue/i);
  await expect(centre.getByTestId('alerte-document-docadm-lea-convention')).toBeVisible();
  await expect(
    centre.getByTestId('alerte-document-docadm-yanis-contrat-pedagogique'),
  ).toBeVisible();

  // Formatrice Sophie (CAP) : ni anomalie de dépôt (réservée aux déposants),
  // ni document réservé.
  await selectRole(page, 'Formateur référent');
  await expect(
    page.getByTestId('alerte-document-manquant-u-apprenti-lea-droit-image'),
  ).toHaveCount(0);
  await expect(page.getByTestId('alerte-document-docadm-lea-convention')).toHaveCount(0);
  await expect(page.getByTestId('alerte-document-docadm-lea-protection-donnees')).toBeVisible();

  // Formateur Marc (BTS) : l'alerte du contrat public de Yanis, cliquable.
  await page.getByRole('button', { name: /Marc TISSIER/i }).click();
  await page.getByTestId('alerte-document-docadm-yanis-contrat-pedagogique').click();
  await expect(page).toHaveURL(/\/livret\/documents/);
  await expect(page.getByTestId('document-docadm-yanis-contrat-pedagogique')).toBeVisible();
});

test('tableau de bord apprenti·e : bandeau « documents à attester » avec navigation', async ({
  page,
}) => {
  await selectRole(page, 'Apprenti·e');
  await page.goto('/');
  const bandeau = page.getByTestId('bandeau-apprenti-documents');
  await expect(bandeau).toContainText(/2 documents administratifs à attester/i);
  await bandeau.click();
  await expect(page).toHaveURL(/\/livret\/documents/);
});
