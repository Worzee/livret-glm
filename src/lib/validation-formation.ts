import type { Formation, Lieu } from '@/types';

/**
 * Validation des champs d'une formation (création + édition).
 * Référence : cahier des charges v1.3, section 7.1 (entité Formation).
 *
 * Pures fonctions — pas d'effet de bord, testables sans React. Utilisées
 * par `ModaleFormation` (création + édition) pour empêcher la soumission
 * sur erreur bloquante.
 */

export type SaisieFormation = Omit<Formation, 'id'>;

export interface ErreursFormation {
  intitule?: string;
  niveau?: string;
  annee?: string;
  referentielId?: string;
  dateDebut?: string;
  dateFin?: string;
  /** Le nom du lieu est obligatoire ; les autres champs du lieu sont optionnels. */
  lieuNom?: string;
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
    avertissements.annee = "Format inhabituel — le format conseillé est « YYYY-YYYY » (ex : 2025-2026).";
  }
  if (!saisie.referentielId?.trim()) {
    erreurs.referentielId = 'Le référentiel est obligatoire.';
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

  if (!saisie.lieu?.nom?.trim()) {
    erreurs.lieuNom = 'Le nom du lieu est obligatoire.';
  }

  return {
    ok: Object.keys(erreurs).length === 0,
    erreurs,
    avertissements,
  };
}

/**
 * Normalise une saisie avant persistance : trim des strings, MAJUSCULES sur le
 * niveau (CAP, BAC PRO, BTS…) si reconnu, conservation du format brut sinon.
 */
export function normaliserSaisieFormation(saisie: SaisieFormation): SaisieFormation {
  const lieu: Lieu = {
    nom: saisie.lieu.nom.trim(),
    adresse: saisie.lieu.adresse?.trim() || undefined,
    codePostal: saisie.lieu.codePostal?.trim() || undefined,
    ville: saisie.lieu.ville?.trim() || undefined,
  };
  return {
    intitule: saisie.intitule.trim(),
    niveau: saisie.niveau.trim(),
    annee: saisie.annee.trim(),
    referentielId: saisie.referentielId.trim(),
    dateDebut: saisie.dateDebut,
    dateFin: saisie.dateFin,
    lieu,
  };
}
