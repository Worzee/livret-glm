import type { ModeleActivites, Referentiel, SelectionActivitesEntreprise } from '@/types';
import { estValidee, restreindreReferentielAuxIds } from './selection-competences-entreprise';

/**
 * Sélection des activités prévues en entreprise (juillet 2026 — chantier
 * référentiels/compétences #4, arbitrage pilote Q4).
 *
 * Miroir exact de la sélection des compétences (CDC v1.5 §12) pour les
 * formations en mode activités : toutes les activités du modèle sont cochées
 * par défaut, le maître / tuteur (co-saisie formateur) décoche celles non
 * prévues, la sélection se fige à la 3ᵉ signature de l'entretien tripartite,
 * l'invalidation R10 motivée la rouvre.
 *
 * Le type `SelectionActivitesEntreprise` partage la forme de
 * `SelectionCompetencesEntreprise` : les mutations génériques (toggle,
 * validation, invalidation) de `selection-competences-entreprise` s'y
 * appliquent telles quelles. Cette lib ne porte que ce qui est propre aux
 * activités : le réalignement sur le MODÈLE (et non le référentiel) et la
 * restriction de la grille « Synthèse » aux compétences couvertes par les
 * activités retenues.
 */

/**
 * Réaligne la sélection sur le modèle d'activités : toutes les activités
 * redeviennent cochées par défaut. Appelée quand le modèle effectif d'un
 * livret change (réimport du modèle, passage de la formation en mode
 * activités, changement de formation d'un·e apprenti·e).
 *
 *   - Sélection **validée** (3 signatures) → inchangée (invalidation R10).
 *   - Ensemble d'ids déjà identique → même référence (pas de faux signal).
 *   - Sans modèle → sélection vidée.
 */
export function realignerSurModele(
  sel: SelectionActivitesEntreprise,
  modele: ModeleActivites | undefined,
  maintenant: Date = new Date(),
): SelectionActivitesEntreprise {
  if (estValidee(sel)) return sel;
  const ids = modele ? modele.activites.map((a) => a.id) : [];
  const actuels = new Set(sel.ids);
  if (ids.length === sel.ids.length && ids.every((id) => actuels.has(id))) {
    return sel;
  }
  return { ...sel, ids, modifieLe: maintenant.toISOString() };
}

/**
 * Union des compétences couvertes par les activités RETENUES de la sélection.
 * Les ids d'activités disparues du modèle sont ignorés.
 */
export function competencesCouvertesParSelection(
  modele: ModeleActivites,
  sel: SelectionActivitesEntreprise,
): Set<string> {
  const retenues = new Set(sel.ids);
  const couvertes = new Set<string>();
  for (const a of modele.activites) {
    if (!retenues.has(a.id)) continue;
    for (const id of a.competenceIds) couvertes.add(id);
  }
  return couvertes;
}

/**
 * Restreint le référentiel aux compétences couvertes par les activités
 * retenues — c'est le périmètre de la grille « Synthèse » en mode activités
 * (arbitrage Q4, dans la continuité de la modif #3 : la grille ne montre que
 * ce qui est prévu en entreprise). À appliquer APRÈS `referentielEvaluable`.
 */
export function restreindreReferentielAuxActivitesRetenues(
  referentiel: Referentiel,
  modele: ModeleActivites,
  sel: SelectionActivitesEntreprise,
): Referentiel {
  return restreindreReferentielAuxIds(referentiel, competencesCouvertesParSelection(modele, sel));
}
