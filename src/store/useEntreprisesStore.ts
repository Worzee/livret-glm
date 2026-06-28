import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Entreprise } from '@/types';
import { entreprisesDemo } from '@/fixtures/entreprises';
import { evaluerVerrouEntreprise } from '@/lib/entreprise-verrou';
import { useUtilisateursStore } from './useUtilisateursStore';

/**
 * Store des entreprises d'accueil des apprenti·e·s (juin 2026).
 *
 * CRUD réservé aux rôles `coordo` et `admin` (matrice §6 — ressource
 * `admin.entreprises.gerer`). Chaque entreprise porte une raison sociale
 * (obligatoire) + SIRET / adresse optionnels. Les apprenti·e·s référencent une
 * entreprise par id (`Apprenti.entrepriseId`).
 *
 * Cohérence référentielle : la suppression est bloquée si au moins un·e
 * apprenti·e y est rattaché·e. Pattern aligné avec `useEtablissementsStore`.
 *
 * Note import croisé : on lit `useUtilisateursStore.getState()` au runtime pour
 * vérifier la cohérence référentielle. Cycle ESM résolu (pas d'init croisée).
 */

interface EntreprisesStore {
  entreprises: Record<string, Entreprise>;

  /** Crée une entreprise. L'id est auto-généré. */
  ajouterEntreprise: (input: Omit<Entreprise, 'id'>) => Entreprise;
  /** Met à jour les champs d'une entreprise existante. */
  modifierEntreprise: (id: string, patch: Partial<Omit<Entreprise, 'id'>>) => void;
  /**
   * Supprime une entreprise. Bloquée si au moins un·e apprenti·e y est
   * rattaché·e (cohérence référentielle).
   * @returns true si supprimée, false si bloquée.
   */
  supprimerEntreprise: (id: string) => boolean;

  /** Réinitialise aux fixtures (utilisé par BoutonReinitialiserDemo). */
  reinitialiser: () => void;
}

const VERSION_SCHEMA = 1;

function etatInitial(): Pick<EntreprisesStore, 'entreprises'> {
  return { entreprises: { ...entreprisesDemo } };
}

export const useEntreprisesStore = create<EntreprisesStore>()(
  persist(
    (set, get) => ({
      ...etatInitial(),

      ajouterEntreprise: (input) => {
        const id = `e-${crypto.randomUUID().slice(0, 8)}`;
        const entreprise: Entreprise = { id, ...input };
        set({ entreprises: { ...get().entreprises, [id]: entreprise } });
        return entreprise;
      },

      modifierEntreprise: (id, patch) =>
        set((s) => {
          const e = s.entreprises[id];
          if (!e) return s;
          const { id: _ign, ...patchSafe } = patch as Entreprise;
          void _ign;
          return { entreprises: { ...s.entreprises, [id]: { ...e, ...patchSafe } } };
        }),

      supprimerEntreprise: (id) => {
        const e = get().entreprises[id];
        if (!e) return false;
        const apprentis = Object.values(useUtilisateursStore.getState().apprentis);
        const verrou = evaluerVerrouEntreprise(id, apprentis);
        if (verrou.verrouille) return false;
        const { [id]: _retire, ...sansLui } = get().entreprises;
        void _retire;
        set({ entreprises: sansLui });
        return true;
      },

      reinitialiser: () => set(etatInitial()),
    }),
    {
      name: 'livret-entreprises',
      version: VERSION_SCHEMA,
      // Migration en cas de bump : reset aux fixtures (stratégie étape 1).
      migrate: () => etatInitial(),
    },
  ),
);
