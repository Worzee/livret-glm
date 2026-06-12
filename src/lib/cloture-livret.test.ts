import { describe, expect, it } from 'vitest';
import type {
  ClotureLivret,
  EtatFiche,
  FicheSuiviPeriode,
  Livret,
  SignaturesTripartite,
} from '@/types';
import {
  creerCloture,
  estCloture,
  motifBlocageCloture,
  peutCloturer,
} from './cloture-livret';

const aucuneSignature: SignaturesTripartite = {
  apprenti: { signe: false },
  maitre: { signe: false },
  formateur: { signe: false },
};

const fiche = (id: string, etat: EtatFiche): FicheSuiviPeriode => ({
  id,
  numeroPeriode: parseInt(id.replace(/\D/g, ''), 10) || 1,
  dateDebut: '2025-09-01',
  dateFin: '2025-12-15',
  suiviGretaCfa: {},
  suiviEntreprise: [],
  observations: {},
  signatures: aucuneSignature,
  etat,
  historiqueDeverrouillages: [],
});

const livretBase = (fiches: FicheSuiviPeriode[], cloture: ClotureLivret | null = null): Livret => ({
  id: 'l-test',
  apprentiId: 'u-app',
  formationId: 'f-test',
  organisationSuivi: {
    evenements: [],
    modifieLe: '2025-09-01T08:00:00.000Z',
    modifiePar: 'u-form',
  },
  entretiens: { 1: null, 2: null, 3: null, 4: null },
  fichesSuivi: fiches,
  evaluationFinaleCompetences: { lignes: [], modifieLe: '2025-09-01T08:00:00.000Z' },
  selectionCompetencesEntreprise: {
    ids: [],
    modifieLe: '2025-09-01T08:00:00.000Z',
    historiqueInvalidations: [],
  },
  cloture,
  creeLe: '2025-09-01T08:00:00.000Z',
  modifieLe: '2025-09-01T08:00:00.000Z',
});

describe('estCloture', () => {
  it('retourne false quand cloture est null', () => {
    expect(estCloture(livretBase([fiche('p1', 'verrouillee')]))).toBe(false);
  });

  it('retourne true quand cloture est renseignée', () => {
    const cloture: ClotureLivret = {
      dateCloture: '2026-06-30T10:00:00.000Z',
      auteurId: 'u-form',
      auteurNom: 'Sophie DUBOIS',
      auteurRole: 'formateur',
    };
    expect(estCloture(livretBase([fiche('p1', 'verrouillee')], cloture))).toBe(true);
  });
});

describe('peutCloturer', () => {
  it('refuse si le livret est déjà clôturé', () => {
    const cloture: ClotureLivret = {
      dateCloture: '2026-06-30T10:00:00.000Z',
      auteurId: 'u-form',
      auteurNom: 'Sophie DUBOIS',
      auteurRole: 'formateur',
    };
    expect(peutCloturer(livretBase([fiche('p1', 'verrouillee')], cloture))).toBe(false);
  });

  it('refuse si aucune fiche de période n\'existe', () => {
    expect(peutCloturer(livretBase([]))).toBe(false);
  });

  it('refuse si une fiche est en brouillon', () => {
    expect(
      peutCloturer(livretBase([fiche('p1', 'verrouillee'), fiche('p2', 'brouillon')])),
    ).toBe(false);
  });

  it('refuse si une fiche est en cours', () => {
    expect(
      peutCloturer(livretBase([fiche('p1', 'verrouillee'), fiche('p2', 'en-cours')])),
    ).toBe(false);
  });

  it('refuse si une fiche est seulement signée (pas verrouillée)', () => {
    expect(
      peutCloturer(livretBase([fiche('p1', 'verrouillee'), fiche('p2', 'signee')])),
    ).toBe(false);
  });

  it('autorise si toutes les fiches sont verrouillées', () => {
    expect(
      peutCloturer(livretBase([fiche('p1', 'verrouillee'), fiche('p2', 'verrouillee')])),
    ).toBe(true);
  });
});

describe('motifBlocageCloture', () => {
  it('retourne null quand la clôture est possible', () => {
    expect(
      motifBlocageCloture(livretBase([fiche('p1', 'verrouillee')])),
    ).toBeNull();
  });

  it('retourne un message si déjà clôturé', () => {
    const cloture: ClotureLivret = {
      dateCloture: '2026-06-30T10:00:00.000Z',
      auteurId: 'u-form',
      auteurNom: 'Sophie DUBOIS',
      auteurRole: 'formateur',
    };
    const message = motifBlocageCloture(livretBase([fiche('p1', 'verrouillee')], cloture));
    expect(message).toMatch(/déjà clôturé/i);
  });

  it('retourne un message si aucune fiche', () => {
    const message = motifBlocageCloture(livretBase([]));
    expect(message).toMatch(/aucune fiche/i);
  });

  it("liste les fiches non verrouillées si certaines sont incomplètes", () => {
    const message = motifBlocageCloture(
      livretBase([
        fiche('p1', 'verrouillee'),
        fiche('p2', 'en-cours'),
        fiche('p3', 'brouillon'),
      ]),
    );
    expect(message).toMatch(/2/);
    expect(message).toMatch(/verrouillée/i);
  });
});

describe('creerCloture', () => {
  it('produit une trace complète avec horodatage ISO 8601', () => {
    const date = new Date('2026-06-30T10:00:00.000Z');
    const c = creerCloture('u-form-1', 'Sophie DUBOIS', 'formateur', date);
    expect(c.auteurId).toBe('u-form-1');
    expect(c.auteurNom).toBe('Sophie DUBOIS');
    expect(c.auteurRole).toBe('formateur');
    expect(c.dateCloture).toBe('2026-06-30T10:00:00.000Z');
  });

  it('utilise la date courante par défaut', () => {
    const c = creerCloture('u-form-1', 'Sophie DUBOIS', 'formateur');
    expect(() => new Date(c.dateCloture).toISOString()).not.toThrow();
    // L'écart à maintenant doit être inférieur à 5 secondes.
    const ecartMs = Math.abs(Date.now() - Date.parse(c.dateCloture));
    expect(ecartMs).toBeLessThan(5000);
  });
});
