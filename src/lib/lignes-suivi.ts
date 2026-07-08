import type { LigneSuiviEntreprise } from '@/types';

/**
 * Une ligne de suivi entreprise est « libre » (ad hoc, hors référentiel ET hors
 * modèle d'activités) lorsqu'elle ne porte NI compétence NI activité. Son
 * intitulé n'est alors résolu depuis aucune source : il est saisi librement dans
 * `libelleLibre` par le maître / tuteur ou le formateur référent, via la zone de
 * texte de la colonne « Activité » (juillet 2026 — pour donner le contexte et le
 * détail de l'activité réalisée, au lieu du libellé figé « Activité libre »).
 */
export function estLigneLibre(
  ligne: Pick<LigneSuiviEntreprise, 'competenceId' | 'activiteId'>,
): boolean {
  return !ligne.competenceId && !ligne.activiteId;
}
