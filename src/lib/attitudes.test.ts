import { describe, expect, it } from 'vitest';
import type { EntretienTripartite } from '@/types';
import {
  ATTITUDES_INITIALES,
  ATTITUDES_OBLIGATOIRES,
  attitudeEstUtilisee,
  auMoinsUneAttitudeEvaluee,
  lignesSyntheseAttitudes,
} from './attitudes';
import { CRITERES_APPRECIATION } from './trame-entretien';

// Helper local — entretien minimal pour les tests.
function entretien(
  evaluationsAttitudes: EntretienTripartite['evaluationsAttitudes'] = {},
): EntretienTripartite {
  return {
    evaluationsAttitudes,
    reponsesTrame: {},
    appreciationMaitre: {},
    commentaires: {},
    signatures: {
      apprenti: { signe: false },
      maitre: { signe: false },
      formateur: { signe: false },
    },
  };
}

describe('ATTITUDES_INITIALES', () => {
  it('contient 12 attitudes avec ids uniques, libellés et descriptions (a1..a4 retirées le 18 juin 2026)', () => {
    expect(ATTITUDES_INITIALES).toHaveLength(12);
    const ids = new Set<string>();
    for (const a of ATTITUDES_INITIALES) {
      expect(a.id).toMatch(/^a\d+$/);
      expect(ids.has(a.id)).toBe(false);
      ids.add(a.id);
      expect(a.libelle.length).toBeGreaterThan(5);
      // Chaque attitude porte une description concrète (aide à l'évaluation).
      expect(a.description ?? '').not.toBe('');
    }
  });

  it('a1..a4 sont retirées (doublon avec l’appréciation maître) ; les ids restants sont stables', () => {
    const parId = new Map(ATTITUDES_INITIALES.map((a) => [a.id, a.libelle]));
    for (const id of ['a1', 'a2', 'a3', 'a4']) {
      expect(parId.has(id)).toBe(false);
    }
    // Attitudes encore référencées par les fixtures de démo : id + libellé stables.
    expect(parId.get('a5')).toBe("Prise d'initiative et autonomie");
    expect(parId.get('a6')).toBe('Communication professionnelle');
    expect(parId.get('a9')).toBe('Motivation et implication');
  });

  it('les libellés sont neutres : pas de référence à un domaine particulier', () => {
    const motsInterdits = ['brigade', 'cuisine', 'cfa'];
    for (const a of ATTITUDES_INITIALES) {
      const texte = `${a.libelle} ${a.description ?? ''}`.toLowerCase();
      for (const mot of motsInterdits) {
        expect(texte.includes(mot)).toBe(false);
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

describe('ATTITUDES_OBLIGATOIRES', () => {
  it("reprend les 4 critères de l'appréciation maître, dans l'ordre de la trame officielle", () => {
    expect(ATTITUDES_OBLIGATOIRES.map((a) => a.cle)).toEqual(
      CRITERES_APPRECIATION.map((c) => c.cle),
    );
    expect(ATTITUDES_OBLIGATOIRES.map((a) => a.libelle)).toEqual(
      CRITERES_APPRECIATION.map((c) => c.libelle),
    );
  });

  it('chaque attitude obligatoire porte une description concrète', () => {
    for (const a of ATTITUDES_OBLIGATOIRES) {
      expect(a.description.length).toBeGreaterThan(10);
    }
  });
});

describe('lignesSyntheseAttitudes', () => {
  const catalogue = [
    { id: 'a5', libelle: "Prise d'initiative et autonomie", description: 'Sait agir seul·e.' },
    { id: 'a9', libelle: 'Motivation et implication' },
  ];

  it('place les 4 obligatoires avant les optionnelles retenues (ordre du catalogue)', () => {
    const lignes = lignesSyntheseAttitudes(catalogue, ['a9', 'a5'], null);
    expect(lignes.map((l) => l.id)).toEqual([
      'oblig-ponctualite',
      'oblig-comprehensionConsignes',
      'oblig-qualiteTravail',
      'oblig-integration',
      'a5',
      'a9',
    ]);
    expect(lignes.slice(0, 4).every((l) => l.obligatoire)).toBe(true);
    expect(lignes.slice(4).every((l) => !l.obligatoire)).toBe(true);
  });

  it("lit les obligatoires dans l'appréciation du maître et les optionnelles dans les évaluations", () => {
    const e = entretien({ a5: 'plus' });
    e.appreciationMaitre = { ponctualite: 'plusplus', qualiteTravail: 'moins' };
    const lignes = lignesSyntheseAttitudes(catalogue, ['a5'], e);

    const parId = new Map(lignes.map((l) => [l.id, l]));
    expect(parId.get('oblig-ponctualite')?.niveau).toBe('plusplus');
    expect(parId.get('oblig-qualiteTravail')?.niveau).toBe('moins');
    // Critère non renseigné dans l'appréciation → null.
    expect(parId.get('oblig-integration')?.niveau).toBeNull();
    expect(parId.get('a5')?.niveau).toBe('plus');
  });

  it('retourne null pour un entretien absent ou une valeur non renseignée', () => {
    const lignesSansEntretien = lignesSyntheseAttitudes(catalogue, ['a5'], null);
    expect(lignesSansEntretien.every((l) => l.niveau === null)).toBe(true);

    const e = entretien({ a5: null });
    const lignes = lignesSyntheseAttitudes(catalogue, ['a5'], e);
    const parId = new Map(lignes.map((l) => [l.id, l]));
    // Évaluation explicitement null → null.
    expect(parId.get('a5')?.niveau).toBeNull();
  });

  it('ignore les ids orphelins de la sélection et conserve toujours les 4 obligatoires', () => {
    const lignes = lignesSyntheseAttitudes(catalogue, ['a-supprimee'], null);
    expect(lignes).toHaveLength(4);
    expect(lignes.every((l) => l.obligatoire)).toBe(true);
  });
});
