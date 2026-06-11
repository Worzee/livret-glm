/**
 * Validation des champs communs aux utilisateur·rice·s « staff »
 * (maître d'apprentissage, formateur référent, coordo).
 * Référence : cahier des charges v1.3, section 7.1.
 *
 * Pures fonctions — pas d'effet de bord, testables sans React. Utilisées
 * par `ModaleUtilisateurStaff` (création + édition) pour empêcher la
 * soumission sur erreur bloquante.
 */

export interface SaisieStaff {
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  /** Nom commercial de l'entreprise — uniquement pour les maîtres d'apprentissage. */
  entreprise?: string;
  /** Poste occupé dans l'entreprise — uniquement pour les maîtres d'apprentissage. */
  fonction?: string;
}

export interface ErreursStaff {
  prenom?: string;
  nom?: string;
  email?: string;
  entreprise?: string;
  fonction?: string;
}

export interface ResultatValidationStaff {
  ok: boolean;
  erreurs: ErreursStaff;
}

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valide une saisie staff (maître / formateur / coordo).
 *
 * @param saisie       Champs saisis dans la modale.
 * @param exigeEntreprise Si `true`, `entreprise` ET `fonction` sont obligatoires (cas du maître).
 */
export function validerSaisieStaff(
  saisie: SaisieStaff,
  exigeEntreprise: boolean = false,
): ResultatValidationStaff {
  const erreurs: ErreursStaff = {};

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

  if (exigeEntreprise) {
    if (!saisie.entreprise?.trim()) {
      erreurs.entreprise = "Le nom de l'entreprise est obligatoire pour un maître.";
    }
    if (!saisie.fonction?.trim()) {
      erreurs.fonction = 'La fonction du maître est obligatoire.';
    }
  }

  return { ok: Object.keys(erreurs).length === 0, erreurs };
}
