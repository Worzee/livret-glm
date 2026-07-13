import { expect, test, type Page } from '@playwright/test';
import { genererXlsx } from '../src/lib/generer-xlsx-modele';
import { MODELES } from '../src/lib/import-utilisateurs';
import { resetState, selectRole } from './helpers';

/**
 * Responsables légaux des apprenti·e·s mineur·e·s (13 juillet 2026 — réunion
 * DG, demande 5).
 *
 * Fixtures : Minh NGUYEN (CAP) est MINEUR (né en 2009) — ses 2 responsables
 * légaux sont Thi (mère, responsable par défaut du sélecteur) et Duc (père)
 * NGUYEN ; sa protection des données est déposée NON attestée.
 *
 * Couvre : inscription manuelle d'un·e mineur·e (section responsables
 * obligatoire, emails contrôlés), 6ᵉ rôle « Responsable légal » (périmètre
 * limité à ses enfants, lecture seule, sélecteur Thi ↔ Duc), attestation des
 * documents en lieu et place du mineur (l'apprenti mineur est en lecture),
 * et import Excel (mineur sans responsable refusé, avec responsable créé).
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

/** Consulte un document (ouvre le PDF dans un onglet — refermé aussitôt). */
async function consulterDocument(page: Page, docId: string) {
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId(`consulter-${docId}`).click(),
  ]);
  await popup.close();
}

test("inscription manuelle d'un·e mineur·e : responsable légal obligatoire, emails contrôlés", async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/utilisateurs');
  await page.getByRole('button', { name: /Nouveau · nouvelle…/i }).click();
  await page.getByRole('menuitem', { name: /Apprenti·e/i }).click();

  const modale = page.getByRole('dialog');
  await modale.getByTestId('apprenti-prenom').fill('Lina');
  await modale.getByTestId('apprenti-nom').fill('Rossi');
  await modale.getByTestId('apprenti-email').fill('lina.rossi@demo.fr');
  await modale.getByTestId('apprenti-contrat-debut').fill('2025-09-02');
  await modale.getByTestId('apprenti-contrat-fin').fill('2027-09-01');

  // Majeure → pas de section responsables ; mineure → la section apparaît.
  await modale.getByTestId('apprenti-naissance').fill('2000-05-10');
  await expect(modale.getByTestId('section-responsables')).toHaveCount(0);
  await modale.getByTestId('apprenti-naissance').fill('2010-05-10');
  await expect(modale.getByTestId('section-responsables')).toBeVisible();

  // Soumission sans responsable → refus (1 minimum pour un·e mineur·e).
  await modale.getByRole('button', { name: /Créer l'apprenti·e/i }).click();
  await expect(modale.getByTestId('erreurs-responsables')).toContainText(/mineur/i);

  // Email du responsable identique à celui de l'apprentie → refus.
  await modale.getByTestId('responsable1-prenom').fill('Paola');
  await modale.getByTestId('responsable1-nom').fill('Rossi');
  await modale.getByTestId('responsable1-email').fill('lina.rossi@demo.fr');
  await modale.getByRole('button', { name: /Créer l'apprenti·e/i }).click();
  await expect(modale.getByTestId('erreurs-responsables')).toContainText(/différent/i);

  // Email propre → création OK, la responsable apparaît dans la liste des
  // utilisateurs (lecture seule — gérée via la fiche de l'apprentie).
  await modale.getByTestId('responsable1-email').fill('paola.rossi@demo.fr');
  await modale.getByTestId('responsable1-lien').fill('Mère');
  await modale.getByRole('button', { name: /Créer l'apprenti·e/i }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByLabel('Filtrer par rôle').selectOption('responsable');
  const ligne = page.locator('tbody tr').filter({ hasText: 'Paola ROSSI' });
  await expect(ligne).toBeVisible();
  await expect(ligne.getByText(/Géré via l'apprenti·e/i)).toBeVisible();
});

test('rôle responsable légal : périmètre limité à ses enfants, sélecteur Thi ↔ Duc, pas de menus admin', async ({
  page,
}) => {
  await selectRole(page, 'Responsable légal');

  // Périmètre : Thi (par défaut) ne voit que Minh.
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Minh NGUYEN/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Léa MARTIN/i })).toHaveCount(
    0,
  );

  // Sélecteur de responsable actif (Thi ↔ Duc), avec lien de parenté.
  await expect(page.getByRole('button', { name: /Thi NGUYEN/i })).toBeVisible();
  await page.getByRole('button', { name: /Duc NGUYEN/i }).click();
  await expect(page.getByRole('button', { name: /Ouvrir le livret de Minh NGUYEN/i })).toBeVisible();

  // Centre d'alertes : l'attestation attendue du document de Minh.
  await expect(
    page.getByTestId('alerte-document-docadm-minh-protection-donnees'),
  ).toContainText(/votre attestation est attendue/i);

  // Aucun menu d'administration (lecture seule hors attestation).
  await expect(page.getByRole('link', { name: 'Utilisateurs' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Formations' })).toHaveCount(0);
});

test("le responsable atteste en lieu et place du mineur ; l'apprenti mineur est en lecture", async ({
  page,
}) => {
  await selectRole(page, 'Responsable légal');
  await page.goto('/livret/documents');

  // La page annonce l'attestation par les responsables légaux.
  await expect(page.getByTestId('mention-attestataire-responsable')).toBeVisible();
  await expect(page.getByTestId('etat-doc-protection-donnees')).toContainText(
    /Attestation du responsable légal attendue/i,
  );

  // « Lu et attesté » : consultation puis attestation par Thi.
  const bouton = page.getByTestId('attester-docadm-minh-protection-donnees');
  await expect(bouton).toBeDisabled();
  await consulterDocument(page, 'docadm-minh-protection-donnees');
  await expect(bouton).toBeEnabled();
  await bouton.click();
  await expect(page.getByText(/responsable légal de Minh NGUYEN/i)).toBeVisible();
  await page.getByTestId('confirmer-attester-docadm-minh-protection-donnees').click();
  await expect(page.getByTestId('attestation-docadm-minh-protection-donnees')).toContainText(
    /attestée par Thi NGUYEN, responsable légal/i,
  );
  await expect(page.getByTestId('etat-doc-protection-donnees')).toContainText(/Attesté/);

  // Côté apprenti MINEUR : lecture seule — aucun bouton d'attestation.
  await selectRole(page, 'Apprenti·e');
  await page.goto('/livret/documents');
  await expect(page.getByTestId('mention-attestataire-responsable')).toBeVisible();
  await expect(page.getByRole('button', { name: /J'atteste avoir pris connaissance/i })).toHaveCount(
    0,
  );
});

test('import Excel : mineur·e sans responsable refusé·e, avec responsable créé·e et rattaché·e', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/import-utilisateurs');

  const fichier = (exemples: string[][]) => ({
    name: 'import-mineurs.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from(genererXlsx({ ...MODELES.apprenti, exemples })),
  });

  // Mineure (née en 2010) sans responsable → import refusé.
  await page
    .getByTestId('input-fichier')
    .setInputFiles(
      fichier([['Emma', 'PETIT', 'emma.petit@demo.fr', '2010-03-01', '2025-09-02', '2027-09-01']]),
    );
  await expect(page.getByText(/mineur/i).first()).toBeVisible();

  // Même mineure avec sa responsable → import accepté.
  await page.getByTestId('input-fichier').setInputFiles(
    fichier([
      // prettier-ignore
      ['Emma', 'PETIT', 'emma.petit@demo.fr', '2010-03-01', '2025-09-02', '2027-09-01', 'Claire', 'PETIT', 'claire.petit@demo.fr', '06 11 22 33 44', 'Mère'],
    ]),
  );
  await page.getByRole('button', { name: /^Importer 1 compte$/i }).click();
  await expect(page.getByText(/Import terminé : 1 compte créé/i)).toBeVisible();

  // La responsable est créée et rattachée.
  await page.goto('/admin/utilisateurs');
  await page.getByLabel('Filtrer par rôle').selectOption('responsable');
  await expect(page.locator('tbody tr').filter({ hasText: 'Claire PETIT' })).toBeVisible();
});
