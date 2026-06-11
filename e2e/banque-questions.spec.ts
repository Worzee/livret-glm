import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Banque de questions de l'entretien tripartite (refonte mai 2026, enrichie
 * juin 2026 — retours coordos).
 *
 * - CRUD admin : seuls coordo + admin y accèdent.
 * - Le coordo affecte chaque question à E1 et/ou E2 (cases du tableau) et
 *   peut la marquer obligatoire (non retirable + réponse exigée pour signer).
 * - Le formateur référent peut ajouter des questions à un entretien mais ne
 *   peut pas retirer celles affectées par le coordo (snapshot à l'init).
 * - Les réponses sont indexées par questionId.
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('le formateur référent ne voit pas le lien « Banque de questions »', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Banque de questions/i })).toHaveCount(0);
});

test('le coordo voit la banque pré-remplie (11 questions par défaut)', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/banque-questions');
  await expect(page.getByRole('heading', { name: /Banque de questions/i })).toBeVisible();
  // 7 questions apprenti + 4 questions maître = 11 lignes dans le tableau.
  const rows = page.locator('tr[data-testid^="banque-q-row-"]');
  await expect(rows).toHaveCount(11);
  // Colonnes d'affectation (retours coordos juin 2026).
  await expect(page.getByRole('columnheader', { name: /Entretiens/i })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /Obligatoire/i })).toBeVisible();
  // Configuration par défaut : motivations = E1 + obligatoire.
  await expect(page.getByTestId('banque-q-e1-q-app-motivations')).toBeChecked();
  await expect(page.getByTestId('banque-q-e2-q-app-motivations')).not.toBeChecked();
  await expect(page.getByTestId('banque-q-obligatoire-q-app-motivations')).toBeChecked();
});

test("le coordo affecte une question à E2 — persiste après rechargement", async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/banque-questions');

  const caseE2 = page.getByTestId('banque-q-e2-q-app-contact-entreprise');
  await expect(caseE2).not.toBeChecked();
  await caseE2.check();

  await page.reload();
  await expect(page.getByTestId('banque-q-e2-q-app-contact-entreprise')).toBeChecked();
});

test("ajout d'une nouvelle question apprenti·e (texte long)", async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/banque-questions');

  await page.getByTestId('banque-q-nouveau').click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('q-cible-apprenti').click();
  await modale.getByTestId('q-type').selectOption('texte-long');
  await modale.getByTestId('q-libelle').fill(
    'Avez-vous identifié un projet professionnel à 5 ans ?',
  );
  await modale.getByTestId('q-valider').click();

  // La nouvelle question apparaît dans la liste.
  await expect(
    page.getByText("Avez-vous identifié un projet professionnel à 5 ans ?"),
  ).toBeVisible();
});

test('suppression bloquée si la question est utilisée par un entretien', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/banque-questions');

  // Les 11 questions par défaut sont toutes utilisées par les fixtures
  // (chaque entretien a `questionsApprentiSelectionnees: idsQuestionsInitiales(...)`).
  const ligneMotivations = page.locator('tr', { hasText: 'motivations pour cette formation' });
  const boutonSupprimer = ligneMotivations.getByRole('button', {
    name: /Supprimer la question/i,
  });
  await expect(boutonSupprimer).toBeDisabled();
  await expect(ligneMotivations.getByText(/Utilisée dans au moins un entretien/i)).toBeVisible();
});

test('les questions affectées par le coordo sont verrouillées dans le sélecteur du formateur', async ({
  page,
}) => {
  // Reset → rôle = formateur, apprenti·e = Léa MARTIN (E1 : 7 questions
  // apprenti imposées par le snapshot de la fixture).
  await page.goto('/livret/entretien/1');

  const boutonApp = page.getByTestId('apprenti-choisir-questions');
  await expect(boutonApp).toBeVisible();
  await expect(boutonApp).toContainText('(7)');

  await boutonApp.click();
  const modale = page.getByRole('dialog');
  await expect(modale.getByRole('heading', { name: /Choisir les questions/i })).toBeVisible();

  // Les questions imposées sont cochées, désactivées et marquées « Affectée ».
  const caseMotivations = modale
    .getByTestId('selecteur-q-q-app-motivations')
    .locator('input[type="checkbox"]');
  await expect(caseMotivations).toBeChecked();
  await expect(caseMotivations).toBeDisabled();
  await expect(
    modale.getByTestId('selecteur-q-q-app-motivations').getByText(/Affectée/i),
  ).toBeVisible();
});

test('le formateur peut ajouter (puis retirer) une question NON affectée par le coordo', async ({
  page,
}) => {
  // 1. Le coordo crée une question apprenti non affectée (E1/E2 décochés).
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/banque-questions');
  await page.getByTestId('banque-q-nouveau').click();
  const modaleCreation = page.getByRole('dialog');
  await modaleCreation.getByTestId('q-cible-apprenti').click();
  await modaleCreation.getByTestId('q-type').selectOption('texte-court');
  await modaleCreation.getByTestId('q-libelle').fill('Question libre ajoutée par le formateur ?');
  await modaleCreation.getByTestId('q-valider').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // 2. Le formateur l'ajoute à l'entretien 1 de Léa.
  await selectRole(page, 'Formateur référent');
  await page.goto('/livret/entretien/1');
  const boutonApp = page.getByTestId('apprenti-choisir-questions');
  await expect(boutonApp).toContainText('(7)');
  await boutonApp.click();
  let modale = page.getByRole('dialog');
  const ligneLibre = modale.locator('li', { hasText: 'Question libre ajoutée' });
  const caseLibre = ligneLibre.locator('input[type="checkbox"]');
  await expect(caseLibre).not.toBeChecked();
  await expect(caseLibre).toBeEnabled();
  await caseLibre.check();
  await modale.getByTestId('selecteur-q-valider').click();
  await expect(boutonApp).toContainText('(8)');

  // 3. Cette question (la sienne) reste retirable.
  await boutonApp.click();
  modale = page.getByRole('dialog');
  await modale
    .locator('li', { hasText: 'Question libre ajoutée' })
    .locator('input[type="checkbox"]')
    .uncheck();
  await modale.getByTestId('selecteur-q-valider').click();
  await expect(boutonApp).toContainText('(7)');
});

test("snapshot + R20 : une question rendue obligatoire avant l'initialisation de E2 bloque la signature apprenti", async ({
  page,
}) => {
  // 1. Le coordo rend obligatoire « ressenti équipe » (déjà affectée E2 par défaut).
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/banque-questions');
  await page.getByTestId('banque-q-obligatoire-q-app-ressenti-equipe').check();

  // 2. Le formateur initialise l'entretien 2 de Léa (événement E2 existant).
  await selectRole(page, 'Formateur référent');
  await page.goto('/livret/entretien/2');
  await page.getByTestId('init-entretien-2').click();

  // L'entretien E2 contient les 4 questions apprenti affectées, dont le badge.
  await expect(page.getByTestId('apprenti-choisir-questions')).toContainText('(4)');
  await expect(page.getByText(/Obligatoire/).first()).toBeVisible();

  // 3. Côté apprenti·e : signature bloquée tant que la question obligatoire
  //    est sans réponse (extension R20). La raison apparaît dans l'encart ambre.
  await selectRole(page, 'Apprenti·e');
  const boutonSigner = page.getByRole('button', { name: /Signer en tant que Léa/i });
  await expect(boutonSigner).toBeDisabled();
  await expect(page.getByText(/Répondez à la question obligatoire/i)).toBeVisible();

  // 4. L'apprenti·e répond → la signature se débloque.
  await page
    .getByLabel(/Comment vous sentez-vous au sein de votre équipe/i)
    .fill("L'équipe m'a bien accueillie depuis le début du contrat.");
  await expect(boutonSigner).toBeEnabled();
});

test("l'apprenti·e ne voit pas le bouton « Choisir les questions »", async ({
  page,
}) => {
  await selectRole(page, 'Apprenti·e');
  await page.goto('/livret/entretien/1');
  await expect(page.getByTestId('apprenti-choisir-questions')).toHaveCount(0);
  await expect(page.getByTestId('maitre-choisir-questions')).toHaveCount(0);
});

test('les réponses indexées par questionId sont préservées entre les rendus', async ({
  page,
}) => {
  // Reset → rôle = formateur, apprenti·e = Léa MARTIN.
  await page.goto('/livret/entretien/1');
  // La fixture Léa contient une réponse pré-saisie pour `q-app-motivations`.
  // On vérifie qu'elle est rendue dans la section apprenti·e.
  // (En lecture seule pour le formateur — la question est éditable apprenti.)
  await expect(
    page.getByText(
      'Devenir cuisinière dans la restauration traditionnelle',
      { exact: false },
    ),
  ).toBeVisible();
});
