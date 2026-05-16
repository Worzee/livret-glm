import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Formation } from '@/types';
import { formationsDemo } from '@/fixtures/formations';
import { useUtilisateursStore } from './useUtilisateursStore';

/**
 * Store des formations du dispositif.
 * Référence : cahier des charges v1.3, section 7.1 (entité Formation).
 *
 * Initialisé depuis les fixtures pour la démo. Persisté en localStorage —
 * les ajouts/modifications survivent aux rechargements jusqu'au reset.
 *
 * Conception alignée sur `useUtilisateursStore` :
 *   - Record indexé par id pour lookup O(1)
 *   - Mutations granulaires (ajouter / modifier / supprimer)
 *   - `supprimerFormation` retourne `false` si des apprenti·e·s y sont
 *     rattaché·e·s (cohérence référentielle, cf. `lib/formation-verrou`)
 *   - `reinitialiser` remet l'état aux fixtures
 *
 * Note import croisé : on lit `useUtilisateursStore.getState()` au runtime
 * pour vérifier la cohérence référentielle. Pas d'import à l'init du module
 * — le cycle est résolu par ESM (cohérent avec `useUtilisateursStore`).
 */

interface FormationsStore {
  formations: Record<string, Formation>;

  /**
   * Crée une nouvelle formation.
   * @returns la formation créée (avec id auto-généré).
   */
  ajouterFormation: (input: Omit<Formation, 'id'>) => Formation;
  /** Met à jour les champs d'une formation existante. */
  modifierFormation: (id: string, patch: Partial<Omit<Formation, 'id'>>) => void;
  /**
   * Supprime une formation. **Empêche la suppression** si au moins un·e
   * apprenti·e y est rattaché·e (cohérence référentielle).
   * @returns true si supprimée, false si bloquée.
   */
  supprimerFormation: (id: string) => boolean;

  /** Réinitialise le store aux fixtures (utilisé par BoutonReinitialiserDemo). */
  reinitialiser: () => void;
}

// Bumpé post-livraison :
//   v1 — schéma initial (`Formation.lieu: Lieu` inline)
//   v2 — refonte mai 2026 : `Formation.lieuId: string` (relation vers
//        `useEtablissementsStore`). Reset complet à la première charge.
const VERSION_SCHEMA = 2;

function etatInitial(): Pick<FormationsStore, 'formations'> {
  return { formations: { ...formationsDemo } };
}

export const useFormationsStore = create<FormationsStore>()(
  persist(
    (set, get) => ({
      ...etatInitial(),

      ajouterFormation: (input) => {
        const id = `f-${crypto.randomUUID().slice(0, 8)}`;
        const formation: Formation = { id, ...input };
        set({ formations: { ...get().formations, [id]: formation } });
        return formation;
      },

      modifierFormation: (id, patch) =>
        set((s) => {
          const formation = s.formations[id];
          if (!formation) return s;
          return {
            formations: { ...s.formations, [id]: { ...formation, ...patch } },
          };
        }),

      supprimerFormation: (id) => {
        const formation = get().formations[id];
        if (!formation) return false;
        // Cohérence référentielle : pas de suppression tant qu'un·e apprenti·e
        // y est rattaché·e. La page /admin/affectations sert à les déplacer
        // d'abord, exactement comme pour la suppression d'un maître/formateur.
        const apprentis = Object.values(useUtilisateursStore.getState().apprentis);
        if (apprentis.some((a) => a.formationId === id)) return false;
        const { [id]: _retire, ...sansElle } = get().formations;
        void _retire;
        set({ formations: sansElle });
        return true;
      },

      reinitialiser: () => set(etatInitial()),
    }),
    {
      name: 'livret-formations',
      version: VERSION_SCHEMA,
      // Migration en cas de bump : reset aux fixtures (cohérent avec la
      // stratégie générale de l'étape 1).
      migrate: () => etatInitial(),
    },
  ),
);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers non-réactifs — utilisés depuis d'autres stores ou pages dont les
// composants ne peuvent pas appeler de hook (ex. callbacks asynchrones).
// Les composants UI doivent passer par le hook ci-dessus.
// ─────────────────────────────────────────────────────────────────────────────

export function getFormationByIdFromStore(id: string): Formation | undefined {
  return useFormationsStore.getState().formations[id];
}
