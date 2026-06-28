import type { Apprenti } from '@/types';

/**
 * Verrou de suppression d'une entreprise d'accueil.
 * Référence : juin 2026.
 *
 * Pour préserver l'intégrité des affectations, une entreprise ne peut être
 * supprimée tant qu'au moins un·e apprenti·e y est rattaché·e. Pattern aligné
 * avec `etablissement-verrou` / `referentiel-verrou`.
 *
 * Pure fonction — testable sans React ni store.
 */

export interface VerrouEntreprise {
  verrouille: boolean;
  nbApprentisRattaches: number;
  /** Message lisible expliquant le blocage. Défini uniquement si verrouillé. */
  raison?: string;
}

export function evaluerVerrouEntreprise(
  entrepriseId: string,
  apprentis: ReadonlyArray<Apprenti>,
): VerrouEntreprise {
  const nb = apprentis.filter((a) => a.entrepriseId === entrepriseId).length;
  if (nb === 0) {
    return { verrouille: false, nbApprentisRattaches: 0 };
  }
  const sfx = nb > 1 ? 's' : '';
  return {
    verrouille: true,
    nbApprentisRattaches: nb,
    raison: `${nb} apprenti·e${sfx} rattaché·e${sfx} — réaffectez-les avant suppression.`,
  };
}
