import type { Activite, ModeleActivites } from '@/types';
import { decoderTexteCsv, detecterSeparateur, parserCsv, slugifier } from './import-referentiel';
import { parserXlsxBuffer } from './parser-xlsx';

/**
 * Import de modèles d'activités depuis un fichier CSV / XLSX (juillet 2026 —
 * chantier référentiels/compétences #4, arbitrage pilote Q1 : le fichier ne
 * contient QUE les activités, le mapping activités ↔ compétences se fait
 * entièrement dans l'UI post-import).
 *
 * Format attendu (première ligne = en-têtes, ignorée) :
 *   - 3 colonnes : `Code;Libellé;Description` (code vide → généré A1..An)
 *   - 2 colonnes : `Libellé;Description` (codes générés)
 *   - 1 colonne  : `Libellé`
 *
 * Le libellé est la donnée maîtresse (les codes ne s'affichent plus dans
 * l'app depuis juin 2026) — d'où la convention 2 colonnes = libellé +
 * description, PAS code + libellé. Mêmes conventions techniques que l'import
 * des référentiels : séparateur auto (`;`, `,`, tab), encodage UTF-8 /
 * Windows-1252 auto, XLSX via le parseur maison.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Détection du nombre de colonnes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Détermine la forme du fichier (1, 2 ou 3 colonnes). Comme pour les
 * référentiels, la 3ᵉ colonne est retenue dès que l'en-tête OU une ligne du
 * corps la renseigne (fichiers « mixtes » où la description est rare).
 */
export function detecterColonnesModele(lignes: string[][]): 1 | 2 | 3 {
  if (lignes.length === 0) return 1;
  const compter = (l: string[]): number => {
    let derniere = 0;
    for (let i = 0; i < l.length; i++) {
      if ((l[i]?.trim().length ?? 0) > 0) derniere = i + 1;
    }
    return derniere;
  };
  const max = Math.max(compter(lignes[0]), ...lignes.slice(1).map(compter));
  if (max >= 3) return 3;
  if (max === 2) return 2;
  return 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Construction du modèle
// ─────────────────────────────────────────────────────────────────────────────

export interface OptionsImportModele {
  /** Nom du modèle (visible dans l'admin). */
  nomModele: string;
  /** Référentiel de la formation cible — porte le mapping à venir. */
  referentielId: string;
  /** Identifiant souhaité (sinon dérivé de nomModele). */
  id?: string;
  /** Force le séparateur (sinon auto-détecté). */
  separateur?: string;
  /** Origine du modèle (défaut `'import-csv'` ; le pipeline XLSX passe `'import-xlsx'`). */
  source?: ModeleActivites['source'];
}

export interface RapportImportModele {
  modele: ModeleActivites;
  stats: {
    nbActivites: number;
    encodageUtilise: 'utf-8' | 'windows-1252';
    separateurUtilise: string;
  };
  /** Avertissements non bloquants (ex : ligne sans libellé ignorée). */
  avertissements: string[];
}

/**
 * Construit un ModeleActivites à partir des lignes CSV parsées. Le mapping
 * (`competenceIds`) de chaque activité démarre vide — il se fait dans l'UI.
 */
export function construireModeleActivites(
  lignes: string[][],
  options: OptionsImportModele,
  encodage: 'utf-8' | 'windows-1252',
  separateur: string,
): RapportImportModele {
  if (lignes.length === 0) {
    throw new Error('Le fichier est vide.');
  }

  const colonnes = detecterColonnesModele(lignes);
  const avertissements: string[] = [];
  const id = options.id ?? `act-${slugifier(options.nomModele)}`;

  // Première ligne = en-têtes (ignorée), comme pour les référentiels.
  const corps = lignes.slice(1);
  const activites: Activite[] = [];

  for (let i = 0; i < corps.length; i++) {
    const ligne = corps[i];
    const numLigneCsv = i + 2; // +1 en-tête, +1 pour passer en 1-based

    let code: string;
    let libelle: string;
    let description: string | undefined;
    if (colonnes === 3) {
      code = ligne[0]?.trim() ?? '';
      libelle = ligne[1]?.trim() ?? '';
      description = ligne[2]?.trim() || undefined;
    } else {
      code = '';
      libelle = ligne[0]?.trim() ?? '';
      description = colonnes === 2 ? ligne[1]?.trim() || undefined : undefined;
    }

    if (!libelle) {
      avertissements.push(`Ligne ${numLigneCsv} ignorée : libellé d'activité manquant.`);
      continue;
    }

    const numero = activites.length + 1;
    const activite: Activite = {
      id: `${id}-a${numero}`,
      code: code || `A${numero}`,
      libelle,
      competenceIds: [],
    };
    if (description) activite.description = description;
    activites.push(activite);
  }

  if (activites.length === 0 && corps.length === 0) {
    throw new Error('Le fichier est vide.');
  }
  if (activites.length === 0) {
    throw new Error("Aucune activité valide n'a été détectée dans le fichier.");
  }

  const modele: ModeleActivites = {
    id,
    nom: options.nomModele,
    referentielId: options.referentielId,
    activites,
    source: options.source ?? 'import-csv',
  };

  return {
    modele,
    stats: {
      nbActivites: activites.length,
      encodageUtilise: encodage,
      separateurUtilise: separateur,
    },
    avertissements,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipelines
// ─────────────────────────────────────────────────────────────────────────────

/** Pipeline complet : ArrayBuffer CSV → ModeleActivites + stats + avertissements. */
export function importerModeleDepuisBuffer(
  buffer: ArrayBuffer,
  options: OptionsImportModele,
): RapportImportModele {
  const { texte, encodageUtilise } = decoderTexteCsv(buffer);
  const separateur = options.separateur ?? detecterSeparateur(texte);
  const lignes = parserCsv(texte, separateur);
  return construireModeleActivites(lignes, options, encodageUtilise, separateur);
}

/** Variante texte (tests, copier-coller dans un textarea). */
export function importerModeleDepuisTexte(
  texte: string,
  options: OptionsImportModele,
): RapportImportModele {
  const separateur = options.separateur ?? detecterSeparateur(texte);
  const lignes = parserCsv(texte, separateur);
  return construireModeleActivites(lignes, options, 'utf-8', separateur);
}

/** Pipeline d'import depuis un buffer XLSX (mêmes conventions que les référentiels). */
export function importerModeleDepuisXlsxBuffer(
  buffer: ArrayBuffer,
  options: OptionsImportModele,
): RapportImportModele {
  const lignes = parserXlsxBuffer(buffer);
  return construireModeleActivites(
    lignes,
    { ...options, source: options.source ?? 'import-xlsx' },
    'utf-8',
    '\t',
  );
}
