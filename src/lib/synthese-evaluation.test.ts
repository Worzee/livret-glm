import { describe, expect, it } from 'vitest';
import type { FicheSuiviPeriode, Referentiel } from '@/types';
import {
  confirmationRequisePourEcraserHeritage,
  synthetiserCompetences,
  valeurEffective,
} from './synthese-evaluation';

const referentiel: Referentiel = {
  id: 'r',
  formation: 'Test',
  blocs: [
    {
      id: 'b1',
      code: 'BC01',
      libelle: 'Bloc 1',
      competences: [
        { id: 'c1', code: 'C1.1', libelle: 'Compétence 1' },
        { id: 'c2', code: 'C1.2', libelle: 'Compétence 2' },
      ],
    },
  ],
};

const fiche = (
  num: number,
  lignes: Array<{
    competenceId: string | null;
    evaluationEntreprise?: 'maitrise' | 'partiel' | 'non-maitrise' | 'non-fait' | null;
  }>,
): FicheSuiviPeriode => ({
  id: `f${num}`,
  numeroPeriode: num,
  dateDebut: '2026-01-01',
  dateFin: '2026-02-01',
  suiviGretaCfa: {},
  suiviEntreprise: lignes.map((l, i) => ({
    id: `l${num}-${i}`,
    competenceId: l.competenceId,
    evaluationEntreprise: l.evaluationEntreprise ?? null,
    retourApprenti: '',
  })),
  observations: {},
  signatures: {
    apprenti: { signe: false },
    maitre: { signe: false },
    formateur: { signe: false },
  },
  etat: 'brouillon',
  historiqueDeverrouillages: [],
});

describe('synthetiserCompetences', () => {
  it('initialise toutes les compétences du référentiel à null', () => {
    const s = synthetiserCompetences([], referentiel);
    expect(s.size).toBe(2);
    expect(s.get('c1')).toEqual({ acquisEntreprise: null });
    expect(s.get('c2')).toEqual({ acquisEntreprise: null });
  });

  it('retient la dernière évaluation chronologique (last-write-wins)', () => {
    const fiches: FicheSuiviPeriode[] = [
      fiche(1, [{ competenceId: 'c1', evaluationEntreprise: 'partiel' }]),
      fiche(2, [{ competenceId: 'c1', evaluationEntreprise: 'maitrise' }]),
    ];
    const s = synthetiserCompetences(fiches, referentiel);
    expect(s.get('c1')?.acquisEntreprise).toBe('maitrise');
  });

  it("retourne le numéro de la dernière période d'origine", () => {
    const fiches: FicheSuiviPeriode[] = [
      fiche(1, [{ competenceId: 'c1', evaluationEntreprise: 'partiel' }]),
      fiche(3, [{ competenceId: 'c1', evaluationEntreprise: 'maitrise' }]),
    ];
    const s = synthetiserCompetences(fiches, referentiel);
    expect(s.get('c1')?.periodeEntreprise).toBe(3);
  });

  it("ne renseigne pas de période d'origine si aucune éval n'a eu lieu", () => {
    const s = synthetiserCompetences([], referentiel);
    expect(s.get('c1')?.periodeEntreprise).toBeUndefined();
  });

  it('ignore les lignes ad-hoc (competenceId null)', () => {
    const fiches: FicheSuiviPeriode[] = [
      fiche(1, [{ competenceId: null, evaluationEntreprise: 'maitrise' }]),
    ];
    const s = synthetiserCompetences(fiches, referentiel);
    expect(s.get('c1')).toEqual({ acquisEntreprise: null });
  });

  it("ignore 'non-fait' (pas encore évalué)", () => {
    const fiches: FicheSuiviPeriode[] = [
      fiche(1, [{ competenceId: 'c1', evaluationEntreprise: 'partiel' }]),
      fiche(2, [{ competenceId: 'c1', evaluationEntreprise: 'non-fait' }]),
    ];
    const s = synthetiserCompetences(fiches, referentiel);
    // La fiche 2 contient 'non-fait' mais on garde 'partiel' de la fiche 1
    expect(s.get('c1')?.acquisEntreprise).toBe('partiel');
    // La période d'origine reste la 1 (fiche 2 ignorée car 'non-fait')
    expect(s.get('c1')?.periodeEntreprise).toBe(1);
  });

  it('trie les fiches par numéro de période avant agrégation', () => {
    // Fiches données dans le désordre — la 2 doit gagner
    const fiches: FicheSuiviPeriode[] = [
      fiche(2, [{ competenceId: 'c1', evaluationEntreprise: 'maitrise' }]),
      fiche(1, [{ competenceId: 'c1', evaluationEntreprise: 'partiel' }]),
    ];
    const s = synthetiserCompetences(fiches, referentiel);
    expect(s.get('c1')?.acquisEntreprise).toBe('maitrise');
  });
});

describe('valeurEffective', () => {
  it('retourne la valeur manuelle si elle existe', () => {
    const synth = new Map([['c1', { acquisEntreprise: 'partiel' as const }]]);
    const r = valeurEffective({ competenceId: 'c1', acquisEntreprise: 'maitrise' }, synth);
    expect(r).toEqual({ valeur: 'maitrise', source: 'manuelle' });
  });

  it('retourne la valeur héritée + le numéro de période si la saisie manuelle est null', () => {
    const synth = new Map([['c1', { acquisEntreprise: 'partiel' as const, periodeEntreprise: 2 }]]);
    const r = valeurEffective({ competenceId: 'c1', acquisEntreprise: null }, synth);
    expect(r.valeur).toBe('partiel');
    expect(r.source).toBe('synthese');
    expect(r.numeroPeriode).toBe(2);
  });

  it('retourne aucune si manuel ET synthèse sont null', () => {
    const synth = new Map([['c1', { acquisEntreprise: null }]]);
    const r = valeurEffective({ competenceId: 'c1', acquisEntreprise: null }, synth);
    expect(r).toEqual({ valeur: null, source: 'aucune' });
  });
});

describe('confirmationRequisePourEcraserHeritage (retours coordos juin 2026)', () => {
  const ligneVierge = { competenceId: 'c1', acquisEntreprise: null };
  const syntheseHeritee = new Map([
    ['c1', { acquisEntreprise: 'maitrise' as const, periodeEntreprise: 1 }],
  ]);
  const syntheseVide = new Map([['c1', { acquisEntreprise: null }]]);

  it('exige une confirmation pour remplacer une valeur héritée par une autre', () => {
    expect(confirmationRequisePourEcraserHeritage(ligneVierge, syntheseHeritee, 'partiel')).toBe(
      true,
    );
  });

  it("exige une confirmation même pour figer la valeur héritée à l'identique (la provenance change)", () => {
    expect(confirmationRequisePourEcraserHeritage(ligneVierge, syntheseHeritee, 'maitrise')).toBe(
      true,
    );
  });

  it("n'exige rien pour un effacement (null) — no-op sur héritage, retour à l'héritage sur saisie manuelle", () => {
    expect(confirmationRequisePourEcraserHeritage(ligneVierge, syntheseHeritee, null)).toBe(false);
  });

  it("n'exige rien quand la cellule porte déjà une saisie manuelle", () => {
    const ligneManuelle = { competenceId: 'c1', acquisEntreprise: 'partiel' as const };
    expect(confirmationRequisePourEcraserHeritage(ligneManuelle, syntheseHeritee, 'maitrise')).toBe(
      false,
    );
  });

  it("n'exige rien quand il n'y a aucun héritage (première saisie libre)", () => {
    expect(confirmationRequisePourEcraserHeritage(ligneVierge, syntheseVide, 'maitrise')).toBe(
      false,
    );
  });
});
