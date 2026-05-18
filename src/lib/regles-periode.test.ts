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

describe('verifierCreationPeriode (R13 bloquant + R14 avertissement)', () => {
  it("R13 : refuse si pas d'entretien tripartite", () => {
    const r = verifierCreationPeriode([], false);
    expect(r.ok).toBe(false);
    expect(r.raisons[0]).toContain("entretien tripartite");
    expect(r.avertissements).toEqual([]);
  });

  it("autorise la 1ère période dès lors que l'entretien existe, sans avertissement", () => {
    const r = verifierCreationPeriode([], true);
    expect(r.ok).toBe(true);
    expect(r.avertissements).toEqual([]);
  });

  it("R14 : autorise la création si la N-1 est en-cours, mais émet un avertissement", () => {
    const f = fiche(1, '2026-01-01', '2026-01-31', 'en-cours');
    const r = verifierCreationPeriode([f], true);
    expect(r.ok).toBe(true);
    expect(r.raisons).toEqual([]);
    expect(r.avertissements.length).toBe(1);
    expect(r.avertissements[0]).toContain('La période 1');
    expect(r.avertissements[0]).toContain("pas encore été signée");
  });

  it("R14 : autorise la création si la N-1 est en brouillon (jamais ouverte)", () => {
    const f = fiche(1, '2026-01-01', '2026-01-31', 'brouillon');
    const r = verifierCreationPeriode([f], true);
    expect(r.ok).toBe(true);
    expect(r.avertissements.length).toBe(1);
  });

  it("R14 : l'avertissement liste les trois parties quand aucune n'a signé", () => {
    const f = fiche(1, '2026-01-01', '2026-01-31', 'en-cours');
    const r = verifierCreationPeriode([f], true);
    expect(r.avertissements[0]).toContain('apprenti·e');
    expect(r.avertissements[0]).toMatch(/maître d'apprentissage/);
    expect(r.avertissements[0]).toContain('formateur·rice référent·e');
  });

  it("R14 : l'avertissement ne mentionne que les parties manquantes", () => {
    const f: FicheSuiviPeriode = {
      ...fiche(1, '2026-01-01', '2026-01-31', 'en-cours'),
      signatures: {
        apprenti: { signe: true, dateSignature: '2026-02-01' },
        maitre: { signe: false },
        formateur: { signe: false },
      },
    };
    const r = verifierCreationPeriode([f], true);
    expect(r.avertissements[0]).not.toContain('apprenti·e');
    expect(r.avertissements[0]).toMatch(/maître d'apprentissage/);
    expect(r.avertissements[0]).toContain('formateur·rice référent·e');
  });

  it("R13 : autorise sans avertissement si la dernière période est signée", () => {
    const f = fiche(1, '2026-01-01', '2026-01-31', 'signee');
    const r = verifierCreationPeriode([f], true);
    expect(r.ok).toBe(true);
    expect(r.avertissements).toEqual([]);
  });

  it("R13 : autorise sans avertissement si la dernière période est verrouillée", () => {
    const f = fiche(1, '2026-01-01', '2026-01-31', 'verrouillee');
    const r = verifierCreationPeriode([f], true);
    expect(r.ok).toBe(true);
    expect(r.avertissements).toEqual([]);
  });

  it("R13 : si l'entretien manque, on bloque sans peupler les avertissements R14", () => {
    // L'absence d'entretien est plus prioritaire : pas la peine d'ajouter du
    // bruit en signalant la N-1 non signée, l'utilisateur règle d'abord
    // l'entretien.
    const f = fiche(1, '2026-01-01', '2026-01-31', 'en-cours');
    const r = verifierCreationPeriode([f], false);
    expect(r.ok).toBe(false);
    expect(r.raisons[0]).toContain("entretien tripartite");
    expect(r.avertissements).toEqual([]);
  });
});
