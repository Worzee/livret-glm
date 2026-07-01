import type { FicheSuiviPeriode, LieuFiche, Role } from '@/types';

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
 *   Formateur   : ne signe QUE les fiches en centre (1ᵉʳ juillet 2026 — en
 *                 entreprise, 2 signataires : apprenti·e + maître / tuteur ;
 *                 le formateur appose un commentaire global optionnel puis
 *                 verrouille). Au centre : ≥ 1 compétence évaluée (col
 *                 `evaluationGreta`) + zone observation formateur non vide
 *                 (la zone « Suivi GRETA CFA » a été retirée partout — tout se
 *                 rédige dans les observations).
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
  lieu: LieuFiche = 'entreprise',
): ResultatValidation {
  const raisons: string[] = [];

  // Coordo et admin ne signent pas en leur nom propre. Les boutons de signature
  // d'un admin doivent être appelés avec le rôle métier ciblé (apprenti, maître
  // ou formateur), pas avec 'admin' lui-même.
  if (role === 'coordo') {
    raisons.push('Le rôle Coordinateur·rice ne signe pas les fiches de période.');
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
        raisons.push('Renseignez au moins un retour dans la colonne « Retour apprenti·e ».');
      }
      if (!fiche.observations.apprenti || fiche.observations.apprenti.trim().length === 0) {
        raisons.push("La zone d'observation apprenti·e est vide.");
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
          'Évaluez au moins une compétence abordée dans la colonne « Évaluation entreprise » (autre que « Non fait »).',
        );
      }
      if (!fiche.observations.maitre || fiche.observations.maitre.trim().length === 0) {
        raisons.push("La zone d'observation maître d'apprentissage est vide.");
      }
      break;
    }

    case 'formateur': {
      // 1ᵉʳ juillet 2026 : le formateur référent ne signe plus les périodes
      // en entreprise (2 signataires : apprenti·e + maître / tuteur). Il y
      // appose un commentaire global optionnel puis verrouille la fiche
      // signée. Garde défensive — l'UI ne propose plus ce bouton.
      if (lieu === 'entreprise') {
        raisons.push(
          'Le formateur référent ne signe pas les périodes en entreprise — il peut commenter puis verrouiller la fiche une fois signée par les deux parties.',
        );
        return { peutSigner: false, raisons };
      }
      // Au centre : ≥ 1 évaluation + observation (la zone « Suivi GRETA CFA »
      // a été retirée le 1ᵉʳ juillet 2026 — tout passe par les observations).
      const auMoinsUneAbordee = fiche.suiviEntreprise.some(
        (l) => l.evaluationGreta !== null && l.evaluationGreta !== 'non-fait',
      );
      if (!auMoinsUneAbordee) {
        raisons.push(
          'Évaluez au moins une compétence abordée dans la colonne « Évaluation centre » (autre que « Non fait »).',
        );
      }
      if (!fiche.observations.formateur || fiche.observations.formateur.trim().length === 0) {
        raisons.push("La zone d'observation formateur référent est vide.");
      }
      break;
    }
  }

  return { peutSigner: raisons.length === 0, raisons };
}
