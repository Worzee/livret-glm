import { describe, expect, it } from 'vitest';
import type { FicheSuiviPeriode, Livret, PeriodeFormation } from '@/types';
import {
  evaluerVerrouPeriode,
  libellePeriode,
  renumeroterPeriodes,
  validerSaisiePeriode,
} from './validation-periode-formation';

const periode = (
  id: string,
  numero: number,
  dateDebut: string,
  dateFin: string,
  titre?: string,
): PeriodeFormation => ({ id, numero, titre, dateDebut, dateFin });

describe('validerSaisiePeriode', () => {
  it('valide une saisie correcte', () => {
    const r = validerSaisiePeriode({ dateDebut: '2025-09-02', dateFin: '2025-12-20' }, []);
    expect(r.ok).toBe(true);
    expect(r.erreurs).toEqual({});
  });

  it('refuse une date de fin vide', () => {
    const r = validerSaisiePeriode({ dateDebut: '2025-09-02', dateFin: '' }, []);
    expect(r.ok).toBe(false);
    expect(r.erreurs.dateFin).toBeDefined();
  });

  it('refuse une date de fin antérieure ou égale au début (R11)', () => {
    const r = validerSaisiePeriode({ dateDebut: '2025-09-02', dateFin: '2025-09-02' }, []);
    expect(r.ok).toBe(false);
    expect(r.erreurs.dateFin).toMatch(/R11/);
  });

  it('refuse un chevauchement avec une période existante (R12)', () => {
    const existantes = [periode('p1', 1, '2025-09-02', '2025-12-20')];
    const r = validerSaisiePeriode({ dateDebut: '2025-11-01', dateFin: '2026-01-15' }, existantes);
    expect(r.ok).toBe(false);
    expect(r.erreurs.dateDebut).toMatch(/chevauchent/);
  });

  it('autorise une période strictement contiguë (fin = début de la suivante)', () => {
    // Convention : fin exclusive — une période finit le 20/12, la suivante
    // peut commencer le 20/12. Évite les faux positifs en saisie quotidienne.
    const existantes = [periode('p1', 1, '2025-09-02', '2025-12-20')];
    const r = validerSaisiePeriode({ dateDebut: '2025-12-20', dateFin: '2026-02-14' }, existantes);
    expect(r.ok).toBe(true);
  });

  it("ignore la période en cours d'édition lors du contrôle de chevauchement", () => {
    const p1 = periode('p1', 1, '2025-09-02', '2025-12-20');
    const r = validerSaisiePeriode(
      { dateDebut: '2025-09-02', dateFin: '2025-12-20' },
      [p1],
      'p1', // on édite p1 — pas de faux conflit avec elle-même
    );
    expect(r.ok).toBe(true);
  });

  it('mentionne le titre de la période en conflit dans le message', () => {
    const existantes = [periode('p1', 1, '2025-09-02', '2025-12-20', "Période d'automne")];
    const r = validerSaisiePeriode({ dateDebut: '2025-11-01', dateFin: '2026-01-15' }, existantes);
    expect(r.erreurs.dateDebut).toMatch(/Période d'automne/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

function ficheAvec(periodeId: string, etat: FicheSuiviPeriode['etat']): FicheSuiviPeriode {
  return {
    id: `f-${periodeId}`,
    numeroPeriode: 1,
    periodeFormationId: periodeId,
    dateDebut: '2025-09-02',
    dateFin: '2025-12-20',
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

function livretAvec(...fiches: FicheSuiviPeriode[]): Livret {
  return {
    id: 'l-test',
    apprentiId: 'a-test',
    formationId: 'f-test',
    organisationSuivi: { evenements: [], modifieLe: '', modifiePar: '' },
    entretien: null,
    fichesSuivi: fiches,
    fichesSuiviCentre: [],
    evaluationFinaleCompetences: { lignes: [], modifieLe: '' },
    attitudesSelectionnees: [],
    selectionCompetencesEntreprise: {
      ids: [],
      modifieLe: '',
      historiqueInvalidations: [],
    },
    cloture: null,
    creeLe: '',
    modifieLe: '',
  };
}

describe('evaluerVerrouPeriode', () => {
  const p = periode('p1', 1, '2025-09-02', '2025-12-20');

  it('autorise modification et suppression quand aucune fiche correspondante existe', () => {
    expect(evaluerVerrouPeriode(p, [], 'modification').peut).toBe(true);
    expect(evaluerVerrouPeriode(p, [], 'suppression').peut).toBe(true);
  });

  it('autorise modification quand les fiches existent mais sont en brouillon', () => {
    const livrets = [livretAvec(ficheAvec('p1', 'brouillon'))];
    const r = evaluerVerrouPeriode(p, livrets, 'modification');
    expect(r.peut).toBe(true);
  });

  it('autorise quand les fiches sont en cours (pas encore signées)', () => {
    const livrets = [livretAvec(ficheAvec('p1', 'en-cours'))];
    expect(evaluerVerrouPeriode(p, livrets, 'suppression').peut).toBe(true);
  });

  it('refuse modification dès qu’une fiche correspondante est signée', () => {
    const livrets = [
      livretAvec(ficheAvec('p1', 'en-cours')),
      livretAvec(ficheAvec('p1', 'signee')),
    ];
    const r = evaluerVerrouPeriode(p, livrets, 'modification');
    expect(r.peut).toBe(false);
    expect(r.raison).toMatch(/modifier/);
    expect(r.apprentisImpactes).toBe(1);
  });

  it('refuse suppression dès qu’une fiche correspondante est verrouillée', () => {
    const livrets = [livretAvec(ficheAvec('p1', 'verrouillee'))];
    const r = evaluerVerrouPeriode(p, livrets, 'suppression');
    expect(r.peut).toBe(false);
    expect(r.raison).toMatch(/supprimer/);
  });

  it("ne compte pas les fiches d'autres périodes", () => {
    const livrets = [livretAvec(ficheAvec('p2', 'signee'))];
    expect(evaluerVerrouPeriode(p, livrets, 'modification').peut).toBe(true);
  });
});

describe('evaluerVerrouPeriode (centre, 17 juin 2026)', () => {
  const p = periode('p1', 1, '2025-09-02', '2025-12-20');
  const livretAvecCentre = (...fiches: FicheSuiviPeriode[]): Livret => ({
    ...livretAvec(),
    fichesSuivi: [],
    fichesSuiviCentre: fiches,
  });

  it('inspecte les fiches CENTRE et non les fiches entreprise', () => {
    // Une fiche entreprise signée ne verrouille pas le planning centre.
    const livretEntreprise = livretAvec(ficheAvec('p1', 'signee'));
    expect(evaluerVerrouPeriode(p, [livretEntreprise], 'modification', 'centre').peut).toBe(true);

    // Une fiche centre signée verrouille bien le planning centre.
    const livretCentre = livretAvecCentre(ficheAvec('p1', 'signee'));
    const r = evaluerVerrouPeriode(p, [livretCentre], 'modification', 'centre');
    expect(r.peut).toBe(false);
    expect(r.apprentisImpactes).toBe(1);
  });

  it('symétrie : une fiche centre signée ne verrouille pas le planning entreprise', () => {
    const livretCentre = livretAvecCentre(ficheAvec('p1', 'signee'));
    expect(evaluerVerrouPeriode(p, [livretCentre], 'modification').peut).toBe(true);
  });
});

describe('renumeroterPeriodes', () => {
  it('attribue 1..N en ordre chronologique de dateDebut', () => {
    const r = renumeroterPeriodes([
      periode('p3', 99, '2026-03-02', '2026-04-11'),
      periode('p1', 99, '2025-09-02', '2025-12-20'),
      periode('p2', 99, '2026-01-06', '2026-02-14'),
    ]);
    expect(r.map((p) => [p.id, p.numero])).toEqual([
      ['p1', 1],
      ['p2', 2],
      ['p3', 3],
    ]);
  });
});

describe('libellePeriode', () => {
  it('formate avec titre quand présent', () => {
    expect(libellePeriode(periode('x', 2, '', '', 'Stage automne'))).toBe(
      'Période 2 — Stage automne',
    );
  });

  it('formate sans titre', () => {
    expect(libellePeriode(periode('x', 1, '', ''))).toBe('Période 1');
  });
});
