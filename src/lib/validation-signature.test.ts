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
  describe('Apprenti·e — entreprise', () => {
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

  describe('Apprenti·e — centre (fiches simplifiées, juillet 2026)', () => {
    it("au centre, seule l'observation est exigée (plus de retour par compétence)", () => {
      // La fiche centre n'a plus de tableau de compétences : l'exigence
      // « ≥ 1 retour apprenti·e » ne s'applique qu'en entreprise.
      const f = ficheBase();
      f.observations.apprenti = 'Regroupement dense mais utile.';
      expect(validerSignature(f, 'apprenti', 'centre')).toEqual({
        peutSigner: true,
        raisons: [],
      });
    });

    it("au centre, l'observation vide bloque la signature de l'apprenti·e", () => {
      const f = ficheBase();
      const r = validerSignature(f, 'apprenti', 'centre');
      expect(r.peutSigner).toBe(false);
      expect(r.raisons).toHaveLength(1);
      expect(r.raisons[0]).toContain('observation apprenti');
    });

    it("au centre, une observation d'espaces seulement reste bloquante", () => {
      const f = ficheBase();
      f.observations.apprenti = '  \n ';
      expect(validerSignature(f, 'apprenti', 'centre').peutSigner).toBe(false);
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
          evaluationEntreprise: 'non-fait',
          retourApprenti: '',
        },
        {
          id: 'l2',
          competenceId: 'c2',
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
          evaluationEntreprise: 'non-fait',
          retourApprenti: '',
        },
        {
          id: 'l2',
          competenceId: 'c2',
          evaluationEntreprise: 'maitrise',
          retourApprenti: '',
        },
      ];
      f.observations.maitre = 'Une compétence maîtrisée, le reste à voir.';
      expect(validerSignature(f, 'maitre').peutSigner).toBe(true);
    });
  });

  describe("Maître d'apprentissage — attitudes professionnelles (juillet 2026)", () => {
    /** Fiche entreprise minimale déjà valide hors attitudes. */
    const ficheValide = (): FicheSuiviPeriode => {
      const f = ficheBase();
      f.suiviEntreprise = [
        {
          id: 'l1',
          competenceId: 'c1',
          evaluationEntreprise: 'maitrise',
          retourApprenti: '',
        },
      ];
      f.observations.maitre = 'Bon travail.';
      return f;
    };

    it('bloque la signature tant que TOUTES les attitudes retenues ne sont pas évaluées', () => {
      const f = ficheValide();
      f.evaluationsAttitudes = { a5: 'plus' };
      const r = validerSignature(f, 'maitre', 'entreprise', ['a5', 'a6', 'a7']);
      expect(r.peutSigner).toBe(false);
      expect(r.raisons.some((m) => /attitudes professionnelles/.test(m))).toBe(true);
      expect(r.raisons.some((m) => m.includes('2 restantes'))).toBe(true);
    });

    it('bloque la signature quand aucune attitude retenue n’est évaluée', () => {
      const f = ficheValide();
      const r = validerSignature(f, 'maitre', 'entreprise', ['a5']);
      expect(r.peutSigner).toBe(false);
      expect(r.raisons.some((m) => m.includes('1 restante'))).toBe(true);
    });

    it('une évaluation à null ne compte pas comme évaluée', () => {
      const f = ficheValide();
      f.evaluationsAttitudes = { a5: null };
      expect(validerSignature(f, 'maitre', 'entreprise', ['a5']).peutSigner).toBe(false);
    });

    it('autorise la signature quand toutes les attitudes retenues sont évaluées', () => {
      const f = ficheValide();
      f.evaluationsAttitudes = { a5: 'plusplus', a6: 'moins' };
      expect(validerSignature(f, 'maitre', 'entreprise', ['a5', 'a6'])).toEqual({
        peutSigner: true,
        raisons: [],
      });
    });

    it("sans attitude retenue (sélection vide ou absente), pas d'exigence supplémentaire", () => {
      // Tant que le choix des attitudes n'a pas été fait à l'entretien,
      // la fiche reste signable selon les règles historiques.
      const f = ficheValide();
      expect(validerSignature(f, 'maitre', 'entreprise', []).peutSigner).toBe(true);
      expect(validerSignature(f, 'maitre').peutSigner).toBe(true);
    });
  });

  describe('Formateur référent', () => {
    it('au centre, signe sans aucune exigence de saisie (fiches simplifiées, juillet 2026)', () => {
      // La fiche centre n'a plus de tableau de compétences ; l'observation du
      // formateur est souhaitée mais NON bloquante (décision pilote).
      const f = ficheBase();
      expect(validerSignature(f, 'formateur', 'centre')).toEqual({
        peutSigner: true,
        raisons: [],
      });
    });

    it('au centre, signe aussi bien avec son observation renseignée', () => {
      const f = ficheBase();
      f.observations.formateur = 'Regroupement productif.';
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
