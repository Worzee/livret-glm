import type { Formation } from '@/types';

/**
 * Verrou de suppression d'un référentiel.
 * Référence : cahier des charges v1.3, section 7.1 (cohérence référentielle).
 *
 * Pour préserver l'intégrité des grilles d'évaluation et la traçabilité des
 * livrets en cours, un référentiel ne peut être supprimé tant qu'au moins
 * une formation y est rattachée. La page /admin/formations permet de
 * déplacer la référence (ou de la vider) avant suppression.
 *
 * Pure fonction — testable sans React ni store.
 */

export interface VerrouReferentiel {
  verrouille: boolean;
  nbFormationsRattachees: number;
  /** Message lisible expliquant le blocage. Défini uniquement si verrouillé. */
  raison?: string;
}

export function evaluerVerrouReferentiel(
  referentielId: string,
  formations: ReadonlyArray<Formation>,
): VerrouReferentiel {
  const nb = formations.filter((f) => f.referentielId === referentielId).length;
  if (nb === 0) {
    return { verrouille: false, nbFormationsRattachees: 0 };
  }
  // Pluriel français standard pour « formation » (ne pas confondre avec
  // « apprenti·e » qui prend un suffixe inclusif). Cohérent avec l'usage CDC.
  const sfx = nb > 1 ? 's' : '';
  return {
    verrouille: true,
    nbFormationsRattachees: nb,
    raison: `${nb} formation${sfx} rattachée${sfx} — réaffectez le référentiel avant suppression.`,
  };
}
