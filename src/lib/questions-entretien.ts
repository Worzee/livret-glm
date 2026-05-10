import type {
  EntretienTripartite,
  QuestionBanque,
  ReponsesEntretien,
  TypeQuestion,
  ValeurReponseEntretien,
} from '@/types';

/**
 * Banque de questions de l'entretien tripartite — catalogue par défaut + helpers.
 * Référence : refonte mai 2026 (les questions étaient codées en dur dans
 * `SectionApprenti` / `SectionMaitre`).
 *
 * Les 11 questions ci-dessous reprennent celles existantes en les reformulant
 * de manière **neutre** (pas de référence à un domaine ou une formation
 * particulière). Elles servent de point de départ : le coordo / admin peut
 * en ajouter, modifier ou supprimer depuis la page d'administration dédiée.
 */

export const QUESTIONS_BANQUE_INITIALE: ReadonlyArray<QuestionBanque> = [
  // ── Apprenti·e ────────────────────────────────────────────────────────────
  {
    id: 'q-app-motivations',
    cible: 'apprenti',
    type: 'texte-long',
    libelle: 'Quelles sont vos motivations pour cette formation ?',
    placeholder: 'Votre projet, vos objectifs…',
  },
  {
    id: 'q-app-contact-entreprise',
    cible: 'apprenti',
    type: 'texte-court',
    libelle: 'Comment êtes-vous entré·e en contact avec votre entreprise ?',
    placeholder: 'Candidature spontanée, journée portes ouvertes, réseau…',
  },
  {
    id: 'q-app-connaissance-entreprise',
    cible: 'apprenti',
    type: 'texte-court',
    libelle: 'Connaissiez-vous cette entreprise auparavant ?',
    placeholder: 'Stage antérieur, visite, recommandation…',
  },
  {
    id: 'q-app-metier-representation',
    cible: 'apprenti',
    type: 'texte-long',
    libelle: 'Le métier correspond-il à la représentation que vous en aviez ?',
    placeholder: 'Surprises, confirmations, ajustements…',
  },
  {
    id: 'q-app-difficultes-formation',
    cible: 'apprenti',
    type: 'texte-long',
    libelle:
      'Rencontrez-vous des difficultés dans certaines matières du centre de formation ?',
    placeholder: 'Matières, contenus, méthodes…',
  },
  {
    id: 'q-app-difficultes-autres',
    cible: 'apprenti',
    type: 'texte-long',
    libelle:
      "Rencontrez-vous d'autres difficultés (matérielles, personnelles) ?",
    placeholder: 'Transport, logement, santé, etc.',
  },
  {
    id: 'q-app-ressenti-equipe',
    cible: 'apprenti',
    type: 'texte-long',
    libelle: 'Comment vous sentez-vous au sein de votre équipe en entreprise ?',
    placeholder: 'Intégration, ambiance, soutien…',
  },
  // ── Maître ─────────────────────────────────────────────────────────────────
  {
    id: 'q-mai-deja-forme',
    cible: 'maitre',
    type: 'oui-non',
    libelle: 'Avez-vous déjà formé un·e apprenti·e auparavant ?',
  },
  {
    id: 'q-mai-diplomes-deja-formes',
    cible: 'maitre',
    type: 'texte-court',
    libelle: "Si oui, quels diplômes / combien d'apprenti·e·s ?",
    placeholder: 'Ex : 3 CAP sur 8 ans',
  },
  {
    id: 'q-mai-objectifs-embauche',
    cible: 'maitre',
    type: 'texte-long',
    libelle:
      "Quels sont vos objectifs en termes d'embauche à l'issue du contrat ?",
    placeholder: 'Embauche envisagée, conditions…',
  },
  {
    id: 'q-mai-organisation-tutorat',
    cible: 'maitre',
    type: 'texte-long',
    libelle: "Quelle est l'organisation prévue de l'accueil et du tutorat ?",
    placeholder: 'Tuteur·rice·s désigné·e·s, fréquence des points…',
  },
];

/**
 * Récupère les ids initiaux pour pré-sélectionner toutes les questions de la
 * banque dans un nouveau livret (toutes les questions par défaut, dans l'ordre
 * du catalogue). Utilisé par `creerLivretVierge` et les fixtures.
 */
export function idsQuestionsInitiales(
  cible: 'apprenti' | 'maitre',
): string[] {
  return QUESTIONS_BANQUE_INITIALE.filter((q) => q.cible === cible).map((q) => q.id);
}

/**
 * Indique si une valeur de réponse est considérée comme « renseignée » pour
 * une question d'un certain type. Utilisé pour les badges « répondu / vide »
 * et les compteurs de progression.
 */
export function reponseEstRenseignee(
  type: TypeQuestion,
  valeur: ValeurReponseEntretien | undefined,
): boolean {
  if (valeur === undefined || valeur === null) return false;
  if (type === 'oui-non') return typeof valeur === 'boolean';
  if (typeof valeur === 'string') return valeur.trim().length > 0;
  return false;
}

/**
 * Crée une banque indexée par id pour des accès O(1) depuis l'UI.
 */
export function indexerBanque(
  banque: ReadonlyArray<QuestionBanque>,
): Record<string, QuestionBanque> {
  return Object.fromEntries(banque.map((q) => [q.id, q]));
}

/**
 * Indique si une question est utilisée dans au moins un entretien existant.
 * Utilisé pour bloquer la suppression depuis la banque (cohérence
 * référentielle), comme pour les formations / référentiels.
 */
export function questionEstUtilisee(
  questionId: string,
  entretiens: ReadonlyArray<EntretienTripartite | null>,
): boolean {
  for (const e of entretiens) {
    if (!e) continue;
    if (e.questionsApprentiSelectionnees.includes(questionId)) return true;
    if (e.questionsMaitreSelectionnees.includes(questionId)) return true;
  }
  return false;
}

/**
 * Filtre une map de réponses pour ne garder que celles dont la `questionId`
 * est encore référencée par les questions sélectionnées. Évite que des
 * réponses « fantômes » (questions désélectionnées) ne pèsent dans le store.
 */
export function nettoyerReponses(
  reponses: ReponsesEntretien,
  questionsSelectionnees: ReadonlyArray<string>,
): ReponsesEntretien {
  const garde = new Set(questionsSelectionnees);
  return Object.fromEntries(
    Object.entries(reponses).filter(([id]) => garde.has(id)),
  );
}
