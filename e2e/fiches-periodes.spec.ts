import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Création / édition / suppression de fiches de suivi par période.
 * Référence : cahier des charges v1.3, sections 5.3 et 8.3.
 *
 * Le formateur référent et le coordo peuvent gérer les fiches (création,
 * renommage, suppression). L'apprenti·e et le maître restent en lecture
 * seule pour ces actions.
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test("le formateur peut créer une nouvelle période avec un titre custom", async ({
  page,
}) => {
  await selectRole(page, 'Formateur référent');
  // Théo DUBOIS a 3 fiches signées dans la fixture → on peut créer la P4.
  // On bascule l'apprenti·e actif·ve via le tableau de bord.
  await page.goto('/');
  await page.getByRole('button', { name: /Ouvrir le livret de Théo DUBOIS/i }).click();

  await page.goto('/livret/fiches-suivi');
  await page.getByTestId('btn-nouvelle-periode').click();

  const modale = page.getByRole('dialog');
  await expect(modale.getByRole('heading', { name: /Nouvelle période/i })).toBeVisible();
  await modale.getByTestId('periode-titre').fill('Stage été');
  await modale.getByTestId('periode-date-debut').fill('2026-07-01');
  await modale.getByTestId('periode-date-fin').fill('2026-08-31');
  await modale.getByRole('button', { name: /Créer la période/i }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Période 4 — Stage été/i })).toBeVisible();
});

test("le coordo a aussi le droit de créer une période", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  // Sélectionne Théo (livret terminé)
  await page.goto('/');
  await page.getByRole('button', { name: /Ouvrir le livret de Théo DUBOIS/i }).click();
  await page.goto('/livret/fiches-suivi');
  await expect(page.getByTestId('btn-nouvelle-periode')).toBeVisible();
});

test("l'apprenti·e ne voit pas le bouton de création", async ({ page }) => {
  await selectRole(page, 'Apprenti·e');
  await page.goto('/livret/fiches-suivi');
  await expect(page.getByTestId('btn-nouvelle-periode')).toHaveCount(0);
});

test("le formateur peut renommer une période existante (titre)", async ({ page }) => {
  await selectRole(page, 'Formateur référent');
  await page.goto('/livret/fiches-suivi');
  // Léa MARTIN par défaut. Modifie sa Période 3 (état en-cours, modifiable).
  const carte = page.locator('li').filter({ has: page.getByRole('heading', { name: /Période 3/i }) }).first();
  await carte.getByRole('button', { name: /^Modifier Période 3/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('periode-titre').fill('Mi-parcours bilan');
  await modale.getByRole('button', { name: /Enregistrer les modifications/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.locator('li', { hasText: /Période 3 — Mi-parcours bilan/i }),
  ).toBeVisible();
});

test("la suppression d'une fiche signée est bloquée (préserve la chaîne de confiance)", async ({
  page,
}) => {
  await selectRole(page, 'Formateur référent');
  await page.goto('/livret/fiches-suivi');
  // Léa Période 1 est signée → suppression refusée
  const carte = page.locator('li', { hasText: /Période 1/i }).first();
  const boutonSupprimer = carte.getByRole('button', { name: /^Supprimer Période 1/i });
  await expect(boutonSupprimer).toBeDisabled();
});

test("création d'une fiche puis suppression libre (aucune signature posée)", async ({
  page,
}) => {
  await selectRole(page, 'Formateur référent');
  // Bascule sur Théo (livret terminé, 3 fiches signées) — on crée une P4 vierge
  await page.goto('/');
  await page.getByRole('button', { name: /Ouvrir le livret de Théo DUBOIS/i }).click();
  await page.goto('/livret/fiches-suivi');
  await page.getByTestId('btn-nouvelle-periode').click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('periode-date-debut').fill('2026-09-01');
  await modale.getByTestId('periode-date-fin').fill('2026-12-15');
  await modale.getByRole('button', { name: /Créer la période/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Supprime la nouvelle Période 4 (en brouillon, sans signature)
  const carte = page.locator('li').filter({ has: page.getByRole('heading', { name: /Période 4/i }) }).first();
  await carte.getByRole('button', { name: /^Supprimer Période 4/i }).click();
  await carte.getByRole('button', { name: /Confirmer la suppression de Période 4/i }).click();
  await expect(
    page.locator('li').filter({ has: page.getByRole('heading', { name: /Période 4/i }) }),
  ).toHaveCount(0);
});

test("création refusée si l'entretien tripartite n'est pas initialisé (R13)", async ({
  page,
}) => {
  await selectRole(page, 'Formateur référent');
  // Sofia PEREIRA — entretien NON initialisé dans la fixture (cas alerte R7)
  await page.goto('/');
  await page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i }).click();
  await page.goto('/livret/fiches-suivi');
  await page.getByTestId('btn-nouvelle-periode').click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('periode-date-debut').fill('2026-01-01');
  await modale.getByTestId('periode-date-fin').fill('2026-04-01');
  await modale.getByRole('button', { name: /Créer la période/i }).click();
  // R13 : message d'erreur sur dateDebut, modale toujours ouverte
  await expect(modale.getByText(/entretien tripartite/i)).toBeVisible();
});

test("le titre custom apparaît sur la page détail de la fiche", async ({ page }) => {
  await selectRole(page, 'Formateur référent');
  await page.goto('/livret/fiches-suivi');
  // Renomme Période 3 de Léa puis clic dessus
  const carte = page.locator('li').filter({ has: page.getByRole('heading', { name: /Période 3/i }) }).first();
  await carte.getByRole('button', { name: /^Modifier Période 3/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('periode-titre').fill('Bilan mi-parcours');
  await modale.getByRole('button', { name: /Enregistrer/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // Ouvre la fiche
  await page.getByRole('link', { name: /Période 3 — Bilan mi-parcours/i }).click();
  await expect(
    page.getByRole('heading', { name: /Période 3 — Bilan mi-parcours/i }),
  ).toBeVisible();
});
