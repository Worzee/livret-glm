import { describe, expect, it } from 'vitest';
import type {
  FicheSuiviPeriode,
  LigneSuiviEntreprise,
  ModeleActivites,
  NiveauMaitriseEntreprise,
  Referentiel,
} from '@/types';
import { projeterActivites } from './projection-activites';

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
        { id: 'c3', code: 'C3', libelle: 'Compétence 3' },
      ],
    },
  ],
};

const modele: ModeleActivites = {
  id: 'act-test',
  nom: 'Modèle test',
  referentielId: 'ref-test',
  activites: [
    { id: 'a1', code: 'A1', libelle: 'Activité A', competenceIds: ['c1', 'c2'] },
    { id: 'a2', code: 'A2', libelle: 'Activité B', competenceIds: ['c2'] },
    { id: 'a3', code: 'A3', libelle: 'Activité C', competenceIds: ['c3'] },
  ],
};

let compteurLigne = 0;
const ligne = (
  activiteId: string | undefined,
  evaluation: NiveauMaitriseEntreprise | null,
  libelleLibre?: string,
): LigneSuiviEntreprise => ({
  id: `l-${++compteurLigne}`,
  competenceId: null,
  activiteId,
  libelleLibre,
  evaluationEntreprise: evaluation,
  retourApprenti: '',
});

const fiche = (numeroPeriode: number, lignes: LigneSuiviEntreprise[]): FicheSuiviPeriode => ({
  id: `fp-${numeroPeriode}`,
  numeroPeriode,
  dateDebut: '2025-09-01',
  dateFin: '2025-12-19',
  suiviGretaCfa: {},
  suiviEntreprise: lignes,
  observations: {},
  signatures: {
    apprenti: { signe: false },
    maitre: { signe: false },
    formateur: { signe: false },
  },
  etat: 'en-cours',
  historiqueDeverrouillages: [],
});

describe('projeterActivites', () => {
  it('projette une évaluation d’activité vers toutes les compétences couvertes, avec provenance', () => {
    const projection = projeterActivites(
      [fiche(1, [ligne('a1', 'maitrise')])],
      modele,
      referentiel,
    );
    expect(projection.get('c1')).toEqual({
      acquisEntreprise: 'maitrise',
      periodeEntreprise: 1,
      activiteId: 'a1',
    });
    expect(projection.get('c2')).toEqual({
      acquisEntreprise: 'maitrise',
      periodeEntreprise: 1,
      activiteId: 'a1',
    });
    expect(projection.get('c3')).toEqual({ acquisEntreprise: null });
  });

  it('last-write-wins chronologique toutes activités confondues (cas du cadrage : P3 gagne)', () => {
    // A couvre c1+c2 « Maîtrisé » en P2 ; B couvre c2 « Partiel » en P3 → c2 = Partiel via B.
    const projection = projeterActivites(
      [fiche(3, [ligne('a2', 'partiel')]), fiche(2, [ligne('a1', 'maitrise')])],
      modele,
      referentiel,
    );
    expect(projection.get('c2')).toEqual({
      acquisEntreprise: 'partiel',
      periodeEntreprise: 3,
      activiteId: 'a2',
    });
    expect(projection.get('c1')).toEqual({
      acquisEntreprise: 'maitrise',
      periodeEntreprise: 2,
      activiteId: 'a1',
    });
  });

  it('au sein d’une même période, la dernière ligne du tableau gagne', () => {
    const projection = projeterActivites(
      [fiche(1, [ligne('a1', 'maitrise'), ligne('a2', 'non-maitrise')])],
      modele,
      referentiel,
    );
    expect(projection.get('c2')).toEqual({
      acquisEntreprise: 'non-maitrise',
      periodeEntreprise: 1,
      activiteId: 'a2',
    });
  });

  it('ignore « non-fait », les lignes non évaluées et les activités libres', () => {
    const projection = projeterActivites(
      [
        fiche(1, [
          ligne('a1', 'non-fait'),
          ligne('a3', null),
          ligne(undefined, 'maitrise', 'Activité libre hors modèle'),
        ]),
      ],
      modele,
      referentiel,
    );
    expect(projection.get('c1')).toEqual({ acquisEntreprise: null });
    expect(projection.get('c2')).toEqual({ acquisEntreprise: null });
    expect(projection.get('c3')).toEqual({ acquisEntreprise: null });
  });

  it('ignore une activité inconnue du modèle et un mapping vers une compétence hors référentiel', () => {
    const modeleAvecOrpheline: ModeleActivites = {
      ...modele,
      activites: [
        ...modele.activites,
        { id: 'a9', code: 'A9', libelle: 'Orpheline', competenceIds: ['disparue'] },
      ],
    };
    const projection = projeterActivites(
      [fiche(1, [ligne('inconnue', 'maitrise'), ligne('a9', 'maitrise')])],
      modeleAvecOrpheline,
      referentiel,
    );
    expect([...projection.values()].every((e) => e.acquisEntreprise === null)).toBe(true);
    expect(projection.has('disparue')).toBe(false);
  });

  it('une évaluation plus tardive ne s’efface pas sur « non-fait » ultérieur', () => {
    const projection = projeterActivites(
      [fiche(1, [ligne('a1', 'partiel')]), fiche(2, [ligne('a1', 'non-fait')])],
      modele,
      referentiel,
    );
    expect(projection.get('c1')).toEqual({
      acquisEntreprise: 'partiel',
      periodeEntreprise: 1,
      activiteId: 'a1',
    });
  });
});
