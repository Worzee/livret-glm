import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Sélection des compétences abordées en entreprise — CDC v1.5 addendum.
 *
 * Couvre :
 *   - Léa (sélection déjà validée — cf. fixtures) : badge « validée »,
 *     cases désactivées, cellules grisées dans la grille finale pour les
 *     compétences non sélectionnées (a1).
 *   - Sofia (entretien jamais initialisé) : bandeau « non validée » sur la
 *     fiche de période et message dédié sur la grille finale.
 *   - 13 juin 2026 : toutes les compétences sont activées par défaut.
 *   - 1ᵉʳ juillet 2026 : le maître / tuteur ET le formateur référent décochent ;
 *     la sélection est réalignée « tout coché » quand le référentiel change
 *     (import, changement de formation).
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

// ─────────────────────────────────────────────────────────────────────────────
// Sofia PEREIRA — pas d'entretien initialisé (sélection non encore validée)
// ─────────────────────────────────────────────────────────────────────────────

test('Sofia : la fiche de période affiche le bandeau « sélection non validée »', async ({
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
    page.getByText(/Sélection des compétences abordées en entreprise non validée/i),
  ).toBeVisible();
  // Le sélecteur d'ajout est absent (caché tant que la sélection n'est pas validée).
  await expect(page.getByLabel(/Ajouter une compétence à la fiche/i)).toHaveCount(0);
});

test("Sofia : la grille de synthèse est masquée tant que la sélection n'est pas validée", async ({
  page,
}) => {
  await selectRole(page, 'Formateur référent');
  await page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i }).click();
  await page.goto('/livret/synthese');
  await expect(
    page.getByText(/Sélection des compétences abordées en entreprise non validée/i),
  ).toBeVisible();
  // Aucune ligne du référentiel CAP Cuisine n'est rendue (synthèse non affichée).
  await expect(page.getByRole('heading', { name: /Synthèse par bloc/i })).toHaveCount(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// Léa MARTIN — sélection validée depuis la fixture
// ─────────────────────────────────────────────────────────────────────────────

test("Léa : la section dans l'entretien affiche le badge « Sélection validée » et les cases sont désactivées", async ({
  page,
}) => {
  await selectRole(page, 'Formateur référent');
  // Léa est l'apprenti·e actif·ve par défaut
  await page.goto('/livret/entretien');
  await expect(
    page.getByRole('heading', { name: /Compétences abordées en entreprise/i }),
  ).toBeVisible();
  await expect(page.getByText(/Sélection validée/i)).toBeVisible();
  // c1-1 est dans la sélection de Léa → case cochée, mais désactivée car validée
  const caseC11 = page.getByTestId('selection-comp-c1-1');
  await expect(caseC11).toBeChecked();
  await expect(caseC11).toBeDisabled();
  // c2-4 n'est PAS dans la sélection de Léa → décochée
  await expect(page.getByTestId('selection-comp-c2-4')).not.toBeChecked();
});

test('Léa : la grille de synthèse ne présente PAS c2-4 (non sélectionnée — juillet 2026)', async ({
  page,
}) => {
  await selectRole(page, 'Maître / Tuteur');
  await page.goto('/livret/synthese');
  // Juillet 2026 : la grille est restreinte à la sélection entreprise — la
  // compétence non sélectionnée disparaît entièrement (plus de ligne grisée).
  await expect(
    page.getByLabel(/Acquis en entreprise pour Communiquer en situation professionnelle/i),
  ).toHaveCount(0);
  await expect(page.getByText('Communiquer en situation professionnelle')).toHaveCount(0);
  // Cellule entreprise pour c1-1 (sélectionnée) → SelecteurNiveau éditable.
  await expect(
    page.getByLabel(/^Acquis en entreprise pour Réceptionner et stocker la marchandise$/i).first(),
  ).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// Tout activé par défaut + maître seul édite (13 juin 2026)
// ─────────────────────────────────────────────────────────────────────────────

test('Sofia : après initialisation, toutes les compétences sont cochées par défaut ; maître ET formateur décochent (1ᵉʳ juillet 2026)', async ({
  page,
}) => {
  // 1. Le formateur initialise l'entretien de Sofia.
  await selectRole(page, 'Formateur référent');
  await page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i }).click();
  await page.goto('/livret/entretien');
  await page.getByRole('button', { name: /Initialiser l'entretien/i }).click();
  await expect(
    page.getByRole('heading', { name: /Compétences abordées en entreprise/i }),
  ).toBeVisible();

  // 2. Le formateur peut désormais décocher lui aussi (réunion direction).
  const caseFormateur = page.getByTestId('selection-comp-c2-4');
  await expect(caseFormateur).toBeChecked();
  await expect(caseFormateur).toBeEnabled();
  await caseFormateur.uncheck();
  await expect(caseFormateur).not.toBeChecked();

  // 3. Côté maître : toutes les cases restent cochées par défaut et éditables.
  await selectRole(page, 'Maître / Tuteur');
  const caseC11 = page.getByTestId('selection-comp-c1-1');
  await expect(caseC11).toBeChecked();
  await expect(caseC11).toBeEnabled();
  // Le maître décoche une compétence non abordée → elle se décoche.
  await caseC11.uncheck();
  await expect(caseC11).not.toBeChecked();
});

test("import d'un nouveau référentiel : la sélection repart « tout coché » (1ᵉʳ juillet 2026)", async ({
  page,
}) => {
  // 1. Le coordo importe un nouveau référentiel sur la formation CAP Cuisine.
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/referentiels');
  await page.getByRole('button', { name: /Importer un référentiel/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('import-ref-formation').selectOption({ value: 'f-cap-cuisine-2025' });
  await modale
    .getByTestId('import-ref-csv')
    .fill(['BLOC;COMPETENCE', 'BLOC 1;Préparer les fonds', 'BLOC 1;Dresser les plats'].join('\n'));
  await modale.getByRole('button', { name: /^Aperçu$/i }).click();
  await modale.getByRole('button', { name: /Importer \(2 compétences évaluables\)/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // 2. Sofia (sélection non validée) : sa sélection est réalignée sur le
  //    NOUVEAU référentiel, toutes compétences cochées.
  await selectRole(page, 'Formateur référent');
  await page.goto('/');
  await page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i }).click();
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
  await expect(page.getByTestId('selection-comp-c1-1')).toBeDisabled();
  await expect(page.getByTestId('selection-comp-c2-4')).toBeDisabled();
});

// ─────────────────────────────────────────────────────────────────────────────
// Ajout de compétences à la fiche de période ouvert au tuteur (17 juin 2026)
// ─────────────────────────────────────────────────────────────────────────────

test('le maître / tuteur peut ajouter une compétence à une fiche de période (17 juin 2026)', async ({
  page,
}) => {
  // Minh : période 1 en brouillon (maître pas encore signataire), sélection des
  // compétences entreprise validée → le sélecteur d'ajout doit être disponible.
  await page.getByRole('button', { name: /Ouvrir le livret de Minh NGUYEN/i }).click();
  await selectRole(page, 'Maître / Tuteur');
  await page.goto('/livret/fiches-suivi');
  await page
    .getByRole('link', { name: /Période 1/i })
    .first()
    .click();
  // Le sélecteur d'ajout, autrefois réservé au formateur, est désormais visible
  // pour le maître / tuteur.
  await expect(page.getByLabel(/Ajouter une compétence à la fiche/i)).toBeVisible();
});

test("l'apprenti·e ne peut toujours pas ajouter de compétence à la fiche", async ({ page }) => {
  // Léa P3 : sélection validée mais l'apprenti·e n'a pas le droit d'ajout.
  await selectRole(page, 'Apprenti·e');
  await page.goto('/livret/fiches-suivi');
  await page
    .getByRole('link', { name: /Période 3/i })
    .first()
    .click();
  await expect(page.getByLabel(/Ajouter une compétence à la fiche/i)).toHaveCount(0);
});

test('la fiche de période n’affiche plus la colonne « Évaluation GRETA CFA » (17 juin 2026)', async ({
  page,
}) => {
  // Léa P3 contient des compétences → le tableau de suivi s'affiche.
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
