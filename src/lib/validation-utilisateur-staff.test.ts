import { describe, expect, it } from 'vitest';
import { type SaisieStaff, validerSaisieStaff } from './validation-utilisateur-staff';

const STAFF_VALIDE: SaisieStaff = {
  prenom: 'Hélène',
  nom: 'ROCHE',
  email: 'helene.roche@demo.fr',
  telephone: '01 99 99 99 22',
};

describe('validerSaisieStaff', () => {
  it('valide une saisie correcte (sans entreprise ni fonction)', () => {
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

  it("n'exige ni entreprise ni fonction par défaut (formateur, coordo)", () => {
    const r = validerSaisieStaff({
      ...STAFF_VALIDE,
      entreprise: undefined,
      fonction: undefined,
    });
    expect(r.ok).toBe(true);
  });

  it('exige entreprise ET fonction quand `exigeEntreprise` est true (cas maître)', () => {
    const r = validerSaisieStaff({ ...STAFF_VALIDE }, true);
    expect(r.ok).toBe(false);
    expect(r.erreurs.entreprise).toBeDefined();
    expect(r.erreurs.fonction).toBeDefined();
  });

  it('refuse un maître si seule la fonction est renseignée (entreprise manquante)', () => {
    const r = validerSaisieStaff({ ...STAFF_VALIDE, fonction: 'Chef de cuisine' }, true);
    expect(r.ok).toBe(false);
    expect(r.erreurs.entreprise).toBeDefined();
    expect(r.erreurs.fonction).toBeUndefined();
  });

  it("refuse un maître si seule l'entreprise est renseignée (fonction manquante)", () => {
    const r = validerSaisieStaff({ ...STAFF_VALIDE, entreprise: 'Le Gourmet' }, true);
    expect(r.ok).toBe(false);
    expect(r.erreurs.fonction).toBeDefined();
    expect(r.erreurs.entreprise).toBeUndefined();
  });

  it('valide un maître quand entreprise et fonction sont fournies', () => {
    const r = validerSaisieStaff(
      { ...STAFF_VALIDE, entreprise: 'Le Gourmet', fonction: 'Chef de cuisine' },
      true,
    );
    expect(r.ok).toBe(true);
  });
});
