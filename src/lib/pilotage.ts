import type { Apprenti, Livret } from '@/types';
import { calculerAlerteR7, entretienSigneParTous } from './regles-entretien';

/**
 * Pilotage des promos (3 juillet 2026 — préparation démo direction).
 *
 * Agrège l'état des livrets d'un périmètre (les apprenti·e·s ACCESSIBLES au
 * rôle actif — le filtrage par périmètre est fait en amont par
 * `apprentis-accessibles`) en compteurs de pilotage : fiches signées,
 * entretiens réalisés, alertes R7, clôtures. Affiché en tête du tableau de
 * bord coordo / admin, globalement et par formation.
 *
 * Pures fonctions — pas d'effet de bord.
 */

export interface CompteurSignees {
  signees: number;
  total: number;
}

export interface StatsPilotage {
  nbApprentis: number;
  /** Fiches de période en entreprise signées (états `signee` + `verrouillee`). */
  fichesEntreprise: CompteurSignees;
  /** Fiches de période en centre de formation signées. */
  fichesCentre: CompteurSignees;
  /** Entretiens signés par les 3 parties / attendus (1 par livret). */
  entretiens: { realises: number; attendus: number };
  /** Nombre d'apprenti·e·s en alerte R7 (entretien en retard). */
  alertesR7: number;
  livretsClotures: number;
}

const ETATS_FICHE_SIGNEE = new Set(['signee', 'verrouillee']);

/** Statistiques agrégées d'un périmètre d'apprenti·e·s. */
export function statsPilotage(
  apprentis: ReadonlyArray<Apprenti>,
  livrets: Readonly<Record<string, Livret>>,
  maintenant: Date = new Date(),
): StatsPilotage {
  const stats: StatsPilotage = {
    nbApprentis: apprentis.length,
    fichesEntreprise: { signees: 0, total: 0 },
    fichesCentre: { signees: 0, total: 0 },
    entretiens: { realises: 0, attendus: 0 },
    alertesR7: 0,
    livretsClotures: 0,
  };

  const livretParApprenti = new Map(Object.values(livrets).map((l) => [l.apprentiId, l]));

  for (const apprenti of apprentis) {
    const livret = livretParApprenti.get(apprenti.id);
    if (!livret) continue;

    for (const fiche of livret.fichesSuivi) {
      stats.fichesEntreprise.total += 1;
      if (ETATS_FICHE_SIGNEE.has(fiche.etat)) stats.fichesEntreprise.signees += 1;
    }
    for (const fiche of livret.fichesSuiviCentre ?? []) {
      stats.fichesCentre.total += 1;
      if (ETATS_FICHE_SIGNEE.has(fiche.etat)) stats.fichesCentre.signees += 1;
    }

    stats.entretiens.attendus += 1;
    if (entretienSigneParTous(livret.entretien)) stats.entretiens.realises += 1;

    if (calculerAlerteR7(apprenti, livret.entretien, maintenant).declenchee) {
      stats.alertesR7 += 1;
    }
    if (livret.cloture) stats.livretsClotures += 1;
  }

  return stats;
}

/** Pourcentage entier (0 quand le total est nul). */
export function pourcentageSignees(compteur: CompteurSignees): number {
  if (compteur.total === 0) return 0;
  return Math.round((compteur.signees / compteur.total) * 100);
}
