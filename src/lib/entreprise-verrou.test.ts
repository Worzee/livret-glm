import { describe, expect, it } from 'vitest';
import type { Apprenti } from '@/types';
import { evaluerVerrouEntreprise } from './entreprise-verrou';

function apprenti(id: string, entrepriseId: string): Apprenti {
  return {
    id,
    role: 'apprenti',
    prenom: 'A',
    nom: 'B',
    email: 'a@b.fr',
    telephone: '',
    dateNaissance: '2005-01-01',
    formationId: 'f1',
    entrepriseId,
    maitreApprentissageId: 'm1',
    formateurReferentId: 'fo1',
    contratDebut: '2025-09-01',
    contratFin: '2027-08-31',
  };
}

describe('evaluerVerrouEntreprise', () => {
  it("déverrouille quand aucun·e apprenti·e n'est rattaché·e", () => {
    const v = evaluerVerrouEntreprise('e1', [apprenti('a1', 'e2')]);
    expect(v.verrouille).toBe(false);
    expect(v.nbApprentisRattaches).toBe(0);
    expect(v.raison).toBeUndefined();
  });

  it('verrouille quand au moins un·e apprenti·e est rattaché·e', () => {
    const v = evaluerVerrouEntreprise('e1', [
      apprenti('a1', 'e1'),
      apprenti('a2', 'e1'),
      apprenti('a3', 'e2'),
    ]);
    expect(v.verrouille).toBe(true);
    expect(v.nbApprentisRattaches).toBe(2);
    expect(v.raison).toMatch(/2 apprenti/);
  });
});
