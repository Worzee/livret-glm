import { describe, expect, it } from 'vitest';
import type { ModeleActivites, Referentiel, SelectionActivitesEntreprise } from '@/types';
import {
  competencesCouvertesParSelection,
  realignerSurModele,
  restreindreReferentielAuxActivitesRetenues,
} from './selection-activites-entreprise';

const modele: ModeleActivites = {
  id: 'act-test',
  nom: 'Modèle test',
  referentielId: 'ref-test',
  activites: [
    { id: 'a1', code: 'A1', libelle: 'Activité 1', competenceIds: ['c1', 'c2'] },
    { id: 'a2', code: 'A2', libelle: 'Activité 2', competenceIds: ['c3'] },
  ],
};

const referentiel: Referentiel = {
  id: 'ref-test',
  formation: 'Formation test',
  blocs: [
    {
      id: 'b1',
      code: 'B1',
      libelle: 'Bloc 1',
      competences: [
        { id: 'c1', code: 'C1', libelle: 'Compétence 1' },
        { id: 'c2', code: 'C2', libelle: 'Compétence 2' },
      ],
    },
    {
      id: 'b2',
      code: 'B2',
      libelle: 'Bloc 2',
      competences: [{ id: 'c3', code: 'C3', libelle: 'Compétence 3' }],
    },
  ],
};

const selection = (ids: string[], validee = false): SelectionActivitesEntreprise => ({
  ids,
  ...(validee ? { validePar: { formateurId: 'fmt', maitreId: 'mai', dateIso: '2026-01-01' } } : {}),
  modifieLe: '2026-01-01',
  historiqueInvalidations: [],
});

describe('realignerSurModele', () => {
  it('repart « tout coché » sur les activités du modèle (sélection non validée)', () => {
    const r = realignerSurModele(selection(['a1', 'disparue']), modele);
    expect(r.ids).toEqual(['a1', 'a2']);
  });

  it('préserve une sélection validée (invalidation R10 pour y revenir)', () => {
    const sel = selection(['a1'], true);
    expect(realignerSurModele(sel, modele)).toBe(sel);
  });

  it('retourne la même référence si l’ensemble est déjà identique', () => {
    const sel = selection(['a2', 'a1']);
    expect(realignerSurModele(sel, modele)).toBe(sel);
  });

  it('sans modèle, la sélection non validée se vide', () => {
    const r = realignerSurModele(selection(['a1']), undefined);
    expect(r.ids).toEqual([]);
  });
});

describe('competencesCouvertesParSelection', () => {
  it('union des compétences couvertes par les activités retenues', () => {
    expect([...competencesCouvertesParSelection(modele, selection(['a1']))].sort()).toEqual([
      'c1',
      'c2',
    ]);
    expect([...competencesCouvertesParSelection(modele, selection(['a1', 'a2']))].sort()).toEqual([
      'c1',
      'c2',
      'c3',
    ]);
  });

  it('ignore les ids d’activités disparues du modèle', () => {
    expect(competencesCouvertesParSelection(modele, selection(['disparue'])).size).toBe(0);
  });
});

describe('restreindreReferentielAuxActivitesRetenues', () => {
  it('restreint la grille aux compétences couvertes par les activités retenues', () => {
    const r = restreindreReferentielAuxActivitesRetenues(referentiel, modele, selection(['a2']));
    expect(r.blocs).toHaveLength(1);
    expect(r.blocs[0].competences.map((c) => c.id)).toEqual(['c3']);
  });

  it('retourne la même référence quand tout est couvert', () => {
    const r = restreindreReferentielAuxActivitesRetenues(
      referentiel,
      modele,
      selection(['a1', 'a2']),
    );
    expect(r).toBe(referentiel);
  });
});
