import type { Apprenti, EntretienTripartite, Role } from '@/types';

/**
 * Règles métier de l'entretien tripartite.
 * Référence : cahier des charges v1.3 §8.2 + refonte mai 2026 (chantier #2)
 * + juillet 2026 : l'entretien tripartite est **unique et obligatoire** (les
 * entretiens 2 à 4 ont été supprimés — le suivi ultérieur passe par les
 * fiches de suivi).
 *
 *   R6  : un seul entretien tripartite par livret
 *   R7  : l'entretien devrait avoir lieu dans les 60 jours suivant
 *         contratDebut → bandeau d'alerte ambre, NE PAS bloquer
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
 * - Pas d'alerte si l'entretien existe ET est signé par les 3 parties.
 * - Sinon, alerte dès que `today > contratDebut + 60 jours`.
 *
 * @param entretien L'entretien du livret (ou `null` si pas encore initialisé).
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
// Initialisation de l'entretien
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
 * L'entretien tripartite peut-il être initialisé ? R6 : un seul entretien
 * par livret — un entretien déjà initialisé ne l'est pas une seconde fois.
 */
export function peutInitialiserEntretien(
  entretien: EntretienTripartite | null,
): ResultatInitialisationEntretien {
  if (entretien !== null) {
    return { ok: false, raison: "L'entretien tripartite est déjà initialisé." };
  }
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation de signature pour l'entretien (parallèle de validation-signature.ts)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vérifie qu'un rôle peut signer l'entretien tripartite.
 *
 * Critères volontairement souples (différents de R20 sur les fiches de
 * période) car l'entretien est un acte de cadrage, pas une évaluation
 * périodique. La trame officielle (« première visite ») est co-saisie par le
 * formateur et le maître : l'apprenti·e et le formateur signent sans
 * exigence de saisie ; le maître doit avoir évalué au moins un critère
 * d'appréciation et choisi les attitudes à évaluer (juillet 2026 :
 * l'ÉVALUATION des attitudes a quitté l'entretien — elle se fait sur chaque
 * fiche de période entreprise ; l'entretien conserve le CHOIX).
 */
export function validerSignatureEntretien(
  entretien: EntretienTripartite,
  role: Role,
  /**
   * Ids des attitudes retenues pour le livret (13 juin 2026 — choisies à
   * l'entretien). Quand fourni et vide, le maître est orienté vers le CHOIX
   * des attitudes : la sélection alimente l'évaluation par période, la figer
   * vide priverait tout le suivi. Optionnel pour la rétrocompatibilité des
   * appels existants.
   */
  attitudesSelectionnees?: ReadonlyArray<string>,
): { peutSigner: boolean; raisons: string[] } {
  const raisons: string[] = [];

  if (role === 'coordo' || role === 'admin') {
    raisons.push("Ce rôle ne signe pas l'entretien tripartite.");
    return { peutSigner: false, raisons };
  }

  if (role === 'maitre') {
    // Refonte mai 2026 : on exige uniquement au moins un critère
    // d'appréciation.
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
    // 13 juin 2026 : les attitudes se CHOISISSENT à l'entretien — tant que la
    // sélection est vide, la signature du maître est bloquée (juillet 2026 :
    // l'évaluation, elle, se fait désormais sur les fiches de période).
    if (attitudesSelectionnees !== undefined && attitudesSelectionnees.length === 0) {
      raisons.push(
        "Choisissez les attitudes professionnelles à évaluer (section « Choix des attitudes » de l'entretien).",
      );
    }
  }

  // Apprenti·e et formateur : aucune exigence de saisie — la trame officielle
  // a retiré les démarches administratives (E1 « première visite ») et les
  // questions individuelles ont disparu avec la banque (juillet 2026).

  return { peutSigner: raisons.length === 0, raisons };
}
