/**
 * Validation du formulaire d'import d'un référentiel.
 * Référence : cahier des charges v1.3, extension 3 (import de référentiels).
 *
 * Pures fonctions — pas d'effet de bord, testables sans React.
 * Utilisé par `ModaleImportReferentiel` pour empêcher la soumission sur erreur.
 */

export interface SaisieImportReferentiel {
  /** Nom affiché de la formation associée au référentiel (ex : « CECRL Anglais B2 »). */
  nomFormation: string;
  /** Contenu textuel du CSV (lu depuis un fichier ou collé dans un textarea). */
  contenuCsv: string;
}

export interface ErreursImportReferentiel {
  nomFormation?: string;
  contenuCsv?: string;
}

export interface ResultatValidationImport {
  ok: boolean;
  erreurs: ErreursImportReferentiel;
  avertissements: ErreursImportReferentiel;
}

const NOM_MIN_CONFORTABLE = 3;

export function validerSaisieImportReferentiel(
  saisie: SaisieImportReferentiel,
): ResultatValidationImport {
  const erreurs: ErreursImportReferentiel = {};
  const avertissements: ErreursImportReferentiel = {};

  const nom = saisie.nomFormation?.trim() ?? '';
  if (!nom) {
    erreurs.nomFormation = 'Le nom de la formation est obligatoire.';
  } else if (nom.length < NOM_MIN_CONFORTABLE) {
    avertissements.nomFormation =
      "Le nom est très court. Préférez un libellé explicite (ex : « CECRL Anglais B2 »).";
  }

  if (!saisie.contenuCsv?.trim()) {
    erreurs.contenuCsv =
      'Le contenu CSV est vide. Sélectionnez un fichier ou collez les lignes du référentiel.';
  }

  return {
    ok: Object.keys(erreurs).length === 0,
    erreurs,
    avertissements,
  };
}
