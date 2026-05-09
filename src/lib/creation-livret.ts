import type { Apprenti, Livret } from '@/types';
import { referentielCapCuisine } from '@/fixtures/referentiel-cap-cuisine';

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
 *   - aucune fiche de période
 *   - les lignes d'évaluation finale instanciées depuis le référentiel actuel
 *
 * @param livretId  Id voulu pour le livret (souvent `livret-${apprenti.id}`).
 * @param auteurId  Id de l'utilisateur·rice à l'origine de la création
 *                  (pour `organisationSuivi.modifiePar`).
 * @param maintenant Permet de passer une date pour les tests déterministes.
 */
export function creerLivretVierge(
  apprenti: Apprenti,
  livretId: string,
  auteurId: string,
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
  const lignesAttitudes = referentielCapCuisine.attitudes.map((a) => ({
    attitudeId: a.id,
    evaluationMaitre: null,
    evaluationFormateur: null,
  }));
  return {
    id: livretId,
    apprentiId: apprenti.id,
    formationId: apprenti.formationId,
    organisationSuivi: {
      reunionRentree: {},
      entretienIndividuel: {},
      accueilTuteurs: {},
      visitesEntreprise: {},
      restitutionActivites: {},
      bilansFormation: {},
      modifieLe: iso,
      modifiePar: auteurId,
    },
    entretienTripartite: null,
    fichesSuivi: [],
    evaluationFinaleCompetences: {
      lignes: lignesCompetences,
      modifieLe: iso,
    },
    evaluationFinaleAttitudes: {
      lignes: lignesAttitudes,
      modifieLe: iso,
    },
    cloture: null,
    creeLe: iso,
    modifieLe: iso,
  };
}
