import type { Activite, ModeleActivites, Referentiel } from '@/types';

/**
 * Balayage du référentiel par un modèle d'activités (juillet 2026 — chantier
 * référentiels/compétences #4).
 *
 * 10 juillet 2026 (retour démo direction) : le passage d'une formation en mode
 * « activités » n'exige PLUS le balayage complet du référentiel — il suffit que
 * **chaque activité du modèle fasse appel à au moins une compétence évaluable**
 * (cf. `activitesSansCompetenceEvaluable`). La jauge « X/Y compétences
 * couvertes » (`calculerBalayage`) reste affichée à titre **informatif** ; les
 * compétences non couvertes n'apparaîtront simplement pas dans la Synthèse.
 *
 * Pures fonctions — pas d'effet de bord.
 */

export interface EtatBalayage {
  /** Nombre de compétences évaluables (non exclues) du référentiel. */
  total: number;
  /** Ids des compétences évaluables couvertes par au moins une activité (ordre du référentiel). */
  couvertes: string[];
  /** Ids des compétences évaluables non couvertes (ordre du référentiel). */
  manquantes: string[];
  /**
   * Ids mappés qui ne correspondent plus à une compétence évaluable du
   * référentiel (compétence disparue à un réimport, ou exclue depuis).
   * Sans effet sur `complet` — signale un mapping à nettoyer.
   */
  orphelines: string[];
  /** Balayage complet : au moins une compétence évaluable et aucune manquante. */
  complet: boolean;
}

/** Union des compétences couvertes par un ensemble d'activités. */
export function competencesCouvertes(activites: ReadonlyArray<Activite>): Set<string> {
  const ids = new Set<string>();
  for (const a of activites) {
    for (const id of a.competenceIds) ids.add(id);
  }
  return ids;
}

/**
 * Calcule l'état de balayage d'un référentiel par un modèle d'activités.
 * `modele` absent (formation sans modèle rattaché) → balayage vide, incomplet.
 */
export function calculerBalayage(
  modele: ModeleActivites | undefined,
  referentiel: Referentiel,
): EtatBalayage {
  const mappees = modele ? competencesCouvertes(modele.activites) : new Set<string>();

  const couvertes: string[] = [];
  const manquantes: string[] = [];
  const evaluables = new Set<string>();
  for (const bloc of referentiel.blocs) {
    for (const c of bloc.competences) {
      if (c.exclue) continue;
      evaluables.add(c.id);
      if (mappees.has(c.id)) couvertes.push(c.id);
      else manquantes.push(c.id);
    }
  }
  const orphelines = [...mappees].filter((id) => !evaluables.has(id));

  return {
    total: evaluables.size,
    couvertes,
    manquantes,
    orphelines,
    complet: evaluables.size > 0 && manquantes.length === 0,
  };
}

/** Ids des compétences évaluables (non exclues) d'un référentiel. */
export function idsCompetencesEvaluables(referentiel: Referentiel): Set<string> {
  const ids = new Set<string>();
  for (const bloc of referentiel.blocs) {
    for (const c of bloc.competences) {
      if (!c.exclue) ids.add(c.id);
    }
  }
  return ids;
}

/**
 * Activités du modèle qui ne font appel à AUCUNE compétence évaluable du
 * référentiel (mapping vide, ou uniquement des ids disparus / exclus).
 * C'est LA condition de bascule en mode activités depuis le 10 juillet 2026 :
 * la bascule est débloquée dès que cette liste est vide — peu importe que
 * toutes les compétences du référentiel soient balayées ou non.
 * `modele` absent → rien à vérifier, liste vide.
 */
export function activitesSansCompetenceEvaluable(
  modele: ModeleActivites | undefined,
  referentiel: Referentiel,
): Activite[] {
  if (!modele) return [];
  const evaluables = idsCompetencesEvaluables(referentiel);
  return modele.activites.filter((a) => !a.competenceIds.some((id) => evaluables.has(id)));
}
