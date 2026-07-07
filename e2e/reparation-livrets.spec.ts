import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Auto-réparation des livrets manquants (7 juillet 2026 — bug pilote).
 *
 * La politique de migration reset chaque store aux fixtures lors d'un bump
 * de version — store par store. Un bump de `livret-donnees` efface donc les
 * livrets des apprenti·e·s créé·e·s par l'utilisateur alors que
 * `livret-utilisateurs` conserve leurs comptes : l'apprenti·e apparaissait
 * au tableau de bord mais son livret retombait sur « Aucun·e apprenti·e
 * sélectionné·e ». `AppShell` répare désormais au montage (livret vierge,
 * planning hérité de la formation, sélections réalignées).
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('un livret effacé (bump de store) est recréé au chargement — le livret s’ouvre', async ({
  page,
}) => {
  // 1. Force la persistance du store (zustand n'écrit qu'à la première
  //    mutation) via le bouton « Réinitialiser la démo ».
  await page.getByRole('button', { name: /Réinitialiser les données de démonstration/i }).click();
  await page.getByRole('button', { name: /Oui, réinitialiser/i }).click();

  // 2. Simule l'état post-bump : l'apprentie existe, son livret a disparu.
  await page.evaluate(() => {
    const brut = localStorage.getItem('livret-donnees');
    if (!brut) throw new Error('store livret-donnees absent');
    const donnees = JSON.parse(brut);
    delete donnees.state.livrets['livret-lea'];
    localStorage.setItem('livret-donnees', JSON.stringify(donnees));
  });
  await page.reload();

  // 2. Léa reste visible au tableau de bord et son livret S'OUVRE (réparé).
  await selectRole(page, 'Formateur référent');
  await page.getByRole('button', { name: /Ouvrir le livret de Léa MARTIN/i }).click();
  await page.goto('/livret/fiches-suivi');
  await expect(page.getByText(/Aucun·e apprenti·e sélectionné·e/i)).toHaveCount(0);

  // 3. Le livret recréé est vierge mais hérite du planning de la formation
  //    (les périodes CAP réapparaissent, séquencement normal → P1 visible).
  await expect(page.getByRole('link', { name: /Période 1/i }).first()).toBeVisible();

  // 4. L'entretien affiche l'écran d'attente propre (non initialisé) — pas
  //    l'écran « Aucun·e apprenti·e sélectionné·e ».
  await page.goto('/livret/entretien');
  await expect(page.getByText(/n'a pas encore été initialisé/i).first()).toBeVisible();
  await expect(page.getByText(/Aucun·e apprenti·e sélectionné·e/i)).toHaveCount(0);
});
