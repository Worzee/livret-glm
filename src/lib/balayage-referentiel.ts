import type { Activite, ModeleActivites, Referentiel } from '@/types';

/**
 * Balayage du référentiel par un modèle d'activités (juillet 2026 — chantier
 * référentiels/compétences #4).
 *
 * Le passage d'une formation en mode d'évaluation « activités » exige que le
 * mapping du modèle couvre TOUTES les compétences évaluables du référentiel
 * (hors compétences exclues — modif #2). Cette lib calcule la jauge affichée
 * dans l'éditeur de mapping (« X/Y compétences couvertes ») et le drapeau
 * `complet` qui conditionne le déblocage du choix de mode.
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

/**
 * Une compétence est-elle couverte par le mapping du modèle ? Sert de garde à
 * la réactivation d'une compétence exclue quand une formation rattachée est en
 * mode activités : réactiver une compétence non couverte rendrait le balayage
 * incomplet (arbitrage pilote Q6 — l'action est alors bloquée).
 */
export function estCouverteParModele(
  modele: ModeleActivites | undefined,
  competenceId: string,
): boolean {
  if (!modele) return false;
  return modele.activites.some((a) => a.competenceIds.includes(competenceId));
}
