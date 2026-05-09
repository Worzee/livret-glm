// @vitest-environment node
// Le parser fait du décompression ZIP natif (Uint8Array/ArrayBuffer) que
// jsdom altère subtilement (vu en debug : `unzipSync` retourne des entrées
// fragmentées par octet). Ces tests s'exécutent en Node pur ; le code
// s'exécute évidemment dans le navigateur en runtime, où la primitive est
// la même qu'en Node natif.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import { parserXlsxBuffer } from './parser-xlsx';
import {
  estXlsxBuffer,
  importerReferentielDepuisBuffer,
  importerReferentielDepuisXlsxBuffer,
} from './import-referentiel';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = resolve(__dirname, '__fixtures__');

function chargerFixture(nom: string): ArrayBuffer {
  const buf = readFileSync(resolve(FIXTURES_DIR, nom));
  // Copie pour obtenir un ArrayBuffer pur (pas un view sur un buffer Node).
  const ab = new ArrayBuffer(buf.byteLength);
  new Uint8Array(ab).set(buf);
  return ab;
}

/**
 * Helpers pour générer un xlsx minimal valide en mémoire (pas de dépendance
 * à un fichier sur disque). Notre parser ne lit que `xl/sharedStrings.xml`
 * et `xl/worksheets/sheet1.xml` ; les autres parties d'un xlsx réel sont
 * inutiles ici (Content_Types, rels, workbook.xml).
 */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function colLettre(col: number): string {
  // 0 → A, 25 → Z, 26 → AA — suffisant pour nos référentiels.
  if (col < 26) return String.fromCharCode(65 + col);
  return String.fromCharCode(65 + Math.floor(col / 26) - 1) + String.fromCharCode(65 + (col % 26));
}

function u8ToArrayBuffer(u8: Uint8Array): ArrayBuffer {
  // Copie explicite vers un nouveau ArrayBuffer ; évite les surprises de
  // typage entre `Uint8Array.buffer` (ArrayBufferLike) et notre signature
  // `parserXlsxBuffer(ArrayBuffer)`.
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return ab;
}

function creerXlsxMini(
  sharedStrings: string[],
  lignesIndex: Array<number[]>,
): ArrayBuffer {
  const sst =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    sharedStrings.map((s) => `<si><t>${escapeXml(s)}</t></si>`).join('') +
    `</sst>`;
  const rows = lignesIndex
    .map((ligne, i) => {
      const r = i + 1;
      if (ligne.length === 0) return `<row r="${r}"/>`;
      const cells = ligne
        .map((idx, c) => `<c r="${colLettre(c)}${r}" t="s"><v>${idx}</v></c>`)
        .join('');
      return `<row r="${r}">${cells}</row>`;
    })
    .join('');
  const sheet =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetData>${rows}</sheetData>` +
    `</worksheet>`;
  const archive = zipSync({
    'xl/sharedStrings.xml': strToU8(sst),
    'xl/worksheets/sheet1.xml': strToU8(sheet),
  });
  return u8ToArrayBuffer(archive);
}

describe('parserXlsxBuffer', () => {
  it('parse un xlsx 3 colonnes — Bloc / Compétence / Sous-compétence', () => {
    const strings = [
      'BLOC',
      'COMPETENCE',
      'SOUS-COMPETENCE',
      'BLOC 1',
      'COMPETENCE 1',
      'SOUS-COMPETENCE 1',
    ];
    const xlsx = creerXlsxMini(strings, [
      [0, 1, 2],
      [3, 4, 5],
    ]);
    expect(parserXlsxBuffer(xlsx)).toEqual([
      ['BLOC', 'COMPETENCE', 'SOUS-COMPETENCE'],
      ['BLOC 1', 'COMPETENCE 1', 'SOUS-COMPETENCE 1'],
    ]);
  });

  it('parse un xlsx 2 colonnes — Bloc / Compétence (cas Pronote sans sous-niveau)', () => {
    const strings = ['BLOC', 'COMPETENCE', 'BLOC 1', 'COMPETENCE 1', 'COMPETENCE 2'];
    const xlsx = creerXlsxMini(strings, [
      [0, 1],
      [2, 3],
      [2, 4],
    ]);
    expect(parserXlsxBuffer(xlsx)).toEqual([
      ['BLOC', 'COMPETENCE'],
      ['BLOC 1', 'COMPETENCE 1'],
      ['BLOC 1', 'COMPETENCE 2'],
    ]);
  });

  it('ignore les lignes entièrement vides', () => {
    const strings = ['A', 'B', 'C'];
    const xlsx = creerXlsxMini(strings, [[0, 1], [], [2]]);
    const lignes = parserXlsxBuffer(xlsx);
    expect(lignes).toHaveLength(2);
    expect(lignes[0]).toEqual(['A', 'B']);
    expect(lignes[1]).toEqual(['C']);
  });

  it('décode les entités XML (esperluette, apostrophe)', () => {
    const strings = ['M&S', "L'autre"];
    const xlsx = creerXlsxMini(strings, [[0, 1]]);
    expect(parserXlsxBuffer(xlsx)).toEqual([['M&S', "L'autre"]]);
  });

  it('jette une erreur explicite quand sheet1.xml est absent', () => {
    const archive = zipSync({ 'inutile.xml': strToU8('<root/>') });
    expect(() => parserXlsxBuffer(u8ToArrayBuffer(archive))).toThrow(/sheet1/i);
  });

  it('comble les cellules manquantes par des chaînes vides (cellules sparses)', () => {
    // Saute la colonne B → retourne 3 cells avec '' au milieu
    const strings = ['A', 'C'];
    // Construction manuelle : <c r="A1" t="s"><v>0</v></c><c r="C1" t="s"><v>1</v></c>
    const sheetXml =
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
      `<sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="s"><v>1</v></c></row></sheetData>` +
      `</worksheet>`;
    const sst =
      `<?xml version="1.0"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
      strings.map((s) => `<si><t>${s}</t></si>`).join('') +
      `</sst>`;
    const archive = zipSync({
      'xl/sharedStrings.xml': strToU8(sst),
      'xl/worksheets/sheet1.xml': strToU8(sheetXml),
    });
    expect(parserXlsxBuffer(u8ToArrayBuffer(archive))).toEqual([['A', '', 'C']]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Détection de format XLSX (signature ZIP)
// ─────────────────────────────────────────────────────────────────────────────

describe('estXlsxBuffer', () => {
  it('reconnaît un buffer XLSX (signature ZIP `PK\\x03\\x04`)', () => {
    const archive = zipSync({ 'fichier.xml': strToU8('<x/>') });
    expect(estXlsxBuffer(u8ToArrayBuffer(archive))).toBe(true);
  });

  it("retourne false sur un buffer texte simple (CSV par exemple)", () => {
    const csv = new TextEncoder().encode('BLOC;COMPETENCE\nA;1\n');
    expect(estXlsxBuffer(csv.buffer as ArrayBuffer)).toBe(false);
  });

  it('retourne false sur un buffer trop petit', () => {
    expect(estXlsxBuffer(new ArrayBuffer(0))).toBe(false);
    expect(estXlsxBuffer(new ArrayBuffer(2))).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline complet : XLSX → Referentiel
// ─────────────────────────────────────────────────────────────────────────────

describe('importerReferentielDepuisXlsxBuffer', () => {
  it('construit un référentiel à 3 colonnes depuis un xlsx', () => {
    const strings = [
      'BLOC',
      'COMPETENCE',
      'SOUS-COMPETENCE',
      'BC1',
      'CO',
      'Reconnaître mots',
      'Comprendre consignes',
    ];
    const xlsx = creerXlsxMini(strings, [
      [0, 1, 2],
      [3, 4, 5],
      [3, 4, 6],
    ]);
    const r = importerReferentielDepuisXlsxBuffer(xlsx, { nomFormation: 'TestXlsx' });
    expect(r.stats.niveauxColonnes).toBe(3);
    expect(r.stats.nbCompetences).toBe(2);
    expect(r.stats.nbBlocs).toBe(1);
    expect(r.stats.nbSousFamilles).toBe(1);
    expect(r.referentiel.formation).toBe('TestXlsx');
    expect(r.referentiel.source).toBe('import-xlsx');
    expect(r.referentiel.blocs[0].competences[0].sousFamille).toBe('CO');
  });

  it('construit un référentiel à 2 colonnes depuis un xlsx', () => {
    const strings = ['BLOC', 'COMPETENCE', 'BC1', 'C1', 'C2'];
    const xlsx = creerXlsxMini(strings, [
      [0, 1],
      [2, 3],
      [2, 4],
    ]);
    const r = importerReferentielDepuisXlsxBuffer(xlsx, { nomFormation: 'XlsxPlat' });
    expect(r.stats.niveauxColonnes).toBe(2);
    expect(r.stats.nbCompetences).toBe(2);
    expect(r.referentiel.blocs[0].competences[0].sousFamille).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration sur les vrais fichiers fournis (CSV + XLSX, 2 et 3 cols)
// ─────────────────────────────────────────────────────────────────────────────

describe('intégration : fichiers exemples du pilote (CSV / XLSX, 2 et 3 niveaux)', () => {
  it('exemple-1.csv : 3 colonnes, 2 blocs, 16 sous-compétences', () => {
    const r = importerReferentielDepuisBuffer(chargerFixture('exemple-1.csv'), {
      nomFormation: 'Exemple 1',
    });
    expect(r.stats.niveauxColonnes).toBe(3);
    expect(r.stats.nbBlocs).toBe(2);
    expect(r.stats.nbCompetences).toBe(16);
    // Vérifie quelques entrées clés
    expect(r.referentiel.blocs[0].code).toBe('BLOC 1');
    expect(r.referentiel.blocs[0].competences[0].sousFamille).toBe('COMPETENCE 1');
    expect(r.referentiel.blocs[0].competences[0].libelle).toBe('SOUS-COMEPTENCE 1');
  });

  it('exemple-1.xlsx : 3 colonnes, 2 blocs, 16 sous-compétences', () => {
    const r = importerReferentielDepuisXlsxBuffer(chargerFixture('exemple-1.xlsx'), {
      nomFormation: 'Exemple 1',
    });
    expect(r.stats.niveauxColonnes).toBe(3);
    expect(r.stats.nbBlocs).toBe(2);
    expect(r.stats.nbCompetences).toBe(16);
    expect(r.referentiel.blocs[0].competences[0].sousFamille).toBe('COMPETENCE 1');
    expect(r.referentiel.source).toBe('import-xlsx');
  });

  it('exemple-2.csv : 2 colonnes, 2 blocs, 16 compétences', () => {
    const r = importerReferentielDepuisBuffer(chargerFixture('exemple-2.csv'), {
      nomFormation: 'Exemple 2',
    });
    expect(r.stats.niveauxColonnes).toBe(2);
    expect(r.stats.nbBlocs).toBe(2);
    expect(r.stats.nbCompetences).toBe(16);
    expect(r.referentiel.blocs[0].competences[0].sousFamille).toBeUndefined();
  });

  it('exemple-2.xlsx : 2 colonnes, 2 blocs, 16 compétences', () => {
    const r = importerReferentielDepuisXlsxBuffer(chargerFixture('exemple-2.xlsx'), {
      nomFormation: 'Exemple 2',
    });
    expect(r.stats.niveauxColonnes).toBe(2);
    expect(r.stats.nbBlocs).toBe(2);
    expect(r.stats.nbCompetences).toBe(16);
  });

  it('estXlsxBuffer reconnaît correctement les vrais fichiers', () => {
    expect(estXlsxBuffer(chargerFixture('exemple-1.xlsx'))).toBe(true);
    expect(estXlsxBuffer(chargerFixture('exemple-2.xlsx'))).toBe(true);
    expect(estXlsxBuffer(chargerFixture('exemple-1.csv'))).toBe(false);
    expect(estXlsxBuffer(chargerFixture('exemple-2.csv'))).toBe(false);
  });
});
