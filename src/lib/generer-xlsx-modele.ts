import { strToU8, zipSync } from 'fflate';

/**
 * Générateur XLSX minimaliste — produit un fichier `.xlsx` téléchargeable
 * contenant **une seule feuille** avec des en-têtes + des lignes de données.
 *
 * Choix techniques (et leurs limites) :
 *   - Inline strings (`t="inlineStr"`) par défaut : moins compact mais évite
 *     un fichier sharedStrings et permet d'écrire chaque cellule
 *     indépendamment, sans table d'indirection.
 *   - **Cellules date** : valeur en serial Excel (jours depuis 1900-01-00)
 *     + style numFmt « yyyy-mm-dd » référencé via `s="1"`. Excel ouvre la
 *     cellule en mode date, ce qui empêche les erreurs de saisie au format
 *     français ambigu (« 20/01/1988 » qui pourrait être lu comme texte).
 *   - Format ZIP via `fflate` (déjà bundlé pour le parser XLSX existant).
 *
 * Compatibilité confirmée : ouverture dans Microsoft Excel 365, LibreOffice
 * Calc, Google Sheets, Numbers macOS, et re-parsable via `parserXlsxBuffer`.
 */

export interface ModeleXlsx {
  /** En-têtes de colonnes (1ʳᵉ ligne du tableau). */
  entetes: string[];
  /**
   * Lignes d'exemple optionnelles (chaque ligne = même longueur que
   * `entetes`). Les valeurs des colonnes marquées dans `colonnesDate`
   * doivent être au format ISO `YYYY-MM-DD` — elles seront converties en
   * serial Excel à l'écriture.
   */
  exemples?: string[][];
  /**
   * Indices (0-based) des colonnes contenant des dates. Ces cellules
   * seront formatées en `yyyy-mm-dd` dans Excel, ce qui force la saisie
   * en mode date (calendrier, validation native) plutôt qu'en texte.
   */
  colonnesDate?: number[];
}

/**
 * Construit un XLSX en mémoire et retourne le `Uint8Array` prêt à être
 * proposé en téléchargement via `Blob` + lien `download`.
 */
export function genererXlsx(modele: ModeleXlsx): Uint8Array {
  if (modele.entetes.length === 0) {
    throw new Error('Le modèle XLSX doit contenir au moins une colonne.');
  }
  const colonnesDate = new Set(modele.colonnesDate ?? []);
  const lignes: string[][] = [modele.entetes, ...(modele.exemples ?? [])];

  const sheet = construireSheetXml(lignes, colonnesDate);
  const styles = colonnesDate.size > 0 ? STYLES_XML_AVEC_DATE : STYLES_XML_MINIMAL;
  const workbook = WORKBOOK_XML;
  const workbookRels = WORKBOOK_RELS_XML;
  const rootRels = ROOT_RELS_XML;
  const contentTypes = CONTENT_TYPES_XML;

  // Chemins ZIP plats : `unzipSync` du parser existant attend exactement
  // ces clés. La structure imbriquée de fflate provoque un mauvais split
  // des noms côté lecture (testé en jsdom — KO).
  const archive: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(contentTypes),
    '_rels/.rels': strToU8(rootRels),
    'xl/workbook.xml': strToU8(workbook),
    'xl/_rels/workbook.xml.rels': strToU8(workbookRels),
    'xl/worksheets/sheet1.xml': strToU8(sheet),
    'xl/styles.xml': strToU8(styles),
  };
  return zipSync(archive);
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversion ISO YYYY-MM-DD → serial Excel
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convertit une date ISO en numéro serial Excel.
 *
 * Référence Excel : le jour 1 = 1900-01-01 (avec un bug historique :
 * Excel considère 1900 comme bissextile, ce qui ajoute 1 jour pour toute
 * date ≥ 1900-03-01). On s'aligne sur ce comportement : serial(1970-01-01)
 * = 25569.
 *
 * Retourne `null` si la chaîne n'est pas une date ISO valide — le code
 * appelant fait alors un fallback en cellule texte.
 */
export function isoEnSerialExcel(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [, yyyy, mm, dd] = m;
  const utc = Date.UTC(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10));
  if (Number.isNaN(utc)) return null;
  const msParJour = 86_400_000;
  // 25569 = jours entre 1900-01-00 (origine Excel ajustée bug) et 1970-01-01.
  return Math.round(utc / msParJour) + 25569;
}

// ─────────────────────────────────────────────────────────────────────────────
// Construction de la feuille — mix inline strings + cellules date numériques
// ─────────────────────────────────────────────────────────────────────────────

function construireSheetXml(lignes: string[][], colonnesDate: ReadonlySet<number>): string {
  const rowsXml = lignes
    .map((cellules, i) => {
      const r = i + 1;
      const cellsXml = cellules
        .map((valeur, c) => {
          const ref = `${indexEnLettres(c)}${r}`;
          // Ligne 1 (en-têtes) : toujours en texte, même pour les colonnes date.
          if (i === 0 || !colonnesDate.has(c)) {
            const texte = encodeXml(valeur);
            return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${texte}</t></is></c>`;
          }
          // Colonne date : on tente la conversion ISO → serial ; en cas
          // d'échec (valeur vide ou hors format), on retombe sur texte.
          const serial = isoEnSerialExcel(valeur);
          if (serial === null) {
            const texte = encodeXml(valeur);
            return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${texte}</t></is></c>`;
          }
          // s="1" → cellule numérique avec format date (cf. STYLES_XML_AVEC_DATE).
          return `<c r="${ref}" s="1"><v>${serial}</v></c>`;
        })
        .join('');
      return `<row r="${r}">${cellsXml}</row>`;
    })
    .join('');

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    `<sheetData>${rowsXml}</sheetData>`,
    '</worksheet>',
  ].join('');
}

/** Convertit un index 0-based en lettres Excel (0 → "A", 25 → "Z", 26 → "AA"...). */
function indexEnLettres(idx: number): string {
  let n = idx;
  let s = '';
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

function encodeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─────────────────────────────────────────────────────────────────────────────
// Boilerplate XML minimal — invariant à travers tous les modèles.
// ─────────────────────────────────────────────────────────────────────────────

const CONTENT_TYPES_XML = [
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
  '<Default Extension="xml" ContentType="application/xml"/>',
  '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
  '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>',
  '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
  '</Types>',
].join('');

const ROOT_RELS_XML = [
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>',
  '</Relationships>',
].join('');

const WORKBOOK_XML = [
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
  '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
  '<sheets><sheet name="Modèle" sheetId="1" r:id="rId1"/></sheets>',
  '</workbook>',
].join('');

const WORKBOOK_RELS_XML = [
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>',
  '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
  '</Relationships>',
].join('');

/**
 * Styles minimaux quand aucune colonne date n'est utilisée — Excel exige
 * néanmoins la présence du fichier styles.xml référencé dans .rels.
 *
 * Index `s="0"` = format par défaut (général).
 */
const STYLES_XML_MINIMAL = [
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
  '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>',
  '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>',
  '<borders count="1"><border/></borders>',
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
  '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>',
  '</styleSheet>',
].join('');

/**
 * Styles enrichis quand au moins une colonne date est utilisée.
 *
 * - `numFmt id=164` : format custom « yyyy-mm-dd » (les ids < 164 sont
 *   réservés aux formats Excel built-in).
 * - `cellXfs index 1` : application de ce numFmt aux cellules avec `s="1"`.
 */
const STYLES_XML_AVEC_DATE = [
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
  '<numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/></numFmts>',
  '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>',
  '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>',
  '<borders count="1"><border/></borders>',
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
  '<cellXfs count="2">',
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
  '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>',
  '</cellXfs>',
  '</styleSheet>',
].join('');
