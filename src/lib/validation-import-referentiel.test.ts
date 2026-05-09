import { describe, expect, it } from 'vitest';
import {
  type SaisieImportReferentiel,
  validerSaisieImportReferentiel,
} from './validation-import-referentiel';

const SAISIE_VALIDE: SaisieImportReferentiel = {
  nomFormation: 'CECRL Anglais B2',
  contenuCsv: 'Domaine;Compétence;Sous-compétence\nA1.1;CO;Reconnaître des mots',
};

describe('validerSaisieImportReferentiel', () => {
  it('valide une saisie correcte (nom + contenu CSV non vide)', () => {
    const r = validerSaisieImportReferentiel(SAISIE_VALIDE);
    expect(r.ok).toBe(true);
    expect(r.erreurs).toEqual({});
  });

  it('exige un nom de formation non vide', () => {
    expect(
      validerSaisieImportReferentiel({ ...SAISIE_VALIDE, nomFormation: '' }).erreurs.nomFormation,
    ).toBeDefined();
    expect(
      validerSaisieImportReferentiel({ ...SAISIE_VALIDE, nomFormation: '   ' }).erreurs.nomFormation,
    ).toBeDefined();
  });

  it('exige un contenu CSV non vide', () => {
    expect(
      validerSaisieImportReferentiel({ ...SAISIE_VALIDE, contenuCsv: '' }).erreurs.contenuCsv,
    ).toBeDefined();
    expect(
      validerSaisieImportReferentiel({ ...SAISIE_VALIDE, contenuCsv: '   \n  ' }).erreurs.contenuCsv,
    ).toBeDefined();
  });

  it("avertit si le nom est très court (< 3 caractères) sans bloquer", () => {
    const r = validerSaisieImportReferentiel({ ...SAISIE_VALIDE, nomFormation: 'AB' });
    expect(r.ok).toBe(true);
    expect(r.avertissements.nomFormation).toBeDefined();
  });

  it('accumule plusieurs erreurs', () => {
    const r = validerSaisieImportReferentiel({ nomFormation: '', contenuCsv: '' });
    expect(r.ok).toBe(false);
    expect(r.erreurs.nomFormation).toBeDefined();
    expect(r.erreurs.contenuCsv).toBeDefined();
  });
});
