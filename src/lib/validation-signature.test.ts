import { describe, expect, it } from 'vitest';
import type { FicheSuiviPeriode } from '@/types';
import { validerSignature } from './validation-signature';

const ficheBase = (): FicheSuiviPeriode => ({
  id: 'f',
  numeroPeriode: 1,
  dateDebut: '2026-01-01',
  dateFin: '2026-01-31',
  suiviGretaCfa: [],
  suiviEntreprise: [],
  observations: {},
  signatures: {
    apprenti: { signe: false },
    maitre: { signe: false },
    formateur: { signe: false },
  },
  etat: 'brouillon',
  historiqueDeverrouillages: [],
});

describe('validerSignature — R20 (champs requis par rôle)', () => {
  describe('Apprenti·e', () => {
    it("interdit la signature si aucun retour apprenti et observation vide", () => {
      const f = ficheBase();
      const r = validerSignature(f, 'apprenti');
      expect(r.peutSigner).toBe(false);
      expect(r.raisons).toHaveLength(2);
    });

    it("autorise la signature avec ≥ 1 retour ET observation non vide", () => {
      const f = ficheBase();
      f.suiviEntreprise = [
        {
          id: 'l1',
          competenceId: 'c1',
          evaluationGreta: null,
          evaluationEntreprise: null,
          retourApprenti: 'Acquis sur la mise en place.',
        },
      ];
      f.observations.apprenti = 'Période formatrice.';
      expect(validerSignature(f, 'apprenti')).toEqual({ peutSigner: true, raisons: [] });
    });

    it("rejette une observation composée uniquement d'espaces", () => {
      const f = ficheBase();
      f.suiviEntreprise = [
        {
          id: 'l1',
          competenceId: 'c1',
          evaluationGreta: null,
          evaluationEntreprise: null,
          retourApprenti: 'OK',
        },
      ];
      f.observations.apprenti = '   \n  ';
      const r = validerSignature(f, 'apprenti');
      expect(r.peutSigner).toBe(false);
      expect(r.raisons.some((m) => m.includes('observation apprenti'))).toBe(true);
    });
  });

  describe("Maître d'apprentissage", () => {
    it("interdit la signature sans évaluation entreprise", () => {
      const f = ficheBase();
      f.observations.maitre = 'Bon travail.';
      const r = validerSignature(f, 'maitre');
      expect(r.peutSigner).toBe(false);
      expect(r.raisons.some((m) => m.includes('Évaluation entreprise'))).toBe(true);
    });

    it("interdit la signature sans observation maître", () => {
      const f = ficheBase();
      f.suiviEntreprise = [
        {
          id: 'l1',
          competenceId: 'c1',
          evaluationGreta: null,
          evaluationEntreprise: 'maitrise',
          retourApprenti: '',
        },
      ];
      const r = validerSignature(f, 'maitre');
      expect(r.peutSigner).toBe(false);
    });

    it("autorise la signature avec ≥ 1 évaluation entreprise + observation", () => {
      const f = ficheBase();
      f.suiviEntreprise = [
        {
          id: 'l1',
          competenceId: 'c1',
          evaluationGreta: null,
          evaluationEntreprise: 'partiel',
          retourApprenti: '',
        },
      ];
      f.observations.maitre = 'Progrès constants.';
      expect(validerSignature(f, 'maitre').peutSigner).toBe(true);
    });
  });

  describe('Formateur référent', () => {
    it("interdit la signature sans suivi GRETA CFA", () => {
      const f = ficheBase();
      f.suiviEntreprise = [
        {
          id: 'l1',
          competenceId: 'c1',
          evaluationGreta: 'maitrise',
          evaluationEntreprise: null,
          retourApprenti: '',
        },
      ];
      f.observations.formateur = 'OK';
      const r = validerSignature(f, 'formateur');
      expect(r.peutSigner).toBe(false);
      expect(r.raisons.some((m) => m.includes('GRETA'))).toBe(true);
    });

    it("interdit la signature sans évaluation GRETA d'au moins une compétence", () => {
      const f = ficheBase();
      f.suiviGretaCfa = [
        { id: 'sg', nomCours: 'Tech', nomFormateur: 'X', contenu: '...' },
      ];
      f.observations.formateur = 'OK';
      const r = validerSignature(f, 'formateur');
      expect(r.peutSigner).toBe(false);
      expect(r.raisons.some((m) => m.includes('GRETA CFA'))).toBe(true);
    });

    it("autorise la signature avec les 3 prérequis remplis", () => {
      const f = ficheBase();
      f.suiviGretaCfa = [
        { id: 'sg', nomCours: 'Tech', nomFormateur: 'X', contenu: '...' },
      ];
      f.suiviEntreprise = [
        {
          id: 'l1',
          competenceId: 'c1',
          evaluationGreta: 'maitrise',
          evaluationEntreprise: null,
          retourApprenti: '',
        },
      ];
      f.observations.formateur = 'Bilan positif.';
      expect(validerSignature(f, 'formateur').peutSigner).toBe(true);
    });
  });

  describe('Coordo', () => {
    it("ne peut jamais signer une fiche de période", () => {
      const f = ficheBase();
      // Même avec tout rempli :
      f.suiviGretaCfa = [{ id: 'sg', nomCours: 'X', nomFormateur: 'Y', contenu: 'Z' }];
      f.suiviEntreprise = [
        {
          id: 'l1',
          competenceId: 'c1',
          evaluationGreta: 'maitrise',
          evaluationEntreprise: 'maitrise',
          retourApprenti: 'OK',
        },
      ];
      f.observations.apprenti = 'X';
      f.observations.maitre = 'X';
      f.observations.formateur = 'X';
      expect(validerSignature(f, 'coordo').peutSigner).toBe(false);
    });
  });

  describe('Admin', () => {
    it("ne signe pas en son nom propre — appelez avec le rôle métier ciblé", () => {
      const f = ficheBase();
      const r = validerSignature(f, 'admin');
      expect(r.peutSigner).toBe(false);
      expect(r.raisons[0]).toContain('rôle métier');
    });
  });
});
