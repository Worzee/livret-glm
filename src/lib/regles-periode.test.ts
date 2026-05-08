import { describe, expect, it } from 'vitest';
import type { FicheSuiviPeriode } from '@/types';
import { verifierCreationPeriode, verifierDatesPeriode } from './regles-periode';

const fiche = (
  num: number,
  dateDebut: string,
  dateFin: string,
  etat: FicheSuiviPeriode['etat'] = 'signee',
): FicheSuiviPeriode => ({
  id: `fp-${num}`,
  numeroPeriode: num,
  dateDebut,
  dateFin,
  suiviGretaCfa: [],
  suiviEntreprise: [],
  observations: {},
  signatures: {
    apprenti: { signe: false },
    maitre: { signe: false },
    formateur: { signe: false },
  },
  etat,
  historiqueDeverrouillages: [],
});

describe('verifierDatesPeriode (R11, R12)', () => {
  it("R11 : refuse une fin = début", () => {
    const r = verifierDatesPeriode('2026-01-15', '2026-01-15', []);
    expect(r.ok).toBe(false);
    expect(r.raisons[0]).toContain('strictement postérieure');
  });

  it("R11 : refuse une fin antérieure au début", () => {
    const r = verifierDatesPeriode('2026-02-01', '2026-01-15', []);
    expect(r.ok).toBe(false);
  });

  it("R11 : accepte une fin postérieure au début", () => {
    const r = verifierDatesPeriode('2026-01-01', '2026-01-31', []);
    expect(r.ok).toBe(true);
    expect(r.raisons).toEqual([]);
  });

  it("R12 : détecte un chevauchement intégral", () => {
    const existante = fiche(1, '2026-01-01', '2026-01-31');
    const r = verifierDatesPeriode('2026-01-15', '2026-01-25', [existante]);
    expect(r.ok).toBe(false);
    expect(r.raisons[0]).toContain('chevauchent');
  });

  it("R12 : détecte un chevauchement partiel par la gauche", () => {
    const existante = fiche(1, '2026-01-15', '2026-02-15');
    const r = verifierDatesPeriode('2026-01-01', '2026-01-20', [existante]);
    expect(r.ok).toBe(false);
  });

  it("R12 : détecte un chevauchement partiel par la droite", () => {
    const existante = fiche(1, '2026-01-15', '2026-02-15');
    const r = verifierDatesPeriode('2026-02-01', '2026-03-01', [existante]);
    expect(r.ok).toBe(false);
  });

  it("R12 : périodes adjacentes (fin = début) sont autorisées en limite ?", () => {
    // Le CDC §8.3 R13 exige "date début > date fin de N-1" → adjacence interdite.
    // Notre R12 considère le chevauchement strict : on ne refuse pas l'adjacence ici.
    // La règle R13 (vérifierCreationPeriode) capture cette contrainte.
    const existante = fiche(1, '2026-01-01', '2026-01-31');
    const r = verifierDatesPeriode('2026-01-31', '2026-02-28', [existante]);
    // Ici 2026-01-31 chevauche bien fFin = 2026-01-31 → considéré chevauchement.
    expect(r.ok).toBe(false);
  });

  it("R12 : pas de chevauchement entre périodes disjointes", () => {
    const existante = fiche(1, '2026-01-01', '2026-01-31');
    const r = verifierDatesPeriode('2026-02-01', '2026-02-28', [existante]);
    expect(r.ok).toBe(true);
  });

  it("refuse des dates invalides", () => {
    const r = verifierDatesPeriode('pas-une-date', '2026-01-01', []);
    expect(r.ok).toBe(false);
  });
});

describe('verifierCreationPeriode (R13)', () => {
  it("R13 : refuse si pas d'entretien tripartite", () => {
    const r = verifierCreationPeriode([], false);
    expect(r.ok).toBe(false);
    expect(r.raisons[0]).toContain("entretien tripartite");
  });

  it("autorise la 1ère période dès lors que l'entretien existe", () => {
    const r = verifierCreationPeriode([], true);
    expect(r.ok).toBe(true);
  });

  it("R13 : refuse si la dernière période est encore en-cours", () => {
    const f = fiche(1, '2026-01-01', '2026-01-31', 'en-cours');
    const r = verifierCreationPeriode([f], true);
    expect(r.ok).toBe(false);
    expect(r.raisons[0]).toContain('signée');
  });

  it("R13 : refuse si la dernière période est en brouillon", () => {
    const f = fiche(1, '2026-01-01', '2026-01-31', 'brouillon');
    const r = verifierCreationPeriode([f], true);
    expect(r.ok).toBe(false);
  });

  it("R13 : autorise si la dernière période est signée", () => {
    const f = fiche(1, '2026-01-01', '2026-01-31', 'signee');
    const r = verifierCreationPeriode([f], true);
    expect(r.ok).toBe(true);
  });

  it("R13 : autorise si la dernière période est verrouillée", () => {
    const f = fiche(1, '2026-01-01', '2026-01-31', 'verrouillee');
    const r = verifierCreationPeriode([f], true);
    expect(r.ok).toBe(true);
  });
});
