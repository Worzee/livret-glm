import { describe, expect, it } from 'vitest';
import type { EntretienTripartite } from '@/types';
import { ATTITUDES_INITIALES, attitudeEstUtilisee, auMoinsUneAttitudeEvaluee } from './attitudes';

// Helper local — entretien minimal pour les tests.
function entretien(
  evaluationsAttitudes: EntretienTripartite['evaluationsAttitudes'] = {},
): EntretienTripartite {
  return {
    questionsApprentiSelectionnees: [],
    questionsMaitreSelectionnees: [],
    questionsImposees: [],
    questionsObligatoires: [],
    evaluationsAttitudes,
    reponsesApprenti: {},
    reponsesMaitre: {},
    appreciationMaitre: {},
    demarchesAdministratives: {
      contratSigne: null,
      visiteMedicale: null,
      permisConduire: null,
      voiture: null,
    },
    conditionsPratiques: {},
    aidesDemandees: { logement: null, premierEquipement: null, permis: null },
    commentaires: {},
    signatures: {
      apprenti: { signe: false },
      maitre: { signe: false },
      formateur: { signe: false },
    },
  };
}

describe('ATTITUDES_INITIALES', () => {
  it('contient les 6 attitudes historiques avec ids et libellés stables', () => {
    expect(ATTITUDES_INITIALES).toHaveLength(6);
    const ids = new Set<string>();
    for (const a of ATTITUDES_INITIALES) {
      expect(a.id).toMatch(/^a\d+$/);
      expect(ids.has(a.id)).toBe(false);
      ids.add(a.id);
      expect(a.libelle.length).toBeGreaterThan(5);
    }
  });

  it('les libellés sont neutres : pas de référence à un domaine particulier', () => {
    const motsInterdits = ['brigade', 'cuisine', 'cfa'];
    for (const a of ATTITUDES_INITIALES) {
      const libelle = a.libelle.toLowerCase();
      for (const mot of motsInterdits) {
        expect(libelle.includes(mot)).toBe(false);
      }
    }
  });
});

describe('attitudeEstUtilisee', () => {
  it('détecte une évaluation dans un entretien', () => {
    const e = entretien({ a1: 'plus' });
    expect(attitudeEstUtilisee('a1', [e])).toBe(true);
  });

  it('une entrée null ne compte pas comme utilisée', () => {
    const e = entretien({ a1: null });
    expect(attitudeEstUtilisee('a1', [e])).toBe(false);
  });

  it("retourne false si aucun entretien n'évalue l'attitude", () => {
    const e = entretien({ a2: 'moins' });
    expect(attitudeEstUtilisee('a1', [e])).toBe(false);
  });

  it('ignore les entretiens null (non initialisés)', () => {
    expect(attitudeEstUtilisee('a1', [null, null])).toBe(false);
  });
});

describe('auMoinsUneAttitudeEvaluee', () => {
  it('false sur un entretien sans aucune évaluation', () => {
    expect(auMoinsUneAttitudeEvaluee(entretien())).toBe(false);
  });

  it('false si toutes les entrées sont null', () => {
    expect(auMoinsUneAttitudeEvaluee(entretien({ a1: null, a2: null }))).toBe(false);
  });

  it("true dès qu'une attitude est évaluée (même « -- »)", () => {
    expect(auMoinsUneAttitudeEvaluee(entretien({ a1: 'moinsmoins' }))).toBe(true);
  });
});
