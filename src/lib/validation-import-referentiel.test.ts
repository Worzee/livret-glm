import { describe, expect, it } from 'vitest';
import type { Formation } from '@/types';
import {
  type SaisieImportReferentiel,
  genererNomReferentiel,
  validerSaisieImportReferentiel,
} from './validation-import-referentiel';

const SAISIE_VALIDE: SaisieImportReferentiel = {
  formationId: 'f-cap-cuisine-2025',
  source: 'fichier',
  nomFichier: 'cap-cuisine.csv',
  contenuCsv: 'BLOC;COMPETENCE\nA;1',
};

describe('validerSaisieImportReferentiel', () => {
  it('valide une saisie correcte (formation choisie + fichier sélectionné)', () => {
    const r = validerSaisieImportReferentiel(SAISIE_VALIDE);
    expect(r.ok).toBe(true);
    expect(r.erreurs).toEqual({});
  });

  // Workflow étendu mai 2026 : la formation peut être rattachée plus tard.
  it('accepte une saisie sans formation si un nom libre est fourni', () => {
    const r = validerSaisieImportReferentiel({
      formationId: '',
      nomReferentielLibre: 'Référentiel Boulangerie 2026',
      source: 'fichier',
      nomFichier: 'boulangerie.xlsx',
      contenuCsv: '',
    });
    expect(r.ok).toBe(true);
    expect(r.erreurs).toEqual({});
  });

  it("exige un nom libre quand aucune formation n'est sélectionnée", () => {
    const r = validerSaisieImportReferentiel({
      ...SAISIE_VALIDE,
      formationId: '',
      nomReferentielLibre: '',
    });
    expect(r.ok).toBe(false);
    expect(r.erreurs.nomReferentielLibre).toBeDefined();
  });

  it('rejette un nom libre trop court (< 3 caractères) sans formation', () => {
    const r = validerSaisieImportReferentiel({
      ...SAISIE_VALIDE,
      formationId: '',
      nomReferentielLibre: 'AB',
    });
    expect(r.ok).toBe(false);
    expect(r.erreurs.nomReferentielLibre).toMatch(/3 caractères/);
  });

  it('ignore le nom libre si une formation est choisie (le libellé est auto-généré)', () => {
    // Si formation présente, nomReferentielLibre est ignoré : pas d'erreur, pas
    // d'avertissement. La modale doit cacher le champ dans ce cas.
    const r = validerSaisieImportReferentiel({
      ...SAISIE_VALIDE,
      nomReferentielLibre: '',
    });
    expect(r.ok).toBe(true);
    expect(r.erreurs.nomReferentielLibre).toBeUndefined();
  });

  it('exige une source de données (fichier OU texte non vide)', () => {
    // Source = fichier mais pas de fichier sélectionné
    expect(
      validerSaisieImportReferentiel({
        ...SAISIE_VALIDE,
        source: 'fichier',
        nomFichier: '',
        contenuCsv: '',
      }).erreurs.contenuCsv,
    ).toBeDefined();
    // Source = texte mais textarea vide
    expect(
      validerSaisieImportReferentiel({
        ...SAISIE_VALIDE,
        source: 'texte',
        nomFichier: '',
        contenuCsv: '   \n  ',
      }).erreurs.contenuCsv,
    ).toBeDefined();
  });

  it('accepte source=texte si seulement le contenu CSV est rempli', () => {
    const r = validerSaisieImportReferentiel({
      formationId: 'f-x',
      source: 'texte',
      nomFichier: '',
      contenuCsv: 'BLOC;COMPETENCE\nA;1',
    });
    expect(r.ok).toBe(true);
  });

  it('accepte source=fichier si seulement nomFichier est défini (le buffer est tenu côté UI)', () => {
    const r = validerSaisieImportReferentiel({
      formationId: 'f-x',
      source: 'fichier',
      nomFichier: 'mon.xlsx',
      contenuCsv: '',
    });
    expect(r.ok).toBe(true);
  });
});

describe('genererNomReferentiel', () => {
  const formation = (intitule: string): Formation => ({
    id: 'f-test',
    intitule,
    niveau: 'CAP',
    annee: '2025-2026',
    referentielId: '',
    dateDebut: '2025-09-01',
    dateFin: '2026-08-31',
    lieuId: 'eta-test',
    periodes: [],
    nombreEntretiens: 2,
    questionsRetirees: [],
  });

  it('compose le libellé `Referentiel_<intitulé>_<YYYY-MM-DD>`', () => {
    const dateImport = new Date('2026-05-09T12:00:00Z');
    expect(genererNomReferentiel(formation('CAP Cuisine'), dateImport)).toBe(
      'Referentiel_CAP Cuisine_2026-05-09',
    );
  });

  it("respecte les espaces et accents de l'intitulé (visible humain)", () => {
    const dateImport = new Date('2026-05-09T00:00:00Z');
    expect(genererNomReferentiel(formation('Bac Pro Cuisinier·ère'), dateImport)).toBe(
      'Referentiel_Bac Pro Cuisinier·ère_2026-05-09',
    );
  });

  it("utilise la date du jour quand aucune date n'est fournie", () => {
    const aujourdhui = new Date();
    const yyyy = aujourdhui.getFullYear();
    const mm = String(aujourdhui.getMonth() + 1).padStart(2, '0');
    const dd = String(aujourdhui.getDate()).padStart(2, '0');
    expect(genererNomReferentiel(formation('X'))).toBe(`Referentiel_X_${yyyy}-${mm}-${dd}`);
  });
});
