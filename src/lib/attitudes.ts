import type { AttitudeProfessionnelle, EntretienTripartite } from '@/types';

/**
 * Attitudes professionnelles — catalogue global + helpers.
 * Référence : retours coordos juin 2026.
 *
 * Les attitudes sortent du référentiel de compétences pour devenir un
 * **catalogue central unique** géré par l'admin (`/admin/attitudes`,
 * pattern banque de questions). Elles sont évaluées par le maître / tuteur
 * **à chaque entretien tripartite** (échelle ++/+/-/--) ; l'onglet
 * « Attitudes » de l'évaluation finale en devient une synthèse en lecture
 * seule (E1..E4).
 *
 * Pures fonctions — pas d'effet de bord.
 */

/**
 * Catalogue par défaut — savoir-être transversaux de l'apprentissage,
 * formulations génériques valables pour toute spécialité (enrichi à la
 * demande du pilote, juin 2026).
 *
 * 18 juin 2026 : a1..a4 (ponctualité, respect des consignes, qualité du
 * travail, intégration) retirées — elles doublonnaient les 4 critères de
 * l'appréciation du maître / tuteur (« Synthèse de la période »), évalués par
 * défaut à chaque entretien tripartite. Les ids restants (a5..a16) sont
 * conservés stables (référencés par les fixtures de démo). L'admin élague ou
 * complète librement depuis `/admin/attitudes`.
 */
export const ATTITUDES_INITIALES: ReadonlyArray<AttitudeProfessionnelle> = [
  {
    id: 'a5',
    libelle: "Prise d'initiative et autonomie",
    description: 'Sait agir seul·e à bon escient, sans attendre systématiquement une consigne.',
  },
  {
    id: 'a6',
    libelle: 'Communication professionnelle',
    description: "S'exprime correctement et adapte son langage à ses interlocuteurs.",
  },
  {
    id: 'a7',
    libelle: "Respect des règles d'hygiène et de sécurité",
    description: 'Applique les protocoles et porte les équipements de protection requis.',
  },
  {
    id: 'a8',
    libelle: 'Présentation et tenue professionnelle',
    description: 'Adopte une tenue et une présentation adaptées au poste et au contact client.',
  },
  {
    id: 'a9',
    libelle: 'Motivation et implication',
    description: "S'investit dans les tâches confiées et montre de l'intérêt pour le métier.",
  },
  {
    id: 'a10',
    libelle: 'Organisation et gestion du temps',
    description: 'Prépare son poste de travail, priorise et respecte les délais.',
  },
  {
    id: 'a11',
    libelle: "Capacité d'adaptation",
    description: 'Fait face aux imprévus et accepte les changements de poste ou de planning.',
  },
  {
    id: 'a12',
    libelle: 'Prise en compte des remarques',
    description: 'Écoute les retours, accepte la critique constructive et progresse.',
  },
  {
    id: 'a13',
    libelle: "Curiosité et volonté d'apprendre",
    description: "Pose des questions et s'intéresse au métier au-delà des tâches confiées.",
  },
  {
    id: 'a14',
    libelle: 'Soin du matériel et des locaux',
    description: "Utilise, entretient et range correctement l'équipement mis à disposition.",
  },
  {
    id: 'a15',
    libelle: 'Maîtrise de soi et gestion du stress',
    description: 'Garde son calme et un comportement adapté en situation de pression.',
  },
  {
    id: 'a16',
    libelle: 'Discrétion et confidentialité',
    description: "Respecte la confidentialité des informations de l'entreprise et des clients.",
  },
];

/**
 * Indique si une attitude est évaluée dans au moins un entretien existant.
 * Utilisé pour bloquer la suppression depuis le catalogue (cohérence
 * référentielle), comme pour les questions de la banque.
 */
export function attitudeEstUtilisee(
  attitudeId: string,
  entretiens: ReadonlyArray<EntretienTripartite | null>,
): boolean {
  for (const e of entretiens) {
    if (!e) continue;
    const valeur = e.evaluationsAttitudes[attitudeId];
    if (valeur !== undefined && valeur !== null) return true;
  }
  return false;
}

/**
 * Au moins une attitude évaluée dans l'entretien ? Extension R20 (juin
 * 2026) : exigée pour que le maître / tuteur puisse signer.
 */
export function auMoinsUneAttitudeEvaluee(entretien: EntretienTripartite): boolean {
  return Object.values(entretien.evaluationsAttitudes).some((v) => v !== null && v !== undefined);
}

/**
 * Indique si une attitude est retenue dans la sélection d'au moins un livret
 * (13 juin 2026 — le choix se fait à l'E1). Avec `attitudeEstUtilisee`,
 * bloque la suppression depuis le catalogue admin : on ne retire pas du
 * catalogue une attitude qu'un livret référence.
 */
export function attitudeEstSelectionnee(
  attitudeId: string,
  selections: ReadonlyArray<ReadonlyArray<string>>,
): boolean {
  return selections.some((ids) => ids.includes(attitudeId));
}
