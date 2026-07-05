import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Scénario admin utilisateurs (CDC §6 + §24.6) :
 *   « Le coordo crée un·e nouvel·le apprenti·e via la page d'administration.
 *     Le livret apparaît immédiatement dans le tableau de bord et peut être
 *     ouvert. La suppression retire l'apprenti·e + son livret. »
 *
 * Couvre :
 *   - Accès refusé pour les rôles métier (R3 admin)
 *   - Création + édition + suppression côté coordo
 *   - Synchronisation avec le tableau de bord (passage de 6 → 7 cartes)
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('le rôle apprenti voit la page admin en accès refusé', async ({ page }) => {
  await selectRole(page, 'Apprenti·e');
  await page.goto('/admin/utilisateurs');
  await expect(page.getByRole('heading', { name: /Accès réservé/i })).toBeVisible();
});

test('le coordo voit la table restreinte à son périmètre (juin 2026)', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');
  // Martine ne liste que SES 5 apprenti·e·s (Léa, Théo, Sofia + Camille, Yanis)
  // + le staff complet : 4 maîtres + 2 formateurs + 2 coordos + 1 admin = 9.
  const lignes = page.locator('tbody tr');
  await expect(lignes).toHaveCount(14);
  await expect(page.locator('tbody tr', { hasText: /Minh NGUYEN/ })).toHaveCount(0);

  // L'admin voit tout : 8 apprenti·e·s + 9 staff = 17 lignes.
  await selectRole(page, 'Admin');
  await page.goto('/admin/utilisateurs');
  await expect(page.locator('tbody tr')).toHaveCount(17);
});

test('le coordo crée un·e nouvel·le apprenti·e — la carte apparaît au tableau de bord', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');

  // Ouvre la modale via le menu de création
  await page.getByRole('button', { name: /Nouveau · nouvelle/i }).click();
  await page.getByRole('menuitem', { name: /^Apprenti·e/i }).click();
  const modale = page.getByRole('dialog');
  await expect(modale).toBeVisible();

  // Remplit le formulaire (data-testid pour éviter les races sous charge).
  await modale.getByTestId('apprenti-contrat-fin').waitFor({ state: 'visible' });
  await modale.getByTestId('apprenti-prenom').fill('Sarah');
  await modale.getByTestId('apprenti-nom').fill('Turc');
  await modale.getByTestId('apprenti-email').fill('sarah.turc@demo.fr');
  await modale.getByTestId('apprenti-naissance').fill('2008-03-12');
  await modale.getByTestId('apprenti-contrat-debut').fill('2025-09-01');
  await modale.getByTestId('apprenti-contrat-fin').fill('2027-08-31');
  // Affectation : valeurs par défaut (1ʳᵉ formation + 1ᵉʳ maître + 1ᵉʳ formateur).

  // Valide
  await modale.getByRole('button', { name: /Créer l'apprenti·e/i }).click();

  // La modale se ferme
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // 15 lignes maintenant (périmètre Martine : 5 + Sarah auto-affectée + 9 staff)
  await expect(page.locator('tbody tr')).toHaveCount(15);

  // Sur le tableau de bord (toujours en coordo), la carte apparaît
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Sarah TURC/i })).toBeVisible();

  // Et bascule en formateur — Sarah est dans sa promo aussi.
  await selectRole(page, 'Formateur référent');
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Sarah TURC/i })).toBeVisible();
});

test('validation : prénom obligatoire bloque la soumission', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');
  await page.getByRole('button', { name: /Nouveau · nouvelle/i }).click();
  await page.getByRole('menuitem', { name: /^Apprenti·e/i }).click();
  // Submit sans rien remplir : l'erreur s'affiche
  await page.getByRole('button', { name: /Créer l'apprenti·e/i }).click();
  await expect(page.getByText(/Le prénom est obligatoire/i)).toBeVisible();
  // La modale reste ouverte (pas de soumission)
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('édition : modifier un·e apprenti·e existant·e met à jour le tableau de bord', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');

  // Clic sur "Modifier" pour Léa
  await page.getByRole('button', { name: /Modifier Léa MARTIN/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('apprenti-prenom').fill('Léane');
  await modale.getByRole('button', { name: /Enregistrer/i }).click();

  // La carte au tableau de bord reflète le nouveau prénom
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Léane MARTIN/i }),
  ).toBeVisible();
});

test("suppression d'un·e apprenti·e bloquée tant que le contrat est démarré", async ({ page }) => {
  // Léa a un contrat démarré dans la fixture (2025-09 → 2027-09) — le verrou
  // empêche sa suppression accidentelle. (Léa appartient au périmètre de
  // Martine — juin 2026 ; Luca, lui, est désormais chez Bernard.)
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');
  const ligneLea = page.locator('tbody tr', { hasText: /Léa MARTIN/ });
  const boutonSupprimer = ligneLea.getByRole('button', { name: /^Supprimer Léa MARTIN/i });
  await expect(boutonSupprimer).toBeDisabled();
  await expect(ligneLea.getByText(/Contrat démarré le|fiche|Entretien/i)).toBeVisible();
});

test("suppression libre d'un·e apprenti·e dont le contrat n'a pas démarré", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');

  // Crée une apprenti·e avec contrat futur (verrou inactif).
  await page.getByRole('button', { name: /Nouveau · nouvelle/i }).click();
  await page.getByRole('menuitem', { name: /^Apprenti·e/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('apprenti-contrat-fin').waitFor({ state: 'visible' });
  await modale.getByTestId('apprenti-prenom').fill('Lina');
  await modale.getByTestId('apprenti-nom').fill('Test');
  await modale.getByTestId('apprenti-email').fill('lina.test@demo.fr');
  await modale.getByTestId('apprenti-naissance').fill('2010-01-01');
  await modale.getByTestId('apprenti-contrat-debut').fill('2027-09-01');
  await modale.getByTestId('apprenti-contrat-fin').fill('2029-08-31');
  await modale.getByRole('button', { name: /Créer l'apprenti·e/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Suppression libre : 2 clics, livret pas encore actif (contrat futur).
  const ligneLina = page.locator('tbody tr', { hasText: /Lina TEST/ });
  await ligneLina.getByRole('button', { name: /^Supprimer Lina TEST/i }).click();
  await ligneLina.getByRole('button', { name: /Confirmer la suppression de Lina TEST/i }).click();
  await expect(page.locator('tbody tr', { hasText: /Lina TEST/ })).toHaveCount(0);
});
