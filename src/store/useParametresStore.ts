import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  SEUIL_COMPETENCES_EVALUABLES_DEFAUT,
  validerSeuil,
  type ResultatValidation,
} from '@/lib/limite-referentiel';

/**
 * Store des paramètres globaux de l'application (juillet 2026 — chantier
 * référentiels/compétences #2).
 *
 * Premier paramètre : le **seuil de lignes évaluables par référentiel**
 * (40 par défaut — au-delà, la saisie tuteur devient trop lourde lors des
 * périodes en entreprise). Modifiable **uniquement par l'admin** (ressource
 * `admin.parametres.gerer` — le gate se fait côté UI, le store valide les
 * bornes).
 *
 * Persisté en localStorage comme les autres stores ; reset aux valeurs par
 * défaut au bump de version.
 */

interface ParametresStore {
  /** Nombre maximal de compétences évaluables par référentiel (défaut 40). */
  seuilCompetencesEvaluables: number;

  /**
   * Modifie le seuil (admin uniquement — gate UI). Valide les bornes via
   * `validerSeuil` ; no-op avec raison en cas de valeur invalide.
   */
  setSeuilCompetencesEvaluables: (valeur: number) => ResultatValidation;

  /** Réinitialise aux valeurs par défaut (utilisé par BoutonReinitialiserDemo). */
  reinitialiser: () => void;
}

// v1 — création du store (6 juillet 2026) : `seuilCompetencesEvaluables`.
const VERSION_SCHEMA = 1;

function etatInitial(): Pick<ParametresStore, 'seuilCompetencesEvaluables'> {
  return { seuilCompetencesEvaluables: SEUIL_COMPETENCES_EVALUABLES_DEFAUT };
}

export const useParametresStore = create<ParametresStore>()(
  persist(
    (set) => ({
      ...etatInitial(),

      setSeuilCompetencesEvaluables: (valeur) => {
        const validation = validerSeuil(valeur);
        if (!validation.ok) return validation;
        set({ seuilCompetencesEvaluables: valeur });
        return { ok: true };
      },

      reinitialiser: () => set(etatInitial()),
    }),
    {
      name: 'livret-parametres',
      version: VERSION_SCHEMA,
      // Migration en cas de bump : reset aux défauts (stratégie générale).
      migrate: () => etatInitial(),
    },
  ),
);
