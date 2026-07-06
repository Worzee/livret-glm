import { describe, expect, it } from 'vitest';
import type { Apprenti, EntretienTripartite } from '@/types';
import {
  calculerAlerteR7,
  DELAI_ENTRETIEN_JOURS,
  entretienSigneParTous,
  peutEncoreEditer,
  peutInitialiserEntretien,
  validerSignatureEntretien,
} from './regles-entretien';

const apprenti = (contratDebut: string): Apprenti => ({
  id: 'a',
  role: 'apprenti',
  nom: 'TEST',
  prenom: 'A',
  email: 'a@demo.fr',
  dateNaissance: '2000-01-01',
  formationId: 'f',
  entrepriseId: 'e',
  maitreApprentissageId: 'm',
  formateurReferentId: 'f',
  contratDebut,
  contratFin: '2027-01-01',
});

const entretienVide = (): EntretienTripartite => ({
  reponsesTrame: {},
  appreciationMaitre: {},
  commentaires: {},
  signatures: {
    apprenti: { signe: false },
    maitre: { signe: false },
    formateur: { signe: false },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
describe('R7 — alerte délai entretien tripartite', () => {
  it("ne déclenche pas l'alerte si on est dans les 60 jours", () => {
    const a = apprenti('2026-04-01');
    const r = calculerAlerteR7(a, null, new Date('2026-05-01'));
    expect(r.declenchee).toBe(false);
    expect(r.joursDepasses).toBeLessThan(0);
  });

  it("déclenche l'alerte au-delà de 60 jours sans entretien", () => {
    const a = apprenti('2026-01-01');
    const r = calculerAlerteR7(a, null, new Date('2026-04-01')); // ~90 jours
    expect(r.declenchee).toBe(true);
    expect(r.joursDepasses).toBeGreaterThan(0);
  });

  it("ne déclenche pas l'alerte si l'entretien existe et est entièrement signé", () => {
    const a = apprenti('2026-01-01');
    const e = entretienVide();
    e.signatures = {
      apprenti: { signe: true, dateSignature: '2026-02-01T10:00:00Z' },
      maitre: { signe: true, dateSignature: '2026-02-01T10:00:00Z' },
      formateur: { signe: true, dateSignature: '2026-02-01T10:00:00Z' },
    };
    const r = calculerAlerteR7(a, e, new Date('2026-04-01'));
    expect(r.declenchee).toBe(false);
  });

  it("déclenche l'alerte si l'entretien est partiellement signé seulement", () => {
    const a = apprenti('2026-01-01');
    const e = entretienVide();
    e.signatures.apprenti = { signe: true, dateSignature: '2026-04-01T10:00:00Z' };
    const r = calculerAlerteR7(a, e, new Date('2026-04-15')); // > 60 j
    expect(r.declenchee).toBe(true);
  });

  it('la butée est exactement contratDebut + DELAI jours', () => {
    const a = apprenti('2026-01-01');
    const r = calculerAlerteR7(a, null, new Date('2026-01-02'));
    const debut = new Date('2026-01-01').getTime();
    const butoir = new Date(r.dateButoir).getTime();
    const jours = Math.round((butoir - debut) / (24 * 60 * 60 * 1000));
    expect(jours).toBe(DELAI_ENTRETIEN_JOURS);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('R8 / R9 — verrouillage progressif des sections', () => {
  it("R8 : un rôle qui n'a pas signé peut encore éditer", () => {
    const e = entretienVide();
    expect(peutEncoreEditer('apprenti', e)).toBe(true);
    expect(peutEncoreEditer('maitre', e)).toBe(true);
    expect(peutEncoreEditer('formateur', e)).toBe(true);
  });

  it("R8 : dès qu'un rôle a signé, il ne peut plus éditer sa section", () => {
    const e = entretienVide();
    e.signatures.apprenti = { signe: true, dateSignature: '2026-04-01T10:00:00Z' };
    expect(peutEncoreEditer('apprenti', e)).toBe(false);
    // Les autres peuvent encore
    expect(peutEncoreEditer('maitre', e)).toBe(true);
    expect(peutEncoreEditer('formateur', e)).toBe(true);
  });

  it('R9 : 3 signatures → tout figé pour tous', () => {
    const e = entretienVide();
    e.signatures = {
      apprenti: { signe: true, dateSignature: '2026-04-01T10:00:00Z' },
      maitre: { signe: true, dateSignature: '2026-04-01T10:00:00Z' },
      formateur: { signe: true, dateSignature: '2026-04-01T10:00:00Z' },
    };
    expect(peutEncoreEditer('apprenti', e)).toBe(false);
    expect(peutEncoreEditer('maitre', e)).toBe(false);
    expect(peutEncoreEditer('formateur', e)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('peutInitialiserEntretien — R6 (entretien unique, juillet 2026)', () => {
  it("l'entretien est initialisable tant qu'il n'existe pas", () => {
    expect(peutInitialiserEntretien(null).ok).toBe(true);
  });

  it("un entretien déjà initialisé ne l'est pas une seconde fois (R6)", () => {
    const r = peutInitialiserEntretien(entretienVide());
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(/déjà initialisé/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('entretienSigneParTous', () => {
  it('est vrai seulement quand les 3 parties obligatoires ont signé', () => {
    const e = entretienVide();
    expect(entretienSigneParTous(null)).toBe(false);
    expect(entretienSigneParTous(e)).toBe(false);
    e.signatures = {
      apprenti: { signe: true },
      maitre: { signe: true },
      formateur: { signe: true },
    };
    expect(entretienSigneParTous(e)).toBe(true);
  });

  it('la signature du représentant légal ne compte pas dans le décompte', () => {
    const e = entretienVide();
    e.signatures = {
      apprenti: { signe: true },
      maitre: { signe: true },
      formateur: { signe: false },
      representantLegal: { signe: true },
    };
    expect(entretienSigneParTous(e)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('validerSignatureEntretien', () => {
  it('apprenti·e peut signer sans exigence de saisie (trame co-saisie par le formateur et le maître)', () => {
    const e = entretienVide();
    expect(validerSignatureEntretien(e, 'apprenti').peutSigner).toBe(true);
  });

  it('formateur peut signer sans exigence de saisie (trame « première visite »)', () => {
    const e = entretienVide();
    expect(validerSignatureEntretien(e, 'formateur').peutSigner).toBe(true);
  });

  // Refonte mai 2026 : la signature maître exige uniquement au moins un
  // critère d'appréciation. Juillet 2026 : l'ÉVALUATION des attitudes a
  // quitté l'entretien (elle se fait sur les fiches de période entreprise) —
  // l'entretien conserve le CHOIX des attitudes, toujours exigé.
  it("maître ne peut pas signer sans aucun critère d'appréciation", () => {
    const e = entretienVide();
    const r = validerSignatureEntretien(e, 'maitre');
    expect(r.peutSigner).toBe(false);
    expect(r.raisons.some((m) => m.includes('appréciation'))).toBe(true);
  });

  it("maître peut signer avec un critère d'appréciation, sans évaluation d'attitude (juillet 2026)", () => {
    const e = entretienVide();
    e.appreciationMaitre.qualiteTravail = 'plusplus';
    expect(validerSignatureEntretien(e, 'maitre').peutSigner).toBe(true);
  });

  it('maître orienté vers le CHOIX des attitudes tant que la sélection du livret est vide (13 juin 2026)', () => {
    const e = entretienVide();
    e.appreciationMaitre.qualiteTravail = 'plus';
    const r = validerSignatureEntretien(e, 'maitre', []);
    expect(r.peutSigner).toBe(false);
    expect(r.raisons.some((m) => m.includes('Choisissez les attitudes'))).toBe(true);
  });

  it('maître signe quand la sélection des attitudes est faite (l’évaluation se fera par période)', () => {
    const e = entretienVide();
    e.appreciationMaitre.qualiteTravail = 'plus';
    expect(validerSignatureEntretien(e, 'maitre', ['a5']).peutSigner).toBe(true);
  });

  it("coordo et admin ne peuvent jamais signer l'entretien", () => {
    const e = entretienVide();
    expect(validerSignatureEntretien(e, 'coordo').peutSigner).toBe(false);
    expect(validerSignatureEntretien(e, 'admin').peutSigner).toBe(false);
  });
});
