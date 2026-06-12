import type { Apprenti, FicheSuiviPeriode, Livret, PeriodeFormation } from '@/types';
import { referentielCapCuisine } from '@/fixtures/referentiel-cap-cuisine';
import { creerSelectionVierge } from './selection-competences-entreprise';

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
    // Jusqu'à 4 entretiens tripartites (juin 2026), initialisés via
    // événement dans l'organisation du suivi (motifs
    // `entretien-tripartite-{1..N}`, N = Formation.nombreEntretiens).
    entretiens: { 1: null, 2: null, 3: null, 4: null },
    fichesSuivi: planning.map(
      (p): FicheSuiviPeriode => ({
        id: `fp-${livretId}-${p.id}`,
        numeroPeriode: p.numero,
        titre: p.titre,
        periodeFormationId: p.id,
        dateDebut: p.dateDebut,
        dateFin: p.dateFin,
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
      }),
    ),
    evaluationFinaleCompetences: {
      lignes: lignesCompetences,
      modifieLe: iso,
    },
    // CDC v1.5 addendum : la sélection des compétences abordées en entreprise
    // démarre vierge — elle sera définie conjointement par le formateur
    // référent et le maître d'apprentissage, puis validée à la 3ᵉ signature
    // de l'entretien tripartite.
    selectionCompetencesEntreprise: creerSelectionVierge(maintenant),
    // 13 juin 2026 : les attitudes à évaluer se choisissent à l'E1 (maître +
    // formateur) — vierge à la création, figée à la 3ᵉ signature de l'E1.
    attitudesSelectionnees: [],
    cloture: null,
    creeLe: iso,
    modifieLe: iso,
  };
}
