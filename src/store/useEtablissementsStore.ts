import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Etablissement } from '@/types';
import { etablissementsDemo } from '@/fixtures/etablissements';
import { evaluerVerrouEtablissement } from '@/lib/etablissement-verrou';
import { useFormationsStore } from './useFormationsStore';

/**
 * Store des établissements (lieux de formation).
 * Référence : refonte mai 2026.
 *
 * CRUD réservé au rôle `admin` uniquement (matrice §6 — ressource
 * `admin.etablissements.gerer`). Chaque établissement porte un nom + adresse
 * + URL Pronote optionnelle. Les formations référencent un établissement par
 * id (`Formation.lieuId`).
 *
 * Cohérence référentielle : la suppression est bloquée si au moins une
 * formation référence l'établissement. Pattern aligné avec
 * `useFormationsStore` / `useReferentielsStore`.
 *
 * Note import croisé : on lit `useFormationsStore.getState()` au runtime pour
 * vérifier la cohérence référentielle. Cycle ESM résolu (pas d'init croisée).
 */

interface EtablissementsStore {
  etablissements: Record<string, Etablissement>;

  /** Crée un établissement. L'id est auto-généré. */
  ajouterEtablissement: (input: Omit<Etablissement, 'id'>) => Etablissement;
  /** Met à jour les champs d'un établissement existant. */
  modifierEtablissement: (
    id: string,
    patch: Partial<Omit<Etablissement, 'id'>>,
  ) => void;
  /**
   * Supprime un établissement. Bloquée si au moins une formation y est
   * rattachée (cohérence référentielle).
   * @returns true si supprimé, false si bloqué.
   */
  supprimerEtablissement: (id: string) => boolean;

  /** Réinitialise aux fixtures (utilisé par BoutonReinitialiserDemo). */
  reinitialiser: () => void;
}

const VERSION_SCHEMA = 1;

function etatInitial(): Pick<EtablissementsStore, 'etablissements'> {
  return { etablissements: { ...etablissementsDemo } };
}

export const useEtablissementsStore = create<EtablissementsStore>()(
  persist(
    (set, get) => ({
      ...etatInitial(),

      ajouterEtablissement: (input) => {
        const id = `eta-${crypto.randomUUID().slice(0, 8)}`;
        const etablissement: Etablissement = { id, ...input };
        set({
          etablissements: { ...get().etablissements, [id]: etablissement },
        });
        return etablissement;
      },

      modifierEtablissement: (id, patch) =>
        set((s) => {
          const e = s.etablissements[id];
          if (!e) return s;
          const { id: _ign, ...patchSafe } = patch as Etablissement;
          void _ign;
          return {
            etablissements: { ...s.etablissements, [id]: { ...e, ...patchSafe } },
          };
        }),

      supprimerEtablissement: (id) => {
        const e = get().etablissements[id];
        if (!e) return false;
        const formations = Object.values(useFormationsStore.getState().formations);
        const verrou = evaluerVerrouEtablissement(id, formations);
        if (verrou.verrouille) return false;
        const { [id]: _retire, ...sansLui } = get().etablissements;
        void _retire;
        set({ etablissements: sansLui });
        return true;
      },

      reinitialiser: () => set(etatInitial()),
    }),
    {
      name: 'livret-etablissements',
      version: VERSION_SCHEMA,
      // Migration en cas de bump : reset aux fixtures (cohérent avec la
      // stratégie générale de l'étape 1).
      migrate: () => etatInitial(),
    },
  ),
);
