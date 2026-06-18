import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuestionBanque } from '@/types';
import { QUESTIONS_BANQUE_INITIALE, questionEstUtilisee } from '@/lib/questions-entretien';
import { useLivretStore } from './useLivretStore';

/**
 * Store de la banque de questions de l'entretien tripartite.
 * Référence : refonte mai 2026.
 *
 * CRUD réservé au rôle `admin` (matrice §6 — ressource
 * `admin.banque-questions.gerer` ; 18 juin 2026 : le coordo n'y a plus accès).
 * Depuis le 13 juin 2026, la banque est un
 * **pur catalogue** (libellé, cible, type) : l'affectation des questions est
 * gérée par formation (`Formation.questionsRetirees`), plus sur la question.
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
  modifierQuestion: (id: string, patch: Partial<Omit<QuestionBanque, 'id'>>) => void;
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
// v3 — jusqu'à 4 entretiens (formations de 2 ans) : `pourEntretiens:
//      NumeroEntretien[]` remplace les 2 booleans.
// v4 — 13 juin 2026 : banque = pur catalogue. `pourEntretiens` et
//      `obligatoire` retirés de la question (affectation portée par la
//      formation via `questionsRetirees`). Reset.
const VERSION_SCHEMA = 4;

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
        // On couvre les 4 entretiens possibles par livret pour la
        // vérification d'utilisation (sinon on autoriserait à supprimer
        // une question utilisée par E3 par exemple).
        const entretiens = livrets.flatMap((l) => Object.values(l.entretiens));
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
