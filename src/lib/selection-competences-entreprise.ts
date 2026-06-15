import type {
  EntreeDeverrouillage,
  LigneEvaluationFinaleCompetence,
  Referentiel,
  Role,
  SelectionCompetencesEntreprise,
} from '@/types';

/**
 * Sélection des compétences abordées en entreprise (CDC v1.5 addendum).
 *
 * Helpers purs sans dépendance React ni store. Toute action transformant la
 * sélection prend en entrée une `SelectionCompetencesEntreprise` immuable et
 * renvoie une nouvelle valeur — la mutation effective vit dans
 * `useLivretStore` (cf. `setSelectionCompetencesEntreprise`,
 * `invaliderSelectionCompetencesEntreprise`).
 *
 * Workflow métier (W1, révisé 13 juin 2026) :
 *   1. À la création du livret, **toutes** les compétences du référentiel
 *      sont activées par défaut (cf. `creerSelectionInitiale`).
 *   2. Le **maître / tuteur seul** décoche les compétences non abordées en
 *      entreprise (cf. `toggleCompetence` ; droit `entretien.selection-
 *      competences-entreprise` réservé au maître). Le formateur consulte.
 *   3. La 3ᵉ signature de l'entretien tripartite déclenche `marquerValidee`
 *      (effet dans `signerEntretien` côté store).
 *   4. Une fois validée, la sélection n'est plus éditable. Seule une
 *      invalidation R10 motivée par le formateur permet d'y revenir
 *      (cf. `invaliderAvecMotif` + matrice `fiche.deverrouiller`).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Création
// ─────────────────────────────────────────────────────────────────────────────

export function creerSelectionVierge(
  maintenant: Date = new Date(),
): SelectionCompetencesEntreprise {
  return {
    ids: [],
    modifieLe: maintenant.toISOString(),
    historiqueInvalidations: [],
  };
}

/**
 * Sélection initiale d'un nouveau livret (13 juin 2026) : **toutes** les
 * compétences du référentiel sont activées par défaut. Le maître / tuteur
 * décochera ensuite celles non abordées en entreprise lors de l'E1.
 */
export function creerSelectionInitiale(
  competenceIds: ReadonlyArray<string>,
  maintenant: Date = new Date(),
): SelectionCompetencesEntreprise {
  return {
    ids: [...competenceIds],
    modifieLe: maintenant.toISOString(),
    historiqueInvalidations: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Lecture
// ─────────────────────────────────────────────────────────────────────────────

export function estValidee(sel: SelectionCompetencesEntreprise): boolean {
  return sel.validePar !== undefined;
}

export function estSelectionnee(
  sel: SelectionCompetencesEntreprise,
  competenceId: string,
): boolean {
  return sel.ids.includes(competenceId);
}

/**
 * Indique si la sélection peut être éditée à l'instant T. Tant que la
 * validation conjointe n'a pas été apposée (3 signatures de l'entretien),
 * formateur et maître peuvent cocher/décocher librement.
 */
export function peutEtreEditee(sel: SelectionCompetencesEntreprise): boolean {
  return !estValidee(sel);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations pures
// ─────────────────────────────────────────────────────────────────────────────

export function toggleCompetence(
  sel: SelectionCompetencesEntreprise,
  competenceId: string,
  maintenant: Date = new Date(),
): SelectionCompetencesEntreprise {
  const present = sel.ids.includes(competenceId);
  const ids = present ? sel.ids.filter((id) => id !== competenceId) : [...sel.ids, competenceId];
  return { ...sel, ids, modifieLe: maintenant.toISOString() };
}

export function marquerValidee(
  sel: SelectionCompetencesEntreprise,
  formateurId: string,
  maitreId: string,
  maintenant: Date = new Date(),
): SelectionCompetencesEntreprise {
  const dateIso = maintenant.toISOString();
  return {
    ...sel,
    validePar: { formateurId, maitreId, dateIso },
    modifieLe: dateIso,
  };
}

export interface ArgumentsInvalidation {
  id: string;
  auteurId: string;
  auteurNom: string;
  auteurRole: Role;
  motif: string;
  maintenant?: Date;
}

export function invaliderAvecMotif(
  sel: SelectionCompetencesEntreprise,
  args: ArgumentsInvalidation,
): SelectionCompetencesEntreprise {
  const maintenant = args.maintenant ?? new Date();
  const dateIso = maintenant.toISOString();
  const trace: EntreeDeverrouillage = {
    id: args.id,
    dateIso,
    auteurId: args.auteurId,
    auteurNom: args.auteurNom,
    auteurRole: args.auteurRole,
    motif: args.motif,
  };
  const { validePar: _validePar, ...sansValidation } = sel;
  void _validePar;
  return {
    ...sansValidation,
    modifieLe: dateIso,
    historiqueInvalidations: [...sel.historiqueInvalidations, trace],
  };
}

/**
 * Nettoie la sélection après mise à jour du référentiel : retire les ids de
 * compétences qui n'existent plus (renommées, supprimées, remplacées par un
 * import CSV/XLSX). Renvoie la sélection inchangée si aucun id n'est orphelin
 * (préserve `modifieLe` pour ne pas créer de faux signal de modification).
 */
export function nettoyerApresMajReferentiel(
  sel: SelectionCompetencesEntreprise,
  referentiel: Referentiel,
  maintenant: Date = new Date(),
): SelectionCompetencesEntreprise {
  const idsValides = new Set<string>();
  for (const b of referentiel.blocs) {
    for (const c of b.competences) {
      idsValides.add(c.id);
    }
  }
  const idsFiltres = sel.ids.filter((id) => idsValides.has(id));
  if (idsFiltres.length === sel.ids.length) {
    return sel;
  }
  return { ...sel, ids: idsFiltres, modifieLe: maintenant.toISOString() };
}

/**
 * Pour l'option a1 (cf. CDC v1.5 addendum) : identifie les compétences qui
 * ont une saisie historique « Acquis en entreprise » mais qui ne sont plus
 * dans la sélection actuelle. La cellule doit alors être affichée en lecture
 * seule (et non remplacée par « — »).
 */
export function competencesNonSelectionneesAvecSaisie(
  sel: SelectionCompetencesEntreprise,
  lignes: ReadonlyArray<LigneEvaluationFinaleCompetence>,
): string[] {
  const selSet = new Set(sel.ids);
  return lignes
    .filter((l) => !selSet.has(l.competenceId) && l.acquisEntreprise !== null)
    .map((l) => l.competenceId);
}
