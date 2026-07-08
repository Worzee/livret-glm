import { describe, expect, it } from 'vitest';
import type { EntretienTripartite, Livret, SignaturesTripartite } from '@/types';
import { pointsAlerteNonTraites, estPointAlerteTraite } from './points-alerte';

/**
 * Points d'alerte de l'entretien remontés au tableau de bord coordo / admin
 * (8 juillet 2026). Deux points d'alerte connus de la trame officielle :
 *   - `e1-org-absences` : alerteSi 'non' → réponse `false` déclenche l'alerte
 *   - `e1-diff-logement` : alerteSi 'oui' → réponse `true` déclenche l'alerte
 */

const SIGNE_3: SignaturesTripartite = {
  apprenti: { signe: true },
  maitre: { signe: true },
  formateur: { signe: true },
};
const PARTIEL: SignaturesTripartite = {
  apprenti: { signe: true },
  maitre: { signe: false },
  formateur: { signe: true },
};

const DEUX_ALERTES = { 'e1-org-absences': false, 'e1-diff-logement': true };
const AUCUNE_ALERTE = { 'e1-org-absences': true, 'e1-diff-logement': false };

function entretien(
  signatures: SignaturesTripartite,
  reponsesTrame: Record<string, string | boolean>,
): EntretienTripartite {
  return { reponsesTrame, appreciationMaitre: {}, commentaires: {}, signatures };
}

function livret(
  sur: Partial<Pick<Livret, 'entretien' | 'pointsAlerteTraites'>>,
): Pick<Livret, 'entretien' | 'pointsAlerteTraites'> {
  return { entretien: null, ...sur };
}

describe('pointsAlerteNonTraites', () => {
  it("remonte les points d'alerte quand l'entretien est signé par les 3 parties", () => {
    const ids = pointsAlerteNonTraites(livret({ entretien: entretien(SIGNE_3, DEUX_ALERTES) })).map(
      (q) => q.id,
    );
    expect(ids).toEqual(expect.arrayContaining(['e1-org-absences', 'e1-diff-logement']));
    expect(ids).toHaveLength(2);
  });

  it("ne remonte rien tant que l'entretien n'est pas signé par les 3 parties", () => {
    expect(pointsAlerteNonTraites(livret({ entretien: entretien(PARTIEL, DEUX_ALERTES) }))).toEqual(
      [],
    );
  });

  it("ne remonte rien si l'entretien est null (non initialisé)", () => {
    expect(pointsAlerteNonTraites(livret({ entretien: null }))).toEqual([]);
  });

  it('exclut les points déjà marqués « traités »', () => {
    const ids = pointsAlerteNonTraites(
      livret({
        entretien: entretien(SIGNE_3, DEUX_ALERTES),
        pointsAlerteTraites: ['e1-org-absences'],
      }),
    ).map((q) => q.id);
    expect(ids).toEqual(['e1-diff-logement']);
  });

  it('ne remonte rien quand tous les points sont traités', () => {
    expect(
      pointsAlerteNonTraites(
        livret({
          entretien: entretien(SIGNE_3, DEUX_ALERTES),
          pointsAlerteTraites: ['e1-org-absences', 'e1-diff-logement'],
        }),
      ),
    ).toEqual([]);
  });

  it("ne remonte rien quand aucune réponse n'est en alerte (entretien signé mais sans difficulté)", () => {
    expect(
      pointsAlerteNonTraites(livret({ entretien: entretien(SIGNE_3, AUCUNE_ALERTE) })),
    ).toEqual([]);
  });
});

describe('estPointAlerteTraite', () => {
  it("reflète la présence de l'id dans pointsAlerteTraites", () => {
    expect(
      estPointAlerteTraite({ pointsAlerteTraites: ['e1-diff-logement'] }, 'e1-diff-logement'),
    ).toBe(true);
    expect(estPointAlerteTraite({ pointsAlerteTraites: [] }, 'e1-diff-logement')).toBe(false);
    expect(estPointAlerteTraite({}, 'e1-diff-logement')).toBe(false);
  });
});
