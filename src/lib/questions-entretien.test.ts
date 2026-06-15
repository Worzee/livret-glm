import { describe, expect, it } from 'vitest';
import type { EntretienTripartite } from '@/types';
import {
  QUESTIONS_BANQUE_INITIALE,
  idsQuestionsActives,
  indexerBanque,
  nettoyerReponses,
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

  it("est un pur catalogue : pas de champ d'affectation sur la question (13 juin 2026)", () => {
    // `pourEntretiens` et `obligatoire` ont migré vers la formation
    // (`Formation.questionsRetirees`). La question ne porte plus que son
    // identité (id, cible, type, libellé, placeholder).
    for (const q of QUESTIONS_BANQUE_INITIALE) {
      expect('pourEntretiens' in q).toBe(false);
      expect('obligatoire' in q).toBe(false);
    }
  });

  it('les libellés sont neutres : pas de référence à un domaine particulier', () => {
    const motsInterdits = ['brigade', 'cuisine', 'cfa'];
    for (const q of QUESTIONS_BANQUE_INITIALE) {
      const libelle = q.libelle.toLowerCase();
      for (const mot of motsInterdits) {
        expect(libelle.includes(mot)).toBe(false);
      }
    }
  });
});

describe('idsQuestionsActives (13 juin 2026 — par formation)', () => {
  it('sans question retirée : toutes les questions de la cible, ordre du catalogue', () => {
    const apprenti = idsQuestionsActives(QUESTIONS_BANQUE_INITIALE, [], 'apprenti');
    expect(apprenti).toHaveLength(7);
    expect(apprenti[0]).toBe('q-app-motivations');
    expect(idsQuestionsActives(QUESTIONS_BANQUE_INITIALE, [], 'maitre')).toHaveLength(4);
  });

  it('exclut les questions retirées de la formation', () => {
    const retirees = ['q-app-motivations', 'q-mai-deja-forme'];
    const apprenti = idsQuestionsActives(QUESTIONS_BANQUE_INITIALE, retirees, 'apprenti');
    expect(apprenti).toHaveLength(6);
    expect(apprenti).not.toContain('q-app-motivations');
    const maitre = idsQuestionsActives(QUESTIONS_BANQUE_INITIALE, retirees, 'maitre');
    expect(maitre).not.toContain('q-mai-deja-forme');
  });

  it('ne renvoie que la cible demandée', () => {
    const maitre = idsQuestionsActives(QUESTIONS_BANQUE_INITIALE, [], 'maitre');
    expect(maitre.every((id) => id.startsWith('q-mai-'))).toBe(true);
  });
});

// Helper local — entretien minimal pour les tests.
function entretien(overrides: Partial<EntretienTripartite> = {}): EntretienTripartite {
  return {
    questionsApprentiSelectionnees: [],
    questionsMaitreSelectionnees: [],
    questionsImposees: [],
    questionsObligatoires: [],
    evaluationsAttitudes: {},
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
    expect(questionsObligatoiresSansReponse(e, 'apprenti', banque).map((q) => q.id)).toEqual([
      'q-app-motivations',
    ]);
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
