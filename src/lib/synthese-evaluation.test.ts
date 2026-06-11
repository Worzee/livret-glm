import { describe, expect, it } from 'vitest';
import type { FicheSuiviPeriode, Referentiel } from '@/types';
import { synthetiserCompetences, valeurEffective } from './synthese-evaluation';

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
  attitudes: [],
};

const fiche = (
  num: number,
  lignes: Array<{
    competenceId: string | null;
    evaluationGreta?: 'maitrise' | 'partiel' | 'non-maitrise' | 'non-fait' | null;
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
    evaluationGreta: l.evaluationGreta ?? null,
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
  it("initialise toutes les compétences du référentiel à null", () => {
    const s = synthetiserCompetences([], referentiel);
    expect(s.size).toBe(2);
    expect(s.get('c1')).toEqual({ acquisEntreprise: null, acquisCentre: null });
    expect(s.get('c2')).toEqual({ acquisEntreprise: null, acquisCentre: null });
  });

  it("retient la dernière évaluation chronologique (last-write-wins)", () => {
    const fiches: FicheSuiviPeriode[] = [
      fiche(1, [{ competenceId: 'c1', evaluationGreta: 'partiel', evaluationEntreprise: 'partiel' }]),
      fiche(2, [{ competenceId: 'c1', evaluationGreta: 'maitrise', evaluationEntreprise: 'maitrise' }]),
    ];
    const s = synthetiserCompetences(fiches, referentiel);
    expect(s.get('c1')?.acquisEntreprise).toBe('maitrise');
    expect(s.get('c1')?.acquisCentre).toBe('maitrise');
  });

  it("retourne le numéro de la dernière période d'origine pour chaque côté", () => {
    const fiches: FicheSuiviPeriode[] = [
      fiche(1, [{ competenceId: 'c1', evaluationGreta: 'partiel', evaluationEntreprise: 'partiel' }]),
      fiche(2, [{ competenceId: 'c1', evaluationGreta: 'maitrise' }]),
      fiche(3, [{ competenceId: 'c1', evaluationEntreprise: 'maitrise' }]),
    ];
    const s = synthetiserCompetences(fiches, referentiel);
    expect(s.get('c1')?.periodeCentre).toBe(2); // dernière éval Greta : période 2
    expect(s.get('c1')?.periodeEntreprise).toBe(3); // dernière éval entreprise : période 3
  });

  it("ne renseigne pas de période d'origine si aucune éval n'a eu lieu", () => {
    const s = synthetiserCompetences([], referentiel);
    expect(s.get('c1')?.periodeCentre).toBeUndefined();
    expect(s.get('c1')?.periodeEntreprise).toBeUndefined();
  });

  it("ignore les lignes ad-hoc (competenceId null)", () => {
    const fiches: FicheSuiviPeriode[] = [
      fiche(1, [{ competenceId: null, evaluationGreta: 'maitrise', evaluationEntreprise: 'maitrise' }]),
    ];
    const s = synthetiserCompetences(fiches, referentiel);
    expect(s.get('c1')).toEqual({ acquisEntreprise: null, acquisCentre: null });
  });

  it("ignore 'non-fait' côté entreprise (pas encore évalué)", () => {
    const fiches: FicheSuiviPeriode[] = [
      fiche(1, [{ competenceId: 'c1', evaluationEntreprise: 'partiel' }]),
      fiche(2, [{ competenceId: 'c1', evaluationEntreprise: 'non-fait' }]),
    ];
    const s = synthetiserCompetences(fiches, referentiel);
    // La fiche 2 contient 'non-fait' mais on garde 'partiel' de la fiche 1
    expect(s.get('c1')?.acquisEntreprise).toBe('partiel');
  });

  it("ignore 'non-fait' côté centre (symétrie entreprise — pas une éval utilisable)", () => {
    const fiches: FicheSuiviPeriode[] = [
      fiche(1, [{ competenceId: 'c1', evaluationGreta: 'partiel' }]),
      fiche(2, [{ competenceId: 'c1', evaluationGreta: 'non-fait' }]),
    ];
    const s = synthetiserCompetences(fiches, referentiel);
    // La fiche 2 contient 'non-fait' mais on garde 'partiel' de la fiche 1
    expect(s.get('c1')?.acquisCentre).toBe('partiel');
    // La période d'origine reste la 1 (fiche 2 ignorée car 'non-fait')
    expect(s.get('c1')?.periodeCentre).toBe(1);
  });

  it("traite indépendamment les colonnes greta et entreprise", () => {
    const fiches: FicheSuiviPeriode[] = [
      fiche(1, [{ competenceId: 'c1', evaluationGreta: 'maitrise', evaluationEntreprise: null }]),
      fiche(2, [{ competenceId: 'c1', evaluationGreta: null, evaluationEntreprise: 'partiel' }]),
    ];
    const s = synthetiserCompetences(fiches, referentiel);
    expect(s.get('c1')?.acquisEntreprise).toBe('partiel');
    expect(s.get('c1')?.acquisCentre).toBe('maitrise');
    expect(s.get('c1')?.periodeCentre).toBe(1);
    expect(s.get('c1')?.periodeEntreprise).toBe(2);
  });

  it("trie les fiches par numéro de période avant agrégation", () => {
    // Fiches données dans le désordre — la 2 doit gagner
    const fiches: FicheSuiviPeriode[] = [
      fiche(2, [{ competenceId: 'c1', evaluationGreta: 'maitrise' }]),
      fiche(1, [{ competenceId: 'c1', evaluationGreta: 'partiel' }]),
    ];
    const s = synthetiserCompetences(fiches, referentiel);
    expect(s.get('c1')?.acquisCentre).toBe('maitrise');
  });
});

describe('valeurEffective', () => {
  it("retourne la valeur manuelle si elle existe", () => {
    const synth = new Map([
      ['c1', { acquisEntreprise: 'partiel' as const, acquisCentre: 'partiel' as const }],
    ]);
    const r = valeurEffective(
      { competenceId: 'c1', acquisEntreprise: 'maitrise', acquisCentre: null },
      synth,
      'acquisEntreprise',
    );
    expect(r).toEqual({ valeur: 'maitrise', source: 'manuelle' });
  });

  it("retourne la valeur héritée + le numéro de période si la saisie manuelle est null", () => {
    const synth = new Map([
      [
        'c1',
        {
          acquisEntreprise: 'partiel' as const,
          acquisCentre: 'partiel' as const,
          periodeEntreprise: 2,
          periodeCentre: 3,
        },
      ],
    ]);
    const r = valeurEffective(
      { competenceId: 'c1', acquisEntreprise: null, acquisCentre: null },
      synth,
      'acquisEntreprise',
    );
    expect(r.valeur).toBe('partiel');
    expect(r.source).toBe('synthese');
    expect(r.numeroPeriode).toBe(2);
  });

  it("retourne aucune si manuel ET synthèse sont null", () => {
    const synth = new Map([
      ['c1', { acquisEntreprise: null, acquisCentre: null }],
    ]);
    const r = valeurEffective(
      { competenceId: 'c1', acquisEntreprise: null, acquisCentre: null },
      synth,
      'acquisEntreprise',
    );
    expect(r).toEqual({ valeur: null, source: 'aucune' });
  });
});
