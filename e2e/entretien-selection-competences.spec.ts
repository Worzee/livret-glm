import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Sélection « entreprise » à l'entretien tripartite — CDC v1.5 addendum +
 * chantier référentiels/compétences #4 (juillet 2026).
 *
 * Depuis la modification #4, la promo CAP Cuisine est en MODE ACTIVITÉS : la
 * section §12 de l'entretien porte sur les **activités du modèle** (mêmes
 * règles — tout coché par défaut, maître + formateur décochent, figée à la
 * 3ᵉ signature, R10). La mécanique « compétences » reste vivante sur le BTS
 * MHR (mode compétences).
 *
 * Couvre :
 *   - Léa (sélection d'activités validée — fixtures) : badge « validée »,
 *     cases désactivées, grille Synthèse restreinte aux compétences couvertes
 *     par les activités retenues (a6 écartée → c3-3 absente).
 *   - Sofia (entretien jamais initialisé) : bandeau « non validée » sur la
 *     fiche de période et message dédié sur la Synthèse.
 *   - Toutes les activités cochées par défaut ; maître ET formateur décochent.
 *   - Réimport d'un référentiel (BTS) : la sélection de compétences non
 *     validée repart « tout coché » (Yanis).
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

// ─────────────────────────────────────────────────────────────────────────────
// Sofia PEREIRA — pas d'entretien initialisé (sélection non encore validée)
// ─────────────────────────────────────────────────────────────────────────────

test('Sofia : la fiche de période affiche le bandeau « sélection d’activités non validée »', async ({
  page,
}) => {
  await selectRole(page, 'Formateur référent');
  await page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i }).click();
  await page.goto('/livret/fiches-suivi');
  await page
    .getByRole('link', { name: /Période 1/i })
    .first()
    .click();
  await expect(
    page.getByText(/Sélection des activités prévues en entreprise non validée/i),
  ).toBeVisible();
  // Le sélecteur d'ajout est absent (caché tant que la sélection n'est pas validée).
  await expect(page.getByLabel(/Ajouter une (compétence|activité) à la fiche/i)).toHaveCount(0);
});

test("Sofia : la grille de synthèse est masquée tant que la sélection n'est pas validée", async ({
  page,
}) => {
  await selectRole(page, 'Formateur référent');
  await page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i }).click();
  await page.goto('/livret/synthese');
  await expect(
    page.getByText(/Sélection des activités prévues en entreprise non validée/i),
  ).toBeVisible();
  // Aucune ligne du référentiel CAP Cuisine n'est rendue (synthèse non affichée).
  await expect(page.getByRole('heading', { name: /Synthèse par bloc/i })).toHaveCount(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// Léa MARTIN — sélection d'activités validée depuis la fixture
// ─────────────────────────────────────────────────────────────────────────────

test('Léa : la section « Activités prévues en entreprise » affiche le badge « Sélection validée » et les cases sont désactivées', async ({
  page,
}) => {
  await selectRole(page, 'Formateur référent');
  // Léa est l'apprenti·e actif·ve par défaut — sa promo est en mode activités.
  await page.goto('/livret/entretien');
  await expect(
    page.getByRole('heading', { name: /Activités prévues en entreprise/i }),
  ).toBeVisible();
  await expect(page.getByText(/Sélection validée : 5 activités sur 6/i)).toBeVisible();
  // a1 est dans la sélection de Léa → case cochée, mais désactivée car validée
  const caseA1 = page.getByTestId('selection-act-act-cap-a1');
  await expect(caseA1).toBeChecked();
  await expect(caseA1).toBeDisabled();
  // a6 (desserts à l'assiette) a été écartée à l'entretien → décochée
  await expect(page.getByTestId('selection-act-act-cap-a6')).not.toBeChecked();
});

test('Léa : la grille de synthèse est restreinte aux compétences couvertes par les activités retenues', async ({
  page,
}) => {
  await selectRole(page, 'Maître / Tuteur');
  await page.goto('/livret/synthese');
  // a6 est écartée → c3-3 (« Dresser et envoyer un dessert à l'assiette »),
  // couverte par a6 seule, disparaît entièrement de la grille.
  await expect(
    page.getByLabel(/Acquis en entreprise pour Dresser et envoyer un dessert/i),
  ).toHaveCount(0);
  await expect(page.getByText("Dresser et envoyer un dessert à l'assiette")).toHaveCount(0);
  // c1-1 (couverte par a1 retenue) → SelecteurNiveau visible, avec la
  // provenance de la projection (chantier #4).
  await expect(
    page.getByLabel(/^Acquis en entreprise pour Réceptionner et stocker la marchandise$/i).first(),
  ).toBeVisible();
  await expect(page.getByText(/Via activité « .+ » \(Période \d+\)/i).first()).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// Tout activé par défaut + maître et formateur décochent (mode activités)
// ─────────────────────────────────────────────────────────────────────────────

test('Sofia : après initialisation, toutes les activités sont cochées par défaut ; maître ET formateur décochent', async ({
  page,
}) => {
  // 1. Le formateur initialise l'entretien de Sofia.
  await selectRole(page, 'Formateur référent');
  await page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i }).click();
  await page.goto('/livret/entretien');
  await page.getByRole('button', { name: /Initialiser l'entretien/i }).click();
  await expect(
    page.getByRole('heading', { name: /Activités prévues en entreprise/i }),
  ).toBeVisible();

  // 2. Le formateur peut décocher lui aussi (réunion direction, 1ᵉʳ juillet).
  const caseFormateur = page.getByTestId('selection-act-act-cap-a6');
  await expect(caseFormateur).toBeChecked();
  await expect(caseFormateur).toBeEnabled();
  await caseFormateur.uncheck();
  await expect(caseFormateur).not.toBeChecked();

  // 3. Côté maître : toutes les autres cases restent cochées et éditables.
  await selectRole(page, 'Maître / Tuteur');
  const caseA1 = page.getByTestId('selection-act-act-cap-a1');
  await expect(caseA1).toBeChecked();
  await expect(caseA1).toBeEnabled();
  await caseA1.uncheck();
  await expect(caseA1).not.toBeChecked();
});

test("import d'un nouveau référentiel (BTS) : la sélection de compétences repart « tout coché »", async ({
  page,
}) => {
  // 1. Le coordo importe un nouveau référentiel sur la formation BTS MHR
  //    (mode compétences — le référentiel de la promo CAP, en mode activités,
  //    est figé, cf. admin-activites.spec.ts).
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/referentiels');
  await page.getByRole('button', { name: /Importer un référentiel/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('import-ref-formation').selectOption({ value: 'f-bts-mhr-2025' });
  await modale
    .getByTestId('import-ref-csv')
    .fill(['BLOC;COMPETENCE', 'BLOC 1;Servir en salle', 'BLOC 1;Gérer les stocks'].join('\n'));
  await modale.getByRole('button', { name: /^Aperçu$/i }).click();
  await modale.getByRole('button', { name: /Importer \(2 compétences évaluables\)/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // 2. Yanis (BTS, sélection non validée — entretien jamais initialisé) : sa
  //    sélection est réalignée sur le NOUVEAU référentiel, tout coché.
  await selectRole(page, 'Formateur référent');
  await page.goto('/');
  await page.getByRole('button', { name: /Marc TISSIER/i }).click();
  await page.getByRole('button', { name: /Ouvrir le livret de Yanis BELKACEM/i }).click();
  await page.goto('/livret/entretien');
  await page.getByRole('button', { name: /Initialiser l'entretien/i }).click();
  await expect(
    page.getByRole('heading', { name: /Compétences abordées en entreprise/i }),
  ).toBeVisible();
  await expect(page.getByTestId('selection-comp-bloc-bloc-1-c1')).toBeChecked();
  await expect(page.getByTestId('selection-comp-bloc-bloc-1-c2')).toBeChecked();
});

test('Léa + apprenti·e : la section sélection est en lecture seule (matrice droits)', async ({
  page,
}) => {
  await selectRole(page, 'Apprenti·e');
  await page.goto('/livret/entretien');
  // Toutes les cases sont disabled (apprenti·e n'a pas le droit d'éditer)
  await expect(page.getByTestId('selection-act-act-cap-a1')).toBeDisabled();
  await expect(page.getByTestId('selection-act-act-cap-a6')).toBeDisabled();
});

// ─────────────────────────────────────────────────────────────────────────────
// Ajout d'activités à la fiche de période ouvert au tuteur (17 juin 2026 +
// chantier #4 : « Ajouter une activité » en mode activités)
// ─────────────────────────────────────────────────────────────────────────────

test('le maître / tuteur peut ajouter une activité à une fiche de période (mode activités)', async ({
  page,
}) => {
  // Minh : période 1 en brouillon (maître pas encore signataire), sélection
  // d'activités validée → le sélecteur d'ajout doit être disponible.
  await page.getByRole('button', { name: /Ouvrir le livret de Minh NGUYEN/i }).click();
  await selectRole(page, 'Maître / Tuteur');
  await page.goto('/livret/fiches-suivi');
  await page
    .getByRole('link', { name: /Période 1/i })
    .first()
    .click();
  const selecteur = page.getByLabel(/Ajouter une activité à la fiche/i);
  await expect(selecteur).toBeVisible();
  // Seules les activités RETENUES apparaissent (a6 écartée chez Minh) + la
  // possibilité d'une activité libre hors modèle (arbitrage Q5).
  await expect(selecteur.locator('option', { hasText: /desserts à l’assiette/i })).toHaveCount(0);
  await expect(selecteur.locator('option', { hasText: /Activité libre/i })).toHaveCount(1);
  // Ajout effectif d'une activité retenue → une ligne apparaît dans le tableau.
  await selecteur.selectOption({ label: 'Réceptionner et stocker les livraisons du jour' });
  await expect(
    page.getByRole('cell', { name: 'Réceptionner et stocker les livraisons du jour', exact: true }),
  ).toBeVisible();
});

test("activité libre : le tuteur saisit l'intitulé et les détails dans une zone de texte (persistée)", async ({
  page,
}) => {
  // Minh : période 1 en brouillon, sélection d'activités validée → le maître
  // peut ajouter une activité libre hors modèle ET la décrire (juillet 2026).
  await page.getByRole('button', { name: /Ouvrir le livret de Minh NGUYEN/i }).click();
  await selectRole(page, 'Maître / Tuteur');
  await page.goto('/livret/fiches-suivi');
  await page
    .getByRole('link', { name: /Période 1/i })
    .first()
    .click();

  // Ajout d'une activité libre hors modèle : au lieu du libellé figé
  // « Activité libre », une zone de texte apparaît dans la colonne « Activité ».
  await page.getByLabel(/Ajouter une activité à la fiche/i).selectOption({ value: '__libre' });
  // Le libellé est rendu deux fois (tableau desktop + carte mobile empilée) —
  // on ne cible que la vue visible selon le viewport du projet Playwright.
  const zone = page
    .getByLabel(/Intitulé et détails de l'activité libre/i)
    .filter({ visible: true });
  await expect(zone).toBeVisible();
  const detail = 'Inventaire de fin de mois en économat : comptage des stocks et saisie logiciel.';
  await zone.fill(detail);
  await expect(zone).toHaveValue(detail);

  // Persistance : après rechargement, la saisie est conservée (store persisté).
  await page.reload();
  await expect(
    page.getByLabel(/Intitulé et détails de l'activité libre/i).filter({ visible: true }),
  ).toHaveValue(detail);
});

test("l'apprenti·e ne peut toujours pas ajouter d'activité à la fiche", async ({ page }) => {
  // Léa P3 : sélection validée mais l'apprenti·e n'a pas le droit d'ajout.
  await selectRole(page, 'Apprenti·e');
  await page.goto('/livret/fiches-suivi');
  await page
    .getByRole('link', { name: /Période 3/i })
    .first()
    .click();
  await expect(page.getByLabel(/Ajouter une (compétence|activité) à la fiche/i)).toHaveCount(0);
});

test('la fiche de période n’affiche plus la colonne « Évaluation GRETA CFA » (17 juin 2026)', async ({
  page,
}) => {
  // Léa P3 contient des activités → le tableau de suivi s'affiche.
  await page.goto('/livret/fiches-suivi');
  await page
    .getByRole('link', { name: /Période 3/i })
    .first()
    .click();
  // L'évaluation centre/GRETA a disparu de la fiche ; restent entreprise + retour.
  await expect(page.getByText('Évaluation GRETA CFA')).toHaveCount(0);
  await expect(page.getByText('Évaluation entreprise').first()).toBeVisible();
  await expect(page.getByText(/Retour apprenti·e/i).first()).toBeVisible();
});
