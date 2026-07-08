import type { Livret } from '@/types';
import { entretienSigneParTous } from './regles-entretien';
import { pointsAlerteTrame, type QuestionTrame } from './trame-entretien';

/**
 * Suivi des points d'alerte de l'entretien tripartite par la coordination
 * (8 juillet 2026, demande pilote).
 *
 * Les « points d'alerte » (réponses de la trame signalant une difficulté —
 * action à mener par le GRETA CFA) sont **dérivés** des réponses de
 * l'entretien via `pointsAlerteTrame` ; l'entretien lui-même n'est jamais
 * modifié. Leur traitement est suivi à part, dans `Livret.pointsAlerteTraites`
 * (ids des questions de la trame déjà prises en charge).
 */

/**
 * Points d'alerte de l'entretien qui restent À TRAITER par le coordo / admin.
 * Remontent uniquement quand l'entretien est **signé par les 3 parties** (R9 —
 * les réponses sont alors figées, décision pilote), et tant qu'ils n'ont pas
 * été marqués « traités ». Renvoie `[]` si l'entretien est absent, non signé,
 * ou sans réponse en alerte.
 */
export function pointsAlerteNonTraites(
  livret: Pick<Livret, 'entretien' | 'pointsAlerteTraites'>,
): QuestionTrame[] {
  const entretien = livret.entretien;
  if (!entretien || !entretienSigneParTous(entretien)) return [];
  const traites = new Set(livret.pointsAlerteTraites ?? []);
  return pointsAlerteTrame(entretien.reponsesTrame).filter((q) => !traites.has(q.id));
}

/** Un point d'alerte donné est-il marqué « traité » pour ce livret ? */
export function estPointAlerteTraite(
  livret: Pick<Livret, 'pointsAlerteTraites'>,
  questionId: string,
): boolean {
  return (livret.pointsAlerteTraites ?? []).includes(questionId);
}
