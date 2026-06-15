import { unzipSync } from 'fflate';

/**
 * Parser XLSX minimal — extrait le contenu de la première feuille en
 * tableau de chaînes.
 *
 * Périmètre supporté :
 *   - Strings indexées via `xl/sharedStrings.xml` (cas le plus courant)
 *   - Strings inline (`t="inlineStr"`) — fallback rare
 *   - Cellules numériques (converties en chaîne)
 *   - Cellules sparses (la colonne B vide est représentée par '' dans la
 *     ligne ; on s'aligne sur l'index de colonne issu de la référence A1)
 *   - Lignes complètement vides : ignorées (cohérent avec parserCsv)
 *
 * Hors périmètre (par choix d'économie de bundle) :
 *   - Multi-feuilles (on ne lit que `xl/worksheets/sheet1.xml`)
 *   - Formules calculées (on lit la valeur cachée `<v>` mais pas la formule)
 *   - Styles, formats de date, nombres riches
 *
 * Justification du parser regex (vs parser DOM) :
 *   - DOMParser n'est pas disponible côté Node sans dépendance
 *   - Les fichiers générés par Pronote / Excel suivent une structure très
 *     prévisible — un parsing regex ciblé reste lisible et léger
 */

export function parserXlsxBuffer(buffer: ArrayBuffer): string[][] {
  const data = new Uint8Array(buffer);
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(data);
  } catch (e) {
    throw new Error(
      `Le fichier ne semble pas être un XLSX valide (échec décompression ZIP). ${(e as Error).message}`,
    );
  }

  const sheet = entries['xl/worksheets/sheet1.xml'];
  if (!sheet) {
    throw new Error("Le fichier XLSX ne contient pas 'xl/worksheets/sheet1.xml'.");
  }

  const decoder = new TextDecoder('utf-8');
  const sharedStrings = entries['xl/sharedStrings.xml']
    ? extraireSharedStrings(decoder.decode(entries['xl/sharedStrings.xml']))
    : [];

  return extraireLignes(decoder.decode(sheet), sharedStrings);
}

// ─────────────────────────────────────────────────────────────────────────────
// SharedStrings — chaque <si> peut contenir un <t> simple ou plusieurs <r><t>
// pour le rich text. On concatène tous les <t> dans l'ordre.
// ─────────────────────────────────────────────────────────────────────────────

function extraireSharedStrings(xml: string): string[] {
  const sis: string[] = [];
  const siRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  for (const m of xml.matchAll(siRegex)) {
    sis.push(extraireTexteT(m[1]));
  }
  return sis;
}

function extraireTexteT(xml: string): string {
  const tRegex = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
  let texte = '';
  for (const m of xml.matchAll(tRegex)) {
    texte += m[1];
  }
  return decodeXml(texte);
}

// ─────────────────────────────────────────────────────────────────────────────
// Sheet — extraction des lignes / cellules
// ─────────────────────────────────────────────────────────────────────────────

function extraireLignes(xml: string, sharedStrings: string[]): string[][] {
  const lignes: string[][] = [];
  // Match <row ...>...</row> ET <row .../> (lignes auto-fermantes).
  const rowRegex = /<row\b[^>]*(?:\/>|>([\s\S]*?)<\/row>)/g;
  for (const m of xml.matchAll(rowRegex)) {
    const inner = m[1] ?? '';
    const ligne = extraireCellules(inner, sharedStrings);
    if (ligne.some((c) => c.trim() !== '')) {
      lignes.push(ligne);
    }
  }
  return lignes;
}

function extraireCellules(xml: string, sharedStrings: string[]): string[] {
  const ligne: string[] = [];
  // Cellule auto-fermante : <c r="A1"/>  → vide
  // Cellule pleine    : <c r="A1" [t="s"]><v>0</v></c>
  const cellRegex = /<c\b\s+r="([A-Z]+)\d+"(?:\s+[^/>]*?)?(?:\/>|>([\s\S]*?)<\/c>)/g;
  for (const m of xml.matchAll(cellRegex)) {
    const ref = m[1];
    const inner = m[2];
    const colIdx = colLettresEnIndex(ref);
    while (ligne.length <= colIdx) ligne.push('');

    if (inner === undefined) {
      // Cellule auto-fermante → vide
      continue;
    }

    // Type de cellule (peut être absent → numeric)
    const typeMatch = m[0].match(/\bt="([^"]+)"/);
    const type = typeMatch?.[1];

    let valeur = '';
    if (type === 's') {
      const v = inner.match(/<v>([\s\S]*?)<\/v>/);
      if (v) {
        const idx = parseInt(v[1], 10);
        valeur = sharedStrings[idx] ?? '';
      }
    } else if (type === 'inlineStr') {
      // <c t="inlineStr"><is><t>...</t></is></c>
      valeur = extraireTexteT(inner);
    } else {
      // Numérique ou autre — on lit la valeur brute
      const v = inner.match(/<v>([\s\S]*?)<\/v>/);
      valeur = v ? decodeXml(v[1]) : '';
    }
    ligne[colIdx] = valeur;
  }
  return ligne;
}

/**
 * Convertit une référence de colonne ("A", "B", ..., "AA", ...) en index
 * 0-based.
 */
function colLettresEnIndex(ref: string): number {
  let idx = 0;
  for (let i = 0; i < ref.length; i++) {
    idx = idx * 26 + (ref.charCodeAt(i) - 64);
  }
  return idx - 1;
}

// L'ordre de remplacement importe : `&amp;` doit être traité en dernier
// pour ne pas ré-affecter les autres entités décodées.
function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}
