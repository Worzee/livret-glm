import { describe, expect, it } from 'vitest';
import type { EntretienTripartite, FicheSuiviPeriode, Livret } from '@/types';
import {
  joursRestants,
  periodeCourante,
  prochainEntretien,
  progressionEntretiens,
  progressionFiches,
} from './recap-apprenti';

// Fiche minimale avec signatures contrôlées.
const fiche = (
  numero: number,
  s: { apprenti: boolean; maitre: boolean; formateur: boolean },
): FicheSuiviPeriode => ({
  id: `f-${numero}`,
  numeroPeriode: numero,
  dateDebut: '2025-09-01',
  dateFin: '2025-12-01',
  suiviGretaCfa: {},
  suiviEntreprise: [],
  observations: {},
  signatures: {
    apprenti: { signe: s.apprenti },
    maitre: { signe: s.maitre },
    formateur: { signe: s.formateur },
  },
  etat: 'brouillon',
  historiqueDeverrouillages: [],
});

// Entretien minimal (casté — seules les signatures sont lues par les helpers).
const entretien = (a: boolean, m: boolean, f: boolean): EntretienTripartite =>
  ({
    signatures: {
      apprenti: { signe: a },
      maitre: { signe: m },
      formateur: { signe: f },
    },
  }) as unknown as EntretienTripartite;

// Livret minimal (casté) : seuls `entretiens` et `organisationSuivi.evenements`
// sont lus par prochainEntretien / progressionEntretiens.
const livret = (
  entretiens: Partial<Record<1 | 2 | 3 | 4, EntretienTripartite | null>>,
  evenements: Array<{ motif: string; date?: string }> = [],
): Livret =>
  ({
    entretiens: { 1: null, 2: null, 3: null, 4: null, ...entretiens },
    organisationSuivi: { evenements, modifieLe: '', modifiePar: '' },
  }) as unknown as Livret;

describe('progressionFiches', () => {
  it('compte les fiches signées selon le lieu', () => {
    const fiches = [
      fiche(1, { apprenti: true, maitre: true, formateur: true }), // entreprise + centre : signée
      fiche(2, { apprenti: true, maitre: false, formateur: true }), // entreprise : non / centre : signée
    ];
    expect(progressionFiches(fiches, 'entreprise')).toEqual({ total: 2, signees: 1 });
    expect(progressionFiches(fiches, 'centre')).toEqual({ total: 2, signees: 2 });
  });
});

describe('periodeCourante', () => {
  it('retourne la première fiche non signée (ordre chronologique)', () => {
    const fiches = [
      fiche(2, { apprenti: false, maitre: false, formateur: false }),
      fiche(1, { apprenti: true, maitre: true, formateur: true }),
    ];
    expect(periodeCourante(fiches, 'entreprise')?.numeroPeriode).toBe(2);
  });

  it('retourne null si toutes les fiches sont signées', () => {
    const fiches = [fiche(1, { apprenti: true, maitre: true, formateur: true })];
    expect(periodeCourante(fiches, 'entreprise')).toBeNull();
  });
});

describe('prochainEntretien', () => {
  it('retourne le premier entretien non signé avec sa date prévue', () => {
    const l = livret({ 1: entretien(true, true, true) }, [
      { motif: 'entretien-tripartite-1', date: '2025-10-28' },
      { motif: 'entretien-tripartite-2', date: '2026-05-15' },
    ]);
    const e = prochainEntretien(l, 2);
    expect(e?.numero).toBe(2);
    expect(e?.datePrevue).toBe('2026-05-15');
    expect(e?.initialise).toBe(false);
  });

  it('retourne E1 quand il n’est pas signé', () => {
    const l = livret({}, [{ motif: 'entretien-tripartite-1', date: '2025-10-28' }]);
    const e = prochainEntretien(l, 2);
    expect(e?.numero).toBe(1);
    expect(e?.datePrevue).toBe('2025-10-28');
  });

  it('retourne null si tous les entretiens prévus sont signés', () => {
    const l = livret({ 1: entretien(true, true, true), 2: entretien(true, true, true) });
    expect(prochainEntretien(l, 2)).toBeNull();
  });

  it('ne regarde que les entretiens jusqu’à nombreEntretiens', () => {
    const l = livret({ 1: entretien(true, true, true) });
    expect(prochainEntretien(l, 1)).toBeNull();
  });
});

describe('progressionEntretiens', () => {
  it('compte les entretiens signés sur le total prévu', () => {
    const l = livret({ 1: entretien(true, true, true), 2: entretien(true, false, true) });
    expect(progressionEntretiens(l, 2)).toEqual({ signes: 1, total: 2 });
  });
});

describe('joursRestants', () => {
  it('compte les jours jusqu’à une date future', () => {
    expect(joursRestants('2026-06-28', new Date('2026-06-18T00:00:00Z'))).toBe(10);
  });

  it('retourne un nombre négatif pour une date passée', () => {
    expect(joursRestants('2026-06-08', new Date('2026-06-18T00:00:00Z'))).toBeLessThan(0);
  });
});
