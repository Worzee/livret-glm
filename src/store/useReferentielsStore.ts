import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Referentiel } from '@/types';
import { referentielCapCuisine } from '@/fixtures/referentiel-cap-cuisine';
import { referentielBtsMhr } from '@/fixtures/referentiel-bts-mhr';
import { peutBasculerExclusion, type ResultatValidation } from '@/lib/limite-referentiel';
import { peutReactiverCompetence, peutReimporterReferentiel } from '@/lib/mode-evaluation';
import { useActivitesStore } from './useActivitesStore';
import { useFormationsStore } from './useFormationsStore';
import { useLivretStore } from './useLivretStore';
import { useParametresStore } from './useParametresStore';

/**
 * Store des référentiels de compétences.
 * Référence : cahier des charges v1.3, extension 3 (import de référentiels).
 *
 * Initialisé depuis le fixture CAP Cuisine pour la démo. Persisté en
 * localStorage — les imports survivent aux rechargements jusqu'au reset.
 *
 * Conception alignée sur `useFormationsStore` :
 *   - Record indexé par id pour lookup O(1)
 *   - Mutations granulaires (ajouter / modifier / supprimer)
 *   - `supprimerReferentiel` retourne `false` si une formation y est rattachée
 *     (cohérence référentielle, cf. `lib/referentiel-verrou`)
 *   - `reinitialiser` remet l'état au fixture initial
 *
 * Note import croisé : on lit `useFormationsStore.getState()` au runtime pour
 * vérifier la cohérence référentielle. Pas d'accès à l'init du module — le
 * cycle est résolu par ESM (cohérent avec les autres stores).
 */

interface ReferentielsStore {
  referentiels: Record<string, Referentiel>;

  /**
   * Ajoute (ou écrase) un référentiel. Si l'id existe déjà, le précédent est
   * remplacé — utile pour réimporter une version corrigée du même CSV.
   * Juillet 2026 (chantier #4) : le remplacement est **refusé** si une
   * formation rattachée est en mode activités (le mapping du modèle
   * deviendrait orphelin — arbitrage pilote Q6).
   */
  ajouterReferentiel: (referentiel: Referentiel) => ResultatValidation;
  /** Met à jour partiellement un référentiel existant (rare en pratique). */
  modifierReferentiel: (id: string, patch: Partial<Omit<Referentiel, 'id'>>) => void;
  /**
   * Supprime un référentiel. Empêche la suppression si au moins une formation
   * y est rattachée (cohérence référentielle).
   * @returns true si supprimé, false si bloqué.
   */
  supprimerReferentiel: (id: string) => boolean;

  /**
   * Bascule l'état d'exclusion d'une compétence (juillet 2026 — limite des
   * lignes évaluables). Gardes : au moins une feuille évaluable, réactivation
   * refusée au-delà du seuil (`useParametresStore`). Les sélections non
   * validées des livrets des formations rattachées sont réalignées (même
   * cascade qu'un réimport).
   */
  basculerExclusionCompetence: (referentielId: string, competenceId: string) => ResultatValidation;

  /** Réinitialise le store au fixture initial (utilisé par BoutonReinitialiserDemo). */
  reinitialiser: () => void;
}

// Bumpé post-CDC v1.5 addendum :
//   v2 — retrait du flag `Competence.evalueeEnEntreprise` (le choix des
//        compétences abordées en entreprise se fait désormais par livret,
//        validé conjointement formateur + maître à l'entretien tripartite —
//        cf. `useLivretStore.selectionCompetencesEntreprise`)
//   v3 — référentiel BTS MHR à 3 niveaux (Bloc → Sous-famille → Compétence)
//        ajouté aux fixtures (3 juillet 2026). Reset pour recharger.
//   v4 — 6 juillet 2026 : limite des lignes évaluables (chantier
//        référentiels/compétences #2) — `Competence.exclue?` (exclusions
//        d'import cochables + gestion post-import). Reset aux fixtures.
const VERSION_SCHEMA = 4;

function etatInitial(): Pick<ReferentielsStore, 'referentiels'> {
  return {
    referentiels: {
      [referentielCapCuisine.id]: referentielCapCuisine,
      [referentielBtsMhr.id]: referentielBtsMhr,
    },
  };
}

export const useReferentielsStore = create<ReferentielsStore>()(
  persist(
    (set, get) => ({
      ...etatInitial(),

      ajouterReferentiel: (referentiel) => {
        const remplace = !!get().referentiels[referentiel.id];
        const formations = Object.values(useFormationsStore.getState().formations);
        // Chantier #4 (juillet 2026) : réimport bloqué tant qu'une formation
        // rattachée est en mode activités (mapping orphelin → balayage
        // incomplet — arbitrage pilote Q6).
        if (remplace) {
          const garde = peutReimporterReferentiel(referentiel.id, formations);
          if (!garde.ok) return garde;
        }
        set({
          referentiels: { ...get().referentiels, [referentiel.id]: referentiel },
        });
        // Réimport sous le même id : le contenu (ids de compétences) change —
        // les sélections non validées des livrets des formations rattachées
        // repartent « tout coché » sur le nouveau contenu (1ᵉʳ juillet 2026).
        // Un id inédit n'a pas encore de formation rattachée : le réalignement
        // se fera au rattachement (cf. `modifierFormation`).
        if (remplace) {
          for (const f of formations) {
            if (f.referentielId === referentiel.id) {
              useLivretStore.getState().realignerSelectionsFormation(f.id, referentiel);
            }
          }
        }
        return { ok: true };
      },

      modifierReferentiel: (id, patch) =>
        set((s) => {
          const r = s.referentiels[id];
          if (!r) return s;
          return { referentiels: { ...s.referentiels, [id]: { ...r, ...patch } } };
        }),

      supprimerReferentiel: (id) => {
        const referentiel = get().referentiels[id];
        if (!referentiel) return false;
        const formations = Object.values(useFormationsStore.getState().formations);
        if (formations.some((f) => f.referentielId === id)) return false;
        const { [id]: _retire, ...sansLui } = get().referentiels;
        void _retire;
        set({ referentiels: sansLui });
        return true;
      },

      basculerExclusionCompetence: (referentielId, competenceId) => {
        const referentiel = get().referentiels[referentielId];
        if (!referentiel) return { ok: false, raison: 'Référentiel introuvable.' };
        // Seuil global lu au runtime (cross-store, cycle résolu par ESM).
        const seuil = useParametresStore.getState().seuilCompetencesEvaluables;
        const garde = peutBasculerExclusion(referentiel, competenceId, seuil);
        if (!garde.ok) return garde;
        // Chantier #4 (juillet 2026) : la RÉACTIVATION d'une compétence non
        // couverte par le mapping est bloquée quand une formation rattachée
        // est en mode activités (le balayage redeviendrait incomplet — Q6).
        // L'exclusion, elle, ne peut que compléter le balayage.
        const feuille = referentiel.blocs
          .flatMap((b) => b.competences)
          .find((c) => c.id === competenceId);
        if (feuille?.exclue) {
          const gardeMode = peutReactiverCompetence(
            competenceId,
            referentielId,
            Object.values(useFormationsStore.getState().formations),
            useActivitesStore.getState().modeles,
          );
          if (!gardeMode.ok) return gardeMode;
        }
        const maj: Referentiel = {
          ...referentiel,
          blocs: referentiel.blocs.map((b) => ({
            ...b,
            competences: b.competences.map((c) =>
              c.id === competenceId ? { ...c, exclue: c.exclue ? undefined : true } : c,
            ),
          })),
        };
        set({ referentiels: { ...get().referentiels, [referentielId]: maj } });
        // L'ensemble des compétences évaluables change → les sélections non
        // validées des livrets des formations rattachées repartent
        // « tout coché » (même cascade qu'un réimport, 1ᵉʳ juillet 2026).
        const formations = Object.values(useFormationsStore.getState().formations);
        for (const f of formations) {
          if (f.referentielId === referentielId) {
            useLivretStore.getState().realignerSelectionsFormation(f.id, maj);
          }
        }
        return { ok: true };
      },

      reinitialiser: () => set(etatInitial()),
    }),
    {
      name: 'livret-referentiels',
      version: VERSION_SCHEMA,
      // Migration en cas de bump : reset au fixture (cohérent avec la stratégie
      // générale de l'étape 1).
      migrate: () => etatInitial(),
    },
  ),
);
