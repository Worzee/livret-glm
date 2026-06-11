import type {
  CibleQuestion,
  EntretienTripartite,
  NumeroEntretien,
  QuestionBanque,
  ReponsesEntretien,
  TypeQuestion,
  ValeurReponseEntretien,
} from '@/types';

/**
 * Banque de questions de l'entretien tripartite — catalogue par défaut + helpers.
 * Référence : refonte mai 2026 (les questions étaient codées en dur dans
 * `SectionApprenti` / `SectionMaitre`), enrichie juin 2026 (retours coordos) :
 * le coordo affecte chaque question à l'entretien 1 et/ou 2 (`pourEntretienN`)
 * et peut la marquer `obligatoire` (non retirable + réponse exigée pour signer).
 *
 * Les 11 questions ci-dessous reprennent celles existantes en les reformulant
 * de manière **neutre** (pas de référence à un domaine ou une formation
 * particulière). Elles servent de point de départ : le coordo / admin peut
 * en ajouter, modifier ou supprimer depuis la page d'administration dédiée.
 *
 * Affectations par défaut : toutes les questions sont affectées à E1
 * (comportement historique) ; les questions de suivi/bilan le sont aussi à
 * E2, E3 et E4 (jusqu'à 4 entretiens pour les formations de 2 ans — le
 * nombre effectif est défini par formation). Deux questions sont
 * obligatoires pour la démonstration : les motivations de l'apprenti·e et
 * l'expérience de formation du maître / tuteur.
 */

export const QUESTIONS_BANQUE_INITIALE: ReadonlyArray<QuestionBanque> = [
  // ── Apprenti·e ────────────────────────────────────────────────────────────
  {
    id: 'q-app-motivations',
    cible: 'apprenti',
    type: 'texte-long',
    libelle: 'Quelles sont vos motivations pour cette formation ?',
    placeholder: 'Votre projet, vos objectifs…',
    pourEntretiens: [1],
    obligatoire: true,
  },
  {
    id: 'q-app-contact-entreprise',
    cible: 'apprenti',
    type: 'texte-court',
    libelle: 'Comment êtes-vous entré·e en contact avec votre entreprise ?',
    placeholder: 'Candidature spontanée, journée portes ouvertes, réseau…',
    pourEntretiens: [1],
    obligatoire: false,
  },
  {
    id: 'q-app-connaissance-entreprise',
    cible: 'apprenti',
    type: 'texte-court',
    libelle: 'Connaissiez-vous cette entreprise auparavant ?',
    placeholder: 'Stage antérieur, visite, recommandation…',
    pourEntretiens: [1],
    obligatoire: false,
  },
  {
    id: 'q-app-metier-representation',
    cible: 'apprenti',
    type: 'texte-long',
    libelle: 'Le métier correspond-il à la représentation que vous en aviez ?',
    placeholder: 'Surprises, confirmations, ajustements…',
    pourEntretiens: [1, 2, 3, 4],
    obligatoire: false,
  },
  {
    id: 'q-app-difficultes-formation',
    cible: 'apprenti',
    type: 'texte-long',
    libelle:
      'Rencontrez-vous des difficultés dans certaines matières du centre de formation ?',
    placeholder: 'Matières, contenus, méthodes…',
    pourEntretiens: [1, 2, 3, 4],
    obligatoire: false,
  },
  {
    id: 'q-app-difficultes-autres',
    cible: 'apprenti',
    type: 'texte-long',
    libelle:
      "Rencontrez-vous d'autres difficultés (matérielles, personnelles) ?",
    placeholder: 'Transport, logement, santé, etc.',
    pourEntretiens: [1, 2, 3, 4],
    obligatoire: false,
  },
  {
    id: 'q-app-ressenti-equipe',
    cible: 'apprenti',
    type: 'texte-long',
    libelle: 'Comment vous sentez-vous au sein de votre équipe en entreprise ?',
    placeholder: 'Intégration, ambiance, soutien…',
    pourEntretiens: [1, 2, 3, 4],
    obligatoire: false,
  },
  // ── Maître / Tuteur ─────────────────────────────────────────────────────────
  {
    id: 'q-mai-deja-forme',
    cible: 'maitre',
    type: 'oui-non',
    libelle: 'Avez-vous déjà formé un·e apprenti·e auparavant ?',
    pourEntretiens: [1],
    obligatoire: true,
  },
  {
    id: 'q-mai-diplomes-deja-formes',
    cible: 'maitre',
    type: 'texte-court',
    libelle: "Si oui, quels diplômes / combien d'apprenti·e·s ?",
    placeholder: 'Ex : 3 CAP sur 8 ans',
    pourEntretiens: [1],
    obligatoire: false,
  },
  {
    id: 'q-mai-objectifs-embauche',
    cible: 'maitre',
    type: 'texte-long',
    libelle:
      "Quels sont vos objectifs en termes d'embauche à l'issue du contrat ?",
    placeholder: 'Embauche envisagée, conditions…',
    pourEntretiens: [1, 2, 3, 4],
    obligatoire: false,
  },
  {
    id: 'q-mai-organisation-tutorat',
    cible: 'maitre',
    type: 'texte-long',
    libelle: "Quelle est l'organisation prévue de l'accueil et du tutorat ?",
    placeholder: 'Tuteur·rice·s désigné·e·s, fréquence des points…',
    pourEntretiens: [1, 2, 3, 4],
    obligatoire: false,
  },
];

/**
 * Ids des questions affectées par le coordo à un entretien donné, pour une
 * cible, dans l'ordre du catalogue. C'est ce sous-ensemble qui est injecté
 * (snapshot) à l'initialisation d'un entretien.
 */
export function idsQuestionsAffectees(
  banque: ReadonlyArray<QuestionBanque>,
  numero: NumeroEntretien,
  cible: CibleQuestion,
): string[] {
  return banque
    .filter((q) => q.cible === cible)
    .filter((q) => q.pourEntretiens.includes(numero))
    .map((q) => q.id);
}

/**
 * Ids des questions obligatoires parmi celles affectées à un entretien
 * (toutes cibles confondues). Snapshot à l'initialisation : non retirables
 * ET réponse exigée pour la signature de la cible (extension R20).
 */
export function idsQuestionsObligatoiresAffectees(
  banque: ReadonlyArray<QuestionBanque>,
  numero: NumeroEntretien,
): string[] {
  return banque
    .filter((q) => q.pourEntretiens.includes(numero))
    .filter((q) => q.obligatoire)
    .map((q) => q.id);
}

/**
 * Le formateur référent peut-il retirer cette question de l'entretien ?
 * Non si elle fait partie du snapshot affecté par le coordo (`questionsImposees`)
 * ou du snapshot obligatoire (`questionsObligatoires`). Les questions que le
 * formateur a lui-même ajoutées après l'initialisation restent retirables.
 */
export function peutRetirerQuestion(
  entretien: Pick<EntretienTripartite, 'questionsImposees' | 'questionsObligatoires'>,
  questionId: string,
): boolean {
  return (
    !entretien.questionsImposees.includes(questionId) &&
    !entretien.questionsObligatoires.includes(questionId)
  );
}

/**
 * Questions obligatoires de l'entretien (snapshot) ciblant `cible` et dont la
 * réponse n'est pas renseignée. Sert à bloquer la signature (extension R20) et
 * à composer les messages d'erreur (libellés).
 */
export function questionsObligatoiresSansReponse(
  entretien: EntretienTripartite,
  cible: CibleQuestion,
  banque: Record<string, QuestionBanque>,
): QuestionBanque[] {
  const reponses = cible === 'apprenti' ? entretien.reponsesApprenti : entretien.reponsesMaitre;
  return entretien.questionsObligatoires
    .map((id) => banque[id])
    .filter((q): q is QuestionBanque => !!q && q.cible === cible)
    .filter((q) => !reponseEstRenseignee(q.type, reponses[q.id]));
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
