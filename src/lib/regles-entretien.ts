import type { Apprenti, EntretienTripartite, Role } from '@/types';

/**
 * Règles métier de l'entretien tripartite.
 * Référence : cahier des charges v1.3, sections 8.2 (R6 → R10) et 5.2.
 *
 *   R6  : un seul entretien tripartite par livret
 *   R7  : devrait avoir lieu dans les 60 jours suivant contratDebut
 *         → bandeau d'alerte ambre, NE PAS bloquer
 *   R8  : éditable tant qu'aucune signature ; dès la 1ère signature, les
 *         champs du rôle signataire passent en lecture seule (les autres
 *         rôles peuvent encore remplir leur partie)
 *   R9  : 3 signatures → fiche entière en lecture seule pour tous
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
 * - Pas d'alerte si l'entretien existe ET est signé par les 3 parties.
 * - Sinon, alerte dès que `today > contratDebut + 60 jours`.
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
 */
export function validerSignatureEntretien(
  entretien: EntretienTripartite,
  role: Role,
): { peutSigner: boolean; raisons: string[] } {
  const raisons: string[] = [];

  if (role === 'coordo' || role === 'admin') {
    raisons.push("Ce rôle ne signe pas l'entretien tripartite.");
    return { peutSigner: false, raisons };
  }

  switch (role) {
    case 'apprenti': {
      const r = entretien.reponsesApprenti;
      const auMoinsUneReponse =
        !!(r.motivations || r.contactEntreprise || r.connaissanceEntreprise ||
          r.metierVsRepresentation || r.difficultesDisciplines || r.difficultesAutres ||
          r.ressenti);
      if (!auMoinsUneReponse) {
        raisons.push('Renseignez au moins une réponse à vos questions.');
      }
      break;
    }

    case 'maitre': {
      const r = entretien.reponsesMaitre;
      const ap = entretien.appreciationMaitre;
      if (r.dejaFormeApprenti === null) {
        raisons.push("Indiquez si vous avez déjà formé un·e apprenti·e (oui/non).");
      }
      const auMoinsUnCritere =
        !!(ap.ponctualite || ap.comprehensionConsignes || ap.qualiteTravail || ap.integration);
      if (!auMoinsUnCritere) {
        raisons.push("Évaluez au moins un critère d'appréciation (++, +, -, --).");
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
  // Apprenti : 7 questions textuelles
  const r = entretien.reponsesApprenti;
  const champsApprenti = [
    r.motivations,
    r.contactEntreprise,
    r.connaissanceEntreprise,
    r.metierVsRepresentation,
    r.difficultesDisciplines,
    r.difficultesAutres,
    r.ressenti,
  ];
  const apprentiPct = pourcentageRempli(champsApprenti);

  // Maître : 1 boolean + 3 textes + 4 critères + commentaires (optionnel)
  const m = entretien.reponsesMaitre;
  const ap = entretien.appreciationMaitre;
  const champsMaitre = [
    m.dejaFormeApprenti !== null ? '✓' : '',
    m.siOuiDiplomes,
    m.objectifsEmbauche,
    m.organisationAccueil,
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
