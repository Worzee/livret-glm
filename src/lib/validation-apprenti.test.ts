import { describe, expect, it } from 'vitest';
import { type SaisieApprenti, validerSaisieApprenti } from './validation-apprenti';

const VALIDE: SaisieApprenti = {
  prenom: 'Sarah',
  nom: 'TURC',
  email: 'sarah.turc@demo.fr',
  telephone: '01 23 45 67 89',
  dateNaissance: '2008-03-12',
  contratDebut: '2025-09-01',
  contratFin: '2027-08-31',
  formationId: 'f-cap-cuisine-2025',
  entrepriseId: 'e-le-gourmet',
  maitreApprentissageId: 'u-maitre-karim',
  formateurReferentId: 'u-formateur-sophie',
};

describe('validerSaisieApprenti', () => {
  it('valide une saisie correcte', () => {
    const r = validerSaisieApprenti(VALIDE);
    expect(r.ok).toBe(true);
    expect(r.erreurs).toEqual({});
  });

  it('exige prénom et nom non vides', () => {
    const r = validerSaisieApprenti({ ...VALIDE, prenom: '', nom: '   ' });
    expect(r.ok).toBe(false);
    expect(r.erreurs.prenom).toBeDefined();
    expect(r.erreurs.nom).toBeDefined();
  });

  it('exige un email au format valide', () => {
    expect(validerSaisieApprenti({ ...VALIDE, email: '' }).erreurs.email).toBeDefined();
    expect(validerSaisieApprenti({ ...VALIDE, email: 'pas-un-email' }).erreurs.email).toBeDefined();
    expect(validerSaisieApprenti({ ...VALIDE, email: 'a@b.c' }).erreurs.email).toBeUndefined();
  });

  it('exige les 3 dates (naissance + début + fin de contrat)', () => {
    expect(
      validerSaisieApprenti({ ...VALIDE, dateNaissance: '' }).erreurs.dateNaissance,
    ).toBeDefined();
    expect(
      validerSaisieApprenti({ ...VALIDE, contratDebut: '' }).erreurs.contratDebut,
    ).toBeDefined();
    expect(
      validerSaisieApprenti({ ...VALIDE, contratFin: '' }).erreurs.contratFin,
    ).toBeDefined();
  });

  it('refuse une fin de contrat antérieure ou égale au début', () => {
    expect(
      validerSaisieApprenti({ ...VALIDE, contratFin: '2025-09-01' }).erreurs.contratFin,
    ).toBeDefined();
    expect(
      validerSaisieApprenti({ ...VALIDE, contratFin: '2025-08-31' }).erreurs.contratFin,
    ).toBeDefined();
  });

  it('refuse un·e apprenti·e de moins de 15 ans à la date de début de contrat', () => {
    const r = validerSaisieApprenti({
      ...VALIDE,
      dateNaissance: '2014-01-01', // 11 ans en 2025-09
      contratDebut: '2025-09-01',
    });
    expect(r.ok).toBe(false);
    expect(r.erreurs.dateNaissance).toContain('au moins 15 ans');
  });

  it("avertit (sans bloquer) pour un âge supérieur à 29 ans — dérogations RQTH/sportif/etc.", () => {
    const r = validerSaisieApprenti({
      ...VALIDE,
      dateNaissance: '1988-01-20', // 37 ans en 2025-09
      contratDebut: '2025-09-01',
    });
    // Pas une erreur bloquante : la sauvegarde reste possible.
    expect(r.ok).toBe(true);
    expect(r.erreurs.dateNaissance).toBeUndefined();
    // Mais un avertissement explicite est levé pour vérification.
    expect(r.avertissements.dateNaissance).toContain('29 ans');
    expect(r.avertissements.dateNaissance).toMatch(/RQTH|dérogation/i);
  });

  it("ne lève pas d'avertissement pour un âge ∈ [15, 29] ans", () => {
    const r = validerSaisieApprenti(VALIDE); // 17 ans en 2025-09
    expect(r.avertissements.dateNaissance).toBeUndefined();
  });

  it("exige les 4 affectations à la création (formation, maître, formateur, entreprise)", () => {
    const sansAffectation: SaisieApprenti = {
      ...VALIDE,
      formationId: '',
      maitreApprentissageId: '',
      formateurReferentId: '',
      entrepriseId: '',
    };
    const r = validerSaisieApprenti(sansAffectation);
    expect(r.erreurs.formationId).toBeDefined();
    expect(r.erreurs.maitreApprentissageId).toBeDefined();
    expect(r.erreurs.formateurReferentId).toBeDefined();
    expect(r.erreurs.entrepriseId).toBeDefined();
  });

  it('accepte un second maître / tuteur différent du principal (juin 2026)', () => {
    const r = validerSaisieApprenti({
      ...VALIDE,
      maitreApprentissageSecondId: 'u-maitre-helene',
    });
    expect(r.ok).toBe(true);
    expect(r.erreurs.maitreApprentissageSecondId).toBeUndefined();
  });

  it('refuse un second maître / tuteur identique au principal', () => {
    const r = validerSaisieApprenti({
      ...VALIDE,
      maitreApprentissageSecondId: VALIDE.maitreApprentissageId,
    });
    expect(r.ok).toBe(false);
    expect(r.erreurs.maitreApprentissageSecondId).toMatch(/différent du principal/i);
  });
});
