import type { Formation } from '@/types';

/**
 * Validation du formulaire d'import d'un modèle d'activités (juillet 2026 —
 * chantier référentiels/compétences #4).
 *
 * Contrairement aux référentiels (import « orphelin » possible), un modèle
 * d'activités s'importe **pour une formation** : c'est elle qui fournit le
 * référentiel sur lequel portera le mapping et qui rattache le modèle
 * (`Formation.modeleActivitesId`). La formation cible est donc obligatoire.
 *
 * Pures fonctions — pas d'effet de bord, testables sans React.
 */

export type SourceImportModele = 'fichier' | 'texte';

export interface SaisieImportModele {
  /** Formation à laquelle le modèle sera rattaché (obligatoire). */
  formationId: string;
  /** Origine du contenu : fichier sélectionné ou texte collé. */
  source: SourceImportModele;
  /** Nom du fichier choisi (présent si source === 'fichier'). */
  nomFichier?: string;
  /** Contenu CSV brut (présent si source === 'texte'). */
  contenuCsv?: string;
}

export interface ErreursImportModele {
  formationId?: string;
  contenuCsv?: string;
}

export interface ResultatValidationImportModele {
  ok: boolean;
  erreurs: ErreursImportModele;
}

export function validerSaisieImportModele(
  saisie: SaisieImportModele,
): ResultatValidationImportModele {
  const erreurs: ErreursImportModele = {};

  if (!saisie.formationId?.trim()) {
    erreurs.formationId = 'Choisissez la formation cible : le mapping portera sur son référentiel.';
  }

  const aFichier = saisie.source === 'fichier' && !!saisie.nomFichier?.trim();
  const aTexte = saisie.source === 'texte' && !!saisie.contenuCsv?.trim();
  if (!aFichier && !aTexte) {
    erreurs.contenuCsv =
      'Sélectionnez un fichier (CSV ou XLSX) ou collez le contenu CSV ci-dessous.';
  }

  return { ok: Object.keys(erreurs).length === 0, erreurs };
}

/**
 * Génère le nom canonique du modèle : `Activites_<intitulé>_<YYYY-MM-DD>`
 * (même patron que `genererNomReferentiel`).
 */
export function genererNomModeleActivites(formation: Formation, date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `Activites_${formation.intitule}_${yyyy}-${mm}-${dd}`;
}
