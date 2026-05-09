import { describe, expect, it } from 'vitest';
import type { Competence } from '@/types';
import {
  estEvalueeEnEntreprise,
  filtrerCompetencesEvalueesEnEntreprise,
} from './competence-entreprise';

const c = (id: string, evalueeEnEntreprise?: boolean): Competence => ({
  id,
  code: id.toUpperCase(),
  libelle: `Lib ${id}`,
  ...(evalueeEnEntreprise !== undefined ? { evalueeEnEntreprise } : {}),
});

describe('estEvalueeEnEntreprise', () => {
  it("retourne true par défaut quand le flag n'est pas défini (rétrocompat)", () => {
    expect(estEvalueeEnEntreprise(c('c1'))).toBe(true);
  });

  it('retourne true quand le flag est explicitement true', () => {
    expect(estEvalueeEnEntreprise(c('c1', true))).toBe(true);
  });

  it('retourne false quand le flag est explicitement false', () => {
    expect(estEvalueeEnEntreprise(c('c1', false))).toBe(false);
  });
});

describe('filtrerCompetencesEvalueesEnEntreprise', () => {
  it('retourne uniquement les compétences abordées en entreprise', () => {
    const competences = [
      c('c1', true),
      c('c2', false),
      c('c3'), // undefined → considéré comme true
      c('c4', false),
    ];
    expect(filtrerCompetencesEvalueesEnEntreprise(competences).map((x) => x.id)).toEqual([
      'c1',
      'c3',
    ]);
  });

  it('préserve l\'ordre des compétences', () => {
    const competences = [c('a', true), c('b'), c('c', true)];
    expect(filtrerCompetencesEvalueesEnEntreprise(competences).map((x) => x.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it("retourne un tableau vide si aucune compétence n'est abordée", () => {
    const competences = [c('a', false), c('b', false)];
    expect(filtrerCompetencesEvalueesEnEntreprise(competences)).toEqual([]);
  });
});
