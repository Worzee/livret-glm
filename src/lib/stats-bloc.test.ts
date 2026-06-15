import { describe, expect, it } from 'vitest';
import type { LigneEvaluationFinaleCompetence, NiveauMaitrise, Referentiel } from '@/types';
import { calculerStatsParBloc, pourcent } from './stats-bloc';

const referentiel: Referentiel = {
  id: 'r',
  formation: 'Test',
  blocs: [
    {
      id: 'b1',
      code: 'BC01',
      libelle: 'Bloc 1',
      competences: [
        { id: 'c1', code: 'C1', libelle: '...' },
        { id: 'c2', code: 'C2', libelle: '...' },
        { id: 'c3', code: 'C3', libelle: '...' },
      ],
    },
    {
      id: 'b2',
      code: 'BC02',
      libelle: 'Bloc 2',
      competences: [{ id: 'c4', code: 'C4', libelle: '...' }],
    },
  ],
};

const ligne = (
  id: string,
  ent: NiveauMaitrise | null,
  cen: NiveauMaitrise | null,
): LigneEvaluationFinaleCompetence => ({
  competenceId: id,
  acquisEntreprise: ent,
  acquisCentre: cen,
});

describe('calculerStatsParBloc', () => {
  it('retourne 100% non-évalué quand aucune saisie ni synthèse', () => {
    const stats = calculerStatsParBloc(referentiel, [], new Map());
    expect(stats).toHaveLength(2);
    expect(stats[0].entreprise).toEqual({
      maitrise: 0,
      partiel: 0,
      nonMaitrise: 0,
      nonEvalue: 3,
      total: 3,
    });
    expect(stats[1].entreprise.total).toBe(1);
    expect(stats[1].entreprise.nonEvalue).toBe(1);
  });

  it('compte correctement les niveaux (saisie manuelle)', () => {
    const lignes = [
      ligne('c1', 'maitrise', 'maitrise'),
      ligne('c2', 'partiel', 'maitrise'),
      ligne('c3', 'non-maitrise', null),
    ];
    const stats = calculerStatsParBloc(referentiel, lignes, new Map());
    expect(stats[0].entreprise).toEqual({
      maitrise: 1,
      partiel: 1,
      nonMaitrise: 1,
      nonEvalue: 0,
      total: 3,
    });
    expect(stats[0].centre).toEqual({
      maitrise: 2,
      partiel: 0,
      nonMaitrise: 0,
      nonEvalue: 1,
      total: 3,
    });
  });

  it('hérite de la synthèse quand la saisie manuelle est null', () => {
    const synthese = new Map([
      ['c1', { acquisEntreprise: 'partiel' as const, acquisCentre: 'maitrise' as const }],
    ]);
    const lignes = [ligne('c1', null, null)];
    const stats = calculerStatsParBloc(referentiel, lignes, synthese);
    expect(stats[0].entreprise.partiel).toBe(1);
    expect(stats[0].centre.maitrise).toBe(1);
  });

  it('la saisie manuelle prime sur la synthèse', () => {
    const synthese = new Map([
      ['c1', { acquisEntreprise: 'partiel' as const, acquisCentre: 'partiel' as const }],
    ]);
    const lignes = [ligne('c1', 'maitrise', 'maitrise')];
    const stats = calculerStatsParBloc(referentiel, lignes, synthese);
    expect(stats[0].entreprise.maitrise).toBe(1);
    expect(stats[0].entreprise.partiel).toBe(0);
  });
});

describe('pourcent', () => {
  it('calcule un pourcentage entier arrondi', () => {
    expect(pourcent(1, 3)).toBe(33);
    expect(pourcent(2, 3)).toBe(67);
    expect(pourcent(3, 3)).toBe(100);
  });

  it('retourne 0 si le total est 0', () => {
    expect(pourcent(0, 0)).toBe(0);
  });
});
