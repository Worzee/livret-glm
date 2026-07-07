import type { Formation } from '@/types';

/**
 * Verrou de suppression d'un établissement (lieu de formation).
 * Référence : refonte mai 2026.
 *
 * Pour préserver l'intégrité des formations existantes, un établissement ne
 * peut être supprimé tant qu'au moins une formation y est rattachée. Pattern
 * aligné avec `formation-verrou` / `referentiel-verrou`.
 *
 * Pure fonction — testable sans React ni store.
 */

export interface VerrouEtablissement {
  verrouille: boolean;
  nbFormationsRattachees: number;
  /** Message lisible expliquant le blocage. Défini uniquement si verrouillé. */
  raison?: string;
}

export function evaluerVerrouEtablissement(
  etablissementId: string,
  formations: ReadonlyArray<Formation>,
): VerrouEtablissement {
  const nb = formations.filter((f) => f.lieuId === etablissementId).length;
  if (nb === 0) {
    return { verrouille: false, nbFormationsRattachees: 0 };
  }
  const sfx = nb > 1 ? 's' : '';
  return {
    verrouille: true,
    nbFormationsRattachees: nb,
    raison: `${nb} formation${sfx} rattachée${sfx} : réaffectez-les avant suppression.`,
  };
}
