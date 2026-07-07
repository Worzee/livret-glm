import type { Formation } from '@/types';
import { modeEffectif, type ResultatValidation } from './mode-evaluation';

/**
 * Verrous des modèles d'activités (juillet 2026 — chantier
 * référentiels/compétences #4). Miroir de `referentiel-verrou` :
 *
 *   - **Suppression** bloquée tant qu'au moins une formation rattache le
 *     modèle (`Formation.modeleActivitesId`) — détacher d'abord.
 *   - **Remplacement** (réimport sous le même id — le mapping repart vierge)
 *     bloqué si une formation rattachée est en **mode activités** : le
 *     balayage redeviendrait incomplet (arbitrage pilote Q6). En mode
 *     compétences, remplacement permis (pattern référentiels : avertissement
 *     UI + réalignement des sélections non validées).
 *
 * Pures fonctions — testables sans React ni store.
 */

export interface VerrouModeleActivites {
  verrouille: boolean;
  nbFormationsRattachees: number;
  /** Message lisible expliquant le blocage. Défini uniquement si verrouillé. */
  raison?: string;
}

export function evaluerVerrouModeleActivites(
  modeleId: string,
  formations: ReadonlyArray<Formation>,
): VerrouModeleActivites {
  const nb = formations.filter((f) => f.modeleActivitesId === modeleId).length;
  if (nb === 0) {
    return { verrouille: false, nbFormationsRattachees: 0 };
  }
  const sfx = nb > 1 ? 's' : '';
  return {
    verrouille: true,
    nbFormationsRattachees: nb,
    raison: `${nb} formation${sfx} rattachée${sfx} : détachez le modèle avant suppression.`,
  };
}

export function peutRemplacerModele(
  modeleId: string,
  formations: ReadonlyArray<Formation>,
): ResultatValidation {
  const bloquantes = formations.filter(
    (f) => f.modeleActivitesId === modeleId && modeEffectif(f) === 'activites',
  );
  if (bloquantes.length === 0) return { ok: true };
  const noms = bloquantes.map((f) => f.intitule).join(', ');
  return {
    ok: false,
    raison: `Réimport bloqué : ${noms} ${bloquantes.length > 1 ? 'sont' : 'est'} en mode activités sur ce modèle : le mapping repartirait vierge et le balayage serait incomplet. Repassez d’abord en mode compétences.`,
  };
}
