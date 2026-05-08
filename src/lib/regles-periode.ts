import type { FicheSuiviPeriode } from '@/types';

/**
 * Règles métier des fiches de suivi par période.
 * Référence : cahier des charges v1.3, sections 8.3 (R11, R12, R13, R14).
 */

export interface ResultatVerification {
  ok: boolean;
  raisons: string[];
  /** Avertissements non bloquants (R14). */
  avertissements: string[];
}

/**
 * R11 : `dateFin` doit être strictement postérieure à `dateDebut`.
 * R12 : pas de chevauchement avec une autre période existante.
 *
 * @param fichesExistantes — fiches déjà présentes dans le livret (hors la fiche en cours d'édition)
 * @param dateDebut, dateFin — dates ISO 8601 (YYYY-MM-DD ou ISO complet)
 */
export function verifierDatesPeriode(
  dateDebut: string,
  dateFin: string,
  fichesExistantes: FicheSuiviPeriode[],
): ResultatVerification {
  const raisons: string[] = [];
  const debut = Date.parse(dateDebut);
  const fin = Date.parse(dateFin);

  if (Number.isNaN(debut) || Number.isNaN(fin)) {
    raisons.push('Les dates fournies ne sont pas valides.');
    return { ok: false, raisons, avertissements: [] };
  }

  // R11
  if (fin <= debut) {
    raisons.push('La date de fin doit être strictement postérieure à la date de début (R11).');
  }

  // R12 : chevauchement
  for (const f of fichesExistantes) {
    const fDebut = Date.parse(f.dateDebut);
    const fFin = Date.parse(f.dateFin);
    // Les intervalles [debut, fin] et [fDebut, fFin] se chevauchent si
    // debut <= fFin ET fin >= fDebut.
    if (debut <= fFin && fin >= fDebut) {
      const ddFr = new Date(fDebut).toLocaleDateString('fr-FR');
      const dfFr = new Date(fFin).toLocaleDateString('fr-FR');
      raisons.push(
        `Les dates saisies chevauchent la période ${f.numeroPeriode} (du ${ddFr} au ${dfFr}). Choisissez une date de début postérieure au ${dfFr}.`,
      );
      break; // un seul message suffit
    }
  }

  return { ok: raisons.length === 0, raisons, avertissements: [] };
}

/**
 * R13 + R14 : autorisation de création d'une période N.
 *
 * Conditions :
 *   - L'entretien tripartite doit exister (objet non null) — bloquant (R13)
 *   - La période N-1 doit être `signee` ou `verrouillee` — bloquant (R13)
 *   - Avertissement (R14) si la période N-1 n'est pas signée par les 3 parties.
 *     (En l'état actuel du modèle, "signee" implique 3 signatures, donc cet
 *      avertissement vise les futurs cas d'arbitrage humain.)
 */
export function verifierCreationPeriode(
  fichesExistantes: FicheSuiviPeriode[],
  entretienExiste: boolean,
): ResultatVerification {
  const raisons: string[] = [];
  const avertissements: string[] = [];

  if (!entretienExiste) {
    raisons.push(
      "Vous ne pouvez pas créer cette période : l'entretien tripartite n'a pas encore été initialisé (R13).",
    );
  }

  // S'il y a déjà des fiches, la dernière doit être signée ou verrouillée
  if (fichesExistantes.length > 0) {
    const triees = [...fichesExistantes].sort((a, b) => a.numeroPeriode - b.numeroPeriode);
    const derniere = triees[triees.length - 1];
    if (derniere.etat !== 'signee' && derniere.etat !== 'verrouillee') {
      raisons.push(
        `La période ${derniere.numeroPeriode} n'est pas encore signée. Terminez-la avant d'en créer une nouvelle (R13).`,
      );
    }
  }

  return { ok: raisons.length === 0, raisons, avertissements };
}
