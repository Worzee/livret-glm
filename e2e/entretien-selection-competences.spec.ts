import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Sélection des compétences abordées en entreprise — CDC v1.5 addendum.
 *
 * Couvre :
 *   - Léa (sélection déjà validée — cf. fixtures) : badge « validée »,
 *     cases désactivées, cellules grisées dans la grille finale pour les
 *     compétences non sélectionnées (a1).
 *   - Sofia (entretien jamais initialisé, sélection vierge) : bandeau
 *     « non validée » sur la fiche de période et message dédié sur la grille
 *     finale.
 *   - Co-édition formateur après initialisation d'un entretien pour Sofia.
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

// ─────────────────────────────────────────────────────────────────────────────
// Sofia PEREIRA — pas d'entretien initialisé, sélection vierge
// ─────────────────────────────────────────────────────────────────────────────

test("Sofia : la fiche de période affiche le bandeau « sélection non validée »", async ({
  page,
}) => {
  await selectRole(page, 'Formateur référent');
  await page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i }).click();
  await page.goto('/livret/fiches-suivi');
  await page.getByRole('link', { name: /Période 1/i }).first().click();
  await expect(
    page.getByText(/Sélection des compétences abordées en entreprise non validée/i),
  ).toBeVisible();
  // Le sélecteur d'ajout est absent (caché tant que la sélection n'est pas validée).
  await expect(page.getByLabel(/Ajouter une compétence à la fiche/i)).toHaveCount(0);
});

test("Sofia : la grille d'évaluation finale est masquée tant que la sélection n'est pas validée", async ({
  page,
}) => {
  await selectRole(page, 'Formateur référent');
  await page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i }).click();
  await page.goto('/livret/evaluation-finale');
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
  await page.goto('/livret/entretien/1');
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

test("Léa : la grille finale grise la colonne « Acquis en entreprise » pour c2-4 (non sélectionnée)", async ({
  page,
}) => {
  await selectRole(page, 'Maître / Tuteur');
  await page.goto('/livret/evaluation-finale');
  // Cellule entreprise pour c2-4 (non sélectionnée) → texte « — » + aria-label dédié
  await expect(
    page.getByLabel(/Compétence C2\.4 non abordée en entreprise/i),
  ).toBeVisible();
  // Cellule entreprise pour c1-1 (sélectionnée) → SelecteurNiveau éditable
  // (aria-label « Acquis en entreprise pour C1.1 »)
  await expect(
    page.getByLabel(/^Acquis en entreprise pour C1\.1$/i).first(),
  ).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// Co-édition par le formateur (Sofia après initialisation de l'entretien)
// ─────────────────────────────────────────────────────────────────────────────

test("Sofia + formateur : après initialisation de l'entretien, les cases sont éditables", async ({
  page,
}) => {
  await selectRole(page, 'Formateur référent');
  await page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i }).click();
  await page.goto('/livret/entretien/1');
  // Initialiser l'entretien
  await page.getByRole('button', { name: /Initialiser l'entretien/i }).click();
  // La section sélection est visible avec des cases activées
  await expect(
    page.getByRole('heading', { name: /Compétences abordées en entreprise/i }),
  ).toBeVisible();
  await expect(page.getByText(/Sélection en cours/i)).toBeVisible();
  const caseC11 = page.getByTestId('selection-comp-c1-1');
  await expect(caseC11).not.toBeChecked();
  await expect(caseC11).toBeEnabled();
  // Cocher c1-1 et c2-1 → le compteur passe à 2
  await caseC11.check();
  await page.getByTestId('selection-comp-c2-1').check();
  await expect(
    page.getByText(/Sélection en cours — 2 compétences sur \d+/i),
  ).toBeVisible();
});

test("Léa + apprenti·e : la section sélection est en lecture seule (matrice droits)", async ({
  page,
}) => {
  await selectRole(page, 'Apprenti·e');
  await page.goto('/livret/entretien/1');
  // Toutes les cases sont disabled (apprenti·e n'a pas le droit d'éditer)
  await expect(page.getByTestId('selection-comp-c1-1')).toBeDisabled();
  await expect(page.getByTestId('selection-comp-c2-4')).toBeDisabled();
});
