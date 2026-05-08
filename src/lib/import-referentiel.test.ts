import { describe, expect, it } from 'vitest';
import {
  construireReferentiel,
  decoderTexteCsv,
  detecterNiveauxColonnes,
  detecterSeparateur,
  importerReferentielDepuisBuffer,
  importerReferentielDepuisTexte,
  parserCsv,
} from './import-referentiel';

// ─────────────────────────────────────────────────────────────────────────────
// Encodage
// ─────────────────────────────────────────────────────────────────────────────

describe('decoderTexteCsv', () => {
  it("décode un buffer UTF-8 valide", () => {
    const enc = new TextEncoder();
    const buf = enc.encode('Compétence;Niveau').buffer;
    const r = decoderTexteCsv(buf);
    expect(r.encodageUtilise).toBe('utf-8');
    expect(r.texte).toBe('Compétence;Niveau');
  });

  it("retombe sur Windows-1252 si l'UTF-8 n'est pas valide", () => {
    // Octets CP1252 non-valides en UTF-8 : é = 0xE9 (impossible en UTF-8)
    const buf = new Uint8Array([0x43, 0x6f, 0x6d, 0x70, 0xe9, 0x74, 0x65, 0x6e, 0x63, 0x65]).buffer; // "Compétence" CP1252
    const r = decoderTexteCsv(buf);
    expect(r.encodageUtilise).toBe('windows-1252');
    expect(r.texte).toBe('Compétence');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Séparateur
// ─────────────────────────────────────────────────────────────────────────────

describe('detecterSeparateur', () => {
  it("détecte le point-virgule comme séparateur dominant", () => {
    expect(detecterSeparateur('a;b;c\nd;e;f')).toBe(';');
  });

  it("détecte la virgule", () => {
    expect(detecterSeparateur('a,b,c\nd,e,f')).toBe(',');
  });

  it("détecte la tabulation", () => {
    expect(detecterSeparateur('a\tb\tc\nd\te\tf')).toBe('\t');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Parsing CSV
// ─────────────────────────────────────────────────────────────────────────────

describe('parserCsv', () => {
  it("parse un CSV simple avec point-virgule", () => {
    const r = parserCsv('a;b;c\n1;2;3');
    expect(r).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it("ignore les lignes vides", () => {
    const r = parserCsv('a;b\n\n\nc;d');
    expect(r).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it("respecte les guillemets contenant le séparateur", () => {
    const r = parserCsv('"a;a";b\nc;"d;d"');
    expect(r).toEqual([
      ['a;a', 'b'],
      ['c', 'd;d'],
    ]);
  });

  it("retire le BOM UTF-8 en tête de fichier", () => {
    const r = parserCsv('﻿a;b\n1;2');
    expect(r[0]).toEqual(['a', 'b']);
  });

  it("trime les espaces autour des champs", () => {
    const r = parserCsv('  a  ;  b  \n c ; d ');
    expect(r).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Détection 2 vs 3 colonnes
// ─────────────────────────────────────────────────────────────────────────────

describe('detecterNiveauxColonnes', () => {
  it("détecte 2 colonnes quand chaque ligne en a 2", () => {
    const lignes = [
      ['Bloc', 'Compétence'],
      ['BC01', 'Compétence A'],
      ['BC01', 'Compétence B'],
    ];
    expect(detecterNiveauxColonnes(lignes)).toBe(2);
  });

  it("détecte 3 colonnes quand chaque ligne en a 3", () => {
    const lignes = [
      ['Domaine', 'Compétence', 'Sous-compétence'],
      ['A1.1', 'CO', 'Reconnaître…'],
      ['A1.1', 'CO', 'Comprendre…'],
    ];
    expect(detecterNiveauxColonnes(lignes)).toBe(3);
  });

  it("retourne 2 sur un fichier vide ou minimal", () => {
    expect(detecterNiveauxColonnes([])).toBe(2);
    expect(detecterNiveauxColonnes([['en-tête']])).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Construction du Referentiel — cas 2 colonnes
// ─────────────────────────────────────────────────────────────────────────────

describe('construireReferentiel — 2 colonnes', () => {
  it("agrège les compétences par bloc", () => {
    const lignes = [
      ['Bloc', 'Compétence'],
      ['BC01', 'Réceptionner'],
      ['BC01', 'Préparer son poste'],
      ['BC02', 'Maîtriser les techniques'],
    ];
    const r = construireReferentiel(
      lignes,
      { nomFormation: 'CAP Test' },
      'utf-8',
      ';',
    );
    expect(r.referentiel.blocs).toHaveLength(2);
    expect(r.referentiel.blocs[0].code).toBe('BC01');
    expect(r.referentiel.blocs[0].competences).toHaveLength(2);
    expect(r.referentiel.blocs[1].competences).toHaveLength(1);
    expect(r.referentiel.niveauxColonnes).toBe(2);
    expect(r.stats.nbBlocs).toBe(2);
    expect(r.stats.nbCompetences).toBe(3);
    expect(r.stats.nbSousFamilles).toBe(0);
  });

  it("ne crée pas de sousFamille en mode 2 colonnes", () => {
    const lignes = [
      ['Bloc', 'Compétence'],
      ['BC01', 'Réceptionner'],
    ];
    const r = construireReferentiel(
      lignes,
      { nomFormation: 'X' },
      'utf-8',
      ';',
    );
    expect(r.referentiel.blocs[0].competences[0].sousFamille).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Construction du Referentiel — cas 3 colonnes (CECRL)
// ─────────────────────────────────────────────────────────────────────────────

describe('construireReferentiel — 3 colonnes (cas CECRL)', () => {
  it("popule sousFamille depuis la 2ème colonne", () => {
    const lignes = [
      ['Domaine', 'Compétence', 'Sous-compétence'],
      ['A1.1', 'Compréhension orale', 'Reconnaître des mots…'],
      ['A1.1', 'Compréhension orale', 'Comprendre des consignes…'],
      ['A1.1', 'Compréhension écrite', 'Reconnaître des mots familiers'],
    ];
    const r = construireReferentiel(
      lignes,
      { nomFormation: 'CECRL Test' },
      'utf-8',
      ';',
    );
    expect(r.referentiel.niveauxColonnes).toBe(3);
    expect(r.referentiel.blocs).toHaveLength(1);
    const bloc = r.referentiel.blocs[0];
    expect(bloc.code).toBe('A1.1');
    expect(bloc.competences).toHaveLength(3);
    expect(bloc.competences[0].sousFamille).toBe('Compréhension orale');
    expect(bloc.competences[1].sousFamille).toBe('Compréhension orale');
    expect(bloc.competences[2].sousFamille).toBe('Compréhension écrite');
    expect(r.stats.nbSousFamilles).toBe(2);
  });

  it("génère des codes et ids uniques par compétence", () => {
    const lignes = [
      ['Domaine', 'Compétence', 'Sous-compétence'],
      ['A1.1', 'CO', 'Sous A'],
      ['A1.1', 'CO', 'Sous B'],
      ['A1.1', 'CE', 'Sous C'],
    ];
    const r = construireReferentiel(
      lignes,
      { nomFormation: 'X' },
      'utf-8',
      ';',
    );
    const ids = r.referentiel.blocs[0].competences.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length); // tous uniques
    expect(ids[0]).toBe('bloc-a1-1-c1');
    expect(ids[2]).toBe('bloc-a1-1-c3');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Robustesse
// ─────────────────────────────────────────────────────────────────────────────

describe('construireReferentiel — robustesse', () => {
  it("ignore les lignes sans code de bloc avec un avertissement", () => {
    const lignes = [
      ['Bloc', 'Compétence'],
      ['', 'Sans bloc'],
      ['BC01', 'OK'],
    ];
    const r = construireReferentiel(
      lignes,
      { nomFormation: 'X' },
      'utf-8',
      ';',
    );
    expect(r.referentiel.blocs).toHaveLength(1);
    expect(r.avertissements.length).toBeGreaterThan(0);
    expect(r.avertissements[0]).toContain('code de bloc');
  });

  it("ignore les lignes sans libellé de compétence", () => {
    const lignes = [
      ['Bloc', 'Compétence'],
      ['BC01', ''],
      ['BC01', 'OK'],
    ];
    const r = construireReferentiel(
      lignes,
      { nomFormation: 'X' },
      'utf-8',
      ';',
    );
    expect(r.referentiel.blocs[0].competences).toHaveLength(1);
    expect(r.avertissements.some((a) => a.includes('libellé'))).toBe(true);
  });

  it("lance une erreur si aucune compétence valide", () => {
    const lignes = [
      ['Bloc', 'Compétence'],
      ['', ''],
    ];
    expect(() =>
      construireReferentiel(lignes, { nomFormation: 'X' }, 'utf-8', ';'),
    ).toThrow();
  });

  it("lance une erreur sur un fichier complètement vide", () => {
    expect(() =>
      construireReferentiel([], { nomFormation: 'X' }, 'utf-8', ';'),
    ).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline texte → Referentiel
// ─────────────────────────────────────────────────────────────────────────────

describe('importerReferentielDepuisTexte', () => {
  it("traite l'exemple complet du CECRL", () => {
    const csv = [
      'Domaine;Compétence;Sous-compétence',
      'A1.1;Compréhension orale;Reconnaître des mots',
      'A1.1;Compréhension orale;Comprendre des consignes',
      'A1.1;Compréhension écrite;Reconnaître des mots familiers',
      'A1;Compréhension orale;Comprendre des mots courants',
      'A2;Expression orale;Communiquer dans des tâches simples',
    ].join('\n');
    const r = importerReferentielDepuisTexte(csv, { nomFormation: 'CECRL' });
    expect(r.referentiel.blocs).toHaveLength(3); // A1.1, A1, A2
    expect(r.referentiel.formation).toBe('CECRL');
    expect(r.referentiel.niveauxColonnes).toBe(3);
    expect(r.referentiel.id).toBe('ref-cecrl');
    expect(r.referentiel.source).toBe('import-csv');
  });

  it("conserve l'ordre d'apparition des blocs", () => {
    const csv = 'B;C\nB3;X\nB1;Y\nB2;Z';
    const r = importerReferentielDepuisTexte(csv, { nomFormation: 'X' });
    expect(r.referentiel.blocs.map((b) => b.code)).toEqual(['B3', 'B1', 'B2']);
  });
});

describe('importerReferentielDepuisBuffer — encodage CP1252', () => {
  it("décode un CSV en Windows-1252 (cas Excel FR)", () => {
    // Construit un buffer CP1252 à la main
    const csvCp1252 = new Uint8Array([
      // "Domaine;Compétence;Sous-compétence\n"
      0x44, 0x6f, 0x6d, 0x61, 0x69, 0x6e, 0x65, 0x3b,
      0x43, 0x6f, 0x6d, 0x70, 0xe9, 0x74, 0x65, 0x6e, 0x63, 0x65, 0x3b,
      0x53, 0x6f, 0x75, 0x73, 0x2d, 0x63, 0x6f, 0x6d, 0x70, 0xe9, 0x74, 0x65, 0x6e, 0x63, 0x65, 0x0a,
      // "A1;CO;Hello\n"
      0x41, 0x31, 0x3b, 0x43, 0x4f, 0x3b, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x0a,
    ]).buffer;
    const r = importerReferentielDepuisBuffer(csvCp1252, { nomFormation: 'X' });
    expect(r.stats.encodageUtilise).toBe('windows-1252');
    expect(r.referentiel.blocs[0].competences[0].libelle).toBe('Hello');
    expect(r.referentiel.blocs[0].competences[0].sousFamille).toBe('CO');
  });
});
