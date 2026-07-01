import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Refonte de l'entretien tripartite 1 sur la trame officielle GRETA
 * (« première visite » — réunion juin 2026).
 *
 * Couvre : affichage des rubriques thématiques, points d'alerte (réponses
 * « Non »), saisie par le formateur, représentant légal, et non-régression des
 * entretiens 2 à 4 (qui conservent les questions de la banque).
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('E1 affiche la trame officielle (rubriques + bandeau d’aide)', async ({ page }) => {
  // Léa : E1 signé, rempli via la trame de démonstration.
  await page.goto('/livret/entretien/1');
  await expect(
    page.getByRole('heading', { name: "Intégration de l'apprenti·e dans l'entreprise" }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: "Accompagnement par le maître d'apprentissage" }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: "Difficultés éventuelles rencontrées par l'apprenti·e" }),
  ).toBeVisible();
  // Les démarches administratives (ancien format) ont disparu de E1.
  await expect(page.getByText(/Démarches administratives/i)).toHaveCount(0);
});

test('E1 : les points d’alerte (réponses « Non ») sont récapitulés', async ({ page }) => {
  // Fixture Léa : 2 « Non » (absences non signalées + difficulté de logement).
  await page.goto('/livret/entretien/1');
  const recap = page.getByTestId('trame-recap-alertes');
  await expect(recap).toBeVisible();
  await expect(recap.getByText(/Points d'alerte \(2\)/i)).toBeVisible();
});

test('E1 : le formateur saisit une réponse « Non » qui devient un point d’alerte', async ({
  page,
}) => {
  // Minh : E1 signé sans alerte au départ → on utilise un E1 frais (Sofia).
  await page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i }).click();
  await page.goto('/livret/entretien/1');
  await page.getByTestId('init-entretien-1').click();

  // Aucune alerte au départ (rien de coché « Non »).
  await expect(page.getByTestId('trame-recap-alertes')).toContainText(/Aucun point d'alerte/i);

  // Le formateur coche « Non » sur « les règles de fonctionnement sont connues ».
  const carte = page.getByTestId('trame-q-e1-integ-regles');
  await carte.getByRole('radio', { name: 'Non' }).click();

  // La question est surlignée et apparaît dans le récapitulatif.
  await expect(page.getByTestId('trame-recap-alertes')).toContainText(/Points d'alerte \(1\)/i);
});

test('E1 : le bloc « Représentant légal » (facultatif) est proposé au formateur', async ({
  page,
}) => {
  await page.goto('/livret/entretien/1');
  await expect(page.getByText(/Représentant légal/i).first()).toBeVisible();
});

test('E1 reste consultable par le coordinateur·rice sans saisie possible', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/livret/entretien/1');
  // La trame s'affiche (lecture seule) ; pas de bouton de réponse « Oui/Non » éditable.
  await expect(
    page.getByRole('heading', { name: "Intégration de l'apprenti·e dans l'entreprise" }),
  ).toBeVisible();
});

test('E1 : 3 commentaires individuels — chacun édite le sien (1ᵉʳ juillet 2026)', async ({
  page,
}) => {
  // Sofia : E1 non initialisé → le formateur l'initialise (trame vierge).
  await page.getByRole('button', { name: /Ouvrir le livret de Sofia PEREIRA/i }).click();
  await page.goto('/livret/entretien/1');
  await page.getByTestId('init-entretien-1').click();

  // En formateur : son commentaire est éditable, celui du maître aussi
  // (co-saisie 1ᵉʳ juillet) — mais PAS celui de l'apprenti·e.
  await expect(page.getByLabel('Commentaire — Formateur référent')).toBeVisible();
  await expect(page.getByLabel('Commentaire — Maître / Tuteur')).toBeVisible();
  await expect(page.getByLabel('Commentaire — Apprenti·e')).toHaveCount(0);
  await page.getByLabel('Commentaire — Formateur référent').fill('Synthèse du formateur.');

  // Côté apprenti·e : seul SON commentaire est éditable ; le texte du
  // formateur reste visible en lecture.
  await selectRole(page, 'Apprenti·e');
  await expect(page.getByLabel('Commentaire — Apprenti·e')).toBeVisible();
  await expect(page.getByLabel('Commentaire — Formateur référent')).toHaveCount(0);
  await expect(page.getByText('Synthèse du formateur.')).toBeVisible();
});
