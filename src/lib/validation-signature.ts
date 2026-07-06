import type { FicheSuiviPeriode, LieuFiche, Role } from '@/types';
import { attitudesNonEvaluees } from './attitudes';

/**
 * Validation des signatures de fin de période.
 * Référence : cahier des charges v1.3, sections 8.4 (R18, R19, R20, R21)
 * + simplification des fiches centre (juillet 2026).
 *
 * Tableau §8.4 — champs requis par rôle pour signer une fiche de période :
 *
 *   Apprenti·e  : entreprise — ≥ 1 entrée "retour apprenti·e" + zone
 *                 observation apprenti non vide ; centre — zone observation
 *                 apprenti non vide SEULEMENT (juillet 2026 : la fiche centre
 *                 n'a plus de tableau de compétences).
 *   Maître      : ≥ 1 compétence **réellement abordée** (col entreprise,
 *                 valeur autre que `null` et autre que `non-fait`) + zone
 *                 observation maître non vide + TOUTES les attitudes
 *                 professionnelles retenues évaluées (juillet 2026 — les
 *                 attitudes s'évaluent à chaque période en entreprise).
 *   Formateur   : ne signe QUE les fiches en centre (1ᵉʳ juillet 2026 — en
 *                 entreprise, 2 signataires : apprenti·e + maître / tuteur ;
 *                 le formateur appose un commentaire global optionnel puis
 *                 verrouille). Au centre : AUCUNE exigence (juillet 2026 —
 *                 son observation de fin de période est souhaitée mais non
 *                 bloquante, décision pilote).
 */

export interface ResultatValidation {
  /** Le rôle peut-il signer maintenant ? */
  peutSigner: boolean;
  /** Liste des messages bloquants (vides si peutSigner === true). */
  raisons: string[];
}

/**
 * Vérifie que tous les pré-requis de R20 sont remplis pour qu'un rôle signe.
 *
 * @param attitudesSelectionnees Ids des attitudes retenues pour le livret
 *   (choisies à l'entretien tripartite). Utilisé pour le maître en entreprise
 *   uniquement : toutes doivent être évaluées sur la fiche pour signer.
 *   Optionnel (défaut `[]`) — sans sélection, aucune exigence d'attitude.
 */
export function validerSignature(
  fiche: FicheSuiviPeriode,
  role: Role,
  lieu: LieuFiche = 'entreprise',
  attitudesSelectionnees: ReadonlyArray<string> = [],
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
      // Juillet 2026 : la fiche centre n'a plus de tableau de compétences —
      // seule l'observation de fin de période reste exigée (bloquante).
      if (lieu === 'entreprise') {
        const auMoinsUnRetour = fiche.suiviEntreprise.some(
          (l) => l.retourApprenti && l.retourApprenti.trim().length > 0,
        );
        if (!auMoinsUnRetour) {
          raisons.push('Renseignez au moins un retour dans la colonne « Retour apprenti·e ».');
        }
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
      // Juillet 2026 : les attitudes professionnelles retenues (choisies à
      // l'entretien tripartite) sont évaluées à chaque période en entreprise —
      // TOUTES doivent l'être pour que le maître signe (décision pilote).
      const manquantes = attitudesNonEvaluees(attitudesSelectionnees, fiche.evaluationsAttitudes);
      if (manquantes.length > 0) {
        raisons.push(
          `Évaluez toutes les attitudes professionnelles retenues (${manquantes.length} ${
            manquantes.length > 1 ? 'restantes' : 'restante'
          }).`,
        );
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
      // Au centre : AUCUNE exigence (juillet 2026 — fiche simplifiée, son
      // observation de fin de période est souhaitée mais non bloquante).
      break;
    }
  }

  return { peutSigner: raisons.length === 0, raisons };
}
