import { describe, expect, it } from 'vitest';
import type { Apprenti, Livret } from '@/types';
import { apprentisSansLivret } from './reparation-livrets';

const apprenti = (id: string): Apprenti => ({
  id,
  role: 'apprenti',
  nom: 'RAMOS',
  prenom: 'Marcel',
  email: `${id}@exemple.fr`,
  dateNaissance: '2007-01-01',
  formationId: 'f-test',
  entrepriseId: 'ent-1',
  maitreApprentissageId: 'u-maitre-1',
  formateurReferentId: 'u-formateur-1',
  contratDebut: '2025-09-01',
  contratFin: '2027-08-31',
});

const livretDe = (apprentiId: string): Livret => ({
  id: `livret-${apprentiId}`,
  apprentiId,
  formationId: 'f-test',
  organisationSuivi: { evenements: [], modifieLe: '', modifiePar: '' },
  entretien: null,
  fichesSuivi: [],
  fichesSuiviCentre: [],
  evaluationFinaleCompetences: { lignes: [], modifieLe: '' },
  selectionCompetencesEntreprise: { ids: [], modifieLe: '', historiqueInvalidations: [] },
  selectionActivitesEntreprise: { ids: [], modifieLe: '', historiqueInvalidations: [] },
  attitudesSelectionnees: [],
  cloture: null,
  creeLe: '',
  modifieLe: '',
});

describe('apprentisSansLivret', () => {
  it('détecte les apprenti·e·s dont le livret a disparu (reset de store après bump)', () => {
    const apprentis = { 'u-a1': apprenti('u-a1'), 'u-a2': apprenti('u-a2') };
    const livrets = { 'livret-u-a1': livretDe('u-a1') };
    expect(apprentisSansLivret(apprentis, livrets).map((a) => a.id)).toEqual(['u-a2']);
  });

  it('retourne vide quand tous les livrets existent', () => {
    const apprentis = { 'u-a1': apprenti('u-a1') };
    const livrets = { 'livret-u-a1': livretDe('u-a1') };
    expect(apprentisSansLivret(apprentis, livrets)).toEqual([]);
  });

  it("se fonde sur l'apprentiId du livret, pas sur son id", () => {
    // Un livret d'id arbitraire (fixtures : `livret-lea`) couvre bien son apprenti·e.
    const apprentis = { 'u-a1': apprenti('u-a1') };
    const livrets = { 'livret-quelconque': { ...livretDe('u-a1'), id: 'livret-quelconque' } };
    expect(apprentisSansLivret(apprentis, livrets)).toEqual([]);
  });

  it('tolère les collections vides', () => {
    expect(apprentisSansLivret({}, {})).toEqual([]);
  });
});
