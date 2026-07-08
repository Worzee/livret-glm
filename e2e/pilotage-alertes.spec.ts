import { expect, test } from '@playwright/test';
import { resetState, selectRole } from './helpers';

/**
 * Pilotage + centre d'alertes + promo BTS (3 juillet 2026 — préparation démo
 * direction).
 *
 *   - Bandeau de KPI (coordo / admin) sur le périmètre actif
 *   - Centre d'alertes par rôle (« qu'est-ce qui attend mon action ? »)
 *   - 2ᵉ formation BTS MHR : groupes du tableau de bord, sélecteur de
 *     formateur actif, référentiel 3 niveaux
 */

test.beforeEach(async ({ page }) => {
  await resetState(page);
});

test('coordo : bandeau de pilotage sur le périmètre + mini-stats par formation', async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');

  // Martine : 5 apprenti·e·s (Léa, Théo, Sofia + Camille, Yanis) et 2 alertes
  // R7 (Sofia côté CAP, Yanis côté BTS).
  const bandeau = page.getByTestId('bandeau-pilotage');
  await expect(bandeau).toBeVisible();
  await expect(bandeau.getByTestId('pilotage-apprentis')).toContainText('5');
  const carteR7 = bandeau.getByTestId('pilotage-alertes-r7');
  await expect(carteR7).toContainText('2');
  // Libellé fiabilisé (8 juillet 2026) : plus de « entretien 1 » (périmé depuis
  // l'entretien unique), accord au pluriel avec le nombre d'alertes.
  await expect(carteR7).toContainText('entretiens tripartites en retard');
  await expect(carteR7).not.toContainText('entretien 1');

  // 2 groupes de formation, BTS (promo la plus récente) en premier, chacun
  // avec son badge « 1 alerte R7 » dans l'en-tête de section.
  const groupeBts = page.getByTestId('groupe-formation-f-bts-mhr-2025');
  const groupeCap = page.getByTestId('groupe-formation-f-cap-cuisine-2025');
  await expect(groupeBts).toBeVisible();
  await expect(groupeCap).toBeVisible();
  await expect(groupeBts.locator('summary').getByText('1 alerte R7')).toBeVisible();
  await expect(groupeCap.locator('summary').getByText('1 alerte R7')).toBeVisible();

  // Bascule sur Bernard : 3 apprenti·e·s (CAP Brasserie), aucune alerte R7.
  await page.getByRole('button', { name: /Bernard PETIT/i }).click();
  await expect(bandeau.getByTestId('pilotage-apprentis')).toContainText('3');
  await expect(bandeau.getByTestId('pilotage-alertes-r7')).toContainText('0');
});

test("coordo : les points d'alerte de l'entretien remontent dans « À traiter » et se marquent « traité » (avec confirmation)", async ({
  page,
}) => {
  await selectRole(page, 'Coordinateur·rice');
  const centre = page.getByTestId('centre-alertes');

  // Léa (entretien signé 3/3) porte 2 points d'alerte : logement + absences.
  const logement = centre.getByTestId('alerte-point-alerte-u-apprenti-lea-e1-diff-logement');
  await expect(logement).toContainText('Léa MARTIN');
  await expect(logement).toContainText('Logement');
  await expect(
    centre.getByTestId('alerte-point-alerte-u-apprenti-lea-e1-org-absences'),
  ).toBeVisible();

  // « Traité » demande confirmation avant de retirer le point.
  await centre.getByTestId('traiter-point-alerte-u-apprenti-lea-e1-diff-logement').click();
  await expect(centre.getByText(/Confirmez-vous avoir réglé ce problème/i)).toBeVisible();
  // Annuler laisse le point en place.
  await centre.getByRole('button', { name: /^Annuler$/i }).click();
  await expect(
    centre.getByTestId('alerte-point-alerte-u-apprenti-lea-e1-diff-logement'),
  ).toBeVisible();
  // Confirmer le retire de « À traiter » ; l'autre point reste.
  await centre.getByTestId('traiter-point-alerte-u-apprenti-lea-e1-diff-logement').click();
  await centre
    .getByTestId('confirmer-traiter-point-alerte-u-apprenti-lea-e1-diff-logement')
    .click();
  await expect(
    centre.getByTestId('alerte-point-alerte-u-apprenti-lea-e1-diff-logement'),
  ).toHaveCount(0);
  await expect(
    centre.getByTestId('alerte-point-alerte-u-apprenti-lea-e1-org-absences'),
  ).toBeVisible();
});

test("formateur : centre d'alertes (R7, signature centre, fiche à verrouiller) — sans bandeau de pilotage", async ({
  page,
}) => {
  // Rôle par défaut = formatrice Sophie (promo CAP).
  await expect(page.getByTestId('bandeau-pilotage')).toHaveCount(0);

  const centre = page.getByTestId('centre-alertes');
  await expect(centre).toBeVisible();
  // Sofia : R7. Léa : C2 centre à signer, P2 à verrouiller.
  await expect(centre.getByTestId('alerte-r7-u-apprenti-sofia')).toBeVisible();
  await expect(centre.getByTestId('alerte-sig-fiche-fc-lea-c2')).toBeVisible();
  await expect(centre.getByTestId('alerte-verrou-fp-lea-2')).toBeVisible();
});

test("clic sur une alerte : active l'apprenti·e et navigue vers la page cible", async ({
  page,
}) => {
  await page.getByTestId('alerte-verrou-fp-lea-2').click();
  await expect(page).toHaveURL(/\/livret\/fiches-suivi\/fp-lea-2/);
  await expect(page.getByRole('heading', { name: /^Période 2/i })).toBeVisible();
  // Le trio d'identité du header pointe bien sur Léa (apprentie activée au clic).
  await expect(page.locator('strong', { hasText: 'Léa MARTIN' }).first()).toBeVisible();
});

test('bascule de formateur : Marc TISSIER ne voit que sa promo BTS, avec ses alertes', async ({
  page,
}) => {
  // Sélecteur de formateur actif (3 juillet 2026) — pattern du sélecteur de maître.
  const selecteur = page.getByText(/Formateur·rice référent·e actif·ve/i);
  await expect(selecteur).toBeVisible();
  await page.getByRole('button', { name: /Marc TISSIER/i }).click();

  // Le header reflète l'utilisateur connecté, la grille = 2 cartes BTS.
  await expect(
    page
      .locator('header')
      .getByText(/Connecté en tant que/i)
      .getByText(/Marc TISSIER/i),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Ouvrir le livret de/i })).toHaveCount(2);
  await expect(
    page.getByRole('button', { name: /Ouvrir le livret de Camille MOREAU/i }),
  ).toBeVisible();

  // Ses alertes : R7 Yanis, entretien de Yanis planifié à initialiser,
  // C2 de Camille à signer, P2 à verrouiller.
  const centre = page.getByTestId('centre-alertes');
  await expect(centre.getByTestId('alerte-r7-u-apprenti-yanis')).toBeVisible();
  await expect(centre.getByTestId('alerte-init-entretien-u-apprenti-yanis')).toBeVisible();
  await expect(centre.getByTestId('alerte-sig-fiche-fc-camille-c2')).toBeVisible();
  await expect(centre.getByTestId('alerte-verrou-fp-camille-2')).toBeVisible();
});

test('maître Karim : « votre signature est attendue » sur la P3 de Léa (période échue)', async ({
  page,
}) => {
  await selectRole(page, 'Maître / Tuteur');
  const centre = page.getByTestId('centre-alertes');
  await expect(centre.getByTestId('alerte-sig-fiche-fp-lea-3')).toBeVisible();
  await expect(centre.getByTestId('alerte-sig-fiche-fp-lea-3')).toContainText(
    /Période 3 terminée : votre signature est attendue/i,
  );
});

test('BTS MHR : référentiel 3 niveaux (sous-familles) et entretien accessibles sur le livret de Camille', async ({
  page,
}) => {
  // Bascule sur Marc puis ouverture du livret de Camille.
  await page.getByRole('button', { name: /Marc TISSIER/i }).click();
  await page.getByRole('button', { name: /Ouvrir le livret de Camille MOREAU/i }).click();

  // L'événement « Entretien Tripartite » existe → lien sidebar unique.
  const lienEntretien = page.getByRole('link', { name: /Entretien tripartite/i });
  await expect(lienEntretien).toHaveCount(1);

  // Entretien signé 3/3 dans la fixture — la page charge en lecture seule.
  await lienEntretien.click();
  await expect(page.getByRole('heading', { name: /Entretien tripartite/i }).first()).toBeVisible();

  // Synthèse : la hiérarchie du référentiel 3 niveaux s'affiche par
  // sous-familles (regroupements non évaluables).
  await page.getByRole('link', { name: /Synthèse/i }).click();
  await expect(page.getByText('Relation client et commercialisation').first()).toBeVisible();
  await expect(page.getByText('Pilotage économique').first()).toBeVisible();
});
