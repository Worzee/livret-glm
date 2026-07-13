import { estMineur } from './minorite';

/**
 * Responsables légaux d'un·e apprenti·e mineur·e (13 juillet 2026 — réunion
 * DG, demande 5). Validation partagée entre l'inscription manuelle
 * (`ModaleApprenti`) et l'import Excel (`lib/import-utilisateurs`).
 *
 * Arbitrages pilote :
 *   - 1 responsable minimum OBLIGATOIRE si l'apprenti·e est mineur·e
 *     (2 maximum) ; rien d'exigé pour un·e majeur·e ;
 *   - prénom, nom, email obligatoires (téléphone et lien de parenté
 *     optionnels) ;
 *   - email différent de celui de l'apprenti·e, distinct entre les 2
 *     responsables, unique par rapport aux autres utilisateurs — SAUF si
 *     l'email correspond à un responsable EXISTANT : même personne,
 *     rattachée au nouvel apprenti (fratrie).
 *
 * Pures fonctions — pas d'effet de bord.
 */

export interface SaisieResponsable {
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  lienParente?: string;
}

export interface ContexteValidationResponsables {
  /**
   * Emails des utilisateurs existants HORS responsables légaux (apprenti·e·s,
   * maîtres, formateurs, coordos, admins) — conflit interdit.
   */
  emailsAutresUtilisateurs: ReadonlyArray<string>;
  /**
   * Emails des responsables légaux existants — un email connu ici désigne la
   * MÊME personne (rattachement fratrie, pas une erreur).
   */
  emailsResponsablesExistants: ReadonlyArray<string>;
}

export interface ResultatValidationResponsables {
  ok: boolean;
  erreurs: string[];
}

const EMAIL_VALIDE = /^\S+@\S+\.\S+$/;

function normaliser(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Valide la saisie des responsables légaux d'un·e apprenti·e. `responsables`
 * ne contient que les blocs effectivement saisis (0 à 2) — c'est l'appelant
 * qui écarte les blocs entièrement vides.
 */
export function validerResponsablesLegaux(params: {
  emailApprenti: string;
  dateNaissance: string;
  responsables: ReadonlyArray<SaisieResponsable>;
  contexte: ContexteValidationResponsables;
  /** Date de référence de la minorité (défaut : maintenant). */
  reference?: Date;
}): ResultatValidationResponsables {
  const { emailApprenti, dateNaissance, responsables, contexte, reference } = params;
  const erreurs: string[] = [];
  const mineur = estMineur(dateNaissance, reference);

  if (mineur && responsables.length === 0) {
    erreurs.push(
      "L'apprenti·e est mineur·e : renseignez au moins un responsable légal (prénom, nom, email).",
    );
  }
  if (responsables.length > 2) {
    erreurs.push('Au maximum 2 responsables légaux par apprenti·e.');
  }

  const emailApprentiNorm = normaliser(emailApprenti);
  const autres = new Set(contexte.emailsAutresUtilisateurs.map(normaliser));
  const responsablesConnus = new Set(contexte.emailsResponsablesExistants.map(normaliser));
  const vus = new Set<string>();

  responsables.forEach((r, i) => {
    const position = `Responsable légal ${i + 1}`;
    if (!r.prenom.trim()) erreurs.push(`${position} : prénom obligatoire.`);
    if (!r.nom.trim()) erreurs.push(`${position} : nom obligatoire.`);
    const email = normaliser(r.email);
    if (!email || !EMAIL_VALIDE.test(email)) {
      erreurs.push(`${position} : email obligatoire et valide.`);
      return;
    }
    if (email === emailApprentiNorm) {
      erreurs.push(
        `${position} : l'email doit être différent de celui de l'apprenti·e (le responsable aura son propre compte).`,
      );
    }
    if (vus.has(email)) {
      erreurs.push('Les 2 responsables légaux doivent avoir des emails distincts.');
    }
    vus.add(email);
    // Rattachement fratrie : un email déjà connu comme RESPONSABLE est la
    // même personne — seul un conflit avec un autre type de compte bloque.
    if (autres.has(email) && !responsablesConnus.has(email)) {
      erreurs.push(
        `${position} : cet email est déjà utilisé par un autre compte (apprenti·e ou personnel).`,
      );
    }
  });

  return { ok: erreurs.length === 0, erreurs };
}
