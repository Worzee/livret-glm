import type { Apprenti, FicheSuiviPeriode, Livret, PeriodeFormation } from '@/types';
import { referentielCapCuisine } from '@/fixtures/referentiel-cap-cuisine';
import { creerSelectionInitiale } from './selection-competences-entreprise';

/**
 * Matérialise une fiche de suivi **vierge** (brouillon, sans contenu
 * pédagogique ni signature) à partir d'une période du planning de la
 * formation. Réutilisé par `creerLivretVierge` (création d'un livret) et par
 * les fixtures de démonstration pour compléter une promo dont tous les
 * livrets partagent le même planning.
 *
 * @param periode  Période parente définie sur la formation.
 * @param idFiche  Id voulu pour la fiche (doit être unique dans le livret).
 */
export function creerFichePeriodeVierge(
  periode: PeriodeFormation,
  idFiche: string,
): FicheSuiviPeriode {
  return {
    id: idFiche,
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
}

/**
 * Crée un livret vierge pour un·e apprenti·e fraîchement créé·e.
 * Référence : cahier des charges v1.3, sections 7.3 et 24.
 *
 * Utilisé à deux endroits :
 *   - fixtures de démonstration (livret-demo.ts) — état initial des 6 livrets
 *   - création par l'admin/coordo (useUtilisateursStore.ajouterApprenti)
 *
 * Le livret est rempli avec :
 *   - une `OrganisationSuivi` minimale (champs vides + horodatage)
 *   - un entretien tripartite null (à initialiser explicitement par le formateur)
 *   - une fiche de période par entrée du `planning` fourni (refonte mai
 *     2026 — chantier #1 : le planning vient de la formation, pas du livret)
 *   - les lignes d'évaluation finale instanciées depuis le référentiel actuel
 *
 * @param livretId  Id voulu pour le livret (souvent `livret-${apprenti.id}`).
 * @param auteurId  Id de l'utilisateur·rice à l'origine de la création
 *                  (pour `organisationSuivi.modifiePar`).
 * @param planning  Planning des périodes hérité de la formation. Pour les
 *                  livrets de fixtures qui définissent leurs propres fiches,
 *                  passer `[]` (les fiches seront ajoutées explicitement).
 * @param maintenant Permet de passer une date pour les tests déterministes.
 */
export function creerLivretVierge(
  apprenti: Apprenti,
  livretId: string,
  auteurId: string,
  planning: ReadonlyArray<PeriodeFormation> = [],
  maintenant: Date = new Date(),
  /** Planning des périodes en centre de formation (17 juin 2026). */
  planningCentre: ReadonlyArray<PeriodeFormation> = [],
): Livret {
  const iso = maintenant.toISOString();
  const lignesCompetences = referentielCapCuisine.blocs
    .flatMap((b) => b.competences)
    .map((c) => ({
      competenceId: c.id,
      acquisEntreprise: null,
      acquisCentre: null,
    }));
  return {
    id: livretId,
    apprentiId: apprenti.id,
    formationId: apprenti.formationId,
    // Refonte modulaire mai 2026 : la liste démarre vide. Le formateur
    // référent ajoute à la demande chaque événement (réunion de rentrée,
    // visites en entreprise, etc.) depuis la page Fiches de suivi.
    organisationSuivi: {
      evenements: [],
      modifieLe: iso,
      modifiePar: auteurId,
    },
    // L'entretien tripartite unique (juillet 2026), initialisé via
    // événement de motif `entretien-tripartite` dans l'organisation du suivi.
    entretien: null,
    fichesSuivi: planning.map((p) => creerFichePeriodeVierge(p, `fp-${livretId}-${p.id}`)),
    // Périodes en centre (17 juin 2026) — héritées du planning centre de la
    // formation. Préfixe d'id `fc-` (vs `fp-` pour l'entreprise).
    fichesSuiviCentre: planningCentre.map((p) =>
      creerFichePeriodeVierge(p, `fc-${livretId}-${p.id}`),
    ),
    evaluationFinaleCompetences: {
      lignes: lignesCompetences,
      modifieLe: iso,
    },
    // 13 juin 2026 : la sélection des compétences abordées en entreprise
    // démarre avec TOUTES les compétences activées. Le maître / tuteur seul
    // décoche celles non abordées lors de l'E1 ; figée à la 3ᵉ signature.
    selectionCompetencesEntreprise: creerSelectionInitiale(
      lignesCompetences.map((l) => l.competenceId),
      maintenant,
    ),
    // 13 juin 2026 : les attitudes à évaluer se choisissent à l'E1 (maître +
    // formateur) — vierge à la création, figée à la 3ᵉ signature de l'E1.
    attitudesSelectionnees: [],
    cloture: null,
    creeLe: iso,
    modifieLe: iso,
  };
}
