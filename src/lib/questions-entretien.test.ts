import { describe, expect, it } from 'vitest';
import type { EntretienTripartite } from '@/types';
import {
  QUESTIONS_BANQUE_INITIALE,
  idsQuestionsInitiales,
  indexerBanque,
  nettoyerReponses,
  questionEstUtilisee,
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
});

describe('idsQuestionsInitiales', () => {
  it('renvoie les 7 ids apprenti·e (dans l\'ordre du catalogue)', () => {
    const ids = idsQuestionsInitiales('apprenti');
    expect(ids).toHaveLength(7);
    expect(ids[0]).toBe('q-app-motivations');
  });

  it('renvoie les 4 ids maître', () => {
    const ids = idsQuestionsInitiales('maitre');
    expect(ids).toHaveLength(4);
    expect(ids).toContain('q-mai-deja-forme');
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
  const entretien = (
    apprentiIds: string[],
    maitreIds: string[],
  ): EntretienTripartite => ({
    questionsApprentiSelectionnees: apprentiIds,
    questionsMaitreSelectionnees: maitreIds,
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
  });

  it('détecte une utilisation côté apprenti·e', () => {
    expect(
      questionEstUtilisee('q-app-motivations', [entretien(['q-app-motivations'], [])]),
    ).toBe(true);
  });

  it('détecte une utilisation côté maître', () => {
    expect(
      questionEstUtilisee('q-mai-deja-forme', [entretien([], ['q-mai-deja-forme'])]),
    ).toBe(true);
  });

  it("retourne false si aucun entretien ne référence l'id", () => {
    expect(
      questionEstUtilisee('q-inexistante', [entretien(['q-app-motivations'], [])]),
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
