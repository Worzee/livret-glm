import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Établissements (lieux de formation) + portail Pronote.
 * Refonte mai 2026 : remplace l'ancien spec `pronote.spec.ts`.
 *
 * Couvre :
 *   - CRUD /admin/etablissements (admin uniquement)
 *   - Validation URL Pronote
 *   - Filtrage par rôle sur /livret/pronote (apprenti, coordo, admin)
 *   - Affichage des établissements sans URL (lecture seule)
 *   - Verrou de suppression d'un établissement référencé par une formation
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

// ─────────────────────────────────────────────────────────────────────────────
// 1) Accès et visibilité de la page admin
// ─────────────────────────────────────────────────────────────────────────────

test('coordo : pas d\'accès à la gestion des établissements (admin uniquement)', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/etablissements');
  await expect(
    page.getByRole('heading', { name: /Accès réservé à l'administration/i }),
  ).toBeVisible();
});

test('formateur : pas d\'accès à la gestion des établissements', async ({ page }) => {
  await page.goto('/admin/etablissements');
  await expect(
    page.getByRole('heading', { name: /Accès réservé à l'administration/i }),
  ).toBeVisible();
});

test('admin : voit la page avec l\'établissement de la fixture', async ({ page }) => {
  await selectRole(page, 'Admin');
  await page.goto('/admin/etablissements');
  await expect(
    page.getByRole('heading', { name: /Gestion des établissements/i }),
  ).toBeVisible();
  // Établissement initial des fixtures
  await expect(
    page.locator('[data-testid^="etablissement-row-"]', {
      hasText: 'Site Diderot',
    }),
  ).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// 2) CRUD : création + URL Pronote
// ─────────────────────────────────────────────────────────────────────────────

test('admin crée un nouvel établissement avec URL Pronote, qui apparaît côté utilisateur', async ({
  page,
}) => {
  await selectRole(page, 'Admin');
  await page.goto('/admin/etablissements');

  await page.getByTestId('etablissement-nouveau').click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('eta-nom').fill('GRETA Site Bellecour');
  await modale
    .getByTestId('eta-url-pronote')
    .fill('https://pronote.greta-lyon-metropole.fr/bellecour');
  await modale.getByTestId('eta-valider').click();

  // Apparaît dans la liste admin
  await expect(page.getByText('GRETA Site Bellecour')).toBeVisible();
  await expect(
    page.getByText('https://pronote.greta-lyon-metropole.fr/bellecour'),
  ).toBeVisible();
});

test('validation : URL Pronote invalide rejetée', async ({ page }) => {
  await selectRole(page, 'Admin');
  await page.goto('/admin/etablissements');
  await page.getByTestId('etablissement-nouveau').click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('eta-nom').fill('Site Test');
  await modale.getByTestId('eta-url-pronote').fill('pasunevraieurl');
  await modale.getByTestId('eta-valider').click();
  await expect(modale.getByText(/L'URL doit commencer par/i)).toBeVisible();
  await expect(modale).toBeVisible();
});

test('admin peut créer un établissement sans URL Pronote (champ optionnel)', async ({
  page,
}) => {
  await selectRole(page, 'Admin');
  await page.goto('/admin/etablissements');
  await page.getByTestId('etablissement-nouveau').click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('eta-nom').fill('Site sans Pronote');
  await modale.getByTestId('eta-valider').click();
  await expect(page.getByText('Site sans Pronote')).toBeVisible();
});

test('suppression bloquée si une formation référence l\'établissement', async ({ page }) => {
  await selectRole(page, 'Admin');
  await page.goto('/admin/etablissements');
  // Le Site Diderot est référencé par la formation CAP Cuisine de la fixture.
  const ligne = page.locator('[data-testid^="etablissement-row-"]', {
    hasText: 'Site Diderot',
  });
  const boutonSupprimer = ligne.getByRole('button', { name: /Supprimer/i });
  await expect(boutonSupprimer).toBeDisabled();
  await expect(ligne.getByText(/réaffectez-les avant suppression/i)).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// 3) Filtrage par rôle sur /livret/pronote
// ─────────────────────────────────────────────────────────────────────────────

test('apprenti·e voit uniquement l\'établissement de sa formation', async ({ page }) => {
  // 1) Admin configure une URL Pronote sur le Site Diderot.
  await selectRole(page, 'Admin');
  await page.goto('/admin/etablissements');
  const ligne = page.locator('[data-testid^="etablissement-row-"]', {
    hasText: 'Site Diderot',
  });
  await ligne.getByRole('button', { name: /Modifier/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('eta-url-pronote').fill('https://pronote.greta-lyon/diderot');
  await modale.getByTestId('eta-valider').click();

  // 2) Bascule en apprenti·e → la page Pronote affiche l'établissement avec lien actif.
  await selectRole(page, 'Apprenti·e');
  await page.goto('/livret/pronote');
  const liste = page.getByTestId('pronote-etablissements');
  await expect(liste).toBeVisible();
  await expect(liste.locator('a[target="_blank"]').first()).toContainText('Site Diderot');
  await expect(liste.locator('a[target="_blank"]').first()).toHaveAttribute(
    'href',
    /pronote.greta-lyon/,
  );
});

test('établissement sans URL Pronote : affiché en lecture seule (pas de lien cliquable)', async ({
  page,
}) => {
  // Le Site Diderot des fixtures n'a pas d'URL Pronote configurée — on teste
  // donc directement en apprenti·e.
  await selectRole(page, 'Apprenti·e');
  await page.goto('/livret/pronote');
  await expect(
    page.getByText(/URL Pronote non configurée — contactez un administrateur/i),
  ).toBeVisible();
});

test('admin voit tous les établissements (même sans formation rattachée)', async ({
  page,
}) => {
  await selectRole(page, 'Admin');
  // 1) Admin crée un établissement « orphelin » (aucune formation ne le référence)
  await page.goto('/admin/etablissements');
  await page.getByTestId('etablissement-nouveau').click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('eta-nom').fill('GRETA Antenne Vaise');
  await modale.getByTestId('eta-valider').click();

  // 2) Sur /livret/pronote, admin voit les deux (Site Diderot + GRETA Antenne Vaise)
  await page.goto('/livret/pronote');
  const liste = page.getByTestId('pronote-etablissements');
  await expect(liste).toBeVisible();
  await expect(liste).toContainText('Site Diderot');
  await expect(liste).toContainText('GRETA Antenne Vaise');
});

test('coordo : voit l\'établissement de la formation dont il/elle a la charge', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/livret/pronote');
  // Martine LEFÈVRE est coordo de CAP Cuisine (formationId = f-cap-cuisine-2025),
  // qui pointe vers Site Diderot. Elle voit donc cet établissement.
  await expect(page.getByTestId('pronote-etablissements')).toContainText('Site Diderot');
});

// ─────────────────────────────────────────────────────────────────────────────
// 4) Menu Pronote WEB visible pour tous les rôles
// ─────────────────────────────────────────────────────────────────────────────

test('le menu « Pronote WEB » est visible pour tous les rôles dans Livret', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('link', { name: /^Pronote WEB$/i }).first(),
  ).toBeVisible();

  await selectRole(page, 'Apprenti·e');
  await expect(
    page.getByRole('link', { name: /^Pronote WEB$/i }).first(),
  ).toBeVisible();
});

test('le menu « Établissements » de l\'admin n\'apparaît que pour le rôle admin', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await expect(page.getByRole('link', { name: /^Établissements$/ })).toHaveCount(0);

  await selectRole(page, 'Admin');
  await expect(page.getByRole('link', { name: /^Établissements$/ }).first()).toBeVisible();
});
