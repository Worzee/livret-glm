// @vitest-environment node
// Même contrainte que parser-xlsx.test.ts : fflate manipule des Uint8Array
// que jsdom altère subtilement — le round-trip zipSync/unzipSync ne marche
// que sous Node pur. Le runtime applicatif (navigateur réel) n'est pas
// concerné, c'est une particularité du shim jsdom.

import { describe, expect, it } from 'vitest';
import { genererXlsx, isoEnSerialExcel } from './generer-xlsx-modele';
import { parserXlsxBuffer } from './parser-xlsx';

/**
 * Tests d'intégration : on génère un XLSX puis on le re-parse avec le
 * parser existant. Si le format est conforme, le round-trip retrouve les
 * mêmes données.
 */

function roundTrip(modele: Parameters<typeof genererXlsx>[0]): string[][] {
  const bytes = genererXlsx(modele);
  // Les Uint8Array de fflate ne sont pas systématiquement alloués sur leur
  // propre ArrayBuffer (peuvent être une vue sur un buffer pool). On
  // recopie pour s'assurer d'avoir un ArrayBuffer non partagé compatible
  // avec parserXlsxBuffer.
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return parserXlsxBuffer(ab);
}

describe('genererXlsx', () => {
  it('refuse un modèle sans aucune colonne', () => {
    expect(() => genererXlsx({ entetes: [] })).toThrow(/au moins une colonne/);
  });

  it('génère un XLSX parsable avec une seule ligne d’en-têtes', () => {
    const lignes = roundTrip({ entetes: ['Prénom', 'Nom', 'Email'] });
    expect(lignes).toEqual([['Prénom', 'Nom', 'Email']]);
  });

  it('inclut les lignes d’exemple à la suite des en-têtes', () => {
    const lignes = roundTrip({
      entetes: ['Prénom', 'Nom', 'Email'],
      exemples: [
        ['Léa', 'MARTIN', 'lea@demo.fr'],
        ['Théo', 'DUBOIS', 'theo@demo.fr'],
      ],
    });
    expect(lignes).toHaveLength(3);
    expect(lignes[1]).toEqual(['Léa', 'MARTIN', 'lea@demo.fr']);
    expect(lignes[2]).toEqual(['Théo', 'DUBOIS', 'theo@demo.fr']);
  });

  it('échappe correctement les caractères XML spéciaux dans les valeurs', () => {
    const lignes = roundTrip({
      entetes: ['Champ'],
      exemples: [['A & B'], ['<balise>'], ['"guillemets" et \'apostrophes\'']],
    });
    expect(lignes[1]?.[0]).toBe('A & B');
    expect(lignes[2]?.[0]).toBe('<balise>');
    expect(lignes[3]?.[0]).toBe('"guillemets" et \'apostrophes\'');
  });

  it('préserve les espaces de tête / de fin dans les cellules', () => {
    const lignes = roundTrip({
      entetes: ['Texte'],
      exemples: [['  espacé  ']],
    });
    expect(lignes[1]?.[0]).toBe('  espacé  ');
  });

  it('génère plus de 26 colonnes (transition A→Z puis AA)', () => {
    const entetes = Array.from({ length: 28 }, (_, i) => `Col${i + 1}`);
    const lignes = roundTrip({ entetes });
    expect(lignes[0]).toHaveLength(28);
    expect(lignes[0]?.[25]).toBe('Col26'); // colonne Z
    expect(lignes[0]?.[26]).toBe('Col27'); // colonne AA
    expect(lignes[0]?.[27]).toBe('Col28'); // colonne AB
  });

  it('produit un buffer non vide qui commence par la signature ZIP (PK)', () => {
    const bytes = genererXlsx({ entetes: ['A'] });
    expect(bytes.length).toBeGreaterThan(0);
    expect(bytes[0]).toBe(0x50); // 'P'
    expect(bytes[1]).toBe(0x4b); // 'K'
  });
});

describe('isoEnSerialExcel', () => {
  it('convertit la date pivot 1970-01-01 vers le serial 25569', () => {
    expect(isoEnSerialExcel('1970-01-01')).toBe(25569);
  });

  it('convertit 2025-09-02 vers son serial Excel correct', () => {
    // Vérification croisée avec Excel : 2025-09-02 = 45902.
    expect(isoEnSerialExcel('2025-09-02')).toBe(45902);
  });

  it('retourne null pour une chaîne non ISO', () => {
    expect(isoEnSerialExcel('20/01/1988')).toBeNull();
    expect(isoEnSerialExcel('')).toBeNull();
    expect(isoEnSerialExcel('hello')).toBeNull();
  });
});

describe('genererXlsx avec colonnesDate', () => {
  it('écrit les cellules date en numérique (parser retourne le serial brut)', () => {
    // Quand la cellule a un format date Excel (s="1"), le parser-xlsx
    // existant retourne la valeur numérique brute (le serial), pas une
    // chaîne ISO. C'est l'appelant qui re-convertit (cf. import-utilisateurs).
    const bytes = genererXlsx({
      entetes: ['Prénom', 'Date'],
      exemples: [['Léa', '2025-09-02']],
      colonnesDate: [1],
    });
    const ab = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(ab).set(bytes);
    const lignes = parserXlsxBuffer(ab);
    expect(lignes[1][0]).toBe('Léa');
    // 2025-09-02 → serial 45902
    expect(lignes[1][1]).toBe('45902');
  });

  it('garde les en-têtes en texte même pour les colonnes date', () => {
    const bytes = genererXlsx({
      entetes: ['Date de naissance'],
      exemples: [['2007-04-15']],
      colonnesDate: [0],
    });
    const ab = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(ab).set(bytes);
    const lignes = parserXlsxBuffer(ab);
    expect(lignes[0][0]).toBe('Date de naissance');
  });

  it("retombe en cellule texte si la valeur d'exemple n'est pas une date ISO valide", () => {
    const bytes = genererXlsx({
      entetes: ['Date'],
      exemples: [['à remplir']],
      colonnesDate: [0],
    });
    const ab = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(ab).set(bytes);
    const lignes = parserXlsxBuffer(ab);
    expect(lignes[1][0]).toBe('à remplir');
  });
});
