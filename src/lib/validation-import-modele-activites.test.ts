import { describe, expect, it } from 'vitest';
import type { Formation } from '@/types';
import {
  genererNomModeleActivites,
  validerSaisieImportModele,
} from './validation-import-modele-activites';

const formation: Formation = {
  id: 'f-cap',
  intitule: 'CAP Cuisine',
  niveau: 'CAP',
  annee: '2025-2026',
  referentielId: 'ref-cap-cuisine',
  dateDebut: '2025-09-02',
  dateFin: '2027-09-01',
  lieuId: 'eta-1',
  periodes: [],
  periodesCentre: [],
};

describe('validerSaisieImportModele', () => {
  it('exige une formation cible (le modèle est importé POUR une formation)', () => {
    const r = validerSaisieImportModele({ formationId: '', source: 'texte', contenuCsv: 'x' });
    expect(r.ok).toBe(false);
    expect(r.erreurs.formationId).toMatch(/formation/i);
  });

  it('exige un fichier ou un texte collé', () => {
    const r = validerSaisieImportModele({ formationId: 'f-cap', source: 'fichier' });
    expect(r.ok).toBe(false);
    expect(r.erreurs.contenuCsv).toBeTruthy();
  });

  it('accepte fichier OU texte avec une formation', () => {
    expect(
      validerSaisieImportModele({
        formationId: 'f-cap',
        source: 'fichier',
        nomFichier: 'activites.xlsx',
      }).ok,
    ).toBe(true);
    expect(
      validerSaisieImportModele({
        formationId: 'f-cap',
        source: 'texte',
        contenuCsv: 'Libellé\nRéception',
      }).ok,
    ).toBe(true);
  });
});

describe('genererNomModeleActivites', () => {
  it('génère Activites_<intitulé>_<date>', () => {
    expect(genererNomModeleActivites(formation, new Date('2026-07-06T10:00:00'))).toBe(
      'Activites_CAP Cuisine_2026-07-06',
    );
  });
});
