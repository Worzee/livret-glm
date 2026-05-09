import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Admin, Apprenti, Coordo, Formateur, Maitre } from '@/types';
import {
  adminGuillaumeFerreri,
  apprentisDemo,
  coordoMartineLefevre,
  formatriceSophieDubois,
  maitresDemo,
} from '@/fixtures/utilisateurs';
import { useLivretStore } from './useLivretStore';
import { useApprentiActifStore } from './useApprentiActifStore';
import { creerLivretVierge } from '@/lib/creation-livret';

/**
 * Store des utilisateurs du dispositif (4 rôles métier + admin).
 * Référence : cahier des charges v1.3, sections 7.1 et 24.
 *
 * Initialisé depuis les fixtures pour la démo. Persisté en localStorage —
 * les ajouts/modifications survivent aux rechargements jusqu'au reset.
 *
 * Conception :
 *   - On stocke chaque type d'utilisateur dans son propre Record indexé par id
 *     (lookup O(1)) plutôt qu'un tableau plat — facilite les mutations partielles.
 *   - Les mutations sur les apprenti·e·s synchronisent automatiquement le livret
 *     correspondant (création vierge à l'ajout, suppression à la suppression).
 *   - Les mutations sur les maîtres garantissent la cohérence des `apprentiIds`
 *     (retrait automatique d'une référence vers un·e apprenti·e supprimé·e).
 *
 * Note import croisé : `useLivretStore` et `useApprentiActifStore` sont importés
 * pour la synchro à la mutation, mais leurs `getState()` ne sont appelés qu'au
 * runtime (jamais à l'init du module) — le cycle d'import est résolu par ESM.
 */

interface UtilisateursStore {
  apprentis: Record<string, Apprenti>;
  maitres: Record<string, Maitre>;
  formateurs: Record<string, Formateur>;
  coordos: Record<string, Coordo>;
  admins: Record<string, Admin>;

  // ── Apprenti·e·s ─────────────────────────────────────────────────────────
  /**
   * Crée un·e nouvel·le apprenti·e + son livret vierge associé.
   * @returns l'apprenti·e créé·e (avec id auto-généré).
   */
  ajouterApprenti: (
    input: Omit<Apprenti, 'id' | 'role'>,
    auteurId: string,
  ) => Apprenti;
  /** Met à jour les champs d'un·e apprenti·e existant·e. */
  modifierApprenti: (id: string, patch: Partial<Omit<Apprenti, 'id' | 'role'>>) => void;
  /**
   * Supprime un·e apprenti·e + son livret + retire les références dans les
   * maîtres concernés. Si l'apprenti·e supprimé·e était l'apprenti·e actif·ve,
   * réinit sur le 1ᵉʳ apprenti·e disponible (ou null si aucun).
   */
  supprimerApprenti: (id: string) => void;

  /** Réinitialise le store aux fixtures (utilisé par BoutonReinitialiserDemo). */
  reinitialiser: () => void;
}

const VERSION_SCHEMA = 1;

/** État initial calculé depuis les fixtures. */
function etatInitial(): Pick<
  UtilisateursStore,
  'apprentis' | 'maitres' | 'formateurs' | 'coordos' | 'admins'
> {
  return {
    apprentis: Object.fromEntries(apprentisDemo.map((a) => [a.id, a])),
    maitres: Object.fromEntries(maitresDemo.map((m) => [m.id, m])),
    formateurs: { [formatriceSophieDubois.id]: formatriceSophieDubois },
    coordos: { [coordoMartineLefevre.id]: coordoMartineLefevre },
    admins: { [adminGuillaumeFerreri.id]: adminGuillaumeFerreri },
  };
}

export const useUtilisateursStore = create<UtilisateursStore>()(
  persist(
    (set, get) => ({
      ...etatInitial(),

      ajouterApprenti: (input, auteurId) => {
        const id = `u-apprenti-${crypto.randomUUID().slice(0, 8)}`;
        const apprenti: Apprenti = { id, role: 'apprenti', ...input };
        // Crée le livret vierge associé. L'id du livret suit la convention
        // `livret-<id apprenti>` pour faciliter la traçabilité.
        const livret = creerLivretVierge(apprenti, `livret-${id}`, auteurId);
        useLivretStore.setState((s) => ({
          livrets: { ...s.livrets, [livret.id]: livret },
          derniereModification: new Date().toISOString(),
        }));
        // Si l'apprenti·e a un maître désigné, l'ajouter à ses apprentiIds.
        const maitre = get().maitres[apprenti.maitreApprentissageId];
        const nouveauxMaitres = maitre
          ? {
              ...get().maitres,
              [maitre.id]: {
                ...maitre,
                apprentiIds: [...maitre.apprentiIds, id],
              },
            }
          : get().maitres;
        set({
          apprentis: { ...get().apprentis, [id]: apprenti },
          maitres: nouveauxMaitres,
        });
        return apprenti;
      },

      modifierApprenti: (id, patch) =>
        set((s) => {
          const apprenti = s.apprentis[id];
          if (!apprenti) return s;
          const nouveau: Apprenti = { ...apprenti, ...patch };
          const updates: Partial<UtilisateursStore> = {
            apprentis: { ...s.apprentis, [id]: nouveau },
          };
          // Si le maître a changé, mettre à jour les `apprentiIds` des deux maîtres concernés.
          if (patch.maitreApprentissageId && patch.maitreApprentissageId !== apprenti.maitreApprentissageId) {
            const ancien = s.maitres[apprenti.maitreApprentissageId];
            const nouveauMaitre = s.maitres[patch.maitreApprentissageId];
            const nouveauxMaitres = { ...s.maitres };
            if (ancien) {
              nouveauxMaitres[ancien.id] = {
                ...ancien,
                apprentiIds: ancien.apprentiIds.filter((aid) => aid !== id),
              };
            }
            if (nouveauMaitre) {
              nouveauxMaitres[nouveauMaitre.id] = {
                ...nouveauMaitre,
                apprentiIds: nouveauMaitre.apprentiIds.includes(id)
                  ? nouveauMaitre.apprentiIds
                  : [...nouveauMaitre.apprentiIds, id],
              };
            }
            updates.maitres = nouveauxMaitres;
          }
          return updates;
        }),

      supprimerApprenti: (id) => {
        const s = get();
        const apprenti = s.apprentis[id];
        if (!apprenti) return;
        // Retire l'apprenti·e du maître concerné.
        const maitre = s.maitres[apprenti.maitreApprentissageId];
        const nouveauxMaitres = maitre
          ? {
              ...s.maitres,
              [maitre.id]: {
                ...maitre,
                apprentiIds: maitre.apprentiIds.filter((aid) => aid !== id),
              },
            }
          : s.maitres;
        // Retire l'apprenti·e du store.
        const { [id]: _retire, ...apprentisSansLui } = s.apprentis;
        void _retire;
        set({ apprentis: apprentisSansLui, maitres: nouveauxMaitres });
        // Supprime le livret correspondant.
        useLivretStore.setState((sl) => {
          const nouveauxLivrets = { ...sl.livrets };
          for (const livretId of Object.keys(nouveauxLivrets)) {
            if (nouveauxLivrets[livretId].apprentiId === id) {
              delete nouveauxLivrets[livretId];
            }
          }
          return {
            livrets: nouveauxLivrets,
            derniereModification: new Date().toISOString(),
          };
        });
        // Si l'apprenti·e supprimé·e était l'apprenti·e actif·ve, replier vers
        // le 1ᵉʳ apprenti·e restant (ou null s'il n'y en a plus).
        if (useApprentiActifStore.getState().apprentiActifId === id) {
          const restants = Object.keys(apprentisSansLui);
          useApprentiActifStore.getState().setApprentiActif(restants[0] ?? null);
        }
      },

      reinitialiser: () => set(etatInitial()),
    }),
    {
      name: 'livret-utilisateurs',
      version: VERSION_SCHEMA,
      // Migration en cas de bump : on reset aux fixtures (cohérent avec
      // la stratégie générale de l'étape 1).
      migrate: () => etatInitial(),
    },
  ),
);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers non-réactifs — utilisés par d'autres stores (cycle d'import OK)
// Les composants UI doivent passer par les hooks ci-dessous.
// ─────────────────────────────────────────────────────────────────────────────

/** Lookup non-réactif d'un·e apprenti·e par id. */
export function getApprentiByIdFromStore(id: string): Apprenti | undefined {
  return useUtilisateursStore.getState().apprentis[id];
}

/** Lookup non-réactif d'un maître par id. */
export function getMaitreByIdFromStore(id: string): Maitre | undefined {
  return useUtilisateursStore.getState().maitres[id];
}
