import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Referentiel } from '@/types';
import { referentielCapCuisine } from '@/fixtures/referentiel-cap-cuisine';
import { useFormationsStore } from './useFormationsStore';

/**
 * Store des référentiels de compétences.
 * Référence : cahier des charges v1.3, extension 3 (import de référentiels).
 *
 * Initialisé depuis le fixture CAP Cuisine pour la démo. Persisté en
 * localStorage — les imports survivent aux rechargements jusqu'au reset.
 *
 * Conception alignée sur `useFormationsStore` :
 *   - Record indexé par id pour lookup O(1)
 *   - Mutations granulaires (ajouter / modifier / supprimer)
 *   - `supprimerReferentiel` retourne `false` si une formation y est rattachée
 *     (cohérence référentielle, cf. `lib/referentiel-verrou`)
 *   - `reinitialiser` remet l'état au fixture initial
 *
 * Note import croisé : on lit `useFormationsStore.getState()` au runtime pour
 * vérifier la cohérence référentielle. Pas d'accès à l'init du module — le
 * cycle est résolu par ESM (cohérent avec les autres stores).
 */

interface ReferentielsStore {
  referentiels: Record<string, Referentiel>;

  /**
   * Ajoute (ou écrase) un référentiel. Si l'id existe déjà, le précédent est
   * remplacé — utile pour réimporter une version corrigée du même CSV.
   * @returns le référentiel persisté.
   */
  ajouterReferentiel: (referentiel: Referentiel) => Referentiel;
  /** Met à jour partiellement un référentiel existant (rare en pratique). */
  modifierReferentiel: (id: string, patch: Partial<Omit<Referentiel, 'id'>>) => void;
  /**
   * Supprime un référentiel. Empêche la suppression si au moins une formation
   * y est rattachée (cohérence référentielle).
   * @returns true si supprimé, false si bloqué.
   */
  supprimerReferentiel: (id: string) => boolean;

  /** Réinitialise le store au fixture initial (utilisé par BoutonReinitialiserDemo). */
  reinitialiser: () => void;
}

// Bumpé post-CDC v1.5 addendum :
//   v2 — retrait du flag `Competence.evalueeEnEntreprise` (le choix des
//        compétences abordées en entreprise se fait désormais par livret,
//        validé conjointement formateur + maître à l'entretien tripartite —
//        cf. `useLivretStore.selectionCompetencesEntreprise`)
const VERSION_SCHEMA = 2;

function etatInitial(): Pick<ReferentielsStore, 'referentiels'> {
  return {
    referentiels: { [referentielCapCuisine.id]: referentielCapCuisine },
  };
}

export const useReferentielsStore = create<ReferentielsStore>()(
  persist(
    (set, get) => ({
      ...etatInitial(),

      ajouterReferentiel: (referentiel) => {
        set({
          referentiels: { ...get().referentiels, [referentiel.id]: referentiel },
        });
        return referentiel;
      },

      modifierReferentiel: (id, patch) =>
        set((s) => {
          const r = s.referentiels[id];
          if (!r) return s;
          return { referentiels: { ...s.referentiels, [id]: { ...r, ...patch } } };
        }),

      supprimerReferentiel: (id) => {
        const referentiel = get().referentiels[id];
        if (!referentiel) return false;
        const formations = Object.values(useFormationsStore.getState().formations);
        if (formations.some((f) => f.referentielId === id)) return false;
        const { [id]: _retire, ...sansLui } = get().referentiels;
        void _retire;
        set({ referentiels: sansLui });
        return true;
      },

      reinitialiser: () => set(etatInitial()),
    }),
    {
      name: 'livret-referentiels',
      version: VERSION_SCHEMA,
      // Migration en cas de bump : reset au fixture (cohérent avec la stratégie
      // générale de l'étape 1).
      migrate: () => etatInitial(),
    },
  ),
);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers non-réactifs — utilisés depuis d'autres stores ou pages dont les
// composants ne peuvent pas appeler de hook (ex. callbacks asynchrones).
// ─────────────────────────────────────────────────────────────────────────────

export function getReferentielByIdFromStore(id: string): Referentiel | undefined {
  return useReferentielsStore.getState().referentiels[id];
}
