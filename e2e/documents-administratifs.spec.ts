import { expect, test, type Page } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Documents administratifs (10 juillet 2026 — demande direction ; v2/v3 le
 * 13 juillet 2026 — réunion DG : typologie de 4 documents OBLIGATOIRES +
 * « Autre », attestation simple après lecture, anomalie « manquant »,
 * documents AU NIVEAU FORMATION — dépôt en masse, demande 4).
 *
 * Fixtures : le règlement intérieur est un document de FORMATION (CAP + BTS,
 * attesté par tou·te·s SAUF Sofia). Léa porte un contrat pédagogique ATTESTÉ,
 * une protection des données NON attestée, un droit à l'image MANQUANT et une
 * convention « Autre » RÉSERVÉE non attestée ; Yanis a son contrat pédagogique
 * public NON attesté ; les autres dossiers nominatifs sont complets attestés.
 *
 * Couvre : visibilité par rôle (flag « réservé », badge formation), bandeau
 * d'état des 4 obligatoires, dépôt typé par le coordo (titre seulement pour
 * « Autre »), remplacement d'un type attesté (attestation remise à zéro),
 * attestation après lecture (bouton grisé avant consultation), verrou de
 * suppression, alertes « À traiter » (manquants coordo/admin, attestations
 * attendues), bandeau du tableau de bord apprenti·e, et dépôt EN MASSE depuis
 * la page Formations (couverture de la promo, remplacement collectif).
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
  // Formateur (rôle par défaut, Léa active) : les documents publics — dont le
  // règlement porté par la FORMATION (badge dédié) — pas la convention réservée.
  await page.goto('/livret/documents');
  await expect(page.getByTestId('document-docadm-lea-contrat-pedagogique')).toBeVisible();
  await expect(page.getByTestId('document-docadm-lea-protection-donnees')).toBeVisible();
  const reglement = page.getByTestId('document-docform-cap-reglement');
  await expect(reglement).toBeVisible();
  await expect(reglement.getByText(/Document de la formation/i)).toBeVisible();
  await expect(page.getByTestId('attestation-docform-cap-reglement')).toContainText(
    /attestée par l'apprenti·e le/i,
  );
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
  // + attestations attendues (Léa ×2 dont la réservée, Yanis, et le règlement
  // de FORMATION de Sofia — id préfixé par l'apprentie).
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
  await expect(
    centre.getByTestId('alerte-document-u-apprenti-sofia-docform-cap-reglement'),
  ).toContainText(/Accusé réception du règlement intérieur/i);

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

test('dépôt en masse (page Formations) : le document couvre la promo et l\'apprentie l\'atteste', async ({
  page,
}) => {
  // Coordo : modale « Documents de la promotion » du CAP Cuisine.
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  await page.getByTestId('documents-formation-f-cap-cuisine-2025').click();
  const modale = page.getByRole('dialog');

  // Le règlement de la promo est déjà déposé (5/6 attestations, insupprimable).
  const ligneReglement = modale.getByTestId('docform-docform-cap-reglement');
  await expect(ligneReglement).toContainText(/attesté par 5\/6/i);
  await expect(ligneReglement.getByText(/insupprimable/i)).toBeVisible();

  // Le contrat pédagogique (nominatif par nature) n'est pas proposé en masse.
  await expect(
    modale.getByRole('option', { name: /Contrat pédagogique/i }),
  ).toHaveCount(0);

  // Dépôt du droit à l'image pour toute la promo.
  await modale.getByTestId('depot-doc-type').selectOption('droit-image');
  await modale.getByTestId('depot-doc-fichier').setInputFiles({
    name: 'droit-image-cap.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n%document promo e2e\n%%EOF'),
  });
  await modale.getByTestId('depot-doc-valider').click();
  // La modale reste ouverte : le document apparaît dans la liste (0/6).
  await expect(modale.getByTestId('docform-liste')).toContainText(/Droit à l'image/i);
  await expect(
    modale.getByTestId('docform-liste').getByText(/attesté par 0\/6/i),
  ).toBeVisible();
  await modale.getByTestId('depot-doc-fermer').click();

  // L'anomalie « dépôt à effectuer » de Léa est tombée.
  await page.goto('/');
  await expect(
    page.getByTestId('alerte-document-manquant-u-apprenti-lea-droit-image'),
  ).toHaveCount(0);

  // Léa voit le document (badge formation) : le nominatif des autres prime,
  // elle n'avait pas de droit à l'image nominatif — elle atteste après lecture.
  await selectRole(page, 'Apprenti·e');
  await page.goto('/livret/documents');
  const carte = page.locator('li').filter({ hasText: "Droit à l'image" });
  await expect(carte.getByText(/Document de la formation/i)).toBeVisible();
  await expect(page.getByTestId('etat-doc-droit-image')).toContainText(
    /Attestation de l'apprenti·e attendue/i,
  );
  const attester = carte.getByRole('button', { name: /J'atteste avoir pris connaissance/i });
  await expect(attester).toBeDisabled();
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    carte.getByRole('button', { name: /Consulter/i }).click(),
  ]);
  await popup.close();
  await attester.click();
  await carte.getByRole('button', { name: /^Confirmer$/i }).click();
  await expect(carte.getByText(/attestée par l'apprenti·e le/i)).toBeVisible();
  await expect(page.getByTestId('etat-doc-droit-image')).toContainText(/Attesté/);
});

test('remplacement en masse : les attestations de la promo repartent de zéro', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  await page.getByTestId('documents-formation-f-cap-cuisine-2025').click();
  const modale = page.getByRole('dialog');

  // Redéposer le règlement → avertissement de remplacement collectif.
  await modale.getByTestId('depot-doc-type').selectOption('reglement-interieur');
  await expect(modale.getByTestId('depot-doc-remplacement')).toContainText(
    /remplacera pour tous les apprenti·e·s et les attestations repartiront de zéro/i,
  );
  await modale.getByTestId('depot-doc-fichier').setInputFiles({
    name: 'reglement-interieur-v2.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n%version 2 du reglement e2e\n%%EOF'),
  });
  await modale.getByTestId('depot-doc-valider').click();

  // Un seul règlement dans la liste, attestations remises à zéro, supprimable
  // (personne n'a encore attesté la nouvelle version).
  const liste = modale.getByTestId('docform-liste');
  await expect(liste.getByText(/Accusé réception du règlement intérieur/i)).toHaveCount(1);
  await expect(liste.getByText(/attesté par 0\/6/i)).toBeVisible();
  await expect(liste.getByText(/insupprimable/i)).toHaveCount(0);
  await modale.getByTestId('depot-doc-fermer').click();

  // Côté Léa : le règlement (attesté sur l'ancienne version) est à ré-attester.
  await page.goto('/livret/documents');
  await expect(page.getByTestId('etat-doc-reglement-interieur')).toContainText(
    /Attestation de l'apprenti·e attendue/i,
  );
});
