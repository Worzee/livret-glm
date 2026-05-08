import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role, Utilisateur } from '@/types';
import { utilisateursDemo } from '@/fixtures/utilisateurs';

/**
 * Store du rôle actif.
 * Référence : cahier des charges v1.3, section 4.2 (role switcher).
 *
 * Le rôle est persisté dans localStorage pour survivre aux rechargements
 * (utile pendant la démo : on ne reset pas à chaque F5).
 */

interface UserStore {
  /** Rôle actuellement incarné (apprenti / maître / formateur). */
  roleActif: Role;
  /** Utilisateur correspondant au rôle actif. */
  utilisateurActif: Utilisateur;
  /** Bascule vers un autre rôle. */
  changerRole: (role: Role) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      // Démarrage par défaut sur le formateur — vue tableau de bord (CDC §10.1)
      roleActif: 'formateur',
      utilisateurActif: utilisateursDemo.formateur,
      changerRole: (role) =>
        set({
          roleActif: role,
          utilisateurActif: utilisateursDemo[role],
        }),
    }),
    {
      name: 'livret-role-actif',
      // On ne persiste que le rôle ; l'utilisateur est dérivé des fixtures.
      partialize: (state) => ({ roleActif: state.roleActif }),
      onRehydrateStorage: () => (state) => {
        // À la réhydratation, recalculer utilisateurActif à partir du rôle persisté.
        if (state) {
          state.utilisateurActif = utilisateursDemo[state.roleActif];
        }
      },
    },
  ),
);
