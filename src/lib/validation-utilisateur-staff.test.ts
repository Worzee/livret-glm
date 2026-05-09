import { describe, expect, it } from 'vitest';
import {
  type SaisieStaff,
  validerSaisieStaff,
} from './validation-utilisateur-staff';

const STAFF_VALIDE: SaisieStaff = {
  prenom: 'Hélène',
  nom: 'ROCHE',
  email: 'helene.roche@demo.fr',
  telephone: '01 99 99 99 22',
};

describe('validerSaisieStaff', () => {
  it('valide une saisie correcte (sans entreprise)', () => {
    const r = validerSaisieStaff(STAFF_VALIDE);
    expect(r.ok).toBe(true);
    expect(r.erreurs).toEqual({});
  });

  it('exige prénom et nom non vides', () => {
    const r = validerSaisieStaff({ ...STAFF_VALIDE, prenom: '', nom: '   ' });
    expect(r.ok).toBe(false);
    expect(r.erreurs.prenom).toBeDefined();
    expect(r.erreurs.nom).toBeDefined();
  });

  it('refuse un email mal formé', () => {
    expect(
      validerSaisieStaff({ ...STAFF_VALIDE, email: 'pas-un-email' }).erreurs.email,
    ).toBeDefined();
    expect(validerSaisieStaff({ ...STAFF_VALIDE, email: '' }).erreurs.email).toBeDefined();
  });

  it("n'exige pas d'entrepriseId par défaut (formateur, coordo)", () => {
    const r = validerSaisieStaff({ ...STAFF_VALIDE, entrepriseId: undefined });
    expect(r.ok).toBe(true);
  });

  it("exige un entrepriseId quand `exigeEntreprise` est true (cas maître)", () => {
    const r = validerSaisieStaff({ ...STAFF_VALIDE }, true);
    expect(r.ok).toBe(false);
    expect(r.erreurs.entrepriseId).toBeDefined();
  });

  it('valide un maître quand entrepriseId fourni', () => {
    const r = validerSaisieStaff(
      { ...STAFF_VALIDE, entrepriseId: 'e-le-gourmet' },
      true,
    );
    expect(r.ok).toBe(true);
  });
});
