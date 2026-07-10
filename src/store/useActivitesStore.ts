import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModeleActivites } from '@/types';
import { modeleActivitesCapCuisine } from '@/fixtures/modele-activites-cap-cuisine';
import { activitesSansCompetenceEvaluable } from '@/lib/balayage-referentiel';
import { modeEffectif, type ResultatValidation } from '@/lib/mode-evaluation';
import { evaluerVerrouModeleActivites, peutRemplacerModele } from '@/lib/modele-activites-verrou';
import { useFormationsStore } from './useFormationsStore';
import { useLivretStore } from './useLivretStore';
import { useReferentielsStore } from './useReferentielsStore';

/**
 * Store des modèles d'activités (juillet 2026 — chantier
 * référentiels/compétences #4).
 *
 * Un modèle regroupe les activités professionnelles importées pour une
 * formation (fichier CSV/XLSX — activités seules) puis mappées sur les
 * compétences de son référentiel dans l'éditeur de mapping. Le passage de la
 * formation en mode « activités » exige que **chaque activité fasse appel à au
 * moins une compétence évaluable** (10 juillet 2026 — le balayage complet du
 * référentiel n'est plus exigé ; cf. `lib/balayage-referentiel`,
 * `lib/mode-evaluation`).
 *
 * Conception alignée sur `useReferentielsStore` :
 *   - Record indexé par id pour lookup O(1)
 *   - `ajouterModele` écrase si l'id existe (réimport) — bloqué si une
 *     formation rattachée est en mode activités (le mapping repartirait
 *     vierge) ; sinon les sélections d'activités non validées des livrets
 *     repartent « tout coché » (même cascade que les référentiels)
 *   - `supprimerModele` bloqué si une formation rattache le modèle
 *   - `setMappingActivite` : quand une formation rattachée est déjà en mode
 *     activités, refuse de laisser une activité sans aucune compétence
 *   - `reinitialiser` remet l'état aux fixtures
 *
 * Note import croisé : lectures des autres stores via `getState()` au
 * runtime — le cycle est résolu par ESM (cohérent avec les autres stores).
 */

interface ActivitesStore {
  modeles: Record<string, ModeleActivites>;

  /**
   * Ajoute (ou remplace, réimport) un modèle d'activités. Le remplacement est
   * refusé si une formation rattachée est en mode activités ; sinon il
   * réaligne « tout coché » les sélections d'activités non validées des
   * livrets des formations rattachées.
   */
  ajouterModele: (modele: ModeleActivites) => ResultatValidation;

  /**
   * Supprime un modèle. Bloqué tant qu'une formation le rattache
   * (`Formation.modeleActivitesId` — cf. `modele-activites-verrou`).
   * @returns true si supprimé, false si bloqué.
   */
  supprimerModele: (id: string) => boolean;

  /**
   * Remplace le mapping d'une activité (ids des compétences couvertes).
   * Quand une formation rattachée est en mode activités, la mutation est
   * refusée si elle laisserait une activité sans aucune compétence évaluable
   * (arbitrage pilote Q6, invariant révisé le 10 juillet 2026).
   */
  setMappingActivite: (
    modeleId: string,
    activiteId: string,
    competenceIds: string[],
  ) => ResultatValidation;

  /** Réinitialise le store aux fixtures (utilisé par BoutonReinitialiserDemo). */
  reinitialiser: () => void;
}

// v1 — création du store (6 juillet 2026, chantier #4) : modèle d'activités
//      CAP Cuisine (6 activités mappées, balayage 10/10).
const VERSION_SCHEMA = 1;

function etatInitial(): Pick<ActivitesStore, 'modeles'> {
  return {
    modeles: {
      [modeleActivitesCapCuisine.id]: modeleActivitesCapCuisine,
    },
  };
}

export const useActivitesStore = create<ActivitesStore>()(
  persist(
    (set, get) => ({
      ...etatInitial(),

      ajouterModele: (modele) => {
        const remplace = !!get().modeles[modele.id];
        const formations = Object.values(useFormationsStore.getState().formations);
        if (remplace) {
          const garde = peutRemplacerModele(modele.id, formations);
          if (!garde.ok) return garde;
        }
        set({ modeles: { ...get().modeles, [modele.id]: modele } });
        // Réimport sous le même id : les ids d'activités changent — les
        // sélections d'activités non validées des livrets des formations
        // rattachées repartent « tout coché » (pattern référentiels).
        if (remplace) {
          for (const f of formations) {
            if (f.modeleActivitesId === modele.id) {
              useLivretStore.getState().realignerSelectionsActivitesFormation(f.id, modele);
            }
          }
        }
        return { ok: true };
      },

      supprimerModele: (id) => {
        const modele = get().modeles[id];
        if (!modele) return false;
        const formations = Object.values(useFormationsStore.getState().formations);
        if (evaluerVerrouModeleActivites(id, formations).verrouille) return false;
        const { [id]: _retire, ...sansLui } = get().modeles;
        void _retire;
        set({ modeles: sansLui });
        return true;
      },

      setMappingActivite: (modeleId, activiteId, competenceIds) => {
        const modele = get().modeles[modeleId];
        if (!modele) return { ok: false, raison: 'Modèle introuvable.' };
        if (!modele.activites.some((a) => a.id === activiteId)) {
          return { ok: false, raison: 'Activité introuvable dans ce modèle.' };
        }
        const maj: ModeleActivites = {
          ...modele,
          activites: modele.activites.map((a) =>
            a.id === activiteId ? { ...a, competenceIds: [...competenceIds] } : a,
          ),
        };
        // Garde Q6 (invariant révisé le 10 juillet 2026) : quand une formation
        // rattachée est en mode activités, chaque activité doit rester mappée
        // sur au moins une compétence évaluable — refuser une retouche qui
        // laisserait une activité sans aucune compétence. Découvrir une
        // compétence du référentiel est en revanche libre (le balayage
        // complet n'est plus exigé).
        const formations = Object.values(useFormationsStore.getState().formations);
        const enModeActivites = formations.some(
          (f) => f.modeleActivitesId === modeleId && modeEffectif(f) === 'activites',
        );
        if (enModeActivites) {
          const referentiel = useReferentielsStore.getState().referentiels[modele.referentielId];
          if (referentiel) {
            const enDefaut = activitesSansCompetenceEvaluable(maj, referentiel);
            if (enDefaut.length > 0) {
              const libelles = enDefaut.map((a) => `« ${a.libelle} »`).join(', ');
              return {
                ok: false,
                raison: `Modification refusée : ${libelles} ne ferait plus appel à aucune compétence alors qu'une formation est en mode activités. Chaque activité doit rester mappée sur au moins une compétence.`,
              };
            }
          }
        }
        set({ modeles: { ...get().modeles, [modeleId]: maj } });
        return { ok: true };
      },

      reinitialiser: () => set(etatInitial()),
    }),
    {
      name: 'livret-activites',
      version: VERSION_SCHEMA,
      // Migration en cas de bump : reset aux fixtures (stratégie générale).
      migrate: () => etatInitial(),
    },
  ),
);
