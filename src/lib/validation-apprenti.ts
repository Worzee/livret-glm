import type { Apprenti } from '@/types';

/**
 * Validation des champs d'un·e apprenti·e (création + édition).
 * Référence : cahier des charges v1.3, section 7.1 et notes annexes.
 *
 * Pures fonctions — pas d'effet de bord, testables sans React.
 */

export type SaisieApprenti = Omit<Apprenti, 'id' | 'role'>;

export interface ErreursApprenti {
  prenom?: string;
  nom?: string;
  email?: string;
  dateNaissance?: string;
  contratDebut?: string;
  contratFin?: string;
  formationId?: string;
  maitreApprentissageId?: string;
  formateurReferentId?: string;
  entrepriseId?: string;
}

export interface ResultatValidation {
  /** True si aucune erreur bloquante. Les avertissements n'entrent pas en compte. */
  ok: boolean;
  /** Erreurs bloquantes — empêchent la soumission. */
  erreurs: ErreursApprenti;
  /**
   * Avertissements non-bloquants — affichés en ambre, n'empêchent pas la
   * sauvegarde. Sert pour les cas atypiques mais légalement valides
   * (ex. âge > 29 ans pour les bénéficiaires RQTH, sportifs de haut niveau,
   * créateurs d'entreprise, reconversions, etc.).
   */
  avertissements: ErreursApprenti;
}

// Email : format simple suffisant pour saisie clavier (pas RFC strict).
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AGE_MIN_APPRENTISSAGE = 15; // Âge minimum légal en France pour l'apprentissage.
// Limite haute « courante » de l'apprentissage (29 ans). Au-delà, plusieurs
// dérogations existent (RQTH, sportifs de haut niveau, créateurs d'entreprise,
// reconversion, etc.) — d'où un AVERTISSEMENT plutôt qu'une erreur bloquante.
const AGE_MAX_COURANT = 29;

export function validerSaisieApprenti(saisie: SaisieApprenti): ResultatValidation {
  const erreurs: ErreursApprenti = {};
  const avertissements: ErreursApprenti = {};

  if (!saisie.prenom?.trim()) {
    erreurs.prenom = 'Le prénom est obligatoire.';
  }
  if (!saisie.nom?.trim()) {
    erreurs.nom = 'Le nom est obligatoire.';
  }
  if (!saisie.email?.trim()) {
    erreurs.email = "L'email est obligatoire.";
  } else if (!REGEX_EMAIL.test(saisie.email.trim())) {
    erreurs.email = "Format d'email invalide.";
  }

  // Dates
  if (!saisie.dateNaissance) {
    erreurs.dateNaissance = 'La date de naissance est obligatoire.';
  }
  if (!saisie.contratDebut) {
    erreurs.contratDebut = 'La date de début de contrat est obligatoire.';
  }
  if (!saisie.contratFin) {
    erreurs.contratFin = 'La date de fin de contrat est obligatoire.';
  }
  // Cohérence dates contrat
  if (saisie.contratDebut && saisie.contratFin && saisie.contratFin <= saisie.contratDebut) {
    erreurs.contratFin = 'La fin de contrat doit être postérieure au début.';
  }
  // Âge à la date de début de contrat
  if (saisie.dateNaissance && saisie.contratDebut) {
    const naissance = new Date(saisie.dateNaissance);
    const debut = new Date(saisie.contratDebut);
    if (Number.isFinite(naissance.getTime()) && Number.isFinite(debut.getTime())) {
      const ageMs = debut.getTime() - naissance.getTime();
      const ageAns = ageMs / (365.25 * 24 * 60 * 60 * 1000);
      if (ageAns < AGE_MIN_APPRENTISSAGE) {
        // Erreur bloquante : limite légale stricte.
        erreurs.dateNaissance = `L'apprenti·e doit avoir au moins ${AGE_MIN_APPRENTISSAGE} ans à la date de début de contrat.`;
      } else if (ageAns > AGE_MAX_COURANT) {
        // Avertissement non-bloquant : limite courante 29 ans, mais plusieurs
        // dérogations existent (RQTH, sportifs de haut niveau, etc.).
        avertissements.dateNaissance = `Âge supérieur à ${AGE_MAX_COURANT} ans à la date de début de contrat. Vérifiez la dérogation applicable (RQTH, sportif de haut niveau, créateur d'entreprise, reconversion…).`;
      }
    }
  }

  // Affectations (toutes obligatoires à la création — l'affectation pourra
  // être modifiée plus tard via /admin/affectations).
  if (!saisie.formationId) {
    erreurs.formationId = 'La formation est obligatoire.';
  }
  if (!saisie.maitreApprentissageId) {
    erreurs.maitreApprentissageId = "Le maître d'apprentissage est obligatoire.";
  }
  if (!saisie.formateurReferentId) {
    erreurs.formateurReferentId = 'Le formateur référent est obligatoire.';
  }
  if (!saisie.entrepriseId) {
    erreurs.entrepriseId = "L'entreprise est obligatoire.";
  }

  return {
    ok: Object.keys(erreurs).length === 0,
    erreurs,
    avertissements,
  };
}
