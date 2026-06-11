import type { Apprenti, EntretienTripartite, QuestionBanque, Role } from '@/types';
import { questionsObligatoiresSansReponse } from './questions-entretien';

/**
 * Règles métier des entretiens tripartites.
 * Référence : cahier des charges v1.3 §8.2 + refonte mai 2026 (chantier #2).
 *
 *   R6  : au plus 2 entretiens tripartites par livret (E1 + E2)
 *   R7  : E1 devrait avoir lieu dans les 60 jours suivant contratDebut
 *         → bandeau d'alerte ambre, NE PAS bloquer. E2 n'est pas concerné
 *         par cette contrainte de délai (bilan mi-parcours).
 *   R8  : éditable tant qu'aucune signature ; dès la 1ère signature, les
 *         champs du rôle signataire passent en lecture seule (les autres
 *         rôles peuvent encore remplir leur partie)
 *   R9  : 3 signatures → entretien entier en lecture seule pour tous
 *   R10 : déverrouillage formateur avec motif obligatoire (impl. différée)
 */

/** Délai de tolérance recommandé pour R7 (jours). */
export const DELAI_ENTRETIEN_JOURS = 60;

// ─────────────────────────────────────────────────────────────────────────────
// R7 — alerte si entretien tardif
// ─────────────────────────────────────────────────────────────────────────────

export interface AlerteR7 {
  /** Vrai si une alerte ambre doit s'afficher. */
  declenchee: boolean;
  /** Nombre de jours écoulés depuis contratDebut (positif = en retard). */
  joursDepasses: number;
  /** Date butoir attendue (ISO). */
  dateButoir: string;
}

/**
 * Détermine si l'alerte R7 doit s'afficher pour un livret donné.
 * - Pas d'alerte si l'**entretien 1** existe ET est signé par les 3 parties.
 * - Sinon, alerte dès que `today > contratDebut + 60 jours`.
 *
 * Refonte mai 2026 (chantier #2) : R7 s'applique uniquement à E1 (qui doit
 * se tenir tôt dans le parcours). E2 = bilan mi-parcours, sans contrainte
 * de délai.
 *
 * @param entretien L'entretien 1 du livret (ou `null` si pas encore initialisé).
 */
export function calculerAlerteR7(
  apprenti: Apprenti,
  entretien: EntretienTripartite | null,
  maintenant: Date = new Date(),
): AlerteR7 {
  const debut = Date.parse(apprenti.contratDebut);
  const butoir = debut + DELAI_ENTRETIEN_JOURS * 24 * 60 * 60 * 1000;
  const joursDepasses = Math.floor((maintenant.getTime() - butoir) / (24 * 60 * 60 * 1000));
  const dateButoir = new Date(butoir).toISOString().slice(0, 10);

  // Pas d'alerte si l'entretien est complètement signé
  const entretienComplet =
    !!entretien &&
    entretien.signatures.apprenti.signe &&
    entretien.signatures.maitre.signe &&
    entretien.signatures.formateur.signe;

  return {
    declenchee: !entretienComplet && joursDepasses > 0,
    joursDepasses,
    dateButoir,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// R8 / R9 — verrouillage progressif des champs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Détermine si un rôle peut encore éditer ses propres champs dans l'entretien,
 * en tenant compte de l'avancement des signatures.
 *
 * @returns true si :
 *   - le rôle n'a pas encore signé (peut encore modifier sa section)
 *   - ET les 3 signatures ne sont pas toutes apposées (R9)
 *
 * Préalable : `peutEditer(role, ressource)` doit déjà avoir retourné true
 * (matrice statique des droits métier). Cette fonction ajoute la couche
 * dynamique de l'état des signatures.
 */
export function peutEncoreEditer(
  role: Role,
  entretien: EntretienTripartite,
): boolean {
  // R9 : 3 signatures → tout figé pour tous
  const sig = entretien.signatures;
  const toutesSignees = sig.apprenti.signe && sig.maitre.signe && sig.formateur.signe;
  if (toutesSignees) return false;

  // R8 : si le rôle propriétaire a déjà signé, ses champs sont figés
  if (role === 'apprenti' && sig.apprenti.signe) return false;
  if (role === 'maitre' && sig.maitre.signe) return false;
  if (role === 'formateur' && sig.formateur.signe) return false;

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation de signature pour l'entretien (parallèle de validation-signature.ts)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vérifie qu'un rôle peut signer l'entretien tripartite.
 *
 * Critère de signature retenu (sprint 3) : la section principale du rôle
 * doit comporter au moins une saisie significative. Ces critères sont
 * volontairement souples (différents de R20 sur les fiches de période)
 * car l'entretien est un acte de cadrage, pas une évaluation périodique.
 *
 * Extension juin 2026 (retours coordos) : les questions marquées obligatoires
 * par le coordo (snapshot `entretien.questionsObligatoires`) doivent avoir une
 * réponse renseignée pour que la cible concernée (apprenti·e ou maître) puisse
 * signer. La `banque` sert à résoudre cible, type et libellé de chaque id.
 */
export function validerSignatureEntretien(
  entretien: EntretienTripartite,
  role: Role,
  banque: Record<string, QuestionBanque>,
): { peutSigner: boolean; raisons: string[] } {
  const raisons: string[] = [];

  if (role === 'coordo' || role === 'admin') {
    raisons.push("Ce rôle ne signe pas l'entretien tripartite.");
    return { peutSigner: false, raisons };
  }

  switch (role) {
    case 'apprenti': {
      // Refonte mai 2026 : la signature est autorisée si au moins une des
      // questions sélectionnées par le formateur référent a été répondue.
      const reponses = entretien.reponsesApprenti;
      const ids = entretien.questionsApprentiSelectionnees;
      const auMoinsUneReponse = ids.some((id) => {
        const v = reponses[id];
        if (typeof v === 'string') return v.trim().length > 0;
        return typeof v === 'boolean';
      });
      if (!auMoinsUneReponse) {
        raisons.push('Renseignez au moins une réponse à vos questions.');
      }
      for (const q of questionsObligatoiresSansReponse(entretien, 'apprenti', banque)) {
        raisons.push(`Répondez à la question obligatoire « ${q.libelle} ».`);
      }
      break;
    }

    case 'maitre': {
      // Refonte mai 2026 : on exige uniquement au moins un critère
      // d'appréciation. La saisie des questions sélectionnées reste libre
      // (le formateur peut en avoir choisi 0 pour un cas simplifié).
      const ap = entretien.appreciationMaitre;
      const auMoinsUnCritere =
        !!(ap.ponctualite || ap.comprehensionConsignes || ap.qualiteTravail || ap.integration);
      if (!auMoinsUnCritere) {
        raisons.push("Évaluez au moins un critère d'appréciation (++, +, -, --).");
      }
      for (const q of questionsObligatoiresSansReponse(entretien, 'maitre', banque)) {
        raisons.push(`Répondez à la question obligatoire « ${q.libelle} ».`);
      }
      break;
    }

    case 'formateur': {
      const d = entretien.demarchesAdministratives;
      const renseigne =
        d.contratSigne !== null ||
        d.visiteMedicale !== null ||
        d.permisConduire !== null ||
        d.voiture !== null;
      if (!renseigne) {
        raisons.push('Renseignez au moins une démarche administrative (oui/non).');
      }
      break;
    }
  }

  return { peutSigner: raisons.length === 0, raisons };
}

// ─────────────────────────────────────────────────────────────────────────────
// Barre de progression — % de complétude de l'entretien
// ─────────────────────────────────────────────────────────────────────────────

interface ProgressionEntretien {
  /** Pourcentage global (0-100). */
  global: number;
  /** Pourcentage par rôle (apprenti, maitre, formateur). */
  parRole: Record<'apprenti' | 'maitre' | 'formateur', number>;
}

/**
 * Calcule un score de complétude de l'entretien.
 * Sprint 3 : approche simple — on compte les champs renseignés sur le total
 * attendu pour chaque rôle.
 */
export function calculerProgression(entretien: EntretienTripartite): ProgressionEntretien {
  // Apprenti : N questions sélectionnées par le formateur référent.
  // On considère « rempli » dès qu'on a une string non-vide ou un boolean.
  const champsApprenti = entretien.questionsApprentiSelectionnees.map((id) =>
    valeurReponseRemplie(entretien.reponsesApprenti[id]),
  );
  const apprentiPct = pourcentageRempli(champsApprenti);

  // Maître : N questions sélectionnées + 4 critères d'appréciation (en dur)
  const ap = entretien.appreciationMaitre;
  const champsMaitre = [
    ...entretien.questionsMaitreSelectionnees.map((id) =>
      valeurReponseRemplie(entretien.reponsesMaitre[id]),
    ),
    ap.ponctualite,
    ap.comprehensionConsignes,
    ap.qualiteTravail,
    ap.integration,
  ];
  const maitrePct = pourcentageRempli(champsMaitre);

  // Formateur : 4 démarches + 4 conditions + 3 aides + remarques optionnels
  const d = entretien.demarchesAdministratives;
  const c = entretien.conditionsPratiques;
  const a = entretien.aidesDemandees;
  const champsFormateur = [
    d.contratSigne !== null ? '✓' : '',
    d.visiteMedicale !== null ? '✓' : '',
    d.permisConduire !== null ? '✓' : '',
    d.voiture !== null ? '✓' : '',
    c.hebergementCentre,
    c.hebergementEntreprise,
    c.transportCentre,
    c.transportEntreprise,
    a.logement !== null ? '✓' : '',
    a.premierEquipement !== null ? '✓' : '',
    a.permis !== null ? '✓' : '',
  ];
  const formateurPct = pourcentageRempli(champsFormateur);

  // Global = moyenne pondérée (chaque rôle compte autant)
  const global = Math.round((apprentiPct + maitrePct + formateurPct) / 3);

  return {
    global,
    parRole: {
      apprenti: apprentiPct,
      maitre: maitrePct,
      formateur: formateurPct,
    },
  };
}

function pourcentageRempli(champs: Array<string | undefined | null>): number {
  if (champs.length === 0) return 0;
  const remplis = champs.filter((v) => v && v.toString().trim().length > 0).length;
  return Math.round((remplis / champs.length) * 100);
}

/** Helper : ramène une réponse de question (string|boolean|null) à un marqueur
 * « rempli » (chaîne non vide) ou « non rempli » (chaîne vide), pour rester
 * compatible avec `pourcentageRempli`. */
function valeurReponseRemplie(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'boolean') return '✓';
  return '';
}
