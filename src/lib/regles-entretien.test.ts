import { describe, expect, it } from 'vitest';
import type { Apprenti, EntretienTripartite } from '@/types';
import {
  calculerAlerteR7,
  calculerProgression,
  DELAI_ENTRETIEN_JOURS,
  peutEncoreEditer,
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
  reponsesApprenti: {},
  reponsesMaitre: { dejaFormeApprenti: null },
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

  it("la butée est exactement contratDebut + DELAI jours", () => {
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

  it("R9 : 3 signatures → tout figé pour tous", () => {
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
describe('validerSignatureEntretien', () => {
  it("apprenti·e ne peut pas signer sans aucune réponse", () => {
    const e = entretienVide();
    const r = validerSignatureEntretien(e, 'apprenti');
    expect(r.peutSigner).toBe(false);
  });

  it("apprenti·e peut signer avec au moins une réponse renseignée", () => {
    const e = entretienVide();
    e.reponsesApprenti.motivations = "Devenir cuisinier·ère.";
    expect(validerSignatureEntretien(e, 'apprenti').peutSigner).toBe(true);
  });

  it("maître ne peut pas signer sans avoir indiqué dejaFormeApprenti", () => {
    const e = entretienVide();
    e.appreciationMaitre.ponctualite = 'plus';
    const r = validerSignatureEntretien(e, 'maitre');
    expect(r.peutSigner).toBe(false);
    expect(r.raisons.some((m) => m.includes('apprenti·e'))).toBe(true);
  });

  it("maître ne peut pas signer sans aucun critère d'appréciation", () => {
    const e = entretienVide();
    e.reponsesMaitre.dejaFormeApprenti = false;
    const r = validerSignatureEntretien(e, 'maitre');
    expect(r.peutSigner).toBe(false);
    expect(r.raisons.some((m) => m.includes('appréciation'))).toBe(true);
  });

  it("maître peut signer avec dejaFormeApprenti + au moins un critère", () => {
    const e = entretienVide();
    e.reponsesMaitre.dejaFormeApprenti = true;
    e.appreciationMaitre.qualiteTravail = 'plusplus';
    expect(validerSignatureEntretien(e, 'maitre').peutSigner).toBe(true);
  });

  it("formateur ne peut pas signer sans aucune démarche administrative", () => {
    const e = entretienVide();
    expect(validerSignatureEntretien(e, 'formateur').peutSigner).toBe(false);
  });

  it("formateur peut signer avec au moins une démarche renseignée", () => {
    const e = entretienVide();
    e.demarchesAdministratives.contratSigne = true;
    expect(validerSignatureEntretien(e, 'formateur').peutSigner).toBe(true);
  });

  it("coordo et admin ne peuvent jamais signer l'entretien", () => {
    const e = entretienVide();
    expect(validerSignatureEntretien(e, 'coordo').peutSigner).toBe(false);
    expect(validerSignatureEntretien(e, 'admin').peutSigner).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('calculerProgression', () => {
  it("retourne 0% sur un entretien vierge", () => {
    const r = calculerProgression(entretienVide());
    expect(r.global).toBe(0);
    expect(r.parRole.apprenti).toBe(0);
    expect(r.parRole.maitre).toBe(0);
    expect(r.parRole.formateur).toBe(0);
  });

  it("incrémente le score apprenti·e au fur et à mesure", () => {
    const e = entretienVide();
    e.reponsesApprenti.motivations = 'X';
    e.reponsesApprenti.contactEntreprise = 'Y';
    const r = calculerProgression(e);
    // 2 / 7 ≈ 29 %
    expect(r.parRole.apprenti).toBeGreaterThan(20);
    expect(r.parRole.apprenti).toBeLessThan(40);
  });

  it("retourne 100% pour le rôle dont la section est entièrement remplie", () => {
    const e = entretienVide();
    e.demarchesAdministratives = {
      contratSigne: true,
      visiteMedicale: true,
      permisConduire: false,
      voiture: false,
    };
    e.conditionsPratiques = {
      hebergementCentre: 'X',
      hebergementEntreprise: 'X',
      transportCentre: 'X',
      transportEntreprise: 'X',
    };
    e.aidesDemandees = { logement: false, premierEquipement: false, permis: false };
    expect(calculerProgression(e).parRole.formateur).toBe(100);
  });
});
