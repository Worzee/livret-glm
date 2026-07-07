import { describe, expect, it } from 'vitest';
import type { FicheSuiviPeriode } from '@/types';
import {
  type SaisieFichePeriode,
  validerSaisieFichePeriode,
  peutSupprimerFichePeriode,
  libelleFichePeriode,
} from './validation-fiche-periode';

const fiche = (
  numero: number,
  dateDebut: string,
  dateFin: string,
  etat: FicheSuiviPeriode['etat'] = 'brouillon',
): FicheSuiviPeriode => ({
  id: `f-${numero}`,
  numeroPeriode: numero,
  dateDebut,
  dateFin,
  suiviGretaCfa: {},
  suiviEntreprise: [],
  observations: {},
  signatures: {
    apprenti: { signe: false },
    maitre: { signe: false },
    formateur: { signe: false },
  },
  etat,
  historiqueDeverrouillages: [],
});

const SAISIE_VALIDE: SaisieFichePeriode = {
  titre: '',
  dateDebut: '2025-09-01',
  dateFin: '2025-12-15',
};

describe('validerSaisieFichePeriode', () => {
  it('valide une saisie sans titre (titre optionnel)', () => {
    const r = validerSaisieFichePeriode(SAISIE_VALIDE, [], true);
    expect(r.ok).toBe(true);
  });

  it('valide une saisie avec un titre', () => {
    const r = validerSaisieFichePeriode({ ...SAISIE_VALIDE, titre: 'Stage automne' }, [], true);
    expect(r.ok).toBe(true);
  });

  it('exige les dates non vides', () => {
    expect(
      validerSaisieFichePeriode({ ...SAISIE_VALIDE, dateDebut: '' }, [], true).erreurs.dateDebut,
    ).toBeDefined();
    expect(
      validerSaisieFichePeriode({ ...SAISIE_VALIDE, dateFin: '' }, [], true).erreurs.dateFin,
    ).toBeDefined();
  });

  it('exige dateFin > dateDebut (R11)', () => {
    const r = validerSaisieFichePeriode(
      { ...SAISIE_VALIDE, dateDebut: '2025-12-01', dateFin: '2025-09-01' },
      [],
      true,
    );
    expect(r.ok).toBe(false);
    expect(r.erreurs.dateFin).toMatch(/postérieure/i);
  });

  it('refuse un chevauchement avec une fiche existante (R12)', () => {
    // Fiche signée pour éviter R13 et tester R12 isolément
    const existante = fiche(1, '2025-09-01', '2025-12-15', 'signee');
    const r = validerSaisieFichePeriode(
      { titre: '', dateDebut: '2025-12-01', dateFin: '2026-02-01' },
      [existante],
      true,
    );
    expect(r.ok).toBe(false);
    expect(r.erreurs.dateDebut).toMatch(/chevauche/i);
  });

  it("autorise la modification d'une fiche existante (chevauchement avec elle-même ignoré)", () => {
    const existante = fiche(1, '2025-09-01', '2025-12-15');
    const r = validerSaisieFichePeriode(
      { ...SAISIE_VALIDE, dateDebut: '2025-09-15', dateFin: '2025-12-30' },
      [existante],
      true,
      'f-1', // id de la fiche en édition → on l'exclut du test de chevauchement
    );
    expect(r.ok).toBe(true);
  });

  it("refuse la création quand l'entretien tripartite n'est pas initialisé (R13)", () => {
    const r = validerSaisieFichePeriode(SAISIE_VALIDE, [], false);
    expect(r.ok).toBe(false);
    expect(r.erreurs.dateDebut).toMatch(/entretien tripartite/i);
  });

  it("autorise la création si la N-1 n'est pas signée, mais propage un avertissement R14 sur dateDebut", () => {
    const enCours = fiche(1, '2025-09-01', '2025-12-15', 'en-cours');
    const r = validerSaisieFichePeriode(
      { ...SAISIE_VALIDE, dateDebut: '2026-01-01', dateFin: '2026-04-01' },
      [enCours],
      true,
    );
    expect(r.ok).toBe(true);
    expect(r.erreurs.dateDebut).toBeUndefined();
    expect(r.avertissements.dateDebut).toMatch(/pas encore été signée/i);
    expect(r.avertissements.dateDebut).toContain('apprenti·e');
  });

  it('autorise la création si la dernière fiche est signée, sans avertissement', () => {
    const signee = fiche(1, '2025-09-01', '2025-12-15', 'signee');
    const r = validerSaisieFichePeriode(
      { ...SAISIE_VALIDE, dateDebut: '2026-01-01', dateFin: '2026-04-01' },
      [signee],
      true,
    );
    expect(r.ok).toBe(true);
    expect(r.avertissements.dateDebut).toBeUndefined();
  });

  it("ne masque pas une erreur de chevauchement par l'avertissement R14", () => {
    // Si dateDebut a déjà une erreur (chevauchement R12), l'avertissement R14
    // ne doit pas l'écraser — l'erreur est plus prioritaire visuellement.
    const enCours = fiche(1, '2025-09-01', '2025-12-15', 'en-cours');
    const r = validerSaisieFichePeriode(
      { ...SAISIE_VALIDE, dateDebut: '2025-12-01', dateFin: '2026-02-01' },
      [enCours],
      true,
    );
    expect(r.ok).toBe(false);
    expect(r.erreurs.dateDebut).toMatch(/chevauche/i);
  });

  it('avertit si le titre est très long sans bloquer', () => {
    const r = validerSaisieFichePeriode({ ...SAISIE_VALIDE, titre: 'A'.repeat(80) }, [], true);
    expect(r.ok).toBe(true);
    expect(r.avertissements.titre).toBeDefined();
  });
});

describe('peutSupprimerFichePeriode', () => {
  it('autorise la suppression si aucune signature et fiche pas verrouillée', () => {
    const r = peutSupprimerFichePeriode(fiche(1, '2025-09-01', '2025-12-15', 'brouillon'));
    expect(r.peut).toBe(true);
  });

  it('refuse si la fiche est verrouillée (R22 ou suppression manuelle)', () => {
    const r = peutSupprimerFichePeriode(fiche(1, '2025-09-01', '2025-12-15', 'verrouillee'));
    expect(r.peut).toBe(false);
    expect(r.raison).toMatch(/verrouillée/i);
  });

  it('refuse si au moins une signature est posée (préserve la chaîne de confiance)', () => {
    const f = fiche(1, '2025-09-01', '2025-12-15', 'en-cours');
    f.signatures.apprenti = { signe: true, dateSignature: '2025-12-20' };
    const r = peutSupprimerFichePeriode(f);
    expect(r.peut).toBe(false);
    expect(r.raison).toMatch(/signature/i);
  });
});

describe('libelleFichePeriode', () => {
  it('retourne « Période N » quand le titre est vide ou absent', () => {
    expect(libelleFichePeriode(fiche(1, '2025-09-01', '2025-12-15'))).toBe('Période 1');
    expect(libelleFichePeriode({ ...fiche(2, '2025-09-01', '2025-12-15'), titre: '' })).toBe(
      'Période 2',
    );
    expect(libelleFichePeriode({ ...fiche(3, '2025-09-01', '2025-12-15'), titre: '   ' })).toBe(
      'Période 3',
    );
  });

  it('retourne « Période N : <titre> » quand le titre est rempli', () => {
    expect(
      libelleFichePeriode({ ...fiche(2, '2025-09-01', '2025-12-15'), titre: 'Stage automne' }),
    ).toBe('Période 2 : Stage automne');
  });
});
