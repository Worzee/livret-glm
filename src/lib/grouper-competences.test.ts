import { describe, expect, it } from 'vitest';
import type { BlocCompetences } from '@/types';
import { grouperParSousFamille } from './grouper-competences';

function bloc(competences: BlocCompetences['competences']): BlocCompetences {
  return { id: 'b', code: 'B', libelle: 'Bloc', competences };
}

describe('grouperParSousFamille', () => {
  it("retourne un seul groupe plat quand aucune compétence n'a de sous-famille", () => {
    const g = grouperParSousFamille(
      bloc([
        { id: '1', code: 'c1', libelle: 'A' },
        { id: '2', code: 'c2', libelle: 'B' },
      ]),
    );
    expect(g).toHaveLength(1);
    expect(g[0].sousFamille).toBeUndefined();
    expect(g[0].competences).toHaveLength(2);
  });

  it("regroupe les compétences contiguës d'une même sous-famille", () => {
    const g = grouperParSousFamille(
      bloc([
        { id: '1', code: 'c1', libelle: 'A', sousFamille: 'SF1' },
        { id: '2', code: 'c2', libelle: 'B', sousFamille: 'SF1' },
      ]),
    );
    expect(g).toHaveLength(1);
    expect(g[0].sousFamille).toBe('SF1');
    expect(g[0].competences.map((c) => c.id)).toEqual(['1', '2']);
  });

  it("préserve l'ordre source en mélangeant feuilles directes et sous-familles", () => {
    const g = grouperParSousFamille(
      bloc([
        { id: '1', code: 'c1', libelle: 'C1-1' }, // feuille directe
        { id: '2', code: 'c2', libelle: 'C1-31', sousFamille: 'C1-3' },
        { id: '3', code: 'c3', libelle: 'C1-32', sousFamille: 'C1-3' },
        { id: '4', code: 'c4', libelle: 'C1-9' }, // feuille directe
      ]),
    );
    expect(g).toHaveLength(3);
    expect(g[0].sousFamille).toBeUndefined();
    expect(g[0].competences.map((c) => c.id)).toEqual(['1']);
    expect(g[1].sousFamille).toBe('C1-3');
    expect(g[1].competences.map((c) => c.id)).toEqual(['2', '3']);
    expect(g[2].sousFamille).toBeUndefined();
    expect(g[2].competences.map((c) => c.id)).toEqual(['4']);
  });
});
