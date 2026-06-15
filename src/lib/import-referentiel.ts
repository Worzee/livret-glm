import type { BlocCompetences, Competence, Referentiel } from '@/types';
import { parserXlsxBuffer } from './parser-xlsx';

/**
 * Import de référentiels de compétences depuis un fichier CSV.
 *
 * Format attendu :
 *   - Séparateur : `;` (default Excel FR) ou `,` (auto-détecté)
 *   - Encodage : UTF-8 ou Windows-1252 (auto-détecté)
 *   - 2 colonnes  : `Bloc;Compétence (leaf)`
 *   - 3 colonnes  : `Bloc;Sous-famille;Compétence (leaf)`
 *   - Première ligne = en-têtes (libre, ignorée)
 *
 * Exemple 3 colonnes :
 *   Domaine;Compétence;Sous-compétence
 *   A1.1;Compréhension orale;Reconnaître des mots très courants
 *   A1.1;Compréhension orale;Comprendre des consignes simples
 *   A1.1;Compréhension écrite;Reconnaître des mots familiers
 *
 * → Bloc "A1.1" contenant 3 leaves :
 *      - { sousFamille: "Compréhension orale", libelle: "Reconnaître…" }
 *      - { sousFamille: "Compréhension orale", libelle: "Comprendre…" }
 *      - { sousFamille: "Compréhension écrite", libelle: "Reconnaître…" }
 */

// ─────────────────────────────────────────────────────────────────────────────
// Décodage / encodage
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Décode un buffer en texte. Essaie UTF-8 strict puis fallback Windows-1252.
 * Justification : Excel français exporte par défaut en CP1252.
 */
export function decoderTexteCsv(buffer: ArrayBuffer): {
  texte: string;
  encodageUtilise: 'utf-8' | 'windows-1252';
} {
  // 1ʳᵉ tentative : UTF-8 strict
  try {
    const decUtf8 = new TextDecoder('utf-8', { fatal: true });
    return { texte: decUtf8.decode(buffer), encodageUtilise: 'utf-8' };
  } catch {
    // Fallback : Windows-1252 (Excel FR par défaut)
    const decCp1252 = new TextDecoder('windows-1252');
    return { texte: decCp1252.decode(buffer), encodageUtilise: 'windows-1252' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsing CSV minimal (sans dépendance externe)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Détecte le séparateur le plus probable entre `;`, `,`, et tabulation.
 * Heuristique : compte les occurrences sur les 5 premières lignes non vides.
 */
export function detecterSeparateur(texte: string): ';' | ',' | '\t' {
  const lignes = texte
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
    .slice(0, 5);
  const candidats: Array<';' | ',' | '\t'> = [';', ',', '\t'];
  let meilleur: { sep: ';' | ',' | '\t'; score: number } = { sep: ';', score: -1 };
  for (const sep of candidats) {
    const total = lignes.reduce(
      (s, l) => s + (l.match(new RegExp(`\\${sep}`, 'g'))?.length ?? 0),
      0,
    );
    if (total > meilleur.score) meilleur = { sep, score: total };
  }
  return meilleur.sep;
}

/**
 * Parse une ligne CSV en respectant les guillemets simples (`"…"`).
 * Champ entre guillemets : peut contenir le séparateur, et `""` = `"` littéral.
 */
function parserLigneCsv(ligne: string, sep: string): string[] {
  const champs: string[] = [];
  let courant = '';
  let dansQuote = false;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (dansQuote) {
      if (c === '"' && ligne[i + 1] === '"') {
        courant += '"';
        i++;
      } else if (c === '"') {
        dansQuote = false;
      } else {
        courant += c;
      }
    } else if (c === '"' && courant === '') {
      dansQuote = true;
    } else if (c === sep) {
      champs.push(courant);
      courant = '';
    } else {
      courant += c;
    }
  }
  champs.push(courant);
  return champs.map((s) => s.trim());
}

/**
 * Parse un texte CSV complet en tableau de tableaux (lignes de champs).
 * Ignore les lignes entièrement vides.
 */
export function parserCsv(texte: string, separateur?: string): string[][] {
  const sep = separateur ?? detecterSeparateur(texte);
  // Retirer le BOM UTF-8 éventuel en début de fichier (U+FEFF)
  const propre = texte.charCodeAt(0) === 0xfeff ? texte.slice(1) : texte;
  const lignes = propre.split(/\r?\n/);
  const resultat: string[][] = [];
  for (const ligne of lignes) {
    if (ligne.trim().length === 0) continue;
    resultat.push(parserLigneCsv(ligne, sep));
  }
  return resultat;
}

// ─────────────────────────────────────────────────────────────────────────────
// Détection 2 vs 3 colonnes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Heuristique : si la majorité des lignes (hors en-tête) ont 3 colonnes
 * non-vides, c'est un référentiel 3-niveaux. Sinon 2-niveaux.
 */
export function detecterNiveauxColonnes(lignes: string[][]): 2 | 3 {
  if (lignes.length < 2) return 2;
  // Sauter la première ligne (en-têtes présumés)
  const corps = lignes.slice(1);
  let avec3 = 0;
  let avec2 = 0;
  for (const ligne of corps) {
    const remplies = ligne.filter((c) => c.trim().length > 0).length;
    if (remplies >= 3) avec3++;
    else if (remplies === 2) avec2++;
  }
  return avec3 > avec2 ? 3 : 2;
}

// ─────────────────────────────────────────────────────────────────────────────
// Construction du référentiel
// ─────────────────────────────────────────────────────────────────────────────

export interface OptionsImport {
  /** Nom de la formation (visible dans l'admin et dans le livret). */
  nomFormation: string;
  /** Identifiant souhaité (sinon dérivé de nomFormation). */
  id?: string;
  /** Force le séparateur (sinon auto-détecté). */
  separateur?: string;
  /** Force la profondeur (sinon auto-détectée). */
  niveauxColonnes?: 2 | 3;
  /**
   * Trace l'origine du référentiel pour la traçabilité (visible dans
   * l'admin). Par défaut `'import-csv'` ; le pipeline XLSX passe
   * `'import-xlsx'`.
   */
  source?: Referentiel['source'];
}

export interface RapportImport {
  referentiel: Referentiel;
  /** Stats utiles à afficher dans l'aperçu de l'import. */
  stats: {
    nbBlocs: number;
    nbCompetences: number;
    nbSousFamilles: number;
    niveauxColonnes: 2 | 3;
    encodageUtilise: 'utf-8' | 'windows-1252';
    separateurUtilise: string;
  };
  /** Avertissements non bloquants (ex : ligne vide ignorée). */
  avertissements: string[];
}

function slugifier(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Construit un Referentiel à partir des lignes CSV parsées.
 * Agrège par bloc (col 0), conserve l'ordre d'apparition.
 */
export function construireReferentiel(
  lignes: string[][],
  options: OptionsImport,
  encodage: 'utf-8' | 'windows-1252',
  separateur: string,
): RapportImport {
  if (lignes.length === 0) {
    throw new Error('Le fichier est vide.');
  }

  const niveaux = options.niveauxColonnes ?? detecterNiveauxColonnes(lignes);
  const avertissements: string[] = [];

  // On suppose que la première ligne est l'en-tête (ignorée)
  const corps = lignes.slice(1);

  // Map { codeBloc -> { libelle: codeBloc, competences: [] } }
  const blocsMap = new Map<string, BlocCompetences>();
  // Compteur pour générer des id uniques par bloc
  const compteursParBloc = new Map<string, number>();
  const sousFamilles = new Set<string>();

  for (let i = 0; i < corps.length; i++) {
    const ligne = corps[i];
    const numLigneCsv = i + 2; // +1 pour l'en-tête, +1 pour passer en 1-based

    const blocCode = ligne[0]?.trim();
    if (!blocCode) {
      avertissements.push(`Ligne ${numLigneCsv} ignorée : code de bloc manquant.`);
      continue;
    }

    let sousFamille: string | undefined;
    let libelleLeaf: string;

    if (niveaux === 3) {
      sousFamille = ligne[1]?.trim();
      libelleLeaf = ligne[2]?.trim() ?? '';
      if (!sousFamille) {
        avertissements.push(`Ligne ${numLigneCsv} : sous-famille vide, traitée comme niveau 2.`);
      } else {
        sousFamilles.add(sousFamille);
      }
    } else {
      libelleLeaf = ligne[1]?.trim() ?? '';
    }

    if (!libelleLeaf) {
      avertissements.push(`Ligne ${numLigneCsv} ignorée : libellé de compétence manquant.`);
      continue;
    }

    if (!blocsMap.has(blocCode)) {
      blocsMap.set(blocCode, {
        id: `bloc-${slugifier(blocCode)}`,
        code: blocCode,
        libelle: blocCode, // par défaut code = libellé, éditable plus tard
        competences: [],
      });
      compteursParBloc.set(blocCode, 0);
    }
    const bloc = blocsMap.get(blocCode)!;
    const compteur = (compteursParBloc.get(blocCode) ?? 0) + 1;
    compteursParBloc.set(blocCode, compteur);

    const comp: Competence = {
      id: `${bloc.id}-c${compteur}`,
      code: `${blocCode}.${compteur}`,
      libelle: libelleLeaf,
    };
    if (sousFamille) comp.sousFamille = sousFamille;
    bloc.competences.push(comp);
  }

  if (blocsMap.size === 0) {
    throw new Error("Aucune compétence valide n'a été détectée dans le fichier.");
  }

  const id = options.id ?? `ref-${slugifier(options.nomFormation)}`;
  const referentiel: Referentiel = {
    id,
    formation: options.nomFormation,
    blocs: [...blocsMap.values()],
    niveauxColonnes: niveaux,
    source: options.source ?? 'import-csv',
  };

  const nbCompetences = referentiel.blocs.reduce((n, b) => n + b.competences.length, 0);
  return {
    referentiel,
    stats: {
      nbBlocs: referentiel.blocs.length,
      nbCompetences,
      nbSousFamilles: sousFamilles.size,
      niveauxColonnes: niveaux,
      encodageUtilise: encodage,
      separateurUtilise: separateur,
    },
    avertissements,
  };
}

/**
 * Pipeline complet : ArrayBuffer → Referentiel + stats + avertissements.
 * Combine décodage, parsing, détection, construction.
 */
export function importerReferentielDepuisBuffer(
  buffer: ArrayBuffer,
  options: OptionsImport,
): RapportImport {
  const { texte, encodageUtilise } = decoderTexteCsv(buffer);
  const separateur = options.separateur ?? detecterSeparateur(texte);
  const lignes = parserCsv(texte, separateur);
  return construireReferentiel(lignes, options, encodageUtilise, separateur);
}

/**
 * Variante texte (utile pour les tests et copier-coller dans un textarea).
 */
export function importerReferentielDepuisTexte(
  texte: string,
  options: OptionsImport,
): RapportImport {
  const separateur = options.separateur ?? detecterSeparateur(texte);
  const lignes = parserCsv(texte, separateur);
  return construireReferentiel(lignes, options, 'utf-8', separateur);
}

/**
 * Pipeline d'import depuis un buffer XLSX (.xlsx).
 * Délègue la décompression ZIP + parsing XML à `parserXlsxBuffer`.
 *
 * Le séparateur reporté dans `stats.separateurUtilise` est le caractère
 * tabulation (cohérent avec le « pas de séparateur explicite » d'un xlsx) ;
 * l'encodage est `utf-8` (les xlsx encodent toujours les chaînes en UTF-8).
 */
export function importerReferentielDepuisXlsxBuffer(
  buffer: ArrayBuffer,
  options: OptionsImport,
): RapportImport {
  const lignes = parserXlsxBuffer(buffer);
  return construireReferentiel(
    lignes,
    { ...options, source: options.source ?? 'import-xlsx' },
    'utf-8',
    '\t',
  );
}

/**
 * Détecte si un buffer est un .xlsx (signature ZIP `PK\x03\x04`).
 * Permet à l'UI de router automatiquement vers le bon pipeline d'import
 * sans dépendre uniquement de l'extension du fichier.
 */
export function estXlsxBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const bytes = new Uint8Array(buffer, 0, 4);
  return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}
