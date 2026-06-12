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
    questionsApprentiSelectionnees: [],
    questionsMaitreSelectionnees: [],
    questionsImposees: [],
    questionsObligatoires: [],
    evaluationsAttitudes: {},
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
      apprenti: { signe: nbSignatures >= 1 },
      maitre: { signe: nbSignatures >= 2 },
      formateur: { signe: nbSignatures >= 3 },
    },
  };
}

function livretAvecE1(e1: EntretienTripartite | null): Livret {
  return {
    entretiens: { 1: e1, 2: null, 3: null, 4: null },
  } as unknown as Livret;
}

describe('selectionAttitudesFigee', () => {
  it("reste modifiable tant que l'E1 n'est pas initialisé", () => {
    expect(selectionAttitudesFigee(livretAvecE1(null))).toBe(false);
  });

  it('reste modifiable avec 0, 1 ou 2 signatures sur E1', () => {
    expect(selectionAttitudesFigee(livretAvecE1(entretien(0)))).toBe(false);
    expect(selectionAttitudesFigee(livretAvecE1(entretien(1)))).toBe(false);
    expect(selectionAttitudesFigee(livretAvecE1(entretien(2)))).toBe(false);
  });

  it('se fige à la 3ᵉ signature de E1 (pattern sélection des compétences)', () => {
    expect(selectionAttitudesFigee(livretAvecE1(entretien(3)))).toBe(true);
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
