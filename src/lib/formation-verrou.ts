import type { Apprenti } from '@/types';

/**
 * Verrou de suppression d'une formation.
 * Référence : cahier des charges v1.3, section 7.1 (cohérence référentielle).
 *
 * Pour préserver l'intégrité des livrets en cours, une formation ne peut être
 * supprimée tant qu'au moins un·e apprenti·e y est rattaché·e. La page
 * /admin/affectations permet de réaffecter les apprenti·e·s avant suppression.
 *
 * Pure fonction — testable sans React ni store.
 */

export interface VerrouFormation {
  verrouille: boolean;
  nbApprentisRattaches: number;
  /** Message lisible expliquant le blocage. Défini uniquement si verrouillé. */
  raison?: string;
}

export function evaluerVerrouFormation(
  formationId: string,
  apprentis: ReadonlyArray<Apprenti>,
): VerrouFormation {
  const nb = apprentis.filter((a) => a.formationId === formationId).length;
  if (nb === 0) {
    return { verrouille: false, nbApprentisRattaches: 0 };
  }
  // Suffixe d'inclusivité cohérent avec les autres pages (cf. GestionUtilisateurs).
  const sfx = nb > 1 ? '·s' : '';
  return {
    verrouille: true,
    nbApprentisRattaches: nb,
    raison: `${nb} apprenti·e${sfx} rattaché·e${sfx} : réaffectez-les avant suppression.`,
  };
}
