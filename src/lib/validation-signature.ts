import type { FicheSuiviPeriode, Role } from '@/types';

/**
 * Validation des signatures de fin de période.
 * Référence : cahier des charges v1.3, sections 8.4 (R18, R19, R20, R21).
 *
 * Tableau §8.4 — champs requis par rôle pour signer une fiche de période :
 *
 *   Apprenti·e  : ≥ 1 entrée "retour apprenti·e" + zone observation apprenti non vide
 *                 (le champ « Suivi GRETA CFA — apprenti » reste optionnel)
 *   Maître      : ≥ 1 compétence **réellement abordée** (col entreprise, valeur
 *                 autre que `null` et autre que `non-fait`) + zone observation
 *                 maître non vide
 *   Formateur   : zone « Suivi GRETA CFA — formateur » non vide + ≥ 1 compétence
 *                 évaluée (col centre) + zone observation formateur non vide
 */

export interface ResultatValidation {
  /** Le rôle peut-il signer maintenant ? */
  peutSigner: boolean;
  /** Liste des messages bloquants (vides si peutSigner === true). */
  raisons: string[];
}

/**
 * Vérifie que tous les pré-requis de R20 sont remplis pour qu'un rôle signe.
 */
export function validerSignature(
  fiche: FicheSuiviPeriode,
  role: Role,
): ResultatValidation {
  const raisons: string[] = [];

  // Coordo et admin ne signent pas en leur nom propre. Les boutons de signature
  // d'un admin doivent être appelés avec le rôle métier ciblé (apprenti, maître
  // ou formateur), pas avec 'admin' lui-même.
  if (role === 'coordo') {
    raisons.push("Le rôle Coordinateur·rice ne signe pas les fiches de période.");
    return { peutSigner: false, raisons };
  }
  if (role === 'admin') {
    raisons.push(
      "Le rôle Administrateur·rice n'a pas de signature en propre. Utilisez le bouton de signature du rôle métier ciblé.",
    );
    return { peutSigner: false, raisons };
  }

  switch (role) {
    case 'apprenti': {
      const auMoinsUnRetour = fiche.suiviEntreprise.some(
        (l) => l.retourApprenti && l.retourApprenti.trim().length > 0,
      );
      if (!auMoinsUnRetour) {
        raisons.push("Renseignez au moins un retour dans la colonne « Retour apprenti·e ».");
      }
      if (!fiche.observations.apprenti || fiche.observations.apprenti.trim().length === 0) {
        raisons.push('La zone d\'observation apprenti·e est vide.');
      }
      break;
    }

    case 'maitre': {
      // Une compétence est « réellement abordée » si elle a été évaluée avec
      // un niveau de maîtrise — `'non-fait'` ne compte pas (signale que la
      // compétence n'a pas pu être travaillée pendant la période).
      const auMoinsUneAbordee = fiche.suiviEntreprise.some(
        (l) => l.evaluationEntreprise !== null && l.evaluationEntreprise !== 'non-fait',
      );
      if (!auMoinsUneAbordee) {
        raisons.push(
          "Évaluez au moins une compétence abordée dans la colonne « Évaluation entreprise » (autre que « Non fait »).",
        );
      }
      if (!fiche.observations.maitre || fiche.observations.maitre.trim().length === 0) {
        raisons.push('La zone d\'observation maître d\'apprentissage est vide.');
      }
      break;
    }

    case 'formateur': {
      const champFormateur = fiche.suiviGretaCfa.formateur?.trim() ?? '';
      if (champFormateur.length === 0) {
        raisons.push(
          "Renseignez la zone « Suivi de la formation au GRETA CFA — Formateur référent ».",
        );
      }
      // Symétrie avec la règle maître : `'non-fait'` ne suffit pas — le
      // formateur référent doit avoir évalué au moins une compétence avec
      // un vrai niveau de maîtrise.
      const auMoinsUneAbordee = fiche.suiviEntreprise.some(
        (l) => l.evaluationGreta !== null && l.evaluationGreta !== 'non-fait',
      );
      if (!auMoinsUneAbordee) {
        raisons.push(
          "Évaluez au moins une compétence abordée dans la colonne « Évaluation GRETA CFA » (autre que « Non fait »).",
        );
      }
      if (!fiche.observations.formateur || fiche.observations.formateur.trim().length === 0) {
        raisons.push('La zone d\'observation formateur référent est vide.');
      }
      break;
    }
  }

  return { peutSigner: raisons.length === 0, raisons };
}
