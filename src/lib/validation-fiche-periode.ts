import type { FicheSuiviPeriode } from '@/types';
import { verifierCreationPeriode, verifierDatesPeriode } from './regles-periode';

/**
 * Validation de la saisie d'une fiche de suivi par période (création + édition).
 * Référence : cahier des charges v1.3, sections 5.3 et 8.3 (R11/R12/R13/R14).
 *
 * Pures fonctions — pas d'effet de bord, testables sans React.
 *
 * Utilisation :
 *   - À la **création** : on passe `enEditionPourFicheId` undefined.
 *   - À l'**édition** : on passe l'id de la fiche en cours pour exclure son
 *     propre intervalle du test de chevauchement (sinon la fiche se verrait
 *     elle-même comme un chevauchement).
 */

export interface SaisieFichePeriode {
  /** Titre libre optionnel — vide = aucun titre custom (affichage « Période N »). */
  titre?: string;
  dateDebut: string;
  dateFin: string;
}

export interface ErreursFichePeriode {
  titre?: string;
  dateDebut?: string;
  dateFin?: string;
}

export interface ResultatValidationFichePeriode {
  ok: boolean;
  erreurs: ErreursFichePeriode;
  avertissements: ErreursFichePeriode;
}

const TITRE_MAX_CONFORTABLE = 60;

export function validerSaisieFichePeriode(
  saisie: SaisieFichePeriode,
  fichesExistantes: FicheSuiviPeriode[],
  entretienExiste: boolean,
  enEditionPourFicheId?: string,
): ResultatValidationFichePeriode {
  const erreurs: ErreursFichePeriode = {};
  const avertissements: ErreursFichePeriode = {};

  if (!saisie.dateDebut) erreurs.dateDebut = 'La date de début est obligatoire.';
  if (!saisie.dateFin) erreurs.dateFin = 'La date de fin est obligatoire.';

  // Pour l'édition d'une fiche existante, on retire la fiche elle-même de la
  // liste des contraintes (R12 chevauchement, R13 dernière fiche signée) :
  // sinon elle se vérifierait contre elle-même.
  const fichesAutres = enEditionPourFicheId
    ? fichesExistantes.filter((f) => f.id !== enEditionPourFicheId)
    : fichesExistantes;

  if (saisie.dateDebut && saisie.dateFin) {
    const datesOk = verifierDatesPeriode(saisie.dateDebut, saisie.dateFin, fichesAutres);
    if (!datesOk.ok) {
      // R12 (chevauchement) → erreur sur dateDebut.
      // R11 (fin <= début) → erreur sur dateFin (cas par défaut).
      // Le mot « postérieure » apparaît dans les deux messages, on filtre
      // donc explicitement sur « chevauchent ».
      for (const r of datesOk.raisons) {
        if (/chevauchent/i.test(r)) {
          erreurs.dateDebut = r;
        } else {
          erreurs.dateFin = r;
        }
      }
    }
  }

  // R13 + R14 ne s'appliquent qu'à la création (pas à la simple édition de
  // titre/dates d'une fiche existante).
  if (!enEditionPourFicheId) {
    const creerOk = verifierCreationPeriode(fichesAutres, entretienExiste);
    if (!creerOk.ok && !erreurs.dateDebut) {
      erreurs.dateDebut = creerOk.raisons[0] ?? 'Création non autorisée.';
    }
    // R14 : avertissement non bloquant si la N-1 n'est pas encore signée. On
    // ne le pose pas si dateDebut porte déjà une erreur (R12 chevauchement ou
    // R13 entretien absent) — l'erreur est plus prioritaire visuellement.
    if (creerOk.avertissements.length > 0 && !erreurs.dateDebut) {
      avertissements.dateDebut = creerOk.avertissements[0];
    }
  }

  // Titre — avertissement seulement si très long (rare en pratique, mais
  // utile pour éviter des libellés à 200 caractères qui cassent l'UI).
  if (saisie.titre && saisie.titre.trim().length > TITRE_MAX_CONFORTABLE) {
    avertissements.titre = `Titre très long (>${TITRE_MAX_CONFORTABLE} caractères) : préférez un libellé court (ex : « Stage automne »).`;
  }

  return {
    ok: Object.keys(erreurs).length === 0,
    erreurs,
    avertissements,
  };
}

/**
 * Vérifie qu'une fiche peut être supprimée :
 *   - pas si elle est verrouillée (R22 / clôture progressive)
 *   - pas si au moins une signature a été posée (préserve la chaîne de
 *     confiance — supprimer effacerait du travail validé)
 *
 * Pour réouvrir une fiche signée à la suppression, le formateur doit d'abord
 * la déverrouiller via R10 (motif obligatoire). On ne la rétro-active pas ici.
 */
export function peutSupprimerFichePeriode(fiche: FicheSuiviPeriode): {
  peut: boolean;
  raison?: string;
} {
  if (fiche.etat === 'verrouillee') {
    return {
      peut: false,
      raison: 'La fiche est verrouillée. Déverrouillez-la (R10) avant de la supprimer.',
    };
  }
  const aSignature =
    fiche.signatures.apprenti.signe ||
    fiche.signatures.maitre.signe ||
    fiche.signatures.formateur.signe;
  if (aSignature) {
    return {
      peut: false,
      raison:
        'Au moins une signature a été posée. Pour supprimer cette fiche, déverrouillez-la (R10) afin de retirer les signatures.',
    };
  }
  return { peut: true };
}

/**
 * Compose le libellé d'affichage d'une fiche : « Période N » seul ou
 * « Période N — <titre> » si un titre custom est renseigné.
 */
export function libelleFichePeriode(fiche: FicheSuiviPeriode): string {
  const titre = fiche.titre?.trim();
  return titre ? `Période ${fiche.numeroPeriode} : ${titre}` : `Période ${fiche.numeroPeriode}`;
}
