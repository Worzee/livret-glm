import { describe, expect, it } from 'vitest';
import {
  construireModeleActivites,
  detecterColonnesModele,
  importerModeleDepuisTexte,
} from './import-modele-activites';

const options = { nomModele: 'Activités CAP Cuisine', referentielId: 'ref-cap-cuisine' };

describe('detecterColonnesModele', () => {
  it('3 colonnes dès que l’en-tête (ou une ligne) porte une 3ᵉ colonne', () => {
    expect(
      detecterColonnesModele([
        ['Code', 'Libellé', 'Description'],
        ['A1', 'Réception', ''],
      ]),
    ).toBe(3);
    expect(
      detecterColonnesModele([
        ['Libellé', 'Description'],
        ['Réception', 'Contrôler les livraisons', 'surprise'],
      ]),
    ).toBe(3);
  });

  it('2 colonnes : libellé + description', () => {
    expect(
      detecterColonnesModele([
        ['Libellé', 'Description'],
        ['Réception', 'Contrôler les livraisons'],
      ]),
    ).toBe(2);
  });

  it('1 colonne : libellé seul', () => {
    expect(detecterColonnesModele([['Libellé'], ['Réception']])).toBe(1);
  });
});

describe('construireModeleActivites / importerModeleDepuisTexte', () => {
  it('construit un modèle 3 colonnes (code, libellé, description), mapping vierge', () => {
    const csv = [
      'Code;Libellé;Description',
      'A1;Réception des marchandises;Contrôler et stocker',
      'A2;Mise en place du poste;',
    ].join('\n');
    const rapport = importerModeleDepuisTexte(csv, options);
    expect(rapport.modele.nom).toBe('Activités CAP Cuisine');
    expect(rapport.modele.referentielId).toBe('ref-cap-cuisine');
    expect(rapport.modele.id).toBe('act-activites-cap-cuisine');
    expect(rapport.modele.activites).toHaveLength(2);
    expect(rapport.modele.activites[0]).toEqual({
      id: 'act-activites-cap-cuisine-a1',
      code: 'A1',
      libelle: 'Réception des marchandises',
      description: 'Contrôler et stocker',
      competenceIds: [],
    });
    expect(rapport.modele.activites[1].description).toBeUndefined();
    expect(rapport.stats.nbActivites).toBe(2);
  });

  it('2 colonnes : libellé + description, codes générés A1..An', () => {
    const csv = ['Libellé;Description', 'Réception;Contrôler', 'Production;'].join('\n');
    const rapport = importerModeleDepuisTexte(csv, options);
    expect(rapport.modele.activites.map((a) => a.code)).toEqual(['A1', 'A2']);
    expect(rapport.modele.activites[0].libelle).toBe('Réception');
    expect(rapport.modele.activites[0].description).toBe('Contrôler');
  });

  it('3 colonnes avec code vide : code généré', () => {
    const csv = ['Code;Libellé;Description', ';Réception;Contrôler'].join('\n');
    const rapport = importerModeleDepuisTexte(csv, options);
    expect(rapport.modele.activites[0].code).toBe('A1');
  });

  it('ignore les lignes sans libellé avec un avertissement', () => {
    const csv = ['Code;Libellé;Description', 'A9;;', 'A1;Réception;'].join('\n');
    const rapport = importerModeleDepuisTexte(csv, options);
    expect(rapport.modele.activites).toHaveLength(1);
    expect(rapport.modele.activites[0].libelle).toBe('Réception');
    expect(rapport.avertissements).toHaveLength(1);
    expect(rapport.avertissements[0]).toMatch(/ligne 2/i);
  });

  it('lève une erreur si le fichier est vide ou sans activité valide', () => {
    expect(() => construireModeleActivites([], options, 'utf-8', ';')).toThrow(/vide/i);
    expect(() => construireModeleActivites([['Libellé'], ['']], options, 'utf-8', ';')).toThrow(
      /aucune activité/i,
    );
  });

  it('respecte un id fourni et la source', () => {
    const rapport = importerModeleDepuisTexte('Libellé\nRéception', {
      ...options,
      id: 'act-perso',
      source: 'import-xlsx',
    });
    expect(rapport.modele.id).toBe('act-perso');
    expect(rapport.modele.source).toBe('import-xlsx');
    expect(rapport.modele.activites[0].id).toBe('act-perso-a1');
  });
});
