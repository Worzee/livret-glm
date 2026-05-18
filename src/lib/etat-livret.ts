import type { Apprenti, Livret } from '@/types';
import { calculerAlerteR7 } from './regles-entretien';

/**
 * Synthétise l'état d'un livret en un résumé compact pour le tableau de bord.
 * Référence : cahier des charges v1.3, sections 10.3 (cartes apprenti·e) et
 * 24.5 (cas démonstratifs).
 *
 * Calculé à la volée — pas persisté, pas mémoïsé : la fonction est pure.
 */

export interface ResumeLivret {
  /** Nombre total de fiches de période. */
  nbFiches: number;
  /** Nombre de fiches signées par les 3 parties (signee + verrouillee). */
  nbFichesSignees: number;
  /** Nombre de fiches verrouillées (état terminal hors clôture). */
  nbFichesVerrouillees: number;
  /** Au moins une trace de déverrouillage R10 dans l'historique des fiches. */
  aDeverrouillage: boolean;
  /** Alerte R7 active : entretien manquant ou incomplet > 60 j après contratDebut. */
  alerteR7: boolean;
  /** Entretien tripartite signé par les 3 parties. */
  entretienComplet: boolean;
  /** Entretien jamais initié (objet null en base). */
  entretienAbsent: boolean;
  /** Livret clôturé (R22). */
  cloture: boolean;
  /** Code de cas pédagogique (pour affichage de badge primaire). */
  cas: CasPedagogique;
}

export type CasPedagogique =
  | 'cloture' // R22 — livret figé
  | 'alerte-r7' // entretien manquant > 60 j
  | 'desaccord' // fiche déverrouillée R10 et pas encore re-signée (désaccord actif)
  | 'demarrage' // pas encore de fiche
  | 'toutes-signees' // toutes les fiches signées ou verrouillées
  | 'en-cours'; // cas standard mi-parcours

export function calculerResumeLivret(
  apprenti: Apprenti,
  livret: Livret,
  maintenant: Date = new Date(),
): ResumeLivret {
  const fiches = livret.fichesSuivi;
  const nbFiches = fiches.length;
  const nbFichesVerrouillees = fiches.filter((f) => f.etat === 'verrouillee').length;
  const nbFichesSignees = fiches.filter(
    (f) => f.etat === 'signee' || f.etat === 'verrouillee',
  ).length;
  const aDeverrouillage = fiches.some((f) => f.historiqueDeverrouillages.length > 0);
  // « Désaccord en cours » = il y a eu un déverrouillage R10 ET la fiche
  // correspondante n'a pas encore été re-signée. Une fois re-signée, l'historique
  // est conservé pour audit mais le badge pédagogique doit disparaître.
  const desaccordEnCours = fiches.some(
    (f) =>
      f.historiqueDeverrouillages.length > 0 &&
      f.etat !== 'signee' &&
      f.etat !== 'verrouillee',
  );

  const alerteR7Result = calculerAlerteR7(apprenti, livret.entretienTripartite, maintenant);
  const alerteR7 = alerteR7Result.declenchee;

  const entretien = livret.entretienTripartite;
  const entretienAbsent = entretien === null;
  const entretienComplet =
    !!entretien &&
    entretien.signatures.apprenti.signe &&
    entretien.signatures.maitre.signe &&
    entretien.signatures.formateur.signe;

  const cloture = livret.cloture !== null;

  // Priorisation des cas (du plus saillant au plus banal).
  let cas: CasPedagogique = 'en-cours';
  if (cloture) cas = 'cloture';
  else if (alerteR7) cas = 'alerte-r7';
  else if (desaccordEnCours) cas = 'desaccord';
  else if (nbFiches === 0) cas = 'demarrage';
  else if (nbFiches > 0 && nbFichesSignees === nbFiches) cas = 'toutes-signees';

  return {
    nbFiches,
    nbFichesSignees,
    nbFichesVerrouillees,
    aDeverrouillage,
    alerteR7,
    entretienComplet,
    entretienAbsent,
    cloture,
    cas,
  };
}

/** Libellé court du cas, pour l'UI (badge sous le nom). */
export function libelleCas(cas: CasPedagogique): string {
  switch (cas) {
    case 'cloture':
      return 'Livret clôturé';
    case 'alerte-r7':
      return 'Entretien à planifier';
    case 'desaccord':
      return 'Désaccord en cours';
    case 'demarrage':
      return 'Démarrage';
    case 'toutes-signees':
      return 'Toutes signées';
    case 'en-cours':
      return 'En cours';
  }
}

/** Couleur de fond et de texte associée au cas (classes Tailwind). */
export function classesBadgeCas(cas: CasPedagogique): string {
  switch (cas) {
    case 'cloture':
      return 'bg-slate-100 text-slate-700 border-slate-300';
    case 'alerte-r7':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    case 'desaccord':
      return 'bg-rose-50 text-rose-800 border-rose-300';
    case 'demarrage':
      return 'bg-blue-50 text-blue-800 border-blue-300';
    case 'toutes-signees':
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    case 'en-cours':
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}
