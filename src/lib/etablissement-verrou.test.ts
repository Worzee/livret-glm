import { describe, expect, it } from 'vitest';
import type { Formation } from '@/types';
import { evaluerVerrouEtablissement } from './etablissement-verrou';

const formation = (id: string, lieuId: string): Formation => ({
  id,
  intitule: 'CAP X',
  niveau: 'CAP',
  annee: '2025-2026',
  referentielId: 'ref-x',
  dateDebut: '2025-09-01',
  dateFin: '2027-09-01',
  lieuId,
  periodes: [],
  periodesCentre: [],
});

describe('evaluerVerrouEtablissement', () => {
  it("retourne non verrouillé si aucune formation ne référence l'établissement", () => {
    const r = evaluerVerrouEtablissement('eta-1', [formation('f-1', 'eta-2')]);
    expect(r.verrouille).toBe(false);
    expect(r.nbFormationsRattachees).toBe(0);
    expect(r.raison).toBeUndefined();
  });

  it('compte les formations rattachées et fournit une raison singulier', () => {
    const r = evaluerVerrouEtablissement('eta-1', [formation('f-1', 'eta-1')]);
    expect(r.verrouille).toBe(true);
    expect(r.nbFormationsRattachees).toBe(1);
    expect(r.raison).toMatch(/^1 formation rattachée/);
  });

  it('utilise le pluriel quand plusieurs formations sont rattachées', () => {
    const r = evaluerVerrouEtablissement('eta-1', [
      formation('f-1', 'eta-1'),
      formation('f-2', 'eta-1'),
      formation('f-3', 'eta-2'),
    ]);
    expect(r.verrouille).toBe(true);
    expect(r.nbFormationsRattachees).toBe(2);
    expect(r.raison).toMatch(/^2 formations rattachées/);
  });

  it('retourne 0 quand la liste de formations est vide', () => {
    const r = evaluerVerrouEtablissement('eta-1', []);
    expect(r).toEqual({ verrouille: false, nbFormationsRattachees: 0 });
  });
});
