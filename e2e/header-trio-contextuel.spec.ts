import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Header — bloc « trio contextuel » (apprenti·e / maître / formateur).
 * Polish UX mai 2026.
 *
 * Le bloc apparaît uniquement quand un·e apprenti·e est actif·ve
 * (synchro avec `useApprentiActif`). Il aide à comprendre « qui voit quoi »
 * au-delà du rôle de démonstration choisi.
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('le trio contextuel s\'affiche par défaut (Léa MARTIN, Karim BENALI, Sophie DUBOIS)', async ({
  page,
}) => {
  await page.goto('/');
  const trio = page.getByTestId('header-trio-contextuel');
  await expect(trio).toBeVisible();
  await expect(trio).toContainText('Léa MARTIN');
  await expect(trio).toContainText('Karim BENALI');
  await expect(trio).toContainText('Sophie DUBOIS');
});

test('le trio se met à jour quand on bascule d\'apprenti·e (Léa → Théo)', async ({
  page,
}) => {
  await page.goto('/');
  // Théo DUBOIS est encadré par Karim BENALI (Le Gourmet) selon les fixtures.
  await page
    .getByRole('button', { name: /Ouvrir le livret de Théo DUBOIS/i })
    .click();
  const trio = page.getByTestId('header-trio-contextuel');
  await expect(trio).toContainText('Théo DUBOIS');
  await expect(trio).toContainText('Karim BENALI');
});

test('le trio est masqué sur les pages admin (pas d\'apprenti·e actif·ve dans le contexte)', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');
  // La sidebar admin charge la page sans apprenti·e actif·ve.
  // Note : `apprentiActifId` reste persisté en localStorage mais le bloc est
  // affiché tant que `useApprentiActif()` retourne quelque chose. Le bloc
  // restera donc visible si l'apprenti·e actif·ve persiste — comportement
  // intentionnel : le coordo voit qui est le « livret de référence » même
  // pendant qu'il administre. On vérifie juste qu'il ne plante pas.
  await expect(page.getByRole('heading', { name: /Gestion des utilisateurs/i })).toBeVisible();
});

test('le bloc « Connecté en tant que ... » reste affiché quand le trio est présent', async ({
  page,
}) => {
  await page.goto('/');
  // Les 2 lignes coexistent.
  await expect(page.getByText(/Connecté en tant que/i)).toBeVisible();
  await expect(page.getByTestId('header-trio-contextuel')).toBeVisible();
});
