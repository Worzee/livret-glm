import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AttitudeProfessionnelle } from '@/types';
import { ATTITUDES_INITIALES, attitudeEstSelectionnee, attitudeEstUtilisee } from '@/lib/attitudes';
import { useLivretStore } from './useLivretStore';

/**
 * Store du catalogue global des attitudes professionnelles.
 * Référence : retours coordos juin 2026.
 *
 * CRUD réservé au rôle `admin` (matrice §6 — ressource
 * `admin.attitudes.gerer`, comme les établissements). Les attitudes sont
 * évaluées par le maître / tuteur à chaque entretien tripartite ;
 * l'évaluation finale en présente une synthèse en lecture seule.
 *
 * Cohérence référentielle : la suppression d'une attitude est bloquée si
 * elle est évaluée dans au moins un entretien existant (cf. helper
 * `attitudeEstUtilisee`). Pattern aligné avec la banque de questions.
 *
 * Note import croisé : on lit `useLivretStore.getState()` au runtime depuis
 * `supprimerAttitude` — le cycle ESM est résolu (cohérent avec les autres
 * stores croisés).
 */

interface AttitudesStore {
  attitudes: Record<string, AttitudeProfessionnelle>;

  /** Crée une attitude. L'id est auto-généré. */
  ajouterAttitude: (input: Omit<AttitudeProfessionnelle, 'id'>) => AttitudeProfessionnelle;
  /** Met à jour le libellé / la description d'une attitude existante. */
  modifierAttitude: (id: string, patch: Partial<Omit<AttitudeProfessionnelle, 'id'>>) => void;
  /**
   * Supprime une attitude. Bloquée si elle est évaluée dans au moins un
   * entretien existant.
   * @returns true si supprimée, false si bloquée.
   */
  supprimerAttitude: (id: string) => boolean;

  /** Réinitialise au catalogue par défaut (utilisé par BoutonReinitialiserDemo). */
  reinitialiser: () => void;
}

// v1 — création du store (juin 2026) : les attitudes sortent du référentiel
//      de compétences pour devenir un catalogue global géré par l'admin.
// v2 — catalogue par défaut enrichi de 6 à 16 attitudes (+ descriptions) à
//      la demande du pilote (13 juin 2026) — reset pour recharger.
// v3 — 18 juin 2026 : a1..a4 retirées (doublon avec les 4 critères de
//      l'appréciation maître, évalués par défaut à chaque entretien) →
//      12 attitudes. Reset pour recharger le catalogue.
const VERSION_SCHEMA = 3;

function etatInitial(): Pick<AttitudesStore, 'attitudes'> {
  return {
    attitudes: Object.fromEntries(ATTITUDES_INITIALES.map((a) => [a.id, a])),
  };
}

export const useAttitudesStore = create<AttitudesStore>()(
  persist(
    (set, get) => ({
      ...etatInitial(),

      ajouterAttitude: (input) => {
        const id = `a-${crypto.randomUUID().slice(0, 8)}`;
        const attitude: AttitudeProfessionnelle = { id, ...input };
        set({ attitudes: { ...get().attitudes, [id]: attitude } });
        return attitude;
      },

      modifierAttitude: (id, patch) =>
        set((s) => {
          const a = s.attitudes[id];
          if (!a) return s;
          const { id: _ign, ...patchSafe } = patch as AttitudeProfessionnelle;
          void _ign;
          return { attitudes: { ...s.attitudes, [id]: { ...a, ...patchSafe } } };
        }),

      supprimerAttitude: (id) => {
        const a = get().attitudes[id];
        if (!a) return false;
        const livrets = Object.values(useLivretStore.getState().livrets);
        const entretiens = livrets.flatMap((l) => Object.values(l.entretiens));
        if (attitudeEstUtilisee(id, entretiens)) return false;
        // 13 juin 2026 : une attitude retenue dans un livret (choix E1) est
        // également protégée, même non encore évaluée.
        if (
          attitudeEstSelectionnee(
            id,
            livrets.map((l) => l.attitudesSelectionnees ?? []),
          )
        )
          return false;
        const { [id]: _retire, ...sansElle } = get().attitudes;
        void _retire;
        set({ attitudes: sansElle });
        return true;
      },

      reinitialiser: () => set(etatInitial()),
    }),
    {
      name: 'livret-attitudes',
      version: VERSION_SCHEMA,
      // Migration en cas de bump : reset au catalogue par défaut.
      migrate: () => etatInitial(),
    },
  ),
);
