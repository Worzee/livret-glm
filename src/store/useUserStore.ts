import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role, Utilisateur } from '@/types';
import {
  apprentiLeaMartin,
  coordoMartineLefevre,
  formatriceSophieDubois,
  maitreKarimBenali,
  responsableThiNguyen,
  utilisateursDemo,
} from '@/fixtures/utilisateurs';
import { useApprentiActifStore } from './useApprentiActifStore';
import {
  getApprentiByIdFromStore,
  getCoordoByIdFromStore,
  getFormateurByIdFromStore,
  getMaitreByIdFromStore,
  getResponsableByIdFromStore,
  useUtilisateursStore,
} from './useUtilisateursStore';

/**
 * Store du rôle actif.
 * Référence : cahier des charges v1.3, section 4.2 (role switcher).
 *
 * Le rôle est persisté dans localStorage pour survivre aux rechargements
 * (utile pendant la démo : on ne reset pas à chaque F5).
 *
 * En rôle `apprenti`, l'utilisateur·rice s'incarne dans l'apprenti·e actif·ve
 * (workflow démo « regardez Sofia vue par chaque rôle »). La synchro
 * bidirectionnelle est faite directement dans les actions des deux stores —
 * l'import croisé avec `useApprentiActifStore` est résolu par ESM tant que
 * les `getState()` ne sont appelés qu'au runtime (dans les actions), jamais
 * à l'init du module.
 *
 * En rôle `maitre`, on peut basculer entre les deux maîtres de la fixture
 * (Karim BENALI / Hélène ROCHE) via un sélecteur dans le tableau de bord.
 * Karim est le maître par défaut (cohérent avec utilisateursDemo.maitre).
 *
 * En rôle `coordo`, même mécanique (juin 2026) : bascule entre les coordos
 * (Martine LEFÈVRE / Bernard PETIT) pour démontrer que chaque coordo ne voit
 * que les apprenti·e·s de son périmètre (`Apprenti.coordoId`).
 *
 * En rôle `formateur`, même mécanique (3 juillet 2026) : bascule entre les
 * formateurs (Sophie DUBOIS / Marc TISSIER) — chacun ne voit que sa promo.
 */

interface UserStore {
  roleActif: Role;
  utilisateurActif: Utilisateur;
  /** Id du maître actif quand `roleActif === 'maitre'`. Persisté. */
  maitreActifId: string;
  /** Id du coordo actif quand `roleActif === 'coordo'`. Persisté. */
  coordoActifId: string;
  /** Id du formateur actif quand `roleActif === 'formateur'`. Persisté. */
  formateurActifId: string;
  /** Id du responsable légal actif quand `roleActif === 'responsable'` (13 juillet 2026). */
  responsableActifId: string;
  changerRole: (role: Role) => void;
  /** Bascule entre les maîtres d'apprentissage (réinit l'apprenti·e actif·ve). */
  setMaitreActif: (id: string) => void;
  /** Bascule entre les coordos (réinit l'apprenti·e actif·ve sur son périmètre). */
  setCoordoActif: (id: string) => void;
  /** Bascule entre les formateurs (réinit l'apprenti·e actif·ve sur sa promo). */
  setFormateurActif: (id: string) => void;
  /** Bascule entre les responsables légaux (réinit sur son 1ᵉʳ enfant). */
  setResponsableActif: (id: string) => void;
}

function utilisateurPourRole(
  role: Role,
  maitreActifId: string,
  coordoActifId: string,
  formateurActifId: string,
  responsableActifId: string,
): Utilisateur {
  if (role === 'apprenti') {
    const id = useApprentiActifStore.getState().apprentiActifId;
    return (id && getApprentiByIdFromStore(id)) || apprentiLeaMartin;
  }
  if (role === 'maitre') {
    return getMaitreByIdFromStore(maitreActifId) || maitreKarimBenali;
  }
  if (role === 'coordo') {
    return getCoordoByIdFromStore(coordoActifId) || coordoMartineLefevre;
  }
  if (role === 'formateur') {
    return getFormateurByIdFromStore(formateurActifId) || formatriceSophieDubois;
  }
  if (role === 'responsable') {
    return getResponsableByIdFromStore(responsableActifId) || responsableThiNguyen;
  }
  return utilisateursDemo[role];
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // Démarrage par défaut sur le formateur — vue tableau de bord (CDC §10.1)
      roleActif: 'formateur',
      utilisateurActif: utilisateursDemo.formateur,
      maitreActifId: maitreKarimBenali.id,
      coordoActifId: coordoMartineLefevre.id,
      formateurActifId: formatriceSophieDubois.id,
      responsableActifId: responsableThiNguyen.id,
      changerRole: (role) => {
        set({
          roleActif: role,
          utilisateurActif: utilisateurPourRole(
            role,
            get().maitreActifId,
            get().coordoActifId,
            get().formateurActifId,
            get().responsableActifId,
          ),
        });
        // Le périmètre du responsable légal se limite à ses enfants : si
        // l'apprenti·e actif·ve n'en fait pas partie, replier sur le 1ᵉʳ enfant
        // (13 juillet 2026 — demande 5).
        if (role === 'responsable') {
          const responsable = get().utilisateurActif;
          const apprentis = Object.values(useUtilisateursStore.getState().apprentis);
          const enfants = apprentis.filter((a) => a.responsableLegalIds?.includes(responsable.id));
          const actifId = useApprentiActifStore.getState().apprentiActifId;
          if (enfants.length > 0 && !enfants.some((a) => a.id === actifId)) {
            useApprentiActifStore.getState().setApprentiActif(enfants[0].id);
          }
        }
      },
      setMaitreActif: (id) => {
        const maitre = getMaitreByIdFromStore(id) ?? maitreKarimBenali;
        set({
          maitreActifId: maitre.id,
          // Si le rôle actif est maitre, l'utilisateur·rice connecté·e suit.
          utilisateurActif: get().roleActif === 'maitre' ? maitre : get().utilisateurActif,
        });
        // Réinit l'apprenti·e actif·ve sur le 1er apprenti·e du nouveau maître,
        // sinon on resterait pointé sur quelqu'un qu'il/elle ne peut pas voir.
        const premierApprentiId = maitre.apprentiIds[0];
        if (premierApprentiId) {
          useApprentiActifStore.getState().setApprentiActif(premierApprentiId);
        }
      },
      setCoordoActif: (id) => {
        const coordo = getCoordoByIdFromStore(id) ?? coordoMartineLefevre;
        set({
          coordoActifId: coordo.id,
          utilisateurActif: get().roleActif === 'coordo' ? coordo : get().utilisateurActif,
        });
        // Réinit l'apprenti·e actif·ve sur le 1er du périmètre du coordo.
        const premierApprenti = Object.values(useUtilisateursStore.getState().apprentis).find(
          (a) => a.coordoId === coordo.id,
        );
        if (premierApprenti) {
          useApprentiActifStore.getState().setApprentiActif(premierApprenti.id);
        }
      },
      setFormateurActif: (id) => {
        const formateur = getFormateurByIdFromStore(id) ?? formatriceSophieDubois;
        set({
          formateurActifId: formateur.id,
          utilisateurActif: get().roleActif === 'formateur' ? formateur : get().utilisateurActif,
        });
        // Réinit l'apprenti·e actif·ve sur le 1er de sa promo (référent direct
        // ou promoIds), sinon on resterait pointé hors périmètre.
        const premierApprenti = Object.values(useUtilisateursStore.getState().apprentis).find(
          (a) =>
            a.formateurReferentId === formateur.id || formateur.promoIds.includes(a.formationId),
        );
        if (premierApprenti) {
          useApprentiActifStore.getState().setApprentiActif(premierApprenti.id);
        }
      },
      setResponsableActif: (id) => {
        const responsable = getResponsableByIdFromStore(id) ?? responsableThiNguyen;
        set({
          responsableActifId: responsable.id,
          utilisateurActif:
            get().roleActif === 'responsable' ? responsable : get().utilisateurActif,
        });
        // Réinit l'apprenti·e actif·ve sur le 1ᵉʳ enfant du responsable.
        const premierEnfant = Object.values(useUtilisateursStore.getState().apprentis).find((a) =>
          a.responsableLegalIds?.includes(responsable.id),
        );
        if (premierEnfant) {
          useApprentiActifStore.getState().setApprentiActif(premierEnfant.id);
        }
      },
    }),
    {
      name: 'livret-role-actif',
      partialize: (state) => ({
        roleActif: state.roleActif,
        maitreActifId: state.maitreActifId,
        coordoActifId: state.coordoActifId,
        formateurActifId: state.formateurActifId,
        responsableActifId: state.responsableActifId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.utilisateurActif = utilisateurPourRole(
            state.roleActif,
            state.maitreActifId ?? maitreKarimBenali.id,
            state.coordoActifId ?? coordoMartineLefevre.id,
            state.formateurActifId ?? formatriceSophieDubois.id,
            state.responsableActifId ?? responsableThiNguyen.id,
          );
        }
      },
    },
  ),
);
