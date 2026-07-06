import { describe, expect, it } from 'vitest';
import type { EntretienTripartite, FicheSuiviPeriode, Livret } from '@/types';
import {
  echeanceEntretien,
  entretienTenu,
  joursRestants,
  periodeCourante,
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

// Livret minimal (casté) : seuls `entretien` et `organisationSuivi.evenements`
// sont lus par echeanceEntretien / entretienTenu.
const livret = (
  e: EntretienTripartite | null,
  evenements: Array<{ motif: string; date?: string }> = [],
): Livret =>
  ({
    entretien: e,
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

describe('echeanceEntretien', () => {
  it("retourne l'échéance avec sa date prévue quand l'entretien n'est pas tenu", () => {
    const l = livret(null, [{ motif: 'entretien-tripartite', date: '2025-10-28' }]);
    const e = echeanceEntretien(l);
    expect(e?.datePrevue).toBe('2025-10-28');
    expect(e?.initialise).toBe(false);
  });

  it("signale l'entretien initialisé mais non signé des 3 parties", () => {
    const l = livret(entretien(true, false, true));
    const e = echeanceEntretien(l);
    expect(e?.initialise).toBe(true);
    expect(e?.datePrevue).toBeUndefined();
  });

  it("retourne null quand l'entretien est signé des 3 parties", () => {
    const l = livret(entretien(true, true, true));
    expect(echeanceEntretien(l)).toBeNull();
  });
});

describe('entretienTenu', () => {
  it("est vrai seulement quand les 3 parties ont signé l'entretien", () => {
    expect(entretienTenu(livret(entretien(true, true, true)))).toBe(true);
    expect(entretienTenu(livret(entretien(true, false, true)))).toBe(false);
    expect(entretienTenu(livret(null))).toBe(false);
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
