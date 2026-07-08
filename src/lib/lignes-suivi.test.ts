import { describe, expect, it } from 'vitest';
import type { LigneSuiviEntreprise } from '@/types';
import { estLigneLibre } from './lignes-suivi';

function ligne(partial: Partial<LigneSuiviEntreprise>): LigneSuiviEntreprise {
  return {
    id: 'l1',
    competenceId: null,
    evaluationEntreprise: null,
    retourApprenti: '',
    ...partial,
  };
}

describe('estLigneLibre', () => {
  it('est vraie pour une ligne sans compétence ni activité (ligne ad hoc)', () => {
    expect(estLigneLibre(ligne({ competenceId: null }))).toBe(true);
  });

  it('reste vraie avec un intitulé libre déjà saisi', () => {
    expect(estLigneLibre(ligne({ libelleLibre: 'Inventaire de fin de mois en économat' }))).toBe(
      true,
    );
  });

  it('est fausse pour une ligne portant une compétence du référentiel', () => {
    expect(estLigneLibre(ligne({ competenceId: 'c1' }))).toBe(false);
  });

  it('est fausse pour une ligne portant une activité du modèle', () => {
    expect(estLigneLibre(ligne({ competenceId: null, activiteId: 'a1' }))).toBe(false);
  });
});
