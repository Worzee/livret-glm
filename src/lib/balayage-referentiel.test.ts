import { describe, expect, it } from 'vitest';
import type { Activite, ModeleActivites, Referentiel } from '@/types';
import {
  calculerBalayage,
  competencesCouvertes,
  estCouverteParModele,
} from './balayage-referentiel';

const referentiel = (exclues: string[] = []): Referentiel => ({
  id: 'ref-test',
  formation: 'Formation test',
  blocs: [
    {
      id: 'b1',
      code: 'B1',
      libelle: 'Bloc 1',
      competences: [
        { id: 'c1', code: 'C1', libelle: 'Compétence 1', exclue: exclues.includes('c1') },
        { id: 'c2', code: 'C2', libelle: 'Compétence 2', exclue: exclues.includes('c2') },
      ],
    },
    {
      id: 'b2',
      code: 'B2',
      libelle: 'Bloc 2',
      competences: [
        { id: 'c3', code: 'C3', libelle: 'Compétence 3', exclue: exclues.includes('c3') },
      ],
    },
  ],
});

const activite = (id: string, competenceIds: string[]): Activite => ({
  id,
  code: id.toUpperCase(),
  libelle: `Activité ${id}`,
  competenceIds,
});

const modele = (activites: Activite[]): ModeleActivites => ({
  id: 'act-test',
  nom: 'Modèle test',
  referentielId: 'ref-test',
  activites,
});

describe('competencesCouvertes', () => {
  it("fait l'union des compétences couvertes par toutes les activités", () => {
    const ids = competencesCouvertes([activite('a1', ['c1', 'c2']), activite('a2', ['c2', 'c3'])]);
    expect([...ids].sort()).toEqual(['c1', 'c2', 'c3']);
  });

  it('retourne un ensemble vide sans activités', () => {
    expect(competencesCouvertes([]).size).toBe(0);
  });
});

describe('calculerBalayage', () => {
  it('balayage complet quand toutes les compétences évaluables sont couvertes', () => {
    const b = calculerBalayage(
      modele([activite('a1', ['c1', 'c2']), activite('a2', ['c3'])]),
      referentiel(),
    );
    expect(b.complet).toBe(true);
    expect(b.total).toBe(3);
    expect(b.couvertes.sort()).toEqual(['c1', 'c2', 'c3']);
    expect(b.manquantes).toEqual([]);
    expect(b.orphelines).toEqual([]);
  });

  it('balayage incomplet : liste les compétences manquantes dans l’ordre du référentiel', () => {
    const b = calculerBalayage(modele([activite('a1', ['c2'])]), referentiel());
    expect(b.complet).toBe(false);
    expect(b.manquantes).toEqual(['c1', 'c3']);
    expect(b.couvertes).toEqual(['c2']);
  });

  it('les compétences EXCLUES ne comptent ni dans le total ni dans les manquantes (modif #2)', () => {
    const b = calculerBalayage(modele([activite('a1', ['c1', 'c3'])]), referentiel(['c2']));
    expect(b.total).toBe(2);
    expect(b.complet).toBe(true);
    expect(b.manquantes).toEqual([]);
  });

  it('un id mappé inexistant ou exclu du référentiel est orphelin (réimport, exclusion)', () => {
    const b = calculerBalayage(
      modele([activite('a1', ['c1', 'c2', 'c3', 'disparue'])]),
      referentiel(['c2']),
    );
    expect(b.orphelines.sort()).toEqual(['c2', 'disparue']);
    expect(b.complet).toBe(true); // c1 + c3 couvertes, c2 exclue hors périmètre
  });

  it('sans modèle, le balayage est vide et incomplet', () => {
    const b = calculerBalayage(undefined, referentiel());
    expect(b.complet).toBe(false);
    expect(b.couvertes).toEqual([]);
    expect(b.manquantes).toEqual(['c1', 'c2', 'c3']);
  });

  it('un référentiel sans compétence évaluable ne peut pas être balayé (complet = false)', () => {
    const b = calculerBalayage(modele([activite('a1', [])]), referentiel(['c1', 'c2', 'c3']));
    expect(b.total).toBe(0);
    expect(b.complet).toBe(false);
  });

  it('un modèle sans aucune activité est incomplet', () => {
    const b = calculerBalayage(modele([]), referentiel());
    expect(b.complet).toBe(false);
    expect(b.manquantes).toEqual(['c1', 'c2', 'c3']);
  });
});

describe('estCouverteParModele', () => {
  it('vraie si au moins une activité mappe la compétence', () => {
    const m = modele([activite('a1', ['c1'])]);
    expect(estCouverteParModele(m, 'c1')).toBe(true);
    expect(estCouverteParModele(m, 'c2')).toBe(false);
  });

  it('fausse sans modèle', () => {
    expect(estCouverteParModele(undefined, 'c1')).toBe(false);
  });
});
