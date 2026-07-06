import { describe, expect, it } from 'vitest';
import type { Competence, Referentiel } from '@/types';
import {
  SEUIL_COMPETENCES_EVALUABLES_DEFAUT,
  agregerAuNiveauSuperieur,
  appliquerExclusions,
  compterCompetencesEvaluables,
  compterCompetencesExclues,
  depasseSeuil,
  peutAgregerAuNiveauSuperieur,
  peutBasculerExclusion,
  referentielEvaluable,
  validerSeuil,
} from './limite-referentiel';

/**
 * Limite du nombre de lignes évaluables par référentiel (juillet 2026 —
 * chantier référentiels/compétences #2). Fixtures locales minimales.
 */

function comp(id: string, sur: Partial<Competence> = {}): Competence {
  return { id, code: id.toUpperCase(), libelle: `Compétence ${id}`, ...sur };
}

/** Référentiel 2 niveaux : 2 blocs, 5 feuilles. */
function ref2Niveaux(): Referentiel {
  return {
    id: 'ref-test',
    formation: 'Test',
    niveauxColonnes: 2,
    blocs: [
      { id: 'b1', code: 'B1', libelle: 'Bloc 1', competences: [comp('c1'), comp('c2')] },
      {
        id: 'b2',
        code: 'B2',
        libelle: 'Bloc 2',
        competences: [comp('c3'), comp('c4'), comp('c5')],
      },
    ],
  };
}

/**
 * Référentiel 3 niveaux mixte : 1 bloc, 6 feuilles — 2 sous-familles (SF A × 2,
 * SF B × 2) + 1 feuille directe intercalée + 1 feuille directe finale.
 */
function ref3Niveaux(): Referentiel {
  return {
    id: 'ref-mixte',
    formation: 'Mixte',
    niveauxColonnes: 3,
    blocs: [
      {
        id: 'b1',
        code: 'B1',
        libelle: 'Bloc 1',
        competences: [
          comp('c1', { sousFamille: 'SF A' }),
          comp('c2', { sousFamille: 'SF A' }),
          comp('c3'), // feuille directe intercalée
          comp('c4', { sousFamille: 'SF B' }),
          comp('c5', { sousFamille: 'SF B' }),
          comp('c6'),
        ],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
describe('compterCompetencesEvaluables / compterCompetencesExclues', () => {
  it('compte toutes les feuilles quand aucune exclusion', () => {
    expect(compterCompetencesEvaluables(ref2Niveaux())).toBe(5);
    expect(compterCompetencesExclues(ref2Niveaux())).toBe(0);
  });

  it('ignore les feuilles exclues', () => {
    const ref = appliquerExclusions(ref2Niveaux(), ['c2', 'c5']);
    expect(compterCompetencesEvaluables(ref)).toBe(3);
    expect(compterCompetencesExclues(ref)).toBe(2);
  });

  it('les sous-familles ne comptent pas : seules les feuilles sont évaluables', () => {
    // 6 feuilles malgré les 2 sous-familles (regroupements d'affichage).
    expect(compterCompetencesEvaluables(ref3Niveaux())).toBe(6);
  });
});

describe('depasseSeuil', () => {
  it('compare le nombre de feuilles évaluables au seuil', () => {
    expect(depasseSeuil(ref2Niveaux(), 5)).toBe(false);
    expect(depasseSeuil(ref2Niveaux(), 4)).toBe(true);
  });

  it('les exclusions font repasser sous le seuil', () => {
    const ref = appliquerExclusions(ref2Niveaux(), ['c1']);
    expect(depasseSeuil(ref, 4)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('appliquerExclusions', () => {
  it('marque `exclue: true` sur les ids donnés, sans retirer les feuilles', () => {
    const ref = appliquerExclusions(ref2Niveaux(), ['c2']);
    const feuilles = ref.blocs.flatMap((b) => b.competences);
    expect(feuilles).toHaveLength(5); // conservées (trace du fichier officiel)
    expect(feuilles.find((c) => c.id === 'c2')?.exclue).toBe(true);
    expect(feuilles.find((c) => c.id === 'c1')?.exclue).toBeUndefined();
  });

  it('réactive (retire le drapeau) pour les ids absents de la liste', () => {
    const exclu = appliquerExclusions(ref2Niveaux(), ['c2']);
    const reactive = appliquerExclusions(exclu, []);
    const feuilles = reactive.blocs.flatMap((b) => b.competences);
    expect(feuilles.every((c) => !c.exclue)).toBe(true);
  });

  it("ne mute pas le référentiel d'origine", () => {
    const origine = ref2Niveaux();
    appliquerExclusions(origine, ['c1']);
    expect(origine.blocs[0].competences[0].exclue).toBeUndefined();
  });
});

describe('referentielEvaluable', () => {
  it('retire les feuilles exclues et abandonne les blocs vidés', () => {
    const ref = appliquerExclusions(ref2Niveaux(), ['c1', 'c2']); // bloc 1 vidé
    const filtre = referentielEvaluable(ref);
    expect(filtre.blocs).toHaveLength(1);
    expect(filtre.blocs[0].competences.map((c) => c.id)).toEqual(['c3', 'c4', 'c5']);
  });

  it('renvoie la même référence quand aucune exclusion (pas de faux signal)', () => {
    const ref = ref2Niveaux();
    expect(referentielEvaluable(ref)).toBe(ref);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('peutAgregerAuNiveauSuperieur', () => {
  it('vrai dès qu’au moins une feuille porte une sous-famille', () => {
    expect(peutAgregerAuNiveauSuperieur(ref3Niveaux())).toBe(true);
  });

  it('faux pour un référentiel 2 niveaux (pas de niveau intermédiaire)', () => {
    expect(peutAgregerAuNiveauSuperieur(ref2Niveaux())).toBe(false);
  });
});

describe('agregerAuNiveauSuperieur', () => {
  it('remplace chaque sous-famille par une compétence évaluable unique', () => {
    const agrege = agregerAuNiveauSuperieur(ref3Niveaux());
    const feuilles = agrege.blocs[0].competences;
    // SF A + c3 (directe) + SF B + c6 (directe) = 4 lignes évaluables.
    expect(feuilles).toHaveLength(4);
    expect(feuilles.map((c) => c.libelle)).toEqual([
      'SF A',
      'Compétence c3',
      'SF B',
      'Compétence c6',
    ]);
    expect(compterCompetencesEvaluables(agrege)).toBe(4);
  });

  it('conserve les libellés fins dans la description de la ligne agrégée', () => {
    const agrege = agregerAuNiveauSuperieur(ref3Niveaux());
    const sfA = agrege.blocs[0].competences[0];
    expect(sfA.description).toContain('Compétence c1');
    expect(sfA.description).toContain('Compétence c2');
    expect(sfA.sousFamille).toBeUndefined();
  });

  it('produit un référentiel 2 niveaux avec des ids stables et uniques', () => {
    const agrege = agregerAuNiveauSuperieur(ref3Niveaux());
    expect(agrege.niveauxColonnes).toBe(2);
    const ids = agrege.blocs.flatMap((b) => b.competences.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
    // Les feuilles directes gardent leur id d'origine.
    expect(ids).toContain('c3');
    expect(ids).toContain('c6');
  });

  it('fusionne une sous-famille scindée en deux runs en une seule ligne', () => {
    const ref: Referentiel = {
      ...ref3Niveaux(),
      blocs: [
        {
          id: 'b1',
          code: 'B1',
          libelle: 'Bloc 1',
          competences: [
            comp('c1', { sousFamille: 'SF A' }),
            comp('c2'), // interruption
            comp('c3', { sousFamille: 'SF A' }), // même sous-famille, 2ᵉ run
          ],
        },
      ],
    };
    const agrege = agregerAuNiveauSuperieur(ref);
    const feuilles = agrege.blocs[0].competences;
    expect(feuilles).toHaveLength(2); // SF A (fusionnée) + c2
    const sfA = feuilles.find((c) => c.libelle === 'SF A')!;
    expect(sfA.description).toContain('Compétence c1');
    expect(sfA.description).toContain('Compétence c3');
  });

  it('ignore les feuilles déjà exclues (agrégation sur le contenu évaluable)', () => {
    const ref = appliquerExclusions(ref3Niveaux(), ['c1', 'c2']); // toute SF A exclue
    const agrege = agregerAuNiveauSuperieur(ref);
    expect(agrege.blocs[0].competences.map((c) => c.libelle)).toEqual([
      'Compétence c3',
      'SF B',
      'Compétence c6',
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('validerSeuil', () => {
  it('accepte un entier raisonnable et refuse le reste', () => {
    expect(validerSeuil(SEUIL_COMPETENCES_EVALUABLES_DEFAUT).ok).toBe(true);
    expect(validerSeuil(1).ok).toBe(true);
    expect(validerSeuil(0).ok).toBe(false);
    expect(validerSeuil(-5).ok).toBe(false);
    expect(validerSeuil(3.5).ok).toBe(false);
    expect(validerSeuil(1000).ok).toBe(false);
    expect(validerSeuil(Number.NaN).ok).toBe(false);
  });

  it('fournit une raison lisible en cas de refus', () => {
    expect(validerSeuil(0).raison).toMatch(/entre 1 et 999/);
  });
});

describe('peutBasculerExclusion', () => {
  it("autorise l'exclusion tant qu'il reste au moins une feuille évaluable", () => {
    expect(peutBasculerExclusion(ref2Niveaux(), 'c1', 40).ok).toBe(true);
  });

  it('refuse d’exclure la dernière feuille évaluable', () => {
    const ref = appliquerExclusions(ref2Niveaux(), ['c1', 'c2', 'c3', 'c4']);
    const r = peutBasculerExclusion(ref, 'c5', 40);
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(/au moins une compétence évaluable/i);
  });

  it('autorise la réactivation tant que le seuil est respecté', () => {
    const ref = appliquerExclusions(ref2Niveaux(), ['c5']);
    expect(peutBasculerExclusion(ref, 'c5', 5).ok).toBe(true);
  });

  it('refuse la réactivation qui dépasserait le seuil', () => {
    const ref = appliquerExclusions(ref2Niveaux(), ['c5']); // 4 évaluables, seuil 4
    const r = peutBasculerExclusion(ref, 'c5', 4);
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(/limite de 4/);
  });

  it('refuse un id inconnu', () => {
    expect(peutBasculerExclusion(ref2Niveaux(), 'c-inconnue', 40).ok).toBe(false);
  });
});
