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
 *   - L'entretien tripartite doit exister (objet non null) — **bloquant** (R13).
 *   - La période N-1 doit exister (implicite : le numéro est attribué par
 *     incrément depuis la dernière fiche existante).
 *   - Si N-1 n'est pas en état `signee`/`verrouillee` : **avertissement
 *     non bloquant** (R14) listant les parties qui n'ont pas encore signé.
 *     Permet de créer la N même si le maître ou le formateur·rice tarde à
 *     signer la N-1 (cas terrain courant : retards de signature pendant que
 *     l'apprenti·e est déjà physiquement sur la période suivante).
 *
 * Quand l'entretien manque (R13), on ne peuple pas l'avertissement R14 : on
 * remet d'abord la situation administrative en place avant d'attaquer le reste.
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
    return { ok: false, raisons, avertissements };
  }

  if (fichesExistantes.length > 0) {
    const triees = [...fichesExistantes].sort((a, b) => a.numeroPeriode - b.numeroPeriode);
    const derniere = triees[triees.length - 1];
    if (derniere.etat !== 'signee' && derniere.etat !== 'verrouillee') {
      const partiesManquantes: string[] = [];
      if (!derniere.signatures.apprenti.signe) partiesManquantes.push('apprenti·e');
      if (!derniere.signatures.maitre.signe) partiesManquantes.push('maître / tuteur');
      if (!derniere.signatures.formateur.signe) partiesManquantes.push('formateur·rice référent·e');

      if (partiesManquantes.length > 0) {
        avertissements.push(
          `La période ${derniere.numeroPeriode} n'a pas encore été signée par ${formaterListeFr(
            partiesManquantes,
          )}. Vous pouvez créer la nouvelle période, mais pensez à finaliser la précédente (R14).`,
        );
      }
    }
  }

  return { ok: raisons.length === 0, raisons, avertissements };
}

/** « a, b et c » — listes énumérées à la française. */
function formaterListeFr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} et ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`;
}

/**
 * Une fiche de période est-elle signée par les **3 parties** (apprenti·e +
 * maître / tuteur + formateur·rice référent·e) ? Critère du séquencement
 * d'affichage des périodes (16 juin 2026). On se base sur les signatures
 * elles-mêmes : un déverrouillage R10 invalide les signatures et masque donc
 * à nouveau les périodes suivantes — comportement voulu.
 */
export function periodeSigneeTroisParties(fiche: FicheSuiviPeriode): boolean {
  const s = fiche.signatures;
  return s.apprenti.signe && s.maitre.signe && s.formateur.signe;
}

/**
 * Séquencement d'affichage des périodes (16 juin 2026) : une période n'est
 * visible que tant que **la période précédente a été signée par les 3
 * parties**. La première période est toujours visible. Concrètement, on
 * parcourt les périodes dans l'ordre chronologique et on s'arrête à la
 * première période non signée (incluse).
 *
 * Exemple : 3 périodes en brouillon → seule la période 1 est visible ; dès
 * qu'elle est signée par les 3 parties, la période 2 apparaît, etc.
 */
export function periodesVisibles(fiches: FicheSuiviPeriode[]): FicheSuiviPeriode[] {
  const triees = [...fiches].sort((a, b) => a.numeroPeriode - b.numeroPeriode);
  const visibles: FicheSuiviPeriode[] = [];
  for (const f of triees) {
    visibles.push(f);
    if (!periodeSigneeTroisParties(f)) break;
  }
  return visibles;
}

/** Indique si une période précise est accessible (cf. `periodesVisibles`). */
export function estPeriodeVisible(fiches: FicheSuiviPeriode[], ficheId: string): boolean {
  return periodesVisibles(fiches).some((f) => f.id === ficheId);
}

/** Nombre de périodes encore masquées (à venir) — pour l'information à l'écran. */
export function nbPeriodesMasquees(fiches: FicheSuiviPeriode[]): number {
  return Math.max(0, fiches.length - periodesVisibles(fiches).length);
}
