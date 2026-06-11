import { expect, test } from '@playwright/test';
import { resetState } from './helpers';

/**
 * Audit mobile — usage terrain : entretiens et visites de suivi se déroulent
 * majoritairement sur smartphone. Ce fichier ne tourne QUE sur le projet
 * `mobile-pixel5` (cf. playwright.config.ts → testMatch).
 *
 * Contrôles automatisés :
 *  1. Aucune page principale ne déborde horizontalement.
 *  2. La navigation est faisable : un bouton hamburger ouvre un menu cliquable.
 *  3. Les zones d'édition critiques (entretien, fiche, organisation) sont accessibles.
 *  4. Les modales et bandeaux ne dépassent pas la largeur de l'écran.
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

const PAGES_PRINCIPALES = [
  { url: '/', titre: /Tableau de bord|MARTIN/i },
  { url: '/livret/organisation-suivi', titre: /Fiches de suivi/i },
  { url: '/livret/entretien/1', titre: /Entretien tripartite n° 1/i },
  { url: '/livret/fiches-suivi', titre: /Période en Entreprise/i },
  { url: '/livret/evaluation-finale', titre: /Évaluation finale/i },
];

test.describe('aucun débordement horizontal', () => {
  for (const { url, titre } of PAGES_PRINCIPALES) {
    test(`page ${url} tient dans la largeur de l'écran`, async ({ page }) => {
      await page.goto(url);
      await expect(page.getByRole('heading', { name: titre }).first()).toBeVisible();

      // Le scrollWidth de l'<html> ne doit pas excéder la largeur de la fenêtre.
      // Tolérance de 1 px pour les arrondis subpixel.
      const overflow = await page.evaluate(() => {
        const html = document.documentElement;
        return {
          scrollWidth: html.scrollWidth,
          clientWidth: html.clientWidth,
        };
      });
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
    });
  }
});

test('le bouton hamburger est visible et ouvre le drawer de navigation', async ({ page }) => {
  await page.goto('/');
  // Sur desktop, ce bouton est masqué (md:hidden). Sur Pixel 5 (393 px), il est visible.
  const hamburger = page.getByRole('button', { name: /Ouvrir le menu de navigation/i });
  await expect(hamburger).toBeVisible();

  await hamburger.click();
  // Drawer = role=dialog avec aria-label "Menu de navigation".
  const drawer = page.getByRole('dialog', { name: /Menu de navigation/i });
  await expect(drawer).toBeVisible();

  // Les liens de la sidebar sont présents dans le drawer (Léa a 2 entretiens →
  // on cible le lien E1 pour éviter la violation strict mode).
  await expect(drawer.getByRole('link', { name: /Fiches de suivi/i })).toBeVisible();
  await expect(drawer.getByRole('link', { name: /Entretien tripartite 1/i })).toBeVisible();
});

test('navigation mobile : clic sur un lien du drawer change la page et ferme le drawer', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Ouvrir le menu de navigation/i }).click();

  const drawer = page.getByRole('dialog', { name: /Menu de navigation/i });
  await drawer.getByRole('link', { name: /Évaluation finale/i }).click();

  await expect(page).toHaveURL(/\/livret\/evaluation-finale/);
  // Le drawer doit s'être fermé automatiquement après la navigation.
  await expect(page.getByRole('dialog', { name: /Menu de navigation/i })).toHaveCount(0);
});

test('la sidebar permanente est cachée sur mobile (pas de doublon)', async ({ page }) => {
  await page.goto('/');
  // <aside> avec classe hidden md:block : ne doit pas être visible en viewport mobile.
  const aside = page.locator('aside').first();
  await expect(aside).toHaveCount(1); // Le DOM la contient
  await expect(aside).not.toBeVisible(); // ... mais elle n'est pas affichée
});

test('le RoleSwitcher est compact (icônes seules) et reste cliquable', async ({ page }) => {
  await page.goto('/');
  const radios = page.getByRole('radio');
  expect(await radios.count()).toBe(5);

  // Chaque bouton est cliquable (touch target ≥ 36px) sans débordement.
  for (let i = 0; i < 5; i++) {
    const box = await radios.nth(i).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(32);
    expect(box!.height).toBeGreaterThanOrEqual(32);
  }

  // Bascule en apprenti·e via clic mobile
  await page.getByRole('radio', { name: /Apprenti·e/ }).click();
  await expect(page.getByRole('radio', { name: /Apprenti·e/ })).toHaveAttribute(
    'aria-checked',
    'true',
  );
});

test("le formulaire Fiches de suivi est utilisable en mobile (date + commentaire)", async ({
  page,
}) => {
  await page.goto('/livret/organisation-suivi');
  await expect(page.getByRole('heading', { name: /Fiches de suivi/i })).toBeVisible();

  // Au moins un input type=date est rendu en mobile (calendrier natif).
  const dates = page.locator('input[type="date"]');
  expect(await dates.count()).toBeGreaterThan(0);

  // Le premier date input est visible et cliquable.
  await expect(dates.first()).toBeVisible();
  const box = await dates.first().boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(80);
});

test("la fiche de période en mobile : tableau tri-colonnes empilé en cartes", async ({
  page,
}) => {
  await page.goto('/livret/fiches-suivi');
  await page.getByRole('link', { name: /Période 3/i }).click();

  // Le TableauTriColonnes a une section dédiée. En desktop, le rendu est une
  // table ; en mobile, c'est une liste de cartes. Le headline reste le même.
  const sectionTriColonnes = page.locator('section', {
    hasText: 'Suivi de la formation en entreprise',
  });
  await expect(sectionTriColonnes).toBeVisible();

  // Côté mobile : la version table de cette section est masquée (hidden md:block),
  // mais sa version cards (md:hidden) est visible — au moins une carte article.
  const articlesCompetence = sectionTriColonnes.locator('article');
  expect(await articlesCompetence.count()).toBeGreaterThan(0);
});

test("la modale R10 reste contenue dans la largeur de l'écran sur mobile", async ({ page }) => {
  await page.goto('/livret/fiches-suivi');
  await page.getByRole('link', { name: /Période 1/i }).click();
  await page.getByRole('button', { name: /Déverrouiller/i }).click();

  const dialog = page.getByRole('dialog', { name: /Déverrouiller la fiche/i });
  await expect(dialog).toBeVisible();

  const dialogBox = await dialog.boundingBox();
  const viewport = page.viewportSize();
  expect(dialogBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(dialogBox!.width).toBeLessThanOrEqual(viewport!.width);
});
