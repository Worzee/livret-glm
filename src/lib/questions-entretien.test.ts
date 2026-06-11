import { describe, expect, it } from 'vitest';
import type { EntretienTripartite, QuestionBanque } from '@/types';
import {
  QUESTIONS_BANQUE_INITIALE,
  idsQuestionsAffectees,
  idsQuestionsObligatoiresAffectees,
  indexerBanque,
  nettoyerReponses,
  peutRetirerQuestion,
  questionEstUtilisee,
  questionsObligatoiresSansReponse,
  reponseEstRenseignee,
} from './questions-entretien';

describe('QUESTIONS_BANQUE_INITIALE', () => {
  it('contient les 11 questions historiques (7 apprenti + 4 maître)', () => {
    expect(QUESTIONS_BANQUE_INITIALE).toHaveLength(11);
    const apprenti = QUESTIONS_BANQUE_INITIALE.filter((q) => q.cible === 'apprenti');
    const maitre = QUESTIONS_BANQUE_INITIALE.filter((q) => q.cible === 'maitre');
    expect(apprenti).toHaveLength(7);
    expect(maitre).toHaveLength(4);
  });

  it('chaque question porte un id stable, un libellé non vide et un type valide', () => {
    const ids = new Set<string>();
    const typesAutorises = new Set(['texte-court', 'texte-long', 'oui-non']);
    for (const q of QUESTIONS_BANQUE_INITIALE) {
      expect(q.id).toMatch(/^q-(app|mai)-/);
      expect(ids.has(q.id)).toBe(false);
      ids.add(q.id);
      expect(q.libelle.length).toBeGreaterThan(5);
      expect(typesAutorises.has(q.type)).toBe(true);
    }
  });

  it('les libellés sont neutres : pas de référence à un domaine particulier', () => {
    // Reformulation neutre demandée par le pilote (mai 2026) : on ne doit
    // plus voir « brigade », « cuisine », « CFA » ou autres marqueurs de
    // domaine.
    const motsInterdits = ['brigade', 'cuisine', 'cfa'];
    for (const q of QUESTIONS_BANQUE_INITIALE) {
      const libelle = q.libelle.toLowerCase();
      for (const mot of motsInterdits) {
        expect(libelle.includes(mot)).toBe(false);
      }
    }
  });

  it('toutes les questions sont affectées à E1 par défaut (comportement historique)', () => {
    for (const q of QUESTIONS_BANQUE_INITIALE) {
      expect(q.pourEntretien1).toBe(true);
    }
  });

  it('exactement 2 questions obligatoires par défaut (1 apprenti + 1 maître), toutes affectées', () => {
    const obligatoires = QUESTIONS_BANQUE_INITIALE.filter((q) => q.obligatoire);
    expect(obligatoires.map((q) => q.id).sort()).toEqual([
      'q-app-motivations',
      'q-mai-deja-forme',
    ]);
    // Cohérence : une question obligatoire doit être affectée à au moins un entretien.
    for (const q of obligatoires) {
      expect(q.pourEntretien1 || q.pourEntretien2).toBe(true);
    }
  });
});

describe('idsQuestionsAffectees', () => {
  it('E1 apprenti : les 7 questions (toutes affectées à E1), motivations en tête', () => {
    const ids = idsQuestionsAffectees(QUESTIONS_BANQUE_INITIALE, 1, 'apprenti');
    expect(ids).toHaveLength(7);
    expect(ids[0]).toBe('q-app-motivations');
  });

  it('E1 maître : les 4 questions', () => {
    const ids = idsQuestionsAffectees(QUESTIONS_BANQUE_INITIALE, 1, 'maitre');
    expect(ids).toHaveLength(4);
    expect(ids).toContain('q-mai-deja-forme');
  });

  it('E2 : seulement les questions de suivi/bilan (4 apprenti + 2 maître)', () => {
    const apprenti = idsQuestionsAffectees(QUESTIONS_BANQUE_INITIALE, 2, 'apprenti');
    const maitre = idsQuestionsAffectees(QUESTIONS_BANQUE_INITIALE, 2, 'maitre');
    expect(apprenti).toHaveLength(4);
    expect(apprenti).not.toContain('q-app-motivations');
    expect(maitre).toEqual(['q-mai-objectifs-embauche', 'q-mai-organisation-tutorat']);
  });

  it("respecte l'ordre du catalogue", () => {
    const ids = idsQuestionsAffectees(QUESTIONS_BANQUE_INITIALE, 2, 'apprenti');
    expect(ids).toEqual([
      'q-app-metier-representation',
      'q-app-difficultes-formation',
      'q-app-difficultes-autres',
      'q-app-ressenti-equipe',
    ]);
  });
});

describe('idsQuestionsObligatoiresAffectees', () => {
  it('E1 : les 2 obligatoires par défaut (toutes cibles confondues)', () => {
    expect(idsQuestionsObligatoiresAffectees(QUESTIONS_BANQUE_INITIALE, 1).sort()).toEqual([
      'q-app-motivations',
      'q-mai-deja-forme',
    ]);
  });

  it("E2 : aucune (les 2 obligatoires par défaut ne sont affectées qu'à E1)", () => {
    expect(idsQuestionsObligatoiresAffectees(QUESTIONS_BANQUE_INITIALE, 2)).toEqual([]);
  });

  it("une question obligatoire non affectée à l'entretien n'est pas retenue", () => {
    const banque: QuestionBanque[] = [
      {
        id: 'q-x',
        cible: 'apprenti',
        type: 'texte-court',
        libelle: 'Question test ?',
        pourEntretien1: false,
        pourEntretien2: true,
        obligatoire: true,
      },
    ];
    expect(idsQuestionsObligatoiresAffectees(banque, 1)).toEqual([]);
    expect(idsQuestionsObligatoiresAffectees(banque, 2)).toEqual(['q-x']);
  });
});

// Helper local — entretien minimal pour les tests.
function entretien(overrides: Partial<EntretienTripartite> = {}): EntretienTripartite {
  return {
    questionsApprentiSelectionnees: [],
    questionsMaitreSelectionnees: [],
    questionsImposees: [],
    questionsObligatoires: [],
    reponsesApprenti: {},
    reponsesMaitre: {},
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
    ...overrides,
  };
}

describe('peutRetirerQuestion', () => {
  it('une question imposée par le coordo (snapshot) ne peut pas être retirée', () => {
    const e = entretien({ questionsImposees: ['q-app-motivations'] });
    expect(peutRetirerQuestion(e, 'q-app-motivations')).toBe(false);
  });

  it('une question obligatoire (snapshot) ne peut pas être retirée', () => {
    const e = entretien({ questionsObligatoires: ['q-mai-deja-forme'] });
    expect(peutRetirerQuestion(e, 'q-mai-deja-forme')).toBe(false);
  });

  it('une question ajoutée par le formateur (hors snapshots) peut être retirée', () => {
    const e = entretien({
      questionsImposees: ['q-app-motivations'],
      questionsObligatoires: ['q-app-motivations'],
    });
    expect(peutRetirerQuestion(e, 'q-app-ressenti-equipe')).toBe(true);
  });
});

describe('questionsObligatoiresSansReponse', () => {
  const banque = indexerBanque(QUESTIONS_BANQUE_INITIALE);

  it('liste la question obligatoire de la cible sans réponse', () => {
    const e = entretien({
      questionsObligatoires: ['q-app-motivations', 'q-mai-deja-forme'],
    });
    const apprenti = questionsObligatoiresSansReponse(e, 'apprenti', banque);
    expect(apprenti.map((q) => q.id)).toEqual(['q-app-motivations']);
    const maitre = questionsObligatoiresSansReponse(e, 'maitre', banque);
    expect(maitre.map((q) => q.id)).toEqual(['q-mai-deja-forme']);
  });

  it('une réponse renseignée (texte non vide) lève le blocage', () => {
    const e = entretien({
      questionsObligatoires: ['q-app-motivations'],
      reponsesApprenti: { 'q-app-motivations': 'Devenir cheffe de partie.' },
    });
    expect(questionsObligatoiresSansReponse(e, 'apprenti', banque)).toEqual([]);
  });

  it('une réponse vide ou blanche ne compte pas', () => {
    const e = entretien({
      questionsObligatoires: ['q-app-motivations'],
      reponsesApprenti: { 'q-app-motivations': '   ' },
    });
    expect(
      questionsObligatoiresSansReponse(e, 'apprenti', banque).map((q) => q.id),
    ).toEqual(['q-app-motivations']);
  });

  it('oui-non : false est une réponse valable', () => {
    const e = entretien({
      questionsObligatoires: ['q-mai-deja-forme'],
      reponsesMaitre: { 'q-mai-deja-forme': false },
    });
    expect(questionsObligatoiresSansReponse(e, 'maitre', banque)).toEqual([]);
  });

  it('ignore les ids absents de la banque (question supprimée — cas non nominal)', () => {
    const e = entretien({ questionsObligatoires: ['q-fantome'] });
    expect(questionsObligatoiresSansReponse(e, 'apprenti', banque)).toEqual([]);
  });
});

describe('reponseEstRenseignee', () => {
  it('texte-court / texte-long : true uniquement si chaîne non vide', () => {
    expect(reponseEstRenseignee('texte-court', 'hello')).toBe(true);
    expect(reponseEstRenseignee('texte-long', 'hello')).toBe(true);
    expect(reponseEstRenseignee('texte-court', '')).toBe(false);
    expect(reponseEstRenseignee('texte-long', '   ')).toBe(false);
    expect(reponseEstRenseignee('texte-court', undefined)).toBe(false);
    expect(reponseEstRenseignee('texte-court', null)).toBe(false);
  });

  it('oui-non : true uniquement si boolean (true ou false), false sinon', () => {
    expect(reponseEstRenseignee('oui-non', true)).toBe(true);
    expect(reponseEstRenseignee('oui-non', false)).toBe(true);
    expect(reponseEstRenseignee('oui-non', null)).toBe(false);
    expect(reponseEstRenseignee('oui-non', undefined)).toBe(false);
    expect(reponseEstRenseignee('oui-non', '')).toBe(false);
  });
});

describe('indexerBanque', () => {
  it('crée un Record indexé par id', () => {
    const idx = indexerBanque(QUESTIONS_BANQUE_INITIALE);
    expect(idx['q-app-motivations']?.libelle).toMatch(/motivations/i);
    expect(idx['q-mai-deja-forme']?.type).toBe('oui-non');
  });
});

describe('questionEstUtilisee', () => {
  it('détecte une utilisation côté apprenti·e', () => {
    expect(
      questionEstUtilisee('q-app-motivations', [
        entretien({ questionsApprentiSelectionnees: ['q-app-motivations'] }),
      ]),
    ).toBe(true);
  });

  it('détecte une utilisation côté maître', () => {
    expect(
      questionEstUtilisee('q-mai-deja-forme', [
        entretien({ questionsMaitreSelectionnees: ['q-mai-deja-forme'] }),
      ]),
    ).toBe(true);
  });

  it("retourne false si aucun entretien ne référence l'id", () => {
    expect(
      questionEstUtilisee('q-inexistante', [
        entretien({ questionsApprentiSelectionnees: ['q-app-motivations'] }),
      ]),
    ).toBe(false);
  });

  it('ignore les livrets sans entretien (entretienTripartite === null)', () => {
    expect(questionEstUtilisee('q-app-motivations', [null, null])).toBe(false);
  });
});

describe('nettoyerReponses', () => {
  it('garde uniquement les réponses dont la questionId est encore sélectionnée', () => {
    const reponses = {
      'q-app-motivations': 'Mon projet',
      'q-app-ressenti-equipe': 'Bonne ambiance',
      'q-supprimee': 'À retirer',
    };
    const restant = nettoyerReponses(reponses, ['q-app-motivations']);
    expect(restant).toEqual({ 'q-app-motivations': 'Mon projet' });
  });

  it('renvoie un objet vide si aucune sélection', () => {
    expect(nettoyerReponses({ 'q-1': 'x' }, [])).toEqual({});
  });
});
