import type { Livret, NumeroEntretien } from '@/types';
import { numeroEntretienPourMotif } from './organisation-suivi';

/**
 * Nombre d'entretiens tripartites par formation (retours coordos juin 2026).
 *
 * Le coordo définit, au niveau de la formation (modale Planning, au même
 * endroit que les périodes), combien d'entretiens tripartites jalonnent le
 * parcours : de 1 (formation courte) à 4 (formation de 2 ans). Défaut : 2
 * (comportement historique du chantier #2 mai 2026).
 *
 * Verrou de réduction : on ne peut pas descendre en dessous du plus haut
 * entretien déjà engagé dans un livret de la promo (entretien initialisé OU
 * événement `entretien-tripartite-N` existant dans l'organisation du suivi).
 * Cohérent avec les autres verrous protecteurs du projet (périodes,
 * référentiels, questions).
 *
 * Pures fonctions — pas d'effet de bord.
 */

export const NOMBRE_ENTRETIENS_MIN = 1;
export const NOMBRE_ENTRETIENS_MAX = 4;
export const NOMBRE_ENTRETIENS_DEFAUT: NumeroEntretien = 2;

export interface ResultatNombreEntretiens {
  ok: boolean;
  /** Message lisible expliquant le refus. Défini uniquement si !ok. */
  raison?: string;
}

/**
 * Plus haut numéro d'entretien « engagé » parmi les livrets fournis :
 * entretien initialisé ou événement entretien-tripartite-N présent dans
 * l'organisation du suivi. Retourne 0 si aucun entretien engagé.
 */
export function plusHautEntretienEngage(livrets: ReadonlyArray<Livret>): number {
  let max = 0;
  for (const livret of livrets) {
    for (const [cle, entretien] of Object.entries(livret.entretiens)) {
      const n = Number(cle);
      if (entretien !== null && n > max) max = n;
    }
    for (const evt of livret.organisationSuivi.evenements) {
      const n = numeroEntretienPourMotif(evt.motif);
      if (n !== null && n > max) max = n;
    }
  }
  return max;
}

/**
 * Le coordo peut-il fixer `nombre` entretiens pour la formation dont les
 * livrets de la promo sont fournis ?
 *
 *  - bornes 1..4 ;
 *  - réduction refusée en dessous du plus haut entretien engagé (un E3
 *    initialisé ou un événement E3 existant interdit de passer à 2).
 */
export function peutDefinirNombreEntretiens(
  nombre: number,
  livretsPromo: ReadonlyArray<Livret>,
): ResultatNombreEntretiens {
  if (
    !Number.isInteger(nombre) ||
    nombre < NOMBRE_ENTRETIENS_MIN ||
    nombre > NOMBRE_ENTRETIENS_MAX
  ) {
    return {
      ok: false,
      raison: `Le nombre d'entretiens doit être compris entre ${NOMBRE_ENTRETIENS_MIN} et ${NOMBRE_ENTRETIENS_MAX}.`,
    };
  }
  const engage = plusHautEntretienEngage(livretsPromo);
  if (nombre < engage) {
    return {
      ok: false,
      raison: `Impossible de passer à ${nombre} : l'entretien tripartite ${engage} est déjà engagé (initialisé ou planifié) dans au moins un livret de la promo.`,
    };
  }
  return { ok: true };
}

/**
 * Numéros d'entretien proposables pour une formation à `nombreEntretiens`
 * (ex. 2 → [1, 2]). Sert à filtrer les motifs de l'organisation du suivi.
 */
export function numerosEntretiensDisponibles(nombreEntretiens: NumeroEntretien): NumeroEntretien[] {
  return ([1, 2, 3, 4] as const).filter((n) => n <= nombreEntretiens);
}
