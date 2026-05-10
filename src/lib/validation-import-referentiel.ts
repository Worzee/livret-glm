import type { Formation } from '@/types';

/**
 * Validation du formulaire d'import d'un référentiel.
 * Référence : cahier des charges v1.3, extension 3 (import de référentiels).
 *
 * Workflow étendu (mai 2026) :
 *   - La formation est **optionnelle** à l'import : un référentiel peut être
 *     importé seul puis rattaché plus tard à une ou plusieurs formations
 *     (relation N:1 — plusieurs formations peuvent pointer vers le même
 *     référentiel).
 *   - Si une formation est choisie, le libellé est auto-généré via
 *     `genererNomReferentiel` (`Referentiel_<intitulé>_<YYYY-MM-DD>`) et la
 *     formation est rattachée automatiquement à l'import.
 *   - Sinon, l'utilisateur·rice fournit un **nom libre** (≥ 3 caractères) qui
 *     sert directement de libellé.
 *
 * Pures fonctions — pas d'effet de bord, testables sans React.
 */

export type SourceImportReferentiel = 'fichier' | 'texte';

const NOM_LIBRE_MIN = 3;

export interface SaisieImportReferentiel {
  /**
   * Identifiant de la formation à laquelle le référentiel sera rattaché.
   * Vide si l'utilisateur·rice importe un référentiel « orphelin » qu'il/elle
   * rattachera plus tard depuis la page Formations.
   */
  formationId: string;
  /**
   * Nom libre du référentiel — utilisé uniquement si `formationId` est vide.
   * Sinon, le libellé est dérivé de la formation via `genererNomReferentiel`.
   */
  nomReferentielLibre?: string;
  /** Origine du contenu : fichier sélectionné ou texte collé. */
  source: SourceImportReferentiel;
  /** Nom du fichier choisi (présent si source === 'fichier'). */
  nomFichier?: string;
  /** Contenu CSV brut (présent si source === 'texte'). */
  contenuCsv?: string;
}

export interface ErreursImportReferentiel {
  formationId?: string;
  nomReferentielLibre?: string;
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

  // Formation optionnelle. Si non fournie, un nom libre est requis pour
  // identifier le référentiel dans la liste — il pourra être rattaché à une
  // ou plusieurs formations plus tard depuis la page Formations.
  const aFormation = !!saisie.formationId?.trim();
  if (!aFormation) {
    const nom = saisie.nomReferentielLibre?.trim() ?? '';
    if (!nom) {
      erreurs.nomReferentielLibre =
        'Sans formation choisie, donnez un nom au référentiel (vous pourrez le rattacher plus tard).';
    } else if (nom.length < NOM_LIBRE_MIN) {
      erreurs.nomReferentielLibre = `Le nom doit faire au moins ${NOM_LIBRE_MIN} caractères.`;
    }
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
