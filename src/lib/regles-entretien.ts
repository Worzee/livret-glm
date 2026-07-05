import type {
  Apprenti,
  EntretienTripartite,
  Livret,
  NumeroEntretien,
  QuestionBanque,
  Role,
} from '@/types';
import { questionsObligatoiresSansReponse } from './questions-entretien';
import { auMoinsUneAttitudeEvaluee } from './attitudes';

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
export function peutEncoreEditer(role: Role, entretien: EntretienTripartite): boolean {
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
// Séquencement des entretiens (retours coordos juin 2026)
// ─────────────────────────────────────────────────────────────────────────────

/** Un entretien est complet quand les 3 parties ont signé (R9). */
export function entretienSigneParTous(entretien: EntretienTripartite | null): boolean {
  return (
    !!entretien &&
    entretien.signatures.apprenti.signe &&
    entretien.signatures.maitre.signe &&
    entretien.signatures.formateur.signe
  );
}

export interface ResultatInitialisationEntretien {
  ok: boolean;
  /** Message lisible expliquant le blocage. Défini uniquement si !ok. */
  raison?: string;
}

/**
 * L'entretien tripartite N peut-il être initialisé ?
 *
 * Règle (retours coordos juin 2026) : on ne peut pas initialiser
 * l'entretien suivant tant que le précédent n'est pas signé par les 3
 * parties. E1 est toujours initialisable ; un entretien déjà initialisé
 * ne l'est pas une seconde fois (R6).
 */
export function peutInitialiserEntretien(
  numero: NumeroEntretien,
  entretiens: Livret['entretiens'],
): ResultatInitialisationEntretien {
  if (entretiens[numero] !== null) {
    return { ok: false, raison: `L'entretien tripartite ${numero} est déjà initialisé.` };
  }
  if (numero === 1) return { ok: true };
  const precedent = (numero - 1) as NumeroEntretien;
  if (entretiens[precedent] === null) {
    return {
      ok: false,
      raison: `Initialisez et faites signer l'entretien tripartite ${precedent} avant d'ouvrir l'entretien ${numero}.`,
    };
  }
  if (!entretienSigneParTous(entretiens[precedent])) {
    return {
      ok: false,
      raison: `L'entretien tripartite ${precedent} doit être signé par les 3 parties avant d'initialiser l'entretien ${numero}.`,
    };
  }
  return { ok: true };
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
  /**
   * Ids des attitudes retenues pour le livret (13 juin 2026 — choisies à
   * l'E1). Quand fourni et vide, la raison côté maître oriente vers le
   * CHOIX plutôt que vers l'évaluation (rien à évaluer tant que rien n'est
   * retenu). Optionnel pour la rétrocompatibilité des appels existants.
   */
  attitudesSelectionnees?: ReadonlyArray<string>,
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
      // Pas d'exigence quand l'apprenti·e n'a aucune question propre :
      // entretien 1 (trame conjointe — juin 2026) ou formation sans question.
      if (ids.length > 0 && !auMoinsUneReponse) {
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
      const auMoinsUnCritere = !!(
        ap.ponctualite ||
        ap.comprehensionConsignes ||
        ap.qualiteTravail ||
        ap.integration
      );
      if (!auMoinsUnCritere) {
        raisons.push("Évaluez au moins un critère d'appréciation (++, +, -, --).");
      }
      // Retours coordos juin 2026 : les attitudes professionnelles sont
      // évaluées à chaque entretien — au moins une est exigée pour signer.
      // 13 juin 2026 : les attitudes se CHOISISSENT à l'E1 — tant que la
      // sélection est vide, la raison oriente vers le choix.
      if (attitudesSelectionnees !== undefined && attitudesSelectionnees.length === 0) {
        raisons.push(
          "Choisissez les attitudes professionnelles à évaluer (section « Choix des attitudes » de l'entretien 1).",
        );
      } else if (!auMoinsUneAttitudeEvaluee(entretien)) {
        raisons.push('Évaluez au moins une attitude professionnelle.');
      }
      for (const q of questionsObligatoiresSansReponse(entretien, 'maitre', banque)) {
        raisons.push(`Répondez à la question obligatoire « ${q.libelle} ».`);
      }
      break;
    }

    case 'formateur': {
      // E1 (« première visite », trame officielle GRETA) : les démarches
      // administratives ont été retirées → aucune exigence côté formateur pour
      // signer. Les entretiens 2 à 4 conservent la règle historique.
      const estE1 = entretien.reponsesTrame !== undefined;
      if (!estE1) {
        const d = entretien.demarchesAdministratives;
        const renseigne =
          d.contratSigne !== null ||
          d.visiteMedicale !== null ||
          d.permisConduire !== null ||
          d.voiture !== null;
        if (!renseigne) {
          raisons.push('Renseignez au moins une démarche administrative (oui/non).');
        }
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
