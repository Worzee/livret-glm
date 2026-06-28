import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Admin, Apprenti, Coordo, Formateur, Maitre } from '@/types';
import {
  adminGuillaumeFerreri,
  apprentisDemo,
  coordosDemo,
  formatriceSophieDubois,
  maitresDemo,
} from '@/fixtures/utilisateurs';
import { useLivretStore } from './useLivretStore';
import { useApprentiActifStore } from './useApprentiActifStore';
import { useFormationsStore } from './useFormationsStore';
import { creerLivretVierge } from '@/lib/creation-livret';
import { maitresIdsDeLApprenti } from '@/lib/maitres-apprenti';
import {
  ajouterAffectationSiChangement,
  creerAffectation,
  type AuteurAffectation,
} from '@/lib/historique-entreprise';

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
  ajouterApprenti: (input: Omit<Apprenti, 'id' | 'role'>, auteur: AuteurAffectation) => Apprenti;
  /**
   * Met à jour les champs d'un·e apprenti·e existant·e. Si `entrepriseId` change
   * et qu'un `auteur` est fourni, une entrée datée est ajoutée à
   * `historiqueEntreprises` (traçabilité du changement d'entreprise).
   */
  modifierApprenti: (
    id: string,
    patch: Partial<Omit<Apprenti, 'id' | 'role'>>,
    auteur?: AuteurAffectation,
  ) => void;
  /**
   * Supprime un·e apprenti·e + son livret + retire les références dans les
   * maîtres concernés. Si l'apprenti·e supprimé·e était l'apprenti·e actif·ve,
   * réinit sur le 1ᵉʳ apprenti·e disponible (ou null si aucun).
   */
  supprimerApprenti: (id: string) => void;

  // ── Maîtres d'apprentissage ──────────────────────────────────────────────
  ajouterMaitre: (input: Omit<Maitre, 'id' | 'role' | 'apprentiIds'>) => Maitre;
  modifierMaitre: (id: string, patch: Partial<Omit<Maitre, 'id' | 'role' | 'apprentiIds'>>) => void;
  /**
   * Supprime un maître. **Empêche la suppression** si des apprenti·e·s sont
   * encore rattaché·e·s à lui (cohérence référentielle). L'UI doit afficher
   * un message demandant la réaffectation préalable.
   * @returns true si supprimé, false si bloqué.
   */
  supprimerMaitre: (id: string) => boolean;

  // ── Formateurs référents ─────────────────────────────────────────────────
  ajouterFormateur: (input: Omit<Formateur, 'id' | 'role' | 'promoIds'>) => Formateur;
  modifierFormateur: (
    id: string,
    patch: Partial<Omit<Formateur, 'id' | 'role' | 'promoIds'>>,
  ) => void;
  /**
   * Supprime un formateur. Empêche la suppression si des apprenti·e·s le
   * référencent encore via `formateurReferentId`.
   */
  supprimerFormateur: (id: string) => boolean;

  // ── Coordo (administratif·ve) ────────────────────────────────────────────
  /** Création réservée au rôle admin (matrice §6). Vérification UI préalable. */
  ajouterCoordo: (input: Omit<Coordo, 'id' | 'role' | 'formationIds'>) => Coordo;
  modifierCoordo: (
    id: string,
    patch: Partial<Omit<Coordo, 'id' | 'role' | 'formationIds'>>,
  ) => void;
  /** Suppression libre — aucune référence vers le coordo dans les autres types. */
  supprimerCoordo: (id: string) => void;

  /** Réinitialise le store aux fixtures (utilisé par BoutonReinitialiserDemo). */
  reinitialiser: () => void;
}

// v4 — répartition des apprenti·e·s par coordo (juin 2026).
// v5 — entreprise gérée comme entité + `Apprenti.historiqueEntreprises`
//      (juin 2026) : `entrepriseId` pointe vers `useEntreprisesStore`,
//      traçabilité des changements d'entreprise en cours de contrat.
const VERSION_SCHEMA = 5;

/** État initial calculé depuis les fixtures. */
function etatInitial(): Pick<
  UtilisateursStore,
  'apprentis' | 'maitres' | 'formateurs' | 'coordos' | 'admins'
> {
  return {
    apprentis: Object.fromEntries(apprentisDemo.map((a) => [a.id, a])),
    maitres: Object.fromEntries(maitresDemo.map((m) => [m.id, m])),
    formateurs: { [formatriceSophieDubois.id]: formatriceSophieDubois },
    coordos: Object.fromEntries(coordosDemo.map((c) => [c.id, c])),
    admins: { [adminGuillaumeFerreri.id]: adminGuillaumeFerreri },
  };
}

export const useUtilisateursStore = create<UtilisateursStore>()(
  persist(
    (set, get) => ({
      ...etatInitial(),

      ajouterApprenti: (input, auteur) => {
        const id = `u-apprenti-${crypto.randomUUID().slice(0, 8)}`;
        // Historique d'entreprise : entrée initiale si une entreprise est déjà
        // affectée à la création (vide pour un import orphelin sans entreprise).
        const historiqueEntreprises = input.entrepriseId
          ? [creerAffectation(input.entrepriseId, auteur, new Date().toISOString())]
          : [];
        const apprenti: Apprenti = { id, role: 'apprenti', ...input, historiqueEntreprises };
        // Le livret hérite des fiches du planning de la formation rattachée
        // (chantier #1) — vide si l'apprenti·e n'a pas encore de formation
        // (cas d'un import XLSX sans affectation).
        const formation = apprenti.formationId
          ? useFormationsStore.getState().formations[apprenti.formationId]
          : undefined;
        const planning = formation?.periodes ?? [];
        const planningCentre = formation?.periodesCentre ?? [];
        const livret = creerLivretVierge(
          apprenti,
          `livret-${id}`,
          auteur.id,
          planning,
          new Date(),
          planningCentre,
        );
        useLivretStore.setState((s) => ({
          livrets: { ...s.livrets, [livret.id]: livret },
          derniereModification: new Date().toISOString(),
        }));
        // Ajoute l'apprenti·e aux `apprentiIds` de ses maîtres désignés
        // (principal + second éventuel — juin 2026).
        const nouveauxMaitres = { ...get().maitres };
        for (const maitreId of maitresIdsDeLApprenti(apprenti)) {
          const maitre = nouveauxMaitres[maitreId];
          if (maitre && !maitre.apprentiIds.includes(id)) {
            nouveauxMaitres[maitreId] = {
              ...maitre,
              apprentiIds: [...maitre.apprentiIds, id],
            };
          }
        }
        set({
          apprentis: { ...get().apprentis, [id]: apprenti },
          maitres: nouveauxMaitres,
        });
        return apprenti;
      },

      modifierApprenti: (id, patch, auteur) => {
        const s = get();
        const apprenti = s.apprentis[id];
        if (!apprenti) return;
        // Traçabilité : si l'entreprise change et qu'un auteur est fourni, on
        // ajoute une entrée datée à l'historique des affectations.
        let patchFinal = patch;
        if (patch.entrepriseId && patch.entrepriseId !== apprenti.entrepriseId && auteur) {
          patchFinal = {
            ...patch,
            historiqueEntreprises: ajouterAffectationSiChangement(
              apprenti.historiqueEntreprises,
              patch.entrepriseId,
              auteur,
              new Date().toISOString(),
            ),
          };
        }
        const nouveau: Apprenti = { ...apprenti, ...patchFinal };
        const updates: Partial<UtilisateursStore> = {
          apprentis: { ...s.apprentis, [id]: nouveau },
        };
        // Si un maître (principal ou second) a changé, resynchroniser les
        // `apprentiIds` par différence ensembliste anciens/nouveaux maîtres.
        if ('maitreApprentissageId' in patch || 'maitreApprentissageSecondId' in patch) {
          const anciensIds = maitresIdsDeLApprenti(apprenti);
          const nouveauxIds = maitresIdsDeLApprenti(nouveau);
          const nouveauxMaitres = { ...s.maitres };
          for (const mid of anciensIds.filter((x) => !nouveauxIds.includes(x))) {
            const m = nouveauxMaitres[mid];
            if (m) {
              nouveauxMaitres[mid] = {
                ...m,
                apprentiIds: m.apprentiIds.filter((aid) => aid !== id),
              };
            }
          }
          for (const mid of nouveauxIds.filter((x) => !anciensIds.includes(x))) {
            const m = nouveauxMaitres[mid];
            if (m && !m.apprentiIds.includes(id)) {
              nouveauxMaitres[mid] = { ...m, apprentiIds: [...m.apprentiIds, id] };
            }
          }
          updates.maitres = nouveauxMaitres;
        }
        set(updates);
        // Propagation au livret : `formationId` est dupliqué entre `Apprenti` et
        // `Livret` (le livret est lié à un référentiel de formation). Si la
        // formation change, on doit mettre à jour le livret aussi pour que les
        // évaluations restent cohérentes avec le bon référentiel.
        if (patch.formationId && patch.formationId !== apprenti.formationId) {
          useLivretStore.setState((sl) => {
            const livret = Object.values(sl.livrets).find((l) => l.apprentiId === id);
            if (!livret) return sl;
            return {
              livrets: {
                ...sl.livrets,
                [livret.id]: {
                  ...livret,
                  formationId: patch.formationId!,
                  modifieLe: new Date().toISOString(),
                },
              },
              derniereModification: new Date().toISOString(),
            };
          });
        }
      },

      supprimerApprenti: (id) => {
        const s = get();
        const apprenti = s.apprentis[id];
        if (!apprenti) return;
        // Retire l'apprenti·e de tous ses maîtres (principal + second).
        const nouveauxMaitres = { ...s.maitres };
        for (const maitreId of maitresIdsDeLApprenti(apprenti)) {
          const maitre = nouveauxMaitres[maitreId];
          if (maitre) {
            nouveauxMaitres[maitreId] = {
              ...maitre,
              apprentiIds: maitre.apprentiIds.filter((aid) => aid !== id),
            };
          }
        }
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

      // ── Maîtres ────────────────────────────────────────────────────────
      ajouterMaitre: (input) => {
        const id = `u-maitre-${crypto.randomUUID().slice(0, 8)}`;
        const maitre: Maitre = { id, role: 'maitre', apprentiIds: [], ...input };
        set({ maitres: { ...get().maitres, [id]: maitre } });
        return maitre;
      },
      modifierMaitre: (id, patch) =>
        set((s) => {
          const maitre = s.maitres[id];
          if (!maitre) return s;
          return { maitres: { ...s.maitres, [id]: { ...maitre, ...patch } } };
        }),
      supprimerMaitre: (id) => {
        const maitre = get().maitres[id];
        if (!maitre) return false;
        // Cohérence référentielle : pas de suppression tant qu'il/elle a des apprenti·e·s.
        if (maitre.apprentiIds.length > 0) return false;
        const { [id]: _retire, ...maitresSansLui } = get().maitres;
        void _retire;
        set({ maitres: maitresSansLui });
        return true;
      },

      // ── Formateurs ────────────────────────────────────────────────────
      ajouterFormateur: (input) => {
        const id = `u-formateur-${crypto.randomUUID().slice(0, 8)}`;
        const formateur: Formateur = { id, role: 'formateur', promoIds: [], ...input };
        set({ formateurs: { ...get().formateurs, [id]: formateur } });
        return formateur;
      },
      modifierFormateur: (id, patch) =>
        set((s) => {
          const f = s.formateurs[id];
          if (!f) return s;
          return { formateurs: { ...s.formateurs, [id]: { ...f, ...patch } } };
        }),
      supprimerFormateur: (id) => {
        const apprentisLies = Object.values(get().apprentis).filter(
          (a) => a.formateurReferentId === id,
        );
        if (apprentisLies.length > 0) return false;
        const { [id]: _retire, ...sansLui } = get().formateurs;
        void _retire;
        set({ formateurs: sansLui });
        return true;
      },

      // ── Coordo ────────────────────────────────────────────────────────
      ajouterCoordo: (input) => {
        const id = `u-coordo-${crypto.randomUUID().slice(0, 8)}`;
        const coordo: Coordo = { id, role: 'coordo', formationIds: [], ...input };
        set({ coordos: { ...get().coordos, [id]: coordo } });
        return coordo;
      },
      modifierCoordo: (id, patch) =>
        set((s) => {
          const c = s.coordos[id];
          if (!c) return s;
          return { coordos: { ...s.coordos, [id]: { ...c, ...patch } } };
        }),
      supprimerCoordo: (id) =>
        set((s) => {
          const { [id]: _retire, ...sansLui } = s.coordos;
          void _retire;
          return { coordos: sansLui };
        }),

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

/** Lookup non-réactif d'un·e coordo par id. */
export function getCoordoByIdFromStore(id: string): Coordo | undefined {
  return useUtilisateursStore.getState().coordos[id];
}
