import { describe, expect, it } from 'vitest';
import type { Apprenti } from '@/types';
import { evaluerVerrouFormation } from './formation-verrou';

const apprenti = (id: string, formationId: string): Apprenti => ({
  id,
  role: 'apprenti',
  prenom: 'X',
  nom: 'Y',
  email: 'x.y@demo.fr',
  dateNaissance: '2005-01-01',
  formationId,
  entrepriseId: 'e-x',
  maitreApprentissageId: 'u-maitre-x',
  formateurReferentId: 'u-formateur-x',
  contratDebut: '2025-09-01',
  contratFin: '2027-08-31',
});

describe('evaluerVerrouFormation', () => {
  it("ne verrouille pas la suppression si aucun·e apprenti·e n'est rattaché·e", () => {
    const r = evaluerVerrouFormation('f-cap-cuisine-2025', []);
    expect(r.verrouille).toBe(false);
  });

  it('verrouille la suppression si au moins 1 apprenti·e est rattaché·e', () => {
    const r = evaluerVerrouFormation('f-cap-cuisine-2025', [apprenti('u-1', 'f-cap-cuisine-2025')]);
    expect(r.verrouille).toBe(true);
    expect(r.nbApprentisRattaches).toBe(1);
    expect(r.raison).toMatch(/1 apprenti/i);
  });

  it('compte correctement les apprenti·e·s rattaché·e·s à cette formation seulement', () => {
    const r = evaluerVerrouFormation('f-cap-cuisine-2025', [
      apprenti('u-1', 'f-cap-cuisine-2025'),
      apprenti('u-2', 'f-cap-cuisine-2025'),
      apprenti('u-3', 'f-autre'),
    ]);
    expect(r.verrouille).toBe(true);
    expect(r.nbApprentisRattaches).toBe(2);
    expect(r.raison).toMatch(/2 apprenti/i);
  });

  it('utilise un suffixe pluriel cohérent avec le pattern CDC', () => {
    const r1 = evaluerVerrouFormation('f-x', [apprenti('u-1', 'f-x')]);
    const r2 = evaluerVerrouFormation('f-x', [apprenti('u-1', 'f-x'), apprenti('u-2', 'f-x')]);
    expect(r1.raison).toMatch(/apprenti·e\b/);
    expect(r2.raison).toMatch(/apprenti·e·s/);
  });
});
