import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Chantier référentiels/compétences #4 (juillet 2026) — modèles d'activités
 * et mode d'évaluation (ressource `admin.activites.gerer`).
 *
 * Fixtures : la promo CAP Cuisine est en MODE ACTIVITÉS (modèle
 * `act-cap-cuisine`, 6 activités, balayage 10/10) ; le BTS MHR reste en mode
 * compétences. Les verrous testés :
 *   - bascule bloquée dès la première saisie signée dans la promo (Q2) ;
 *   - passage en activités bloqué tant qu'une activité ne fait appel à aucune
 *     compétence — débloqué dès que chaque activité est mappée sur au moins
 *     une compétence, même à balayage partiel (10 juillet 2026, retour démo
 *     direction — le balayage complet n'est plus exigé) ;
 *   - réimport d'un référentiel bloqué si une formation rattachée est en
 *     mode activités (Q6).
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('le formateur voit la page Modèles d’activités en accès refusé', async ({ page }) => {
  await selectRole(page, 'Formateur référent');
  await page.goto('/admin/activites');
  await expect(page.getByRole('heading', { name: /Accès réservé/i })).toBeVisible();
});

test('le coordo voit le modèle CAP Cuisine : 6 activités, balayage complet, formation rattachée', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/activites');
  await expect(page.getByRole('heading', { name: /Modèles d'activités/i })).toBeVisible();
  const carte = page.getByTestId('modele-activites-act-cap-cuisine');
  await expect(carte).toBeVisible();
  await expect(carte).toContainText(/6 activités/i);
  await expect(carte.getByTestId('balayage-act-cap-cuisine')).toContainText(
    /10\/10 compétences couvertes \(complet/i,
  );
  await expect(carte).toContainText(/CAP Cuisine \(2025-2026\)/);
  await expect(carte.getByTestId('badge-mode-f-cap-cuisine-2025')).toContainText(/Mode activités/i);
});

test('CAP : le retour en mode compétences est verrouillé (saisies signées dans la promo — Q2)', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/activites');
  const carte = page.getByTestId('modele-activites-act-cap-cuisine');
  await carte.getByTestId('basculer-mode-f-cap-cuisine-2025').click();
  await expect(carte.getByTestId('erreur-mode-f-cap-cuisine-2025')).toContainText(
    /au moins une saisie signée/i,
  );
  // Le badge reste « Mode activités ».
  await expect(carte.getByTestId('badge-mode-f-cap-cuisine-2025')).toContainText(/Mode activités/i);
});

test('import BTS : bascule bloquée tant qu’une activité est sans compétence, débloquée dès 1 compétence par activité (balayage partiel)', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/activites');
  await page.getByTestId('ouvrir-import-modele-activites').click();

  const modale = page.getByRole('dialog');
  await modale.getByTestId('import-act-formation').selectOption({ value: 'f-bts-mhr-2025' });
  await expect(modale.getByText(/Activites_BTS Management/)).toBeVisible();
  await modale
    .getByTestId('import-act-texte')
    .fill(
      [
        'Libellé;Description',
        'Service en salle;Accueil, prise de commande, service',
        'Gestion des stocks du restaurant;Inventaires et ratios',
      ].join('\n'),
    );
  await modale.getByTestId('import-act-apercu').click();
  await expect(modale.getByText(/2 activités détectées/i)).toBeVisible();
  await modale.getByTestId('import-act-importer').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // 1. Fraîchement importées, les 2 activités ne font appel à aucune
  //    compétence : la bascule est désactivée et l'encart les liste.
  const carte = page.locator('article').filter({ hasText: /Activites_BTS Management/ });
  await expect(carte).toBeVisible();
  await expect(carte).toContainText(/0\/11 compétences couvertes/i);
  await expect(carte.locator('[data-testid^="activites-non-mappees-"]')).toContainText(
    /2 activités sans compétence mappée/i,
  );
  await expect(carte.getByTestId('basculer-mode-f-bts-mhr-2025')).toBeDisabled();

  // 2. Une compétence sur la 1ʳᵉ activité : la 2ᵉ reste en défaut → toujours
  //    désactivée.
  await carte.getByText(/Mapping activités ↔ compétences/i).click();
  await carte
    .getByRole('checkbox', { name: /Service en salle couvre/i })
    .first()
    .check();
  await expect(carte.locator('[data-testid^="activites-non-mappees-"]')).toContainText(
    /1 activité sans compétence mappée/i,
  );
  await expect(carte.getByTestId('basculer-mode-f-bts-mhr-2025')).toBeDisabled();

  // 3. Une compétence sur la 2ᵉ activité (la même : peu importe — l'union ne
  //    couvre que 1/11) : chaque activité fait appel à au moins une
  //    compétence → la bascule se DÉBLOQUE, à balayage partiel (le balayage
  //    complet n'est plus exigé, 10 juillet 2026).
  await carte
    .getByRole('checkbox', { name: /Gestion des stocks du restaurant couvre/i })
    .first()
    .check();
  await expect(carte).toContainText(/1\/11 compétences couvertes \(partiel, non bloquant\)/i);
  await expect(carte.locator('[data-testid^="activites-non-mappees-"]')).toHaveCount(0);
  await expect(carte.getByTestId('basculer-mode-f-bts-mhr-2025')).toBeEnabled();
});

test('mapping dans l’éditeur : la jauge progresse à chaque compétence couverte', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/activites');
  // Import d'un mini-modèle pour le BTS.
  await page.getByTestId('ouvrir-import-modele-activites').click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('import-act-formation').selectOption({ value: 'f-bts-mhr-2025' });
  await modale.getByTestId('import-act-texte').fill('Libellé\nService en salle');
  await modale.getByTestId('import-act-apercu').click();
  await modale.getByTestId('import-act-importer').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  const carte = page.locator('article').filter({ hasText: /Activites_BTS Management/ });
  await carte.getByText(/Mapping activités ↔ compétences/i).click();
  // Cocher 2 compétences du référentiel BTS sur l'activité importée.
  const idActivite = /-a1$/;
  const cases = carte.locator('input[type="checkbox"][data-testid^="mapping-"]');
  await cases.nth(0).check();
  await expect(carte).toContainText(/1\/11 compétences couvertes/i);
  await cases.nth(1).check();
  await expect(carte).toContainText(/2\/11 compétences couvertes/i);
  void idActivite;
});

test('badge du mode sur les cartes de la page Formations', async ({ page }) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/formations');
  await expect(page.getByTestId('badge-mode-f-cap-cuisine-2025')).toContainText(/Mode activités/i);
  await expect(page.getByTestId('badge-mode-f-bts-mhr-2025')).toContainText(/Mode compétences/i);
});

test('réimport d’un référentiel pour une formation en mode activités : bloqué (Q6)', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/referentiels');
  await page.getByRole('button', { name: /Importer un référentiel/i }).click();
  const modale = page.getByRole('dialog');
  await modale.getByTestId('import-ref-formation').selectOption({ value: 'f-cap-cuisine-2025' });
  await expect(modale.getByTestId('import-ref-bloque-mode-activites')).toContainText(
    /mode activités/i,
  );
  // L'aperçu reste possible mais l'import est désactivé.
  await modale
    .getByTestId('import-ref-csv')
    .fill(['BLOC;COMPETENCE', 'BLOC A;Compétence 1'].join('\n'));
  await modale.getByRole('button', { name: /^Aperçu$/i }).click();
  await expect(modale.getByRole('button', { name: /Importer \(/i })).toBeDisabled();
});

test('le gabarit Excel se télécharge puis se réimporte tel quel (boucle complète)', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/activites');

  // 1. Téléchargement depuis le bouton de la page.
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('telecharger-gabarit-activites').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('modele-activites.xlsx');
  const chemin = await download.path();

  // 2. Le fichier téléchargé se réimporte tel quel (3 activités d'exemple).
  await page.getByTestId('ouvrir-import-modele-activites').click();
  const modale = page.getByRole('dialog');
  // Le gabarit est aussi proposé depuis la modale, à côté du champ fichier.
  await expect(modale.getByTestId('import-act-telecharger-gabarit')).toBeVisible();
  await modale.getByTestId('import-act-formation').selectOption({ value: 'f-bts-mhr-2025' });
  await modale.locator('input[type="file"]').setInputFiles(chemin);
  await modale.getByTestId('import-act-apercu').click();
  await expect(modale.getByText(/3 activités détectées/i)).toBeVisible();
  await expect(modale.getByText(/Réceptionner et contrôler les livraisons/i)).toBeVisible();
  await modale.getByTestId('import-act-importer').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.locator('article').filter({ hasText: /Activites_BTS Management/ }),
  ).toContainText(/3 activités/i);
});

test('la suppression du modèle CAP est bloquée tant que la formation le rattache', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  await page.goto('/admin/activites');
  const carte = page.getByTestId('modele-activites-act-cap-cuisine');
  await expect(
    carte.getByRole('button', { name: /Supprimer Activités CAP Cuisine/i }),
  ).toBeDisabled();
  await expect(carte).toContainText(/détachez le modèle avant suppression/i);
});
