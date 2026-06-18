import { describe, expect, it } from 'vitest';
import type { Formation } from '@/types';
import { evaluerVerrouReferentiel } from './referentiel-verrou';

const formation = (id: string, referentielId: string): Formation => ({
  id,
  intitule: `Formation ${id}`,
  niveau: 'CAP',
  annee: '2025-2026',
  referentielId,
  dateDebut: '2025-09-01',
  dateFin: '2026-08-31',
  lieuId: 'eta-test',
  periodes: [],
  periodesCentre: [],
  nombreEntretiens: 2,
  questionsRetirees: [],
});

describe('evaluerVerrouReferentiel', () => {
  it("ne verrouille pas la suppression si aucune formation n'est rattachée", () => {
    const r = evaluerVerrouReferentiel('ref-cap-cuisine', []);
    expect(r.verrouille).toBe(false);
    expect(r.nbFormationsRattachees).toBe(0);
  });

  it('verrouille la suppression si au moins 1 formation est rattachée', () => {
    const r = evaluerVerrouReferentiel('ref-cap-cuisine', [formation('f-1', 'ref-cap-cuisine')]);
    expect(r.verrouille).toBe(true);
    expect(r.nbFormationsRattachees).toBe(1);
    expect(r.raison).toMatch(/1 formation/i);
  });

  it('compte uniquement les formations rattachées au référentiel demandé', () => {
    const r = evaluerVerrouReferentiel('ref-cap-cuisine', [
      formation('f-1', 'ref-cap-cuisine'),
      formation('f-2', 'ref-cap-cuisine'),
      formation('f-3', 'ref-autre'),
      formation('f-4', ''), // formation sans référentiel
    ]);
    expect(r.verrouille).toBe(true);
    expect(r.nbFormationsRattachees).toBe(2);
    expect(r.raison).toMatch(/2 formations/i);
  });

  it('utilise un suffixe pluriel lisible', () => {
    const r1 = evaluerVerrouReferentiel('ref-x', [formation('f-1', 'ref-x')]);
    const r2 = evaluerVerrouReferentiel('ref-x', [
      formation('f-1', 'ref-x'),
      formation('f-2', 'ref-x'),
    ]);
    expect(r1.raison).toMatch(/^1 formation\b/);
    expect(r2.raison).toMatch(/^2 formations\b/);
  });
});
