import { describe, expect, it } from 'vitest';
import { type SaisieFormation, validerSaisieFormation } from './validation-formation';

const FORMATION_VALIDE: SaisieFormation = {
  intitule: 'CAP Cuisine',
  niveau: 'CAP',
  annee: '2025-2026',
  referentielId: 'ref-cap-cuisine',
  dateDebut: '2025-09-02',
  dateFin: '2027-09-01',
  lieuId: 'eta-site-diderot',
};

describe('validerSaisieFormation', () => {
  it('valide une saisie correcte complète', () => {
    const r = validerSaisieFormation(FORMATION_VALIDE);
    expect(r.ok).toBe(true);
    expect(r.erreurs).toEqual({});
  });

  it("exige l'intitulé non vide", () => {
    expect(
      validerSaisieFormation({ ...FORMATION_VALIDE, intitule: '' }).erreurs.intitule,
    ).toBeDefined();
    expect(
      validerSaisieFormation({ ...FORMATION_VALIDE, intitule: '   ' }).erreurs.intitule,
    ).toBeDefined();
  });

  it('exige le niveau non vide', () => {
    expect(
      validerSaisieFormation({ ...FORMATION_VALIDE, niveau: '' }).erreurs.niveau,
    ).toBeDefined();
  });

  it("exige l'année non vide", () => {
    expect(validerSaisieFormation({ ...FORMATION_VALIDE, annee: '' }).erreurs.annee).toBeDefined();
  });

  it("avertit sans bloquer si l'année n'est pas au format YYYY-YYYY", () => {
    const r = validerSaisieFormation({ ...FORMATION_VALIDE, annee: '2025/2026' });
    expect(r.ok).toBe(true);
    expect(r.avertissements.annee).toBeDefined();
  });

  it('exige les deux dates et leur cohérence (fin > début)', () => {
    expect(
      validerSaisieFormation({ ...FORMATION_VALIDE, dateDebut: '' }).erreurs.dateDebut,
    ).toBeDefined();
    expect(
      validerSaisieFormation({ ...FORMATION_VALIDE, dateFin: '' }).erreurs.dateFin,
    ).toBeDefined();
    const r = validerSaisieFormation({
      ...FORMATION_VALIDE,
      dateDebut: '2027-01-01',
      dateFin: '2025-09-01',
    });
    expect(r.ok).toBe(false);
    expect(r.erreurs.dateFin).toMatch(/postérieure/i);
  });

  it("n'exige PAS le référentiel mais signale un avertissement quand absent", () => {
    const r = validerSaisieFormation({ ...FORMATION_VALIDE, referentielId: '' });
    expect(r.ok).toBe(true);
    expect(r.erreurs.referentielId).toBeUndefined();
    expect(r.avertissements.referentielId).toBeDefined();
  });

  it('exige un lieu de formation (lieuId non vide)', () => {
    const r = validerSaisieFormation({ ...FORMATION_VALIDE, lieuId: '' });
    expect(r.ok).toBe(false);
    expect(r.erreurs.lieuId).toMatch(/lieu de formation/i);
  });

  it("rejette un lieuId composé uniquement d'espaces", () => {
    const r = validerSaisieFormation({ ...FORMATION_VALIDE, lieuId: '   ' });
    expect(r.ok).toBe(false);
    expect(r.erreurs.lieuId).toBeDefined();
  });
});
