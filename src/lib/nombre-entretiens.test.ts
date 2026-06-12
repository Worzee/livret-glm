import { describe, expect, it } from 'vitest';
import type { EntretienTripartite, Livret, NumeroEntretien } from '@/types';
import {
  NOMBRE_ENTRETIENS_DEFAUT,
  NOMBRE_ENTRETIENS_MAX,
  NOMBRE_ENTRETIENS_MIN,
  numerosEntretiensDisponibles,
  peutDefinirNombreEntretiens,
  plusHautEntretienEngage,
} from './nombre-entretiens';
import { creerEvenementVierge } from './organisation-suivi';

const ENTRETIEN_VIDE: EntretienTripartite = {
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
    apprenti: { signe: false },
    maitre: { signe: false },
    formateur: { signe: false },
  },
};

function fabriquerLivret(overrides: Partial<Livret> = {}): Livret {
  return {
    id: 'livret-test',
    apprentiId: 'u-test',
    formationId: 'f-test',
    organisationSuivi: {
      evenements: [],
      modifieLe: '2025-09-01T00:00:00.000Z',
      modifiePar: 'u-test',
    },
    entretiens: { 1: null, 2: null, 3: null, 4: null },
    fichesSuivi: [],
    evaluationFinaleCompetences: { lignes: [], modifieLe: '2025-09-01T00:00:00.000Z' },
    attitudesSelectionnees: [],
    selectionCompetencesEntreprise: {
      ids: [],
      modifieLe: '2025-09-01T00:00:00.000Z',
      historiqueInvalidations: [],
    },
    cloture: null,
    creeLe: '2025-09-01T00:00:00.000Z',
    modifieLe: '2025-09-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('constantes', () => {
  it('bornes 1..4, défaut 2', () => {
    expect(NOMBRE_ENTRETIENS_MIN).toBe(1);
    expect(NOMBRE_ENTRETIENS_MAX).toBe(4);
    expect(NOMBRE_ENTRETIENS_DEFAUT).toBe(2);
  });
});

describe('plusHautEntretienEngage', () => {
  it('retourne 0 sans aucun entretien ni événement', () => {
    expect(plusHautEntretienEngage([fabriquerLivret()])).toBe(0);
  });

  it('détecte un entretien initialisé', () => {
    const livret = fabriquerLivret({
      entretiens: { 1: ENTRETIEN_VIDE, 2: null, 3: ENTRETIEN_VIDE, 4: null },
    });
    expect(plusHautEntretienEngage([livret])).toBe(3);
  });

  it('détecte un événement entretien-tripartite-N même sans entretien initialisé', () => {
    const livret = fabriquerLivret({
      organisationSuivi: {
        evenements: [creerEvenementVierge('entretien-tripartite-4', 'evt-test')],
        modifieLe: '2025-09-01T00:00:00.000Z',
        modifiePar: 'u-test',
      },
    });
    expect(plusHautEntretienEngage([livret])).toBe(4);
  });

  it('prend le maximum sur plusieurs livrets de la promo', () => {
    const l1 = fabriquerLivret({
      entretiens: { 1: ENTRETIEN_VIDE, 2: null, 3: null, 4: null },
    });
    const l2 = fabriquerLivret({
      id: 'livret-2',
      organisationSuivi: {
        evenements: [creerEvenementVierge('entretien-tripartite-2', 'evt-2')],
        modifieLe: '2025-09-01T00:00:00.000Z',
        modifiePar: 'u-test',
      },
    });
    expect(plusHautEntretienEngage([l1, l2])).toBe(2);
  });

  it('ignore les événements non-entretien', () => {
    const livret = fabriquerLivret({
      organisationSuivi: {
        evenements: [creerEvenementVierge('visite-entreprise', 'evt-v')],
        modifieLe: '2025-09-01T00:00:00.000Z',
        modifiePar: 'u-test',
      },
    });
    expect(plusHautEntretienEngage([livret])).toBe(0);
  });
});

describe('peutDefinirNombreEntretiens', () => {
  it('accepte les valeurs 1 à 4 sur une promo vierge', () => {
    for (const n of [1, 2, 3, 4]) {
      expect(peutDefinirNombreEntretiens(n, [fabriquerLivret()]).ok).toBe(true);
    }
  });

  it('refuse 0, 5 et les valeurs non entières', () => {
    expect(peutDefinirNombreEntretiens(0, []).ok).toBe(false);
    expect(peutDefinirNombreEntretiens(5, []).ok).toBe(false);
    expect(peutDefinirNombreEntretiens(2.5, []).ok).toBe(false);
  });

  it("refuse de réduire en dessous d'un entretien initialisé", () => {
    const livret = fabriquerLivret({
      entretiens: { 1: ENTRETIEN_VIDE, 2: null, 3: ENTRETIEN_VIDE, 4: null },
    });
    const r = peutDefinirNombreEntretiens(2, [livret]);
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(/entretien tripartite 3/);
  });

  it("refuse de réduire en dessous d'un événement entretien existant", () => {
    const livret = fabriquerLivret({
      organisationSuivi: {
        evenements: [creerEvenementVierge('entretien-tripartite-3', 'evt-3')],
        modifieLe: '2025-09-01T00:00:00.000Z',
        modifiePar: 'u-test',
      },
    });
    expect(peutDefinirNombreEntretiens(2, [livret]).ok).toBe(false);
  });

  it("accepte une réduction qui reste au-dessus de l'engagé", () => {
    const livret = fabriquerLivret({
      entretiens: { 1: ENTRETIEN_VIDE, 2: ENTRETIEN_VIDE, 3: null, 4: null },
    });
    expect(peutDefinirNombreEntretiens(2, [livret]).ok).toBe(true);
    expect(peutDefinirNombreEntretiens(3, [livret]).ok).toBe(true);
  });
});

describe('numerosEntretiensDisponibles', () => {
  it('liste 1..N selon le nombre de la formation', () => {
    expect(numerosEntretiensDisponibles(1)).toEqual([1]);
    expect(numerosEntretiensDisponibles(2)).toEqual([1, 2]);
    expect(numerosEntretiensDisponibles(4 as NumeroEntretien)).toEqual([1, 2, 3, 4]);
  });
});
