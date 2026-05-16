import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LienPronote } from '@/types';

/**
 * Store des liens externes Pronote WEB.
 * Référence : refonte mai 2026.
 *
 * CRUD réservé aux rôles `coordo` et `admin` (matrice §6 — ressource
 * `admin.pronote.gerer`). Tous les utilisateur·rice·s peuvent consulter la
 * liste depuis la page `/livret/pronote`.
 *
 * Chaque lien est un simple `(libelle, url, description?)` — l'utilisateur·rice
 * s'identifie avec ses propres credentials côté Pronote (pas de SSO côté
 * maquette). Cela permet par exemple d'avoir un espace élèves et un espace
 * enseignants distincts dans une même installation Pronote.
 */

interface PronoteStore {
  liens: Record<string, LienPronote>;

  /** Crée un nouveau lien (id auto-généré). */
  ajouterLien: (input: Omit<LienPronote, 'id'>) => LienPronote;
  /** Met à jour un lien existant. L'id n'est pas modifiable. */
  modifierLien: (id: string, patch: Partial<Omit<LienPronote, 'id'>>) => void;
  /** Supprime un lien. Aucun verrou (les liens sont autonomes). */
  supprimerLien: (id: string) => void;

  /** Réinitialise au catalogue par défaut (utilisé par BoutonReinitialiserDemo). */
  reinitialiser: () => void;
}

const VERSION_SCHEMA = 1;

/**
 * Catalogue par défaut — vide en démo pour ne pas laisser entendre que des
 * URLs Pronote « officielles » seraient pré-configurées. Le pilote ajoute
 * ses propres liens depuis la page d'administration.
 */
function etatInitial(): Pick<PronoteStore, 'liens'> {
  return { liens: {} };
}

export const usePronoteStore = create<PronoteStore>()(
  persist(
    (set, get) => ({
      ...etatInitial(),

      ajouterLien: (input) => {
        const id = `pronote-${crypto.randomUUID().slice(0, 8)}`;
        const lien: LienPronote = { id, ...input };
        set({ liens: { ...get().liens, [id]: lien } });
        return lien;
      },

      modifierLien: (id, patch) =>
        set((s) => {
          const l = s.liens[id];
          if (!l) return s;
          // Sanitize : on ignore tout id parasite éventuellement passé en patch.
          const { id: _ign, ...patchSafe } = patch as LienPronote;
          void _ign;
          return { liens: { ...s.liens, [id]: { ...l, ...patchSafe } } };
        }),

      supprimerLien: (id) =>
        set((s) => {
          const { [id]: _retire, ...sansLui } = s.liens;
          void _retire;
          return { liens: sansLui };
        }),

      reinitialiser: () => set(etatInitial()),
    }),
    {
      name: 'livret-pronote',
      version: VERSION_SCHEMA,
      // Migration en cas de bump : reset au catalogue par défaut (cohérent
      // avec la stratégie générale de l'étape 1).
      migrate: () => etatInitial(),
    },
  ),
);
