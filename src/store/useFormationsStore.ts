import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FicheSuiviPeriode, Formation, PeriodeFormation } from '@/types';
import { formationsDemo } from '@/fixtures/formations';
import { useUtilisateursStore } from './useUtilisateursStore';
import { useLivretStore } from './useLivretStore';
import {
  evaluerVerrouPeriode,
  renumeroterPeriodes,
  type SaisiePeriode,
  validerSaisiePeriode,
} from '@/lib/validation-periode-formation';

/**
 * Store des formations du dispositif.
 * Référence : cahier des charges v1.3, section 7.1 (entité Formation).
 *
 * Initialisé depuis les fixtures pour la démo. Persisté en localStorage —
 * les ajouts/modifications survivent aux rechargements jusqu'au reset.
 *
 * Conception alignée sur `useUtilisateursStore` :
 *   - Record indexé par id pour lookup O(1)
 *   - Mutations granulaires (ajouter / modifier / supprimer)
 *   - `supprimerFormation` retourne `false` si des apprenti·e·s y sont
 *     rattaché·e·s (cohérence référentielle, cf. `lib/formation-verrou`)
 *   - `reinitialiser` remet l'état aux fixtures
 *
 * Note import croisé : on lit `useUtilisateursStore.getState()` au runtime
 * pour vérifier la cohérence référentielle. Pas d'import à l'init du module
 * — le cycle est résolu par ESM (cohérent avec `useUtilisateursStore`).
 */

/**
 * Résultat d'une mutation sur le planning des périodes — informe l'appelant
 * du succès ou de la raison du blocage (verrou cohérence référentielle).
 */
export interface ResultatMutationPeriode {
  ok: boolean;
  raison?: string;
}

interface FormationsStore {
  formations: Record<string, Formation>;

  /**
   * Crée une nouvelle formation.
   * @returns la formation créée (avec id auto-généré).
   */
  ajouterFormation: (input: Omit<Formation, 'id' | 'periodes'>) => Formation;
  /** Met à jour les champs d'une formation existante (hors `periodes`). */
  modifierFormation: (
    id: string,
    patch: Partial<Omit<Formation, 'id' | 'periodes'>>,
  ) => void;
  /**
   * Supprime une formation. **Empêche la suppression** si au moins un·e
   * apprenti·e y est rattaché·e (cohérence référentielle).
   * @returns true si supprimée, false si bloquée.
   */
  supprimerFormation: (id: string) => boolean;

  // ── Planning des périodes (refonte mai 2026 — chantier #1) ──────────
  /**
   * Ajoute une période au planning d'une formation et propage la création
   * d'une fiche correspondante dans **tous les livrets** de la promo.
   * Validation R11/R12 effectuée — retourne `{ ok: false }` si conflit.
   */
  ajouterPeriode: (
    formationId: string,
    saisie: SaisiePeriode,
  ) => ResultatMutationPeriode;
  /**
   * Modifie une période existante (titre, dates) et propage les nouvelles
   * valeurs dans toutes les fiches correspondantes. Refus si au moins une
   * fiche est signée ou verrouillée.
   */
  modifierPeriode: (
    formationId: string,
    periodeId: string,
    saisie: SaisiePeriode,
  ) => ResultatMutationPeriode;
  /**
   * Supprime une période et toutes les fiches correspondantes dans tous
   * les livrets de la promo. Refus si au moins une fiche est signée ou
   * verrouillée. Renumérote ensuite les périodes restantes (1..N).
   */
  supprimerPeriode: (
    formationId: string,
    periodeId: string,
  ) => ResultatMutationPeriode;

  /** Réinitialise le store aux fixtures (utilisé par BoutonReinitialiserDemo). */
  reinitialiser: () => void;
}

// Bumpé post-livraison :
//   v1 — schéma initial (`Formation.lieu: Lieu` inline)
//   v2 — refonte mai 2026 : `Formation.lieuId: string` (relation vers
//        `useEtablissementsStore`). Reset complet à la première charge.
//   v3 — chantier #1 mai 2026 : `Formation.periodes: PeriodeFormation[]`
//        (planning commun à toute la promo, propage en cascade vers les
//        livrets via `useLivretStore`).
const VERSION_SCHEMA = 3;

function etatInitial(): Pick<FormationsStore, 'formations'> {
  return { formations: { ...formationsDemo } };
}

export const useFormationsStore = create<FormationsStore>()(
  persist(
    (set, get) => ({
      ...etatInitial(),

      ajouterFormation: (input) => {
        const id = `f-${crypto.randomUUID().slice(0, 8)}`;
        const formation: Formation = { id, periodes: [], ...input };
        set({ formations: { ...get().formations, [id]: formation } });
        return formation;
      },

      modifierFormation: (id, patch) =>
        set((s) => {
          const formation = s.formations[id];
          if (!formation) return s;
          return {
            formations: { ...s.formations, [id]: { ...formation, ...patch } },
          };
        }),

      supprimerFormation: (id) => {
        const formation = get().formations[id];
        if (!formation) return false;
        // Cohérence référentielle : pas de suppression tant qu'un·e apprenti·e
        // y est rattaché·e. La page /admin/affectations sert à les déplacer
        // d'abord, exactement comme pour la suppression d'un maître/formateur.
        const apprentis = Object.values(useUtilisateursStore.getState().apprentis);
        if (apprentis.some((a) => a.formationId === id)) return false;
        const { [id]: _retire, ...sansElle } = get().formations;
        void _retire;
        set({ formations: sansElle });
        return true;
      },

      // ── Planning des périodes ────────────────────────────────────────
      ajouterPeriode: (formationId, saisie) => {
        const formation = get().formations[formationId];
        if (!formation) return { ok: false, raison: 'Formation introuvable.' };
        const validation = validerSaisiePeriode(saisie, formation.periodes);
        if (!validation.ok) {
          const premier = Object.values(validation.erreurs)[0] ?? 'Saisie invalide.';
          return { ok: false, raison: premier };
        }
        const id = `pf-${crypto.randomUUID().slice(0, 8)}`;
        const periodeBrute: PeriodeFormation = {
          id,
          numero: formation.periodes.length + 1,
          titre: saisie.titre?.trim() || undefined,
          dateDebut: saisie.dateDebut,
          dateFin: saisie.dateFin,
        };
        const periodes = renumeroterPeriodes([...formation.periodes, periodeBrute]);
        set((s) => ({
          formations: {
            ...s.formations,
            [formationId]: { ...formation, periodes },
          },
        }));
        propagerCreationFiche(formationId, periodes.find((p) => p.id === id)!);
        return { ok: true };
      },

      modifierPeriode: (formationId, periodeId, saisie) => {
        const formation = get().formations[formationId];
        if (!formation) return { ok: false, raison: 'Formation introuvable.' };
        const cible = formation.periodes.find((p) => p.id === periodeId);
        if (!cible) return { ok: false, raison: 'Période introuvable.' };
        // Verrou : refus si une fiche correspondante est signée ou verrouillée.
        const livrets = Object.values(useLivretStore.getState().livrets).filter(
          (l) => apprentiAppartientPromo(l.apprentiId, formationId),
        );
        const verrou = evaluerVerrouPeriode(cible, livrets, 'modification');
        if (!verrou.peut) return { ok: false, raison: verrou.raison };
        // Validation des nouvelles dates (en court-circuitant la période éditée).
        const validation = validerSaisiePeriode(saisie, formation.periodes, periodeId);
        if (!validation.ok) {
          const premier = Object.values(validation.erreurs)[0] ?? 'Saisie invalide.';
          return { ok: false, raison: premier };
        }
        const periodesMaj = formation.periodes.map((p) =>
          p.id === periodeId
            ? {
                ...p,
                titre: saisie.titre?.trim() || undefined,
                dateDebut: saisie.dateDebut,
                dateFin: saisie.dateFin,
              }
            : p,
        );
        const periodes = renumeroterPeriodes(periodesMaj);
        set((s) => ({
          formations: {
            ...s.formations,
            [formationId]: { ...formation, periodes },
          },
        }));
        const nouvelle = periodes.find((p) => p.id === periodeId)!;
        propagerModificationFiche(formationId, nouvelle);
        return { ok: true };
      },

      supprimerPeriode: (formationId, periodeId) => {
        const formation = get().formations[formationId];
        if (!formation) return { ok: false, raison: 'Formation introuvable.' };
        const cible = formation.periodes.find((p) => p.id === periodeId);
        if (!cible) return { ok: false, raison: 'Période introuvable.' };
        const livrets = Object.values(useLivretStore.getState().livrets).filter(
          (l) => apprentiAppartientPromo(l.apprentiId, formationId),
        );
        const verrou = evaluerVerrouPeriode(cible, livrets, 'suppression');
        if (!verrou.peut) return { ok: false, raison: verrou.raison };
        const periodes = renumeroterPeriodes(
          formation.periodes.filter((p) => p.id !== periodeId),
        );
        set((s) => ({
          formations: {
            ...s.formations,
            [formationId]: { ...formation, periodes },
          },
        }));
        propagerSuppressionFiche(formationId, periodeId);
        // La cascade « modifier » sur les périodes renumérotées garantit que
        // les fiches restantes voient leur numéro mis à jour (cohérent avec
        // le nouveau planning).
        for (const p of periodes) {
          propagerModificationFiche(formationId, p);
        }
        return { ok: true };
      },

      reinitialiser: () => set(etatInitial()),
    }),
    {
      name: 'livret-formations',
      version: VERSION_SCHEMA,
      // Migration en cas de bump : reset aux fixtures (cohérent avec la
      // stratégie générale de l'étape 1).
      migrate: () => etatInitial(),
    },
  ),
);

// ─────────────────────────────────────────────────────────────────────────────
// Cascade Formation → Livrets
//
// Chaque mutation sur le planning d'une formation propage en cascade sur
// les livrets des apprenti·e·s de la promo. On manipule directement
// `useLivretStore.setState` (au lieu de passer par une mutation publique)
// pour éviter d'ajouter une API store qui ne servirait que dans ce cycle
// d'import croisé.
// ─────────────────────────────────────────────────────────────────────────────

function apprentiAppartientPromo(apprentiId: string, formationId: string): boolean {
  const apprenti = useUtilisateursStore.getState().apprentis[apprentiId];
  return apprenti?.formationId === formationId;
}

/** Crée une fiche vierge pour chaque livret de la promo. */
function propagerCreationFiche(formationId: string, periode: PeriodeFormation): void {
  useLivretStore.setState((state) => {
    const livretsMaj = { ...state.livrets };
    for (const livret of Object.values(state.livrets)) {
      if (!apprentiAppartientPromo(livret.apprentiId, formationId)) continue;
      // Idempotence : si la fiche existe déjà (par exemple après reset), no-op.
      if (livret.fichesSuivi.some((f) => f.periodeFormationId === periode.id)) continue;
      const nouvelle: FicheSuiviPeriode = {
        id: `fp-${livret.id}-${periode.id}`,
        numeroPeriode: periode.numero,
        titre: periode.titre,
        periodeFormationId: periode.id,
        dateDebut: periode.dateDebut,
        dateFin: periode.dateFin,
        suiviGretaCfa: {},
        suiviEntreprise: [],
        observations: {},
        signatures: {
          apprenti: { signe: false },
          maitre: { signe: false },
          formateur: { signe: false },
        },
        etat: 'brouillon',
        historiqueDeverrouillages: [],
      };
      livretsMaj[livret.id] = {
        ...livret,
        fichesSuivi: [...livret.fichesSuivi, nouvelle],
        modifieLe: new Date().toISOString(),
      };
    }
    return { livrets: livretsMaj, derniereModification: new Date().toISOString() };
  });
}

/** Met à jour le numéro, le titre et les dates de la fiche correspondante. */
function propagerModificationFiche(
  formationId: string,
  periode: PeriodeFormation,
): void {
  useLivretStore.setState((state) => {
    const livretsMaj = { ...state.livrets };
    for (const livret of Object.values(state.livrets)) {
      if (!apprentiAppartientPromo(livret.apprentiId, formationId)) continue;
      const fichesMaj = livret.fichesSuivi.map((f) =>
        f.periodeFormationId === periode.id
          ? {
              ...f,
              numeroPeriode: periode.numero,
              titre: periode.titre,
              dateDebut: periode.dateDebut,
              dateFin: periode.dateFin,
            }
          : f,
      );
      livretsMaj[livret.id] = {
        ...livret,
        fichesSuivi: fichesMaj,
        modifieLe: new Date().toISOString(),
      };
    }
    return { livrets: livretsMaj, derniereModification: new Date().toISOString() };
  });
}

/** Retire la fiche correspondante de tous les livrets de la promo. */
function propagerSuppressionFiche(formationId: string, periodeId: string): void {
  useLivretStore.setState((state) => {
    const livretsMaj = { ...state.livrets };
    for (const livret of Object.values(state.livrets)) {
      if (!apprentiAppartientPromo(livret.apprentiId, formationId)) continue;
      livretsMaj[livret.id] = {
        ...livret,
        fichesSuivi: livret.fichesSuivi.filter(
          (f) => f.periodeFormationId !== periodeId,
        ),
        modifieLe: new Date().toISOString(),
      };
    }
    return { livrets: livretsMaj, derniereModification: new Date().toISOString() };
  });
}
