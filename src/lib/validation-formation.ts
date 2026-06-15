import type { Formation } from '@/types';

/**
 * Validation des champs d'une formation (création + édition).
 * Référence : cahier des charges v1.3, section 7.1 (entité Formation).
 *
 * Refonte mai 2026 : le lieu inline (`Lieu`) est remplacé par un `lieuId`
 * qui pointe vers une entrée du store `useEtablissementsStore`.
 *
 * Pures fonctions — pas d'effet de bord, testables sans React.
 */

/**
 * `periodes` et `nombreEntretiens` exclus : le planning (périodes + nombre
 * d'entretiens tripartites) n'est pas géré via ce formulaire mais via
 * `ModalePlanningPeriodes` (chantier #1 + retours coordos juin 2026).
 */
export type SaisieFormation = Omit<
  Formation,
  'id' | 'periodes' | 'nombreEntretiens' | 'questionsRetirees'
>;

export interface ErreursFormation {
  intitule?: string;
  niveau?: string;
  annee?: string;
  referentielId?: string;
  dateDebut?: string;
  dateFin?: string;
  /** L'établissement (lieu de formation) est obligatoire. */
  lieuId?: string;
}

export interface ResultatValidationFormation {
  ok: boolean;
  erreurs: ErreursFormation;
  /** Avertissements non-bloquants (format atypique, etc.). */
  avertissements: ErreursFormation;
}

// Format académique attendu : "YYYY-YYYY" avec année de fin = année de début + 1 ou 2.
const REGEX_ANNEE = /^\d{4}-\d{4}$/;

export function validerSaisieFormation(saisie: SaisieFormation): ResultatValidationFormation {
  const erreurs: ErreursFormation = {};
  const avertissements: ErreursFormation = {};

  if (!saisie.intitule?.trim()) {
    erreurs.intitule = "L'intitulé est obligatoire.";
  }
  if (!saisie.niveau?.trim()) {
    erreurs.niveau = 'Le niveau est obligatoire.';
  }
  if (!saisie.annee?.trim()) {
    erreurs.annee = "L'année académique est obligatoire.";
  } else if (!REGEX_ANNEE.test(saisie.annee.trim())) {
    avertissements.annee =
      'Format inhabituel — le format conseillé est « YYYY-YYYY » (ex : 2025-2026).';
  }
  // Le référentiel peut ne pas exister encore au moment de créer la formation
  // (cas où on l'importe plus tard). On ne bloque donc pas la sauvegarde, mais
  // on émet un avertissement explicite : sans référentiel, les grilles
  // d'évaluation finales n'auront pas de compétences à afficher.
  if (!saisie.referentielId?.trim()) {
    avertissements.referentielId =
      "Aucun référentiel sélectionné. Vous pourrez en associer un plus tard ; les grilles d'évaluation resteront vides en attendant.";
  }

  if (!saisie.dateDebut) {
    erreurs.dateDebut = 'La date de début est obligatoire.';
  }
  if (!saisie.dateFin) {
    erreurs.dateFin = 'La date de fin est obligatoire.';
  }
  if (saisie.dateDebut && saisie.dateFin && saisie.dateFin <= saisie.dateDebut) {
    erreurs.dateFin = 'La date de fin doit être postérieure à la date de début.';
  }

  if (!saisie.lieuId?.trim()) {
    erreurs.lieuId =
      'Le lieu de formation est obligatoire. Sélectionnez un établissement dans la liste.';
  }

  return {
    ok: Object.keys(erreurs).length === 0,
    erreurs,
    avertissements,
  };
}

/**
 * Normalise une saisie avant persistance : trim des strings.
 */
export function normaliserSaisieFormation(saisie: SaisieFormation): SaisieFormation {
  return {
    intitule: saisie.intitule.trim(),
    niveau: saisie.niveau.trim(),
    annee: saisie.annee.trim(),
    referentielId: saisie.referentielId.trim(),
    dateDebut: saisie.dateDebut,
    dateFin: saisie.dateFin,
    lieuId: saisie.lieuId.trim(),
  };
}
