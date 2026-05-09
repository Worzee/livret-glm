import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role, Utilisateur } from '@/types';
import {
  apprentiLeaMartin,
  getApprentiById,
  utilisateursDemo,
} from '@/fixtures/utilisateurs';
import { useApprentiActifStore } from './useApprentiActifStore';

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
 */

interface UserStore {
  roleActif: Role;
  utilisateurActif: Utilisateur;
  changerRole: (role: Role) => void;
}

function utilisateurPourRole(role: Role): Utilisateur {
  if (role === 'apprenti') {
    const id = useApprentiActifStore.getState().apprentiActifId;
    return (id && getApprentiById(id)) || apprentiLeaMartin;
  }
  return utilisateursDemo[role];
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      // Démarrage par défaut sur le formateur — vue tableau de bord (CDC §10.1)
      roleActif: 'formateur',
      utilisateurActif: utilisateursDemo.formateur,
      changerRole: (role) =>
        set({ roleActif: role, utilisateurActif: utilisateurPourRole(role) }),
    }),
    {
      name: 'livret-role-actif',
      partialize: (state) => ({ roleActif: state.roleActif }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.utilisateurActif = utilisateurPourRole(state.roleActif);
        }
      },
    },
  ),
);
