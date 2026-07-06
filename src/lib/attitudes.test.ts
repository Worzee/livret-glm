import { describe, expect, it } from 'vitest';
import type { EntretienTripartite, EvaluationsAttitudes, FicheSuiviPeriode } from '@/types';
import {
  ATTITUDES_INITIALES,
  ATTITUDES_OBLIGATOIRES,
  attitudeEstUtilisee,
  attitudesNonEvaluees,
  lignesSyntheseAttitudes,
  synthetiserAttitudes,
} from './attitudes';
import { CRITERES_APPRECIATION } from './trame-entretien';

// Helper local — entretien minimal pour les tests.
function entretien(): EntretienTripartite {
  return {
    reponsesTrame: {},
    appreciationMaitre: {},
    commentaires: {},
    signatures: {
      apprenti: { signe: false },
      maitre: { signe: false },
      formateur: { signe: false },
    },
  };
}

// Helper local — fiche entreprise minimale portant des évaluations d'attitudes.
function fiche(num: number, evaluationsAttitudes?: EvaluationsAttitudes): FicheSuiviPeriode {
  return {
    id: `f${num}`,
    numeroPeriode: num,
    dateDebut: '2026-01-01',
    dateFin: '2026-02-01',
    suiviGretaCfa: {},
    suiviEntreprise: [],
    evaluationsAttitudes,
    observations: {},
    signatures: {
      apprenti: { signe: false },
      maitre: { signe: false },
      formateur: { signe: false },
    },
    etat: 'brouillon',
    historiqueDeverrouillages: [],
  };
}

describe('ATTITUDES_INITIALES', () => {
  it('contient 12 attitudes avec ids uniques, libellés et descriptions (a1..a4 retirées le 18 juin 2026)', () => {
    expect(ATTITUDES_INITIALES).toHaveLength(12);
    const ids = new Set<string>();
    for (const a of ATTITUDES_INITIALES) {
      expect(a.id).toMatch(/^a\d+$/);
      expect(ids.has(a.id)).toBe(false);
      ids.add(a.id);
      expect(a.libelle.length).toBeGreaterThan(5);
      // Chaque attitude porte une description concrète (aide à l'évaluation).
      expect(a.description ?? '').not.toBe('');
    }
  });

  it('a1..a4 sont retirées (doublon avec l’appréciation maître) ; les ids restants sont stables', () => {
    const parId = new Map(ATTITUDES_INITIALES.map((a) => [a.id, a.libelle]));
    for (const id of ['a1', 'a2', 'a3', 'a4']) {
      expect(parId.has(id)).toBe(false);
    }
    // Attitudes encore référencées par les fixtures de démo : id + libellé stables.
    expect(parId.get('a5')).toBe("Prise d'initiative et autonomie");
    expect(parId.get('a6')).toBe('Communication professionnelle');
    expect(parId.get('a9')).toBe('Motivation et implication');
  });

  it('les libellés sont neutres : pas de référence à un domaine particulier', () => {
    const motsInterdits = ['brigade', 'cuisine', 'cfa'];
    for (const a of ATTITUDES_INITIALES) {
      const texte = `${a.libelle} ${a.description ?? ''}`.toLowerCase();
      for (const mot of motsInterdits) {
        expect(texte.includes(mot)).toBe(false);
      }
    }
  });
});

describe('attitudeEstUtilisee (juillet 2026 — évaluations portées par les fiches entreprise)', () => {
  it('détecte une évaluation dans une fiche de période entreprise', () => {
    expect(attitudeEstUtilisee('a5', [fiche(1, { a5: 'plus' })])).toBe(true);
  });

  it('une entrée null ne compte pas comme utilisée', () => {
    expect(attitudeEstUtilisee('a5', [fiche(1, { a5: null })])).toBe(false);
  });

  it("retourne false si aucune fiche n'évalue l'attitude", () => {
    expect(attitudeEstUtilisee('a5', [fiche(1, { a6: 'moins' })])).toBe(false);
  });

  it('tolère les fiches sans évaluations (champ absent — fiches centre, anciennes fiches)', () => {
    expect(attitudeEstUtilisee('a5', [fiche(1), fiche(2)])).toBe(false);
  });
});

describe('attitudesNonEvaluees (R20 fiche entreprise — juillet 2026)', () => {
  it('retourne les ids retenus sans évaluation, dans l’ordre de la sélection', () => {
    expect(attitudesNonEvaluees(['a5', 'a6', 'a9'], { a6: 'plus' })).toEqual(['a5', 'a9']);
  });

  it('une entrée null reste non évaluée', () => {
    expect(attitudesNonEvaluees(['a5'], { a5: null })).toEqual(['a5']);
  });

  it('retourne [] quand tout est évalué', () => {
    expect(attitudesNonEvaluees(['a5', 'a6'], { a5: 'moinsmoins', a6: 'plusplus' })).toEqual([]);
  });

  it('retourne [] sur une sélection vide et tolère des évaluations absentes', () => {
    expect(attitudesNonEvaluees([], undefined)).toEqual([]);
    expect(attitudesNonEvaluees(['a5'], undefined)).toEqual(['a5']);
  });
});

describe('synthetiserAttitudes (last-write-wins sur les périodes entreprise)', () => {
  it('retient la dernière évaluation chronologique avec sa période d’origine', () => {
    const s = synthetiserAttitudes([fiche(1, { a5: 'moins' }), fiche(2, { a5: 'plus' })]);
    expect(s.get('a5')).toEqual({ niveau: 'plus', numeroPeriode: 2 });
  });

  it('trie les fiches par numéro de période avant agrégation', () => {
    const s = synthetiserAttitudes([fiche(2, { a5: 'plus' }), fiche(1, { a5: 'moins' })]);
    expect(s.get('a5')).toEqual({ niveau: 'plus', numeroPeriode: 2 });
  });

  it('une entrée null ne remplace pas une évaluation antérieure', () => {
    const s = synthetiserAttitudes([fiche(1, { a5: 'plusplus' }), fiche(2, { a5: null })]);
    expect(s.get('a5')).toEqual({ niveau: 'plusplus', numeroPeriode: 1 });
  });

  it('ignore les fiches sans évaluations et retourne une map vide sans donnée', () => {
    expect(synthetiserAttitudes([fiche(1), fiche(2)]).size).toBe(0);
    expect(synthetiserAttitudes([]).size).toBe(0);
  });
});

describe('ATTITUDES_OBLIGATOIRES', () => {
  it("reprend les 4 critères de l'appréciation maître, dans l'ordre de la trame officielle", () => {
    expect(ATTITUDES_OBLIGATOIRES.map((a) => a.cle)).toEqual(
      CRITERES_APPRECIATION.map((c) => c.cle),
    );
    expect(ATTITUDES_OBLIGATOIRES.map((a) => a.libelle)).toEqual(
      CRITERES_APPRECIATION.map((c) => c.libelle),
    );
  });

  it('chaque attitude obligatoire porte une description concrète', () => {
    for (const a of ATTITUDES_OBLIGATOIRES) {
      expect(a.description.length).toBeGreaterThan(10);
    }
  });
});

describe('lignesSyntheseAttitudes', () => {
  const catalogue = [
    { id: 'a5', libelle: "Prise d'initiative et autonomie", description: 'Sait agir seul·e.' },
    { id: 'a9', libelle: 'Motivation et implication' },
  ];

  it('place les 4 obligatoires avant les optionnelles retenues (ordre du catalogue)', () => {
    const lignes = lignesSyntheseAttitudes(catalogue, ['a9', 'a5'], null, []);
    expect(lignes.map((l) => l.id)).toEqual([
      'oblig-ponctualite',
      'oblig-comprehensionConsignes',
      'oblig-qualiteTravail',
      'oblig-integration',
      'a5',
      'a9',
    ]);
    expect(lignes.slice(0, 4).every((l) => l.obligatoire)).toBe(true);
    expect(lignes.slice(4).every((l) => !l.obligatoire)).toBe(true);
  });

  it("lit les obligatoires dans l'appréciation du maître (entretien) et les optionnelles dans les fiches entreprise", () => {
    const e = entretien();
    e.appreciationMaitre = { ponctualite: 'plusplus', qualiteTravail: 'moins' };
    const fiches = [fiche(1, { a5: 'moins' }), fiche(3, { a5: 'plus' })];
    const lignes = lignesSyntheseAttitudes(catalogue, ['a5'], e, fiches);

    const parId = new Map(lignes.map((l) => [l.id, l]));
    expect(parId.get('oblig-ponctualite')?.niveau).toBe('plusplus');
    expect(parId.get('oblig-qualiteTravail')?.niveau).toBe('moins');
    // Critère non renseigné dans l'appréciation → null.
    expect(parId.get('oblig-integration')?.niveau).toBeNull();
    // Optionnelle : last-write-wins des périodes + période d'origine.
    expect(parId.get('a5')?.niveau).toBe('plus');
    expect(parId.get('a5')?.numeroPeriode).toBe(3);
    // Les obligatoires ne portent pas de période (évaluées à l'entretien).
    expect(parId.get('oblig-ponctualite')?.numeroPeriode).toBeUndefined();
  });

  it('retourne null pour un entretien absent ou une attitude jamais évaluée', () => {
    const lignesSansRien = lignesSyntheseAttitudes(catalogue, ['a5'], null, []);
    expect(lignesSansRien.every((l) => l.niveau === null)).toBe(true);

    const lignes = lignesSyntheseAttitudes(catalogue, ['a5'], null, [fiche(1, { a5: null })]);
    const parId = new Map(lignes.map((l) => [l.id, l]));
    // Évaluation explicitement null → null, sans période.
    expect(parId.get('a5')?.niveau).toBeNull();
    expect(parId.get('a5')?.numeroPeriode).toBeUndefined();
  });

  it('ignore les ids orphelins de la sélection et conserve toujours les 4 obligatoires', () => {
    const lignes = lignesSyntheseAttitudes(catalogue, ['a-supprimee'], null, []);
    expect(lignes).toHaveLength(4);
    expect(lignes.every((l) => l.obligatoire)).toBe(true);
  });
});
