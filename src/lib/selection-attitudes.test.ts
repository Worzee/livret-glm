import { describe, expect, it } from 'vitest';
import type { EntretienTripartite, Livret } from '@/types';
import {
  attitudesRetenues,
  selectionAttitudesFigee,
  toggleIdSelection,
} from './selection-attitudes';

/** Entretien minimal avec n signatures apposées (0 à 3). */
function entretien(nbSignatures: number): EntretienTripartite {
  return {
    evaluationsAttitudes: {},
    reponsesTrame: {},
    appreciationMaitre: {},
    commentaires: {},
    signatures: {
      apprenti: { signe: nbSignatures >= 1 },
      maitre: { signe: nbSignatures >= 2 },
      formateur: { signe: nbSignatures >= 3 },
    },
  };
}

function livretAvecEntretien(e: EntretienTripartite | null): Livret {
  return { entretien: e } as unknown as Livret;
}

describe('selectionAttitudesFigee', () => {
  it("reste modifiable tant que l'entretien n'est pas initialisé", () => {
    expect(selectionAttitudesFigee(livretAvecEntretien(null))).toBe(false);
  });

  it("reste modifiable avec 0, 1 ou 2 signatures sur l'entretien", () => {
    expect(selectionAttitudesFigee(livretAvecEntretien(entretien(0)))).toBe(false);
    expect(selectionAttitudesFigee(livretAvecEntretien(entretien(1)))).toBe(false);
    expect(selectionAttitudesFigee(livretAvecEntretien(entretien(2)))).toBe(false);
  });

  it("se fige à la 3ᵉ signature de l'entretien (pattern sélection des compétences)", () => {
    expect(selectionAttitudesFigee(livretAvecEntretien(entretien(3)))).toBe(true);
  });
});

describe('toggleIdSelection', () => {
  it('ajoute un id absent', () => {
    expect(toggleIdSelection(['a1'], 'a2')).toEqual(['a1', 'a2']);
  });

  it('retire un id présent', () => {
    expect(toggleIdSelection(['a1', 'a2'], 'a1')).toEqual(['a2']);
  });

  it("ne mute pas la liste d'origine", () => {
    const ids = ['a1'];
    toggleIdSelection(ids, 'a2');
    expect(ids).toEqual(['a1']);
  });
});

describe('attitudesRetenues', () => {
  const catalogue = [
    { id: 'a1', libelle: 'Ponctualité et assiduité' },
    { id: 'a2', libelle: 'Respect des consignes' },
    { id: 'a3', libelle: 'Qualité du travail' },
  ];

  it("filtre le catalogue sur la sélection, dans l'ordre du catalogue", () => {
    expect(attitudesRetenues(catalogue, ['a3', 'a1']).map((a) => a.id)).toEqual(['a1', 'a3']);
  });

  it('ignore les ids orphelins (attitude supprimée du catalogue)', () => {
    expect(attitudesRetenues(catalogue, ['a1', 'a-supprimee']).map((a) => a.id)).toEqual(['a1']);
  });

  it('retourne une liste vide pour une sélection vide', () => {
    expect(attitudesRetenues(catalogue, [])).toEqual([]);
  });
});
