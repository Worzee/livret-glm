import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Apprenti, Livret } from '@/types';
import { apprentiLeaMartin } from '@/fixtures/utilisateurs';
import { useLivretStore } from './useLivretStore';
import { useUserStore } from './useUserStore';
import { getApprentiByIdFromStore, useUtilisateursStore } from './useUtilisateursStore';

/**
 * Store de l'apprenti·e affiché·e dans les pages livret.
 * Référence : cahier des charges v1.3, sections 10.2 et 24.5.
 *
 * Conception :
 *   - L'identité « apprenti·e affiché·e » est orthogonale au rôle (un formateur
 *     peut consulter Léa puis Théo sans changer de rôle).
 *   - Côté rôle `apprenti` : R3 garantie naturellement — l'utilisateur·rice
 *     n'a accès qu'à un seul livret (le sien). Pour la démo, basculer en rôle
 *     apprenti « s'incarne » dans l'apprenti·e actif·ve. La synchronisation
 *     `utilisateurActif ↔ apprentiActifId` est faite par un effet dans
 *     `AppShell` (évite un cycle d'import entre les deux stores).
 *   - Persistance : confort de démo, on ne perd pas le contexte au F5.
 */

interface ApprentiActifStore {
  /** Id de l'apprenti·e sélectionné·e (null = aucun choix explicite). */
  apprentiActifId: string | null;
  /** Bascule vers un·e autre apprenti·e (ou null pour revenir à l'écran d'accueil). */
  setApprentiActif: (id: string | null) => void;
}

export const useApprentiActifStore = create<ApprentiActifStore>()(
  persist(
    (set) => ({
      // Léa par défaut — apprenti·e du cas démo principal (CDC §24.5).
      apprentiActifId: apprentiLeaMartin.id,
      setApprentiActif: (id) => {
        set({ apprentiActifId: id });
        // Synchro : si le rôle actif est `apprenti`, l'utilisateur·rice
        // « connecté·e » s'incarne dans l'apprenti·e actif·ve.
        if (useUserStore.getState().roleActif === 'apprenti') {
          const apprenti = (id && getApprentiByIdFromStore(id)) || apprentiLeaMartin;
          useUserStore.setState({ utilisateurActif: apprenti });
        }
      },
    }),
    {
      name: 'livret-apprenti-actif',
      version: 1,
    },
  ),
);

/**
 * Hook composite — retourne l'apprenti·e à afficher et son livret.
 *
 * Le livret est lu depuis `useLivretStore` (live, pas depuis les fixtures) afin
 * que les mutations soient visibles immédiatement.
 *
 * Retourne `null` si l'id est manquant ou invalide ; le composant appelant
 * doit alors rediriger vers le tableau de bord.
 */
export function useApprentiActif(): { apprenti: Apprenti; livret: Livret } | null {
  const apprentiActifId = useApprentiActifStore((s) => s.apprentiActifId);
  const livrets = useLivretStore((s) => s.livrets);
  const apprentis = useUtilisateursStore((s) => s.apprentis);

  return useMemo(() => {
    if (!apprentiActifId) return null;
    const apprenti = apprentis[apprentiActifId];
    if (!apprenti) return null;
    const livret = Object.values(livrets).find((l) => l.apprentiId === apprenti.id);
    if (!livret) return null;
    return { apprenti, livret };
  }, [apprentiActifId, livrets, apprentis]);
}
