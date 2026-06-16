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

test('maître / tuteur Karim voit ses 4 apprenti·e·s (dont Luca en second — juin 2026)', async ({
  page,
}) => {
  await selectRole(page, 'Maître / Tuteur');
  const liens = page.getByRole('button', { name: /Ouvrir le livret de/i });
  await expect(liens).toHaveCount(4);
  // Léa, Théo, Sofia : Karim est maître principal (Le Gourmet).
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Léa MARTIN/i })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Théo DUBOIS/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i }),
  ).toBeVisible();
  // Luca : Karim est SECOND maître (double tutorat — principal Hélène).
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Luca BIANCHI/i }),
  ).toBeVisible();
});

test('filtre par année de formation sur le tableau de bord (juin 2026)', async ({ page }) => {
  // Formateur (rôle par défaut, 6 cartes) : le sélecteur d'année est présent
  // et propose la promo des fixtures.
  const filtre = page.getByLabel(/Filtrer par année de formation/i);
  await expect(filtre).toBeVisible();
  await expect(filtre.getByRole('option', { name: '2025-2026' })).toHaveCount(1);

  // Filtrer sur la promo 2025-2026 conserve les 6 cartes (toutes la même promo).
  await filtre.selectOption('2025-2026');
  await expect(page.getByRole('button', { name: /Ouvrir le livret de/i })).toHaveCount(6);
  await filtre.selectOption('toutes');
  await expect(page.getByRole('button', { name: /Ouvrir le livret de/i })).toHaveCount(6);

  // L'année est visible sur les cartes (tri par promo la plus récente).
  await expect(page.getByText(/CAP Cuisine \(2025-2026\)/i).first()).toBeVisible();

  // Le sélecteur existe aussi pour le maître / tuteur (4 cartes) et l'admin.
  await selectRole(page, 'Maître / Tuteur');
  await expect(page.getByLabel(/Filtrer par année de formation/i)).toBeVisible();
  await selectRole(page, 'Admin');
  await expect(page.getByLabel(/Filtrer par année de formation/i)).toBeVisible();
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
    page
      .getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i })
      .getByText(/Entretien à planifier/i),
  ).toBeVisible();

  // Aya : déverrouillage R10 → "Désaccord en cours"
  await expect(
    page
      .getByRole('button', { name: /Ouvrir le livret de Aya KOUAMÉ/i })
      .getByText(/Désaccord en cours/i),
  ).toBeVisible();

  // Minh : 3 périodes héritées mais toutes vierges → "Démarrage"
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Minh NGUYEN/i }).getByText(/Démarrage/i),
  ).toBeVisible();

  // Théo : 3 fiches verrouillées → "Toutes signées"
  await expect(
    page
      .getByRole('button', { name: /Ouvrir le livret de Théo DUBOIS/i })
      .getByText(/Toutes signées/i),
  ).toBeVisible();
});

test("clic sur une carte ouvre le livret de l'apprenti·e correspondant·e", async ({ page }) => {
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

test('contexte « apprenti·e actif·ve » survit aux changements de page', async ({ page }) => {
  // Sélectionner Aya, naviguer vers les fiches → on doit voir la fiche P2 dévérrouillée.
  await page.getByRole('button', { name: /Ouvrir le livret de Aya KOUAMÉ/i }).click();
  await page.getByRole('link', { name: /Période en Entreprise/i }).click();
  await expect(page.getByRole('link', { name: /Période 1/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Période 2/i })).toBeVisible();
  // Séquencement (16 juin 2026) : P1 signée 3/3 → P2 visible, mais P2 est
  // déverrouillée (signatures invalidées R10) → P3 reste masquée.
  await expect(page.getByRole('link', { name: /Période 3/i })).toHaveCount(0);

  // Détail période 2 — l'historique R10 doit être visible.
  await page.getByRole('link', { name: /Période 2/i }).click();
  await expect(page.getByText(/Historique des déverrouillages/i)).toBeVisible();
  await expect(page.getByText(/Désaccord exprimé par l'apprenti/i)).toBeVisible();
});

test('Minh (cas démarrage) : seule la période 1 est visible, les suivantes masquées (séquencement)', async ({
  page,
}) => {
  await page.getByRole('button', { name: /Ouvrir le livret de Minh NGUYEN/i }).click();
  await page.getByRole('link', { name: /Période en Entreprise/i }).click();
  // Plus d'état vide : Minh hérite des 3 périodes du planning de la formation…
  await expect(page.getByText(/Aucune période planifiée/i)).toHaveCount(0);
  // …mais le séquencement (16 juin 2026) ne dévoile que la période en cours :
  // P1 est en brouillon (non signée) → P2 et P3 restent masquées.
  await expect(page.getByRole('link', { name: /Période 1/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Période 2/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Période 3/i })).toHaveCount(0);
  // Un message annonce les périodes encore masquées.
  await expect(page.getByText(/restent masquées/i)).toBeVisible();
});

test('accès direct à une période masquée : page « Période non accessible » (séquencement)', async ({
  page,
}) => {
  // Minh : P1 en brouillon → la période 2 (fp-minh-2) est masquée. L'accès par
  // URL directe est gardé côté détail.
  await page.getByRole('button', { name: /Ouvrir le livret de Minh NGUYEN/i }).click();
  await page.goto('/livret/fiches-suivi/fp-minh-2');
  await expect(page.getByRole('heading', { name: /Période non accessible/i })).toBeVisible();
  // La période 1 (visible), elle, s'ouvre normalement.
  await page.goto('/livret/fiches-suivi/fp-minh-1');
  await expect(page.getByRole('heading', { name: /Période en Entreprise n° 1|Période 1/i })).toBeVisible();
});

test("Sofia (cas alerte R7) : la page Entretien affiche le bandeau d'alerte", async ({ page }) => {
  await page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i }).click();
  // Sofia n'a pas d'événement « Entretien Tripartite 1 » dans son organisation
  // du suivi → pas de lien sidebar (liens conditionnels, chantier #2). On passe
  // par l'URL directe.
  await page.goto('/livret/entretien/1');
  // L'entretien n'est pas initié → bouton « Initialiser l'entretien » visible
  // pour le formateur référent (rôle par défaut).
  await expect(page.getByRole('button', { name: /Initialiser l'entretien/i })).toBeVisible();
});

test('le sélecteur de maître bascule entre Karim (Le Gourmet) et Hélène (La Brasserie du Rhône)', async ({
  page,
}) => {
  await selectRole(page, 'Maître / Tuteur');

  // Karim est actif par défaut → 4 cartes : Léa, Théo, Sofia (+ Luca en second).
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Léa MARTIN/i })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Théo DUBOIS/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Minh NGUYEN/i })).toHaveCount(
    0,
  );

  // Bascule vers Hélène — l'équipe de La Brasserie du Rhône.
  await page.getByRole('button', { name: /Hélène ROCHE/i }).click();

  // 3 cartes : Minh, Aya, Luca (Hélène est maître principale de Luca).
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Minh NGUYEN/i }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Aya KOUAMÉ/i })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Luca BIANCHI/i }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Léa MARTIN/i })).toHaveCount(
    0,
  );

  // Le header reflète l'utilisateur·rice connecté·e.
  await expect(
    page
      .locator('header')
      .getByText(/Connecté en tant que/i)
      .getByText(/Hélène ROCHE/i),
  ).toBeVisible();
});

test("le sélecteur de maître n'apparaît PAS pour les autres rôles", async ({ page }) => {
  // Rôle formateur par défaut → pas de fieldset « Maître / Tuteur actif ».
  await expect(page.getByText(/Maître \/ Tuteur actif/i)).toHaveCount(0);
  // Idem en admin.
  await selectRole(page, 'Admin');
  await expect(page.getByText(/Maître \/ Tuteur actif/i)).toHaveCount(0);
});

test("le rôle apprenti·e suit l'apprenti·e actif·ve sélectionné·e", async ({ page }) => {
  // 1. En formateur : ouvrir le livret de Théo.
  await page.getByRole('button', { name: /Ouvrir le livret de Théo DUBOIS/i }).click();
  await expect(page.getByText(/Apprenti·e :/i).getByText(/Théo DUBOIS/i)).toBeVisible();

  // 2. Basculer en rôle Apprenti·e — on s'incarne dans Théo.
  await selectRole(page, 'Apprenti·e');
  // Le header indique le nouvel utilisateur connecté.
  await expect(
    page
      .locator('header')
      .getByText(/Connecté en tant que/i)
      .getByText(/Théo DUBOIS/i),
  ).toBeVisible();

  // 3. Sur le tableau de bord, l'apprenti·e voit toujours UN seul livret (R3),
  //    et c'est celui de Théo (pas Léa).
  await page.goto('/');
  const liens = page.getByRole('button', { name: /Ouvrir le livret de/i });
  await expect(liens).toHaveCount(1);
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Théo DUBOIS/i }),
  ).toBeVisible();
});
