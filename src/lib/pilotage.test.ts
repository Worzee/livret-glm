import { describe, expect, it } from 'vitest';
import type { Apprenti, EntretienTripartite, FicheSuiviPeriode, Livret } from '@/types';
import { apprentiLeaMartin } from '@/fixtures/utilisateurs';
import { pourcentageSignees, statsPilotage } from './pilotage';

/**
 * Pilotage des promos (3 juillet 2026) — agrégats du tableau de bord
 * coordo / admin. Fixtures minimales construites localement pour la
 * déterminisme (la date « maintenant » est injectée).
 */

const MAINTENANT = new Date('2026-07-03T12:00:00.000Z');

function fiche(
  etat: FicheSuiviPeriode['etat'],
  id = `f-${etat}-${Math.random()}`,
): FicheSuiviPeriode {
  return {
    id,
    numeroPeriode: 1,
    dateDebut: '2025-09-01',
    dateFin: '2025-12-19',
    suiviGretaCfa: {},
    suiviEntreprise: [],
    observations: {},
    signatures: {
      apprenti: { signe: false },
      maitre: { signe: false },
      formateur: { signe: false },
    },
    etat,
    historiqueDeverrouillages: [],
  };
}

function entretienSigne(complet: boolean): EntretienTripartite {
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
      apprenti: { signe: true },
      maitre: { signe: true },
      formateur: { signe: complet },
    },
  };
}

function livret(apprentiId: string, sur: Partial<Livret> = {}): Livret {
  return {
    id: `livret-${apprentiId}`,
    apprentiId,
    formationId: 'f-test',
    organisationSuivi: { evenements: [], modifieLe: '', modifiePar: '' },
    entretiens: { 1: null, 2: null, 3: null, 4: null },
    fichesSuivi: [],
    fichesSuiviCentre: [],
    evaluationFinaleCompetences: { lignes: [], modifieLe: '' },
    selectionCompetencesEntreprise: { ids: [], modifieLe: '', historiqueInvalidations: [] },
    attitudesSelectionnees: [],
    cloture: null,
    creeLe: '',
    modifieLe: '',
    ...sur,
  };
}

function apprenti(id: string, sur: Partial<Apprenti> = {}): Apprenti {
  return { ...apprentiLeaMartin, id, formationId: 'f-test', ...sur };
}

const FORMATIONS = {
  'f-test': { nombreEntretiens: 2 as const },
} as never;

describe('statsPilotage', () => {
  it('compte les fiches signées et verrouillées (entreprise et centre)', () => {
    const a = apprenti('a1');
    const l = livret('a1', {
      fichesSuivi: [fiche('verrouillee', 'p1'), fiche('signee', 'p2'), fiche('en-cours', 'p3')],
      fichesSuiviCentre: [fiche('signee', 'c1'), fiche('brouillon', 'c2')],
    });
    const s = statsPilotage([a], { [l.id]: l }, FORMATIONS, MAINTENANT);
    expect(s.fichesEntreprise).toEqual({ signees: 2, total: 3 });
    expect(s.fichesCentre).toEqual({ signees: 1, total: 2 });
  });

  it('compte les entretiens signés 3 parties sur les attendus de la formation', () => {
    const a = apprenti('a1');
    const l = livret('a1', {
      entretiens: { 1: entretienSigne(true), 2: entretienSigne(false), 3: null, 4: null },
    });
    const s = statsPilotage([a], { [l.id]: l }, FORMATIONS, MAINTENANT);
    expect(s.entretiens).toEqual({ realises: 1, attendus: 2 });
  });

  it("additionne les attendus selon le nombre d'entretiens de chaque formation (défaut 2)", () => {
    const a1 = apprenti('a1');
    const a2 = apprenti('a2', { formationId: 'f-inconnue' });
    const livrets = { l1: livret('a1'), l2: livret('a2') };
    livrets.l1.apprentiId = 'a1';
    livrets.l2.apprentiId = 'a2';
    const formations = { 'f-test': { nombreEntretiens: 4 } } as never;
    const s = statsPilotage([a1, a2], livrets, formations, MAINTENANT);
    expect(s.entretiens.attendus).toBe(6); // 4 (f-test) + 2 (défaut)
  });

  it('compte les alertes R7 (contrat démarré, E1 non signé) et les clôtures', () => {
    const enRetard = apprenti('a1', { contratDebut: '2025-09-01' });
    const ok = apprenti('a2', { contratDebut: '2025-09-01' });
    const livrets = {
      l1: livret('a1'),
      l2: livret('a2', {
        apprentiId: 'a2',
        entretiens: { 1: entretienSigne(true), 2: null, 3: null, 4: null },
        cloture: {
          dateCloture: '2026-06-30T10:00:00.000Z',
          auteurId: 'x',
          auteurNom: 'X',
          auteurRole: 'formateur',
        },
      }),
    };
    const s = statsPilotage([enRetard, ok], livrets, FORMATIONS, MAINTENANT);
    expect(s.alertesR7).toBe(1);
    expect(s.livretsClotures).toBe(1);
  });

  it('ignore un·e apprenti·e sans livret', () => {
    const s = statsPilotage([apprenti('a1')], {}, FORMATIONS, MAINTENANT);
    expect(s.nbApprentis).toBe(1);
    expect(s.fichesEntreprise.total).toBe(0);
    expect(s.entretiens.attendus).toBe(0);
  });
});

describe('pourcentageSignees', () => {
  it("arrondit à l'entier", () => {
    expect(pourcentageSignees({ signees: 2, total: 3 })).toBe(67);
  });
  it('retourne 0 quand le total est nul', () => {
    expect(pourcentageSignees({ signees: 0, total: 0 })).toBe(0);
  });
});
