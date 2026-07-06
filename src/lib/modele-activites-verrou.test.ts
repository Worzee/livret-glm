import { describe, expect, it } from 'vitest';
import type { Formation } from '@/types';
import { evaluerVerrouModeleActivites, peutRemplacerModele } from './modele-activites-verrou';

const formation = (id: string, patch: Partial<Formation> = {}): Formation => ({
  id,
  intitule: `Formation ${id}`,
  niveau: 'CAP',
  annee: '2025-2026',
  referentielId: 'ref-test',
  dateDebut: '2025-09-01',
  dateFin: '2026-08-31',
  lieuId: 'eta-test',
  periodes: [],
  periodesCentre: [],
  ...patch,
});

describe('evaluerVerrouModeleActivites', () => {
  it('ne verrouille pas la suppression si aucune formation ne rattache le modèle', () => {
    const r = evaluerVerrouModeleActivites('act-1', [formation('f-1')]);
    expect(r.verrouille).toBe(false);
    expect(r.nbFormationsRattachees).toBe(0);
  });

  it('verrouille la suppression si au moins une formation rattache le modèle', () => {
    const r = evaluerVerrouModeleActivites('act-1', [
      formation('f-1', { modeleActivitesId: 'act-1' }),
      formation('f-2', { modeleActivitesId: 'act-1' }),
      formation('f-3', { modeleActivitesId: 'act-autre' }),
    ]);
    expect(r.verrouille).toBe(true);
    expect(r.nbFormationsRattachees).toBe(2);
    expect(r.raison).toMatch(/^2 formations/);
  });
});

describe('peutRemplacerModele', () => {
  it('autorise le réimport si les formations rattachées sont en mode compétences', () => {
    const r = peutRemplacerModele('act-1', [formation('f-1', { modeleActivitesId: 'act-1' })]);
    expect(r.ok).toBe(true);
  });

  it('bloque le réimport si une formation rattachée est en mode activités (le mapping serait perdu)', () => {
    const r = peutRemplacerModele('act-1', [
      formation('f-1', { modeleActivitesId: 'act-1', modeEvaluation: 'activites' }),
    ]);
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(/mode activités/i);
  });
});
