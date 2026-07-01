import { describe, expect, it } from 'vitest';
import type { FicheSuiviPeriode } from '@/types';
import { validerSignature } from './validation-signature';

const ficheBase = (): FicheSuiviPeriode => ({
  id: 'f',
  numeroPeriode: 1,
  dateDebut: '2026-01-01',
  dateFin: '2026-01-31',
  suiviGretaCfa: {},
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
    it('interdit la signature si aucun retour apprenti et observation vide', () => {
      const f = ficheBase();
      const r = validerSignature(f, 'apprenti');
      expect(r.peutSigner).toBe(false);
      expect(r.raisons).toHaveLength(2);
    });

    it('autorise la signature avec ≥ 1 retour ET observation non vide', () => {
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

    it('autorise la signature même si la zone « Suivi GRETA CFA — apprenti » est vide', () => {
      // Refonte mai 2026 : le champ apprenti GRETA reste optionnel pour la
      // signature, contrairement au champ formateur. Pas de fardeau ajouté
      // côté apprenti·e.
      const f = ficheBase();
      f.suiviGretaCfa = {};
      f.suiviEntreprise = [
        {
          id: 'l1',
          competenceId: 'c1',
          evaluationGreta: null,
          evaluationEntreprise: null,
          retourApprenti: 'OK',
        },
      ];
      f.observations.apprenti = 'Période formatrice.';
      expect(validerSignature(f, 'apprenti').peutSigner).toBe(true);
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
    it('interdit la signature sans évaluation entreprise', () => {
      const f = ficheBase();
      f.observations.maitre = 'Bon travail.';
      const r = validerSignature(f, 'maitre');
      expect(r.peutSigner).toBe(false);
      expect(r.raisons.some((m) => m.includes('Évaluation entreprise'))).toBe(true);
    });

    it('interdit la signature sans observation maître', () => {
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

    it('autorise la signature avec ≥ 1 évaluation entreprise + observation', () => {
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

    it('rejette la signature si la seule éval entreprise est « Non fait »', () => {
      // « Non fait » signale une compétence non abordée durant la période —
      // ce n'est pas une évaluation utilisable. Il faut au moins une
      // compétence réellement abordée pour pouvoir signer.
      const f = ficheBase();
      f.suiviEntreprise = [
        {
          id: 'l1',
          competenceId: 'c1',
          evaluationGreta: null,
          evaluationEntreprise: 'non-fait',
          retourApprenti: '',
        },
        {
          id: 'l2',
          competenceId: 'c2',
          evaluationGreta: null,
          evaluationEntreprise: 'non-fait',
          retourApprenti: '',
        },
      ];
      f.observations.maitre = 'Période courte.';
      const r = validerSignature(f, 'maitre');
      expect(r.peutSigner).toBe(false);
      expect(r.raisons.some((m) => /abord[ée]e/i.test(m))).toBe(true);
    });

    it("autorise la signature dès qu'une éval entreprise est autre que « Non fait »", () => {
      // Mix « Non fait » + une vraie éval → signature autorisée.
      const f = ficheBase();
      f.suiviEntreprise = [
        {
          id: 'l1',
          competenceId: 'c1',
          evaluationGreta: null,
          evaluationEntreprise: 'non-fait',
          retourApprenti: '',
        },
        {
          id: 'l2',
          competenceId: 'c2',
          evaluationGreta: null,
          evaluationEntreprise: 'maitrise',
          retourApprenti: '',
        },
      ];
      f.observations.maitre = 'Une compétence maîtrisée, le reste à voir.';
      expect(validerSignature(f, 'maitre').peutSigner).toBe(true);
    });
  });

  describe('Formateur référent', () => {
    it("au centre, la zone « Suivi GRETA CFA » n'est plus exigée (1ᵉʳ juillet 2026)", () => {
      // La zone a été retirée partout : tout se rédige dans les observations.
      // Éval + observation suffisent pour signer, sans aucun suiviGretaCfa.
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
      f.observations.formateur = 'Bilan positif.';
      expect(validerSignature(f, 'formateur', 'centre').peutSigner).toBe(true);
    });

    it("au centre, interdit la signature sans évaluation d'au moins une compétence", () => {
      const f = ficheBase();
      f.suiviGretaCfa = { formateur: 'Contenus abordés.' };
      f.observations.formateur = 'OK';
      const r = validerSignature(f, 'formateur', 'centre');
      expect(r.peutSigner).toBe(false);
      expect(r.raisons.some((m) => m.includes('Évaluation centre'))).toBe(true);
    });

    it("au centre, l'observation est requise en plus de l'évaluation", () => {
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
      const r = validerSignature(f, 'formateur', 'centre');
      expect(r.peutSigner).toBe(false);
      expect(r.raisons.some((m) => m.includes('observation'))).toBe(true);
    });

    it('rejette la signature si la seule éval centre est « Non fait »', () => {
      // Par symétrie avec la règle maître : « Non fait » ne compte pas comme
      // une éval utilisable, il faut au moins une vraie évaluation.
      const f = ficheBase();
      f.suiviGretaCfa = { formateur: 'Contenus abordés.' };
      f.suiviEntreprise = [
        {
          id: 'l1',
          competenceId: 'c1',
          evaluationGreta: 'non-fait',
          evaluationEntreprise: null,
          retourApprenti: '',
        },
      ];
      f.observations.formateur = 'OK';
      const r = validerSignature(f, 'formateur', 'centre');
      expect(r.peutSigner).toBe(false);
      expect(r.raisons.some((m) => /abord[ée]e/i.test(m))).toBe(true);
    });

    it("autorise la signature dès qu'une éval centre est autre que « Non fait »", () => {
      const f = ficheBase();
      f.suiviGretaCfa = { formateur: 'Contenus abordés.' };
      f.suiviEntreprise = [
        {
          id: 'l1',
          competenceId: 'c1',
          evaluationGreta: 'non-fait',
          evaluationEntreprise: null,
          retourApprenti: '',
        },
        {
          id: 'l2',
          competenceId: 'c2',
          evaluationGreta: 'maitrise',
          evaluationEntreprise: null,
          retourApprenti: '',
        },
      ];
      f.observations.formateur = 'Une compétence acquise, une non abordée.';
      expect(validerSignature(f, 'formateur', 'centre').peutSigner).toBe(true);
    });

    it('en entreprise, le formateur ne signe plus (1ᵉʳ juillet 2026)', () => {
      // 2 signataires : apprenti·e + maître / tuteur. Le formateur appose un
      // commentaire global optionnel puis verrouille — la garde défensive
      // refuse sa « signature » même avec tout rempli.
      const f = ficheBase();
      f.observations.formateur = 'Bilan positif.';
      const r = validerSignature(f, 'formateur', 'entreprise');
      expect(r.peutSigner).toBe(false);
      expect(r.raisons.some((m) => /ne signe pas les périodes en entreprise/i.test(m))).toBe(true);
      expect(validerSignature(f, 'formateur').peutSigner).toBe(false); // défaut = entreprise
    });
  });

  describe('Coordo', () => {
    it('ne peut jamais signer une fiche de période', () => {
      const f = ficheBase();
      // Même avec tout rempli :
      f.suiviGretaCfa = { formateur: 'Contenus abordés.', apprenti: 'OK' };
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
    it('ne signe pas en son nom propre — appelez avec le rôle métier ciblé', () => {
      const f = ficheBase();
      const r = validerSignature(f, 'admin');
      expect(r.peutSigner).toBe(false);
      expect(r.raisons[0]).toContain('rôle métier');
    });
  });
});
