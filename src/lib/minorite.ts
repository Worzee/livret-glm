/**
 * Minorité d'un·e apprenti·e (13 juillet 2026 — réunion DG, demande 5).
 *
 * Arbitrage pilote : la minorité se recalcule EN CONTINU à la date du jour —
 * un·e apprenti·e qui atteint 18 ans en cours de parcours récupère
 * automatiquement l'attestation de ses documents administratifs, ses
 * responsables légaux passant en simple lecture.
 *
 * Pures fonctions — pas d'effet de bord.
 */

/**
 * L'apprenti·e est-il/elle mineur·e (< 18 ans) à la date de référence ?
 * Une date de naissance vide ou invalide vaut « majeur·e » (pas de blocage
 * des données historiques sans date exploitable).
 */
export function estMineur(dateNaissance: string, reference: Date = new Date()): boolean {
  const naissance = new Date(dateNaissance);
  if (!dateNaissance || Number.isNaN(naissance.getTime())) return false;
  // 18ᵉ anniversaire : même jour/mois, année + 18 (le 29/02 devient 01/03
  // les années non bissextiles — comportement natif de Date, conforme à la
  // convention civile française qui fait naître la majorité « le jour de
  // l'anniversaire »).
  const majorite = new Date(
    Date.UTC(naissance.getUTCFullYear() + 18, naissance.getUTCMonth(), naissance.getUTCDate()),
  );
  return reference.getTime() < majorite.getTime();
}
