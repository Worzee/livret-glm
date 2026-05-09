import type { Formation } from '@/types';

/**
 * Validation du formulaire d'import d'un référentiel.
 * Référence : cahier des charges v1.3, extension 3 (import de référentiels).
 *
 * Workflow validé par le pilote :
 *   - L'utilisateur·rice choisit une **formation existante** (et non un nom
 *     libre comme dans la version initiale).
 *   - Le référentiel est ensuite **rattaché automatiquement** à cette
 *     formation, et son libellé est dérivé via `genererNomReferentiel`
 *     (`Referentiel_<intitulé>_<YYYY-MM-DD>`).
 *
 * Pures fonctions — pas d'effet de bord, testables sans React.
 */

export type SourceImportReferentiel = 'fichier' | 'texte';

export interface SaisieImportReferentiel {
  /** Identifiant de la formation à laquelle le référentiel sera rattaché. */
  formationId: string;
  /** Origine du contenu : fichier sélectionné ou texte collé. */
  source: SourceImportReferentiel;
  /** Nom du fichier choisi (présent si source === 'fichier'). */
  nomFichier?: string;
  /** Contenu CSV brut (présent si source === 'texte'). */
  contenuCsv?: string;
}

export interface ErreursImportReferentiel {
  formationId?: string;
  contenuCsv?: string;
}

export interface ResultatValidationImport {
  ok: boolean;
  erreurs: ErreursImportReferentiel;
  avertissements: ErreursImportReferentiel;
}

export function validerSaisieImportReferentiel(
  saisie: SaisieImportReferentiel,
): ResultatValidationImport {
  const erreurs: ErreursImportReferentiel = {};
  const avertissements: ErreursImportReferentiel = {};

  if (!saisie.formationId?.trim()) {
    erreurs.formationId = 'Sélectionnez la formation à laquelle rattacher ce référentiel.';
  }

  // Source de données : fichier OU texte. Au moins l'une des deux doit être
  // remplie. La modale aiguille l'utilisateur·rice : si un fichier est
  // sélectionné, le textarea est désactivé (et inversement).
  const aFichier = saisie.source === 'fichier' && !!saisie.nomFichier?.trim();
  const aTexte = saisie.source === 'texte' && !!saisie.contenuCsv?.trim();
  if (!aFichier && !aTexte) {
    erreurs.contenuCsv =
      'Sélectionnez un fichier (CSV ou XLSX) ou collez le contenu CSV ci-dessous.';
  }

  return {
    ok: Object.keys(erreurs).length === 0,
    erreurs,
    avertissements,
  };
}

/**
 * Génère le libellé canonique du référentiel : `Referentiel_<intitulé>_<YYYY-MM-DD>`.
 * La date est exprimée dans le fuseau local pour rester lisible par l'équipe.
 */
export function genererNomReferentiel(formation: Formation, date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `Referentiel_${formation.intitule}_${yyyy}-${mm}-${dd}`;
}
