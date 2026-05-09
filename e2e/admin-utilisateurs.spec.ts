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

test('le coordo voit la table avec les 10 utilisateurs des fixtures', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');
  // 6 apprenti·e·s + 2 maîtres + 1 formatrice + 1 coordo + 1 admin = 11
  const lignes = page.locator('tbody tr');
  await expect(lignes).toHaveCount(11);
});

test('le coordo crée un·e nouvel·le apprenti·e — la carte apparaît au tableau de bord', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');

  // Ouvre la modale
  await page.getByRole('button', { name: /Nouvel·le apprenti·e/i }).click();
  const modale = page.getByRole('dialog');
  await expect(modale).toBeVisible();

  // Remplit le formulaire
  await modale.getByLabel(/^Prénom/).fill('Sarah');
  await modale.getByLabel(/^Nom/).fill('Turc');
  await modale.getByLabel(/^Email/).fill('sarah.turc@demo.fr');
  await modale.getByLabel(/^Date de naissance/).fill('2008-03-12');
  await modale.getByLabel(/^Début de contrat/).fill('2025-09-01');
  await modale.getByLabel(/^Fin de contrat/).fill('2027-08-31');
  // Affectation : valeurs par défaut (1ʳᵉ formation + 1ᵉʳ maître + 1ᵉʳ formateur).

  // Valide
  await modale.getByRole('button', { name: /Créer l'apprenti·e/i }).click();

  // La modale se ferme
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // 12 lignes maintenant
  await expect(page.locator('tbody tr')).toHaveCount(12);

  // Sur le tableau de bord (toujours en coordo), la carte apparaît
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Sarah TURC/i }),
  ).toBeVisible();

  // Et bascule en formateur — Sarah est dans sa promo aussi.
  await selectRole(page, 'Formateur référent');
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Sarah TURC/i }),
  ).toBeVisible();
});

test('validation : prénom obligatoire bloque la soumission', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');
  await page.getByRole('button', { name: /Nouvel·le apprenti·e/i }).click();
  // Submit sans rien remplir : l'erreur s'affiche
  await page.getByRole('button', { name: /Créer l'apprenti·e/i }).click();
  await expect(page.getByText(/Le prénom est obligatoire/i)).toBeVisible();
  // La modale reste ouverte (pas de soumission)
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('édition : modifier un·e apprenti·e existant·e met à jour le tableau de bord', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');

  // Clic sur "Modifier" pour Léa
  await page.getByRole('button', { name: /Modifier Léa MARTIN/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByLabel(/^Prénom/).fill('Léane');
  await modale.getByRole('button', { name: /Enregistrer/i }).click();

  // La carte au tableau de bord reflète le nouveau prénom
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Léane MARTIN/i }),
  ).toBeVisible();
});

test('suppression : confirmation 2 clics + retrait de la liste et du tableau de bord', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');

  // 1ᵉʳ clic sur Supprimer Luca → bouton passe en "Confirmer"
  await page.getByRole('button', { name: /^Supprimer Luca BIANCHI/i }).click();
  // 2ᵉ clic → suppression effective
  await page.getByRole('button', { name: /Confirmer la suppression de Luca BIANCHI/i }).click();

  // Plus dans la table (passage de 11 à 10)
  await expect(page.locator('tbody tr')).toHaveCount(10);
  // Plus de carte au tableau de bord
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Luca BIANCHI/i }),
  ).toHaveCount(0);
});
