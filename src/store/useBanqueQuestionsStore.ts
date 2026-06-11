import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuestionBanque } from '@/types';
import {
  QUESTIONS_BANQUE_INITIALE,
  questionEstUtilisee,
} from '@/lib/questions-entretien';
import { useLivretStore } from './useLivretStore';

/**
 * Store de la banque de questions de l'entretien tripartite.
 * Référence : refonte mai 2026.
 *
 * CRUD réservé aux rôles `coordo` et `admin` (matrice §6 — ressource
 * `admin.banque-questions.gerer`). Le formateur référent ne fait que
 * sélectionner les questions à poser pour chaque entretien.
 *
 * Cohérence référentielle : la suppression d'une question est bloquée si elle
 * est encore référencée dans au moins un entretien existant (cf. helper
 * `questionEstUtilisee`). Pattern aligné avec les autres verrous (formation /
 * référentiel).
 *
 * Note import croisé : on lit `useLivretStore.getState()` au runtime depuis
 * `supprimerQuestion` — le cycle ESM est résolu (cohérent avec les autres
 * stores croisés).
 */

interface BanqueQuestionsStore {
  questions: Record<string, QuestionBanque>;

  /** Crée une question. L'id est auto-généré. */
  ajouterQuestion: (input: Omit<QuestionBanque, 'id'>) => QuestionBanque;
  /** Met à jour les champs d'une question existante. */
  modifierQuestion: (
    id: string,
    patch: Partial<Omit<QuestionBanque, 'id'>>,
  ) => void;
  /**
   * Supprime une question. Bloquée si la question est utilisée dans au moins
   * un entretien existant.
   * @returns true si supprimée, false si bloquée.
   */
  supprimerQuestion: (id: string) => boolean;

  /** Réinitialise au catalogue par défaut (utilisé par BoutonReinitialiserDemo). */
  reinitialiser: () => void;
}

// v2 — retours coordos juin 2026 : `pourEntretien1` / `pourEntretien2` /
//      `obligatoire` sur chaque question (affectation par le coordo).
const VERSION_SCHEMA = 2;

function etatInitial(): Pick<BanqueQuestionsStore, 'questions'> {
  return {
    questions: Object.fromEntries(QUESTIONS_BANQUE_INITIALE.map((q) => [q.id, q])),
  };
}

export const useBanqueQuestionsStore = create<BanqueQuestionsStore>()(
  persist(
    (set, get) => ({
      ...etatInitial(),

      ajouterQuestion: (input) => {
        const id = `q-${crypto.randomUUID().slice(0, 8)}`;
        const question: QuestionBanque = { id, ...input };
        set({ questions: { ...get().questions, [id]: question } });
        return question;
      },

      modifierQuestion: (id, patch) =>
        set((s) => {
          const q = s.questions[id];
          if (!q) return s;
          // L'id et la cible ne sont pas modifiables après création — protège
          // la cohérence des entretiens déjà saisis (la cible détermine la
          // section dans laquelle la question apparaît).
          const { id: _ign1, cible: _ign2, ...patchSafe } = patch as QuestionBanque;
          void _ign1;
          void _ign2;
          return { questions: { ...s.questions, [id]: { ...q, ...patchSafe } } };
        }),

      supprimerQuestion: (id) => {
        const q = get().questions[id];
        if (!q) return false;
        const livrets = Object.values(useLivretStore.getState().livrets);
        // Chantier #2 : on couvre les 2 entretiens par livret pour la
        // vérification d'utilisation (sinon on autoriserait à supprimer
        // une question utilisée par E2 par exemple).
        const entretiens = livrets.flatMap((l) => [l.entretien1, l.entretien2]);
        if (questionEstUtilisee(id, entretiens)) return false;
        const { [id]: _retire, ...sansElle } = get().questions;
        void _retire;
        set({ questions: sansElle });
        return true;
      },

      reinitialiser: () => set(etatInitial()),
    }),
    {
      name: 'livret-banque-questions',
      version: VERSION_SCHEMA,
      // Migration en cas de bump : reset au catalogue par défaut (cohérent
      // avec la stratégie générale de l'étape 1).
      migrate: () => etatInitial(),
    },
  ),
);
