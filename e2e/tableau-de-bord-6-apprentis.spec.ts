import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Scénario tableau de bord — 6 apprenti·e·s (CDC §10.3 et §24.5).
 *
 * Vérifie :
 *   - liste filtrée par rôle (admin/formateur = 6, maître Karim = 3, apprenti = 1)
 *   - recherche par nom/prénom (insensible à la casse et aux accents)
 *   - badges de cas démonstratifs : alerte R7 (Sofia), désaccord (Aya),
 *     démarrage (Minh), toutes signées (Théo)
 *   - sélection d'un·e apprenti·e via une carte → ouverture du livret
 *     correspondant (le titre de chaque page livret affiche son prénom/nom)
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('formateur·rice voit 6 cartes apprenti·e·s sur le tableau de bord', async ({ page }) => {
  // Rôle par défaut = formateur, formatrice Sophie suit la promo entière.
  const liens = page.getByRole('button', { name: /Ouvrir le livret de/i });
  await expect(liens).toHaveCount(6);
});

test('admin voit 6 cartes apprenti·e·s', async ({ page }) => {
  await selectRole(page, 'Admin');
  const liens = page.getByRole('button', { name: /Ouvrir le livret de/i });
  await expect(liens).toHaveCount(6);
});

test('maître d\'apprentissage Karim voit ses 3 apprenti·e·s', async ({ page }) => {
  await selectRole(page, "Maître d'apprentissage");
  const liens = page.getByRole('button', { name: /Ouvrir le livret de/i });
  await expect(liens).toHaveCount(3);
  // Léa, Théo, Sofia sont les 3 apprenti·e·s de Karim (Le Gourmet)
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Léa MARTIN/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Théo DUBOIS/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i })).toBeVisible();
});

test('apprenti·e ne voit que son propre livret (R3)', async ({ page }) => {
  await selectRole(page, 'Apprenti·e');
  const liens = page.getByRole('button', { name: /Ouvrir le livret de/i });
  await expect(liens).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Léa MARTIN/i })).toBeVisible();
});

test('le filtre par nom restreint la liste (insensible aux accents)', async ({ page }) => {
  // Sur 6 apprenti·e·s, "kouame" doit retrouver KOUAMÉ Aya malgré l'accent.
  await page.getByRole('searchbox', { name: /Filtrer par nom ou prénom/i }).fill('kouame');
  const liens = page.getByRole('button', { name: /Ouvrir le livret de/i });
  await expect(liens).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Aya KOUAMÉ/i })).toBeVisible();
});

test('les badges de cas démonstratifs sont visibles sur le tableau de bord', async ({ page }) => {
  // Sofia : entretien manquant → "Entretien à planifier"
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i })
      .getByText(/Entretien à planifier/i),
  ).toBeVisible();

  // Aya : déverrouillage R10 → "Désaccord en cours"
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Aya KOUAMÉ/i })
      .getByText(/Désaccord en cours/i),
  ).toBeVisible();

  // Minh : aucune fiche → "Démarrage"
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Minh NGUYEN/i })
      .getByText(/Démarrage/i),
  ).toBeVisible();

  // Théo : 3 fiches verrouillées → "Toutes signées"
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Théo DUBOIS/i })
      .getByText(/Toutes signées/i),
  ).toBeVisible();
});

test('clic sur une carte ouvre le livret de l\'apprenti·e correspondant·e', async ({ page }) => {
  // Choix Théo (cas bon élève).
  await page.getByRole('button', { name: /Ouvrir le livret de Théo DUBOIS/i }).click();
  await expect(page).toHaveURL(/\/livret\/organisation-suivi/);
  // Le titre de la page mentionne explicitement l'apprenti·e affiché·e.
  await expect(page.getByText(/Apprenti·e :/i).getByText(/Théo DUBOIS/i)).toBeVisible();

  // Aller voir l'entretien : il est complet pour Théo (pas d'alerte R7).
  await page.getByRole('link', { name: /Entretien tripartite/i }).click();
  // R7 : pas de bandeau d'alerte.
  await expect(page.getByText(/Entretien à planifier|en retard/i)).toHaveCount(0);
});

test("contexte « apprenti·e actif·ve » survit aux changements de page", async ({ page }) => {
  // Sélectionner Aya, naviguer vers les fiches → on doit voir la fiche P2 dévérrouillée.
  await page.getByRole('button', { name: /Ouvrir le livret de Aya KOUAMÉ/i }).click();
  await page.getByRole('link', { name: /Période en Entreprise/i }).click();
  await expect(page.getByRole('link', { name: /Période 1/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Période 2/i })).toBeVisible();
  // Période 3 n'existe pas pour Aya (livret avec 2 fiches uniquement).
  await expect(page.getByRole('link', { name: /Période 3/i })).toHaveCount(0);

  // Détail période 2 — l'historique R10 doit être visible.
  await page.getByRole('link', { name: /Période 2/i }).click();
  await expect(page.getByText(/Historique des déverrouillages/i)).toBeVisible();
  await expect(page.getByText(/Désaccord exprimé par l'apprenti/i)).toBeVisible();
});

test('Minh (cas démarrage) : page Fiches affiche un état vide', async ({ page }) => {
  await page.getByRole('button', { name: /Ouvrir le livret de Minh NGUYEN/i }).click();
  await page.getByRole('link', { name: /Période en Entreprise/i }).click();
  await expect(page.getByText(/Aucune période créée/i)).toBeVisible();
});

test('Sofia (cas alerte R7) : la page Entretien affiche le bandeau d\'alerte', async ({ page }) => {
  await page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i }).click();
  await page.getByRole('link', { name: /Entretien tripartite/i }).click();
  // L'entretien n'est pas initié → bouton « Initialiser l'entretien » visible
  // pour le formateur référent (rôle par défaut).
  await expect(page.getByRole('button', { name: /Initialiser l'entretien/i })).toBeVisible();
});

test('le sélecteur de maître bascule entre Karim (Le Gourmet) et Hélène (La Brasserie du Rhône)', async ({ page }) => {
  await selectRole(page, "Maître d'apprentissage");

  // Karim est actif par défaut → 3 cartes : Léa, Théo, Sofia.
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Léa MARTIN/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Théo DUBOIS/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Minh NGUYEN/i })).toHaveCount(0);

  // Bascule vers Hélène — l'équipe de La Brasserie du Rhône.
  await page.getByRole('button', { name: /Hélène ROCHE/i }).click();

  // Maintenant 3 cartes : Minh, Aya, Luca.
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Minh NGUYEN/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Aya KOUAMÉ/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Luca BIANCHI/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Léa MARTIN/i })).toHaveCount(0);

  // Le header reflète l'utilisateur·rice connecté·e.
  await expect(
    page.locator('header').getByText(/Connecté en tant que/i).getByText(/Hélène ROCHE/i),
  ).toBeVisible();
});

test('le sélecteur de maître n\'apparaît PAS pour les autres rôles', async ({ page }) => {
  // Rôle formateur par défaut → pas de fieldset « Maître d'apprentissage actif ».
  await expect(page.getByText(/Maître d'apprentissage actif/i)).toHaveCount(0);
  // Idem en admin.
  await selectRole(page, 'Admin');
  await expect(page.getByText(/Maître d'apprentissage actif/i)).toHaveCount(0);
});

test('le rôle apprenti·e suit l\'apprenti·e actif·ve sélectionné·e', async ({ page }) => {
  // 1. En formateur : ouvrir le livret de Théo.
  await page.getByRole('button', { name: /Ouvrir le livret de Théo DUBOIS/i }).click();
  await expect(page.getByText(/Apprenti·e :/i).getByText(/Théo DUBOIS/i)).toBeVisible();

  // 2. Basculer en rôle Apprenti·e — on s'incarne dans Théo.
  await selectRole(page, 'Apprenti·e');
  // Le header indique le nouvel utilisateur connecté.
  await expect(
    page.locator('header').getByText(/Connecté en tant que/i).getByText(/Théo DUBOIS/i),
  ).toBeVisible();

  // 3. Sur le tableau de bord, l'apprenti·e voit toujours UN seul livret (R3),
  //    et c'est celui de Théo (pas Léa).
  await page.goto('/');
  const liens = page.getByRole('button', { name: /Ouvrir le livret de/i });
  await expect(liens).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Théo DUBOIS/i })).toBeVisible();
});
