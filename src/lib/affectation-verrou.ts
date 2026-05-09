import type { Apprenti, Livret } from '@/types';

/**
 * Détermine si les affectations d'un·e apprenti·e doivent être verrouillées
 * pour éviter les modifications accidentelles après le démarrage du contrat.
 * Référence : cahier des charges v1.3, section 10.4 (note de gouvernance).
 *
 * Trois critères déclenchent le verrou (du plus engageant au moins) :
 *   1. Au moins une fiche de période existe (le travail pédagogique a démarré)
 *   2. L'entretien tripartite a été initialisé (l'engagement formel a eu lieu)
 *   3. La date courante est postérieure ou égale à `contratDebut`
 *
 * Le verrou couvre :
 *   - les selects de la page d'affectation (formation / maître / formateur)
 *   - la suppression d'apprenti·e dans la page de gestion des utilisateurs
 *
 * Raison d'être : éviter qu'une fausse manipulation côté coordo n'efface du
 * travail (signatures, évaluations, observations) ou ne crée une incohérence
 * référentielle (changement de référentiel en cours de formation).
 *
 * Pure fonction — pas d'effet de bord.
 */
export interface ResultatVerrou {
  /** True si les affectations sont verrouillées (modification interdite). */
  verrouille: boolean;
  /** Raison la plus précise déclenchant le verrou (pour l'UI). */
  raison?: string;
}

export function evaluerVerrouAffectation(
  apprenti: Apprenti,
  livret: Livret,
  maintenant: Date = new Date(),
): ResultatVerrou {
  // Critère 1 : fiches de période existantes (priorité — c'est le plus visible).
  const nbFiches = livret.fichesSuivi.length;
  if (nbFiches > 0) {
    return {
      verrouille: true,
      raison: `${nbFiches} fiche${nbFiches > 1 ? 's' : ''} de période créée${nbFiches > 1 ? 's' : ''} — modifier l'affectation effacerait le travail en cours.`,
    };
  }

  // Critère 2 : entretien tripartite initialisé.
  if (livret.entretienTripartite !== null) {
    return {
      verrouille: true,
      raison: "Entretien tripartite initialisé — modifier l'affectation invaliderait l'engagement formel.",
    };
  }

  // Critère 3 : contrat démarré (>= contratDebut).
  const debut = Date.parse(apprenti.contratDebut);
  if (Number.isFinite(debut) && maintenant.getTime() >= debut) {
    const dateFormatee = new Date(debut).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return {
      verrouille: true,
      raison: `Contrat démarré le ${dateFormatee} — affectations verrouillées par défaut.`,
    };
  }

  return { verrouille: false };
}
