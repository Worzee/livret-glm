import type { Apprenti, Formateur, Maitre } from '@/types';
import type { ModeleXlsx } from './generer-xlsx-modele';
import { parserXlsxBuffer } from './parser-xlsx';
import { validerResponsablesLegaux, type SaisieResponsable } from './responsables-legaux';

/**
 * Import par lot d'utilisateur·rice·s depuis un fichier Excel.
 *
 * Périmètre (mai 2026) — 3 types supportés :
 *   - Apprenti·e   : identité + dates de contrat (les rattachements
 *                    formation / maître / formateur se font ensuite via
 *                    /admin/affectations) + responsables légaux si MINEUR·E
 *                    (13 juillet 2026 — demande 5 : colonnes « resp. légal »
 *                    OPTIONNELLES dans l'en-tête, mais 1 responsable exigé
 *                    dès que la date de naissance donne un·e mineur·e)
 *   - Maître       : identité + entreprise + fonction (cohérent avec la
 *                    modale création maître, cf. chantier #4)
 *   - Formateur·rice : identité seule
 *
 * Politique d'import (validée pilote) :
 *   - **Refus total dès la moindre erreur** : si une seule ligne ne passe
 *     pas, l'import entier est rejeté. L'admin corrige le fichier puis
 *     re-tente.
 *   - **Doublons (email existant)** : traités comme erreur bloquante — SAUF
 *     l'email d'un responsable légal déjà connu (rattachement fratrie).
 *   - **Lignes vides** : ignorées (au cas où l'utilisateur·rice laisse
 *     des séparateurs de ligne en fin de fichier).
 */

export type TypeImport = 'apprenti' | 'maitre' | 'formateur';

// ─────────────────────────────────────────────────────────────────────────────
// Modèles téléchargeables (en-têtes + lignes d'exemple)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colonnes OBLIGATOIRES de l'en-tête apprenti — les 10 colonnes
 * « responsable légal » du modèle sont optionnelles (un fichier sans elles
 * reste importable tant qu'il ne contient que des majeur·e·s).
 */
const ENTETES_REQUISES_APPRENTI = [
  'Prénom',
  'Nom',
  'Email',
  'Date de naissance',
  'Début de contrat',
  'Fin de contrat',
];

export const MODELES: Record<TypeImport, ModeleXlsx> = {
  apprenti: {
    entetes: [
      ...ENTETES_REQUISES_APPRENTI,
      // Responsables légaux (13 juillet 2026 — demande 5) : obligatoires
      // seulement pour les apprenti·e·s mineur·e·s (1 minimum, 2 maximum).
      'Prénom resp. légal 1',
      'Nom resp. légal 1',
      'Email resp. légal 1',
      'Téléphone resp. légal 1',
      'Lien resp. légal 1',
      'Prénom resp. légal 2',
      'Nom resp. légal 2',
      'Email resp. légal 2',
      'Téléphone resp. légal 2',
      'Lien resp. légal 2',
    ],
    // Colonnes 3, 4, 5 = dates → formatées en cellules date Excel
    // (numFmt yyyy-mm-dd). Évite les saisies texte ambiguës type
    // « 20/01/1988 » qui ne passeraient pas la validation ISO.
    colonnesDate: [3, 4, 5],
    exemples: [
      // Majeur·e·s : colonnes responsables laissées vides.
      // prettier-ignore
      ['Léa', 'MARTIN', 'lea.martin@demo.fr', '2007-04-15', '2025-09-02', '2027-09-01', '', '', '', '', '', '', '', '', '', ''],
      // prettier-ignore
      ['Théo', 'DUBOIS', 'theo.dubois@demo.fr', '2006-11-23', '2025-09-02', '2027-09-01', '', '', '', '', '', '', '', '', '', ''],
      // Mineur·e : au moins le responsable légal 1 (prénom, nom, email).
      // prettier-ignore
      ['Nadia', 'SAADI', 'nadia.saadi@demo.fr', '2009-01-20', '2025-09-02', '2027-09-01', 'Yasmina', 'SAADI', 'yasmina.saadi@demo.fr', '06 12 34 56 78', 'Mère', '', '', '', '', ''],
    ],
  },
  maitre: {
    entetes: ['Prénom', 'Nom', 'Email', 'Entreprise', 'Fonction'],
    exemples: [
      ['Karim', 'BENALI', 'karim.benali@gourmet.demo', 'Restaurant Le Gourmet', 'Chef de cuisine'],
    ],
  },
  formateur: {
    entetes: ['Prénom', 'Nom', 'Email'],
    exemples: [['Sophie', 'DUBOIS', 'sophie.dubois@greta-demo.fr']],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Types des lignes parsées + valides
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Données parsées pour un·e apprenti·e (sans rattachements — affectation
 * post-import). `responsables` : responsables légaux saisis (0 à 2 — au
 * moins 1 pour un·e mineur·e, demande 5), créés / rattachés à l'insertion
 * via `enregistrerResponsablesApprenti`.
 */
export type LigneApprentiValide = Pick<
  Apprenti,
  'prenom' | 'nom' | 'email' | 'dateNaissance' | 'contratDebut' | 'contratFin'
> & { responsables: SaisieResponsable[] };

/** Données parsées pour un maître d'apprentissage. */
export type LigneMaitreValide = Pick<
  Maitre,
  'prenom' | 'nom' | 'email' | 'entreprise' | 'fonction'
>;

/** Données parsées pour un formateur référent. */
export type LigneFormateurValide = Pick<Formateur, 'prenom' | 'nom' | 'email'>;

export type LigneValide<T extends TypeImport> = T extends 'apprenti'
  ? LigneApprentiValide
  : T extends 'maitre'
    ? LigneMaitreValide
    : LigneFormateurValide;

/**
 * Erreur portant sur une ligne donnée (1-based incluant la ligne d'en-tête,
 * comme dans l'interface Excel).
 */
export interface ErreurLigne {
  /** Index de la ligne dans le fichier source (1 = en-tête, 2 = 1ʳᵉ donnée). */
  ligne: number;
  /** Nom de la colonne fautive, ou `null` si l'erreur porte sur toute la ligne. */
  colonne: string | null;
  /** Message lisible pour l'admin. */
  message: string;
}

export interface RapportImport<T extends TypeImport> {
  /** Type d'import effectué. */
  type: T;
  /** Lignes valides prêtes à être insérées (vides si erreurs présentes). */
  lignes: LigneValide<T>[];
  /** Liste exhaustive des erreurs détectées. */
  erreurs: ErreurLigne[];
  /**
   * `true` si aucune erreur — l'admin peut alors déclencher l'import effectif.
   * Refonte mai 2026 : politique stricte (refus complet si moindre erreur).
   */
  ok: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline d'import
// ─────────────────────────────────────────────────────────────────────────────

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse un fichier XLSX et valide chaque ligne. Le résultat est purement
 * **descriptif** — aucune mutation de store n'a lieu, c'est à l'appelant
 * de décider d'insérer les lignes via `useUtilisateursStore.ajouterXxx`
 * une fois `rapport.ok === true`.
 *
 * @param buffer            Contenu binaire du fichier .xlsx.
 * @param type              Type d'utilisateur·rice à importer.
 * @param emailsExistants   Emails déjà présents dans le store (toutes
 *                          catégories confondues — la collision est globale).
 * @param emailsResponsablesExistants  Emails des responsables légaux déjà
 *                          connus (13 juillet 2026 — un email de responsable
 *                          connu = même personne, rattachement fratrie).
 */
export function importerDepuisXlsx<T extends TypeImport>(
  buffer: ArrayBuffer,
  type: T,
  emailsExistants: ReadonlySet<string>,
  emailsResponsablesExistants: ReadonlySet<string> = new Set(),
): RapportImport<T> {
  let lignesBrutes: string[][];
  try {
    lignesBrutes = parserXlsxBuffer(buffer);
  } catch (e) {
    return {
      type,
      lignes: [],
      erreurs: [
        {
          ligne: 0,
          colonne: null,
          message: `Le fichier ne semble pas être un XLSX valide : ${(e as Error).message}`,
        },
      ],
      ok: false,
    };
  }

  // En-tête apprenti : seules les 6 colonnes de base sont exigées — les
  // colonnes « resp. légal » du modèle sont optionnelles (demande 5).
  const entetesRequises = type === 'apprenti' ? ENTETES_REQUISES_APPRENTI : MODELES[type].entetes;
  return validerLignes(
    lignesBrutes,
    type,
    entetesRequises,
    emailsExistants,
    emailsResponsablesExistants,
  );
}

function validerLignes<T extends TypeImport>(
  lignesBrutes: string[][],
  type: T,
  entetesAttendues: string[],
  emailsExistants: ReadonlySet<string>,
  emailsResponsablesExistants: ReadonlySet<string>,
): RapportImport<T> {
  const erreurs: ErreurLigne[] = [];

  if (lignesBrutes.length === 0) {
    erreurs.push({
      ligne: 0,
      colonne: null,
      message: 'Le fichier est vide : aucune ligne détectée.',
    });
    return { type, lignes: [], erreurs, ok: false };
  }

  // Validation de l'en-tête : chaque colonne attendue doit être présente,
  // mais l'utilisateur·rice peut ajouter des colonnes supplémentaires
  // (ignorées) et la casse / les accents doivent matcher exactement (le
  // modèle est téléchargeable, il n'y a pas de raison de bricoler).
  const entetesReelles = lignesBrutes[0].map((s) => s.trim());
  for (const attendue of entetesAttendues) {
    if (!entetesReelles.includes(attendue)) {
      erreurs.push({
        ligne: 1,
        colonne: attendue,
        message: `Colonne « ${attendue} » manquante dans l'en-tête.`,
      });
    }
  }
  if (erreurs.length > 0) {
    return { type, lignes: [], erreurs, ok: false };
  }

  const indexPar = (col: string) => entetesReelles.indexOf(col);

  // ── Validation ligne par ligne ────────────────────────────────────────
  const lignesValides: LigneValide<T>[] = [];
  const emailsDejaVusDansFichier = new Set<string>();

  for (let i = 1; i < lignesBrutes.length; i++) {
    const numLigne = i + 1; // 1-based incluant l'en-tête → 2 = 1ʳᵉ ligne de données
    const cells = lignesBrutes[i];

    // Ligne vide → on saute (cas typique : ligne fantôme en fin de fichier
    // créée par Excel quand on appuie sur Entrée par mégarde).
    if (cells.every((c) => !c?.trim())) continue;

    const lit = (col: string): string => (cells[indexPar(col)] ?? '').trim();

    // Champs communs aux 3 types
    const prenom = lit('Prénom');
    const nom = lit('Nom');
    const email = lit('Email');

    if (!prenom) {
      erreurs.push({ ligne: numLigne, colonne: 'Prénom', message: 'Prénom obligatoire.' });
    }
    if (!nom) {
      erreurs.push({ ligne: numLigne, colonne: 'Nom', message: 'Nom obligatoire.' });
    }
    if (!email) {
      erreurs.push({ ligne: numLigne, colonne: 'Email', message: 'Email obligatoire.' });
    } else if (!REGEX_EMAIL.test(email)) {
      erreurs.push({
        ligne: numLigne,
        colonne: 'Email',
        message: `Format d'email invalide : « ${email} ».`,
      });
    } else {
      if (emailsExistants.has(email.toLowerCase())) {
        erreurs.push({
          ligne: numLigne,
          colonne: 'Email',
          message: `L'email « ${email} » est déjà utilisé par un compte existant.`,
        });
      }
      if (emailsDejaVusDansFichier.has(email.toLowerCase())) {
        erreurs.push({
          ligne: numLigne,
          colonne: 'Email',
          message: `L'email « ${email} » apparaît plusieurs fois dans le fichier.`,
        });
      }
      emailsDejaVusDansFichier.add(email.toLowerCase());
    }

    // ── Champs spécifiques par type ────────────────────────────────────
    if (type === 'apprenti') {
      // Normalisation préalable : si la cellule Excel est au format date,
      // le parser retourne un nombre serial. On le convertit en ISO avant
      // validation pour que l'utilisateur·rice puisse soit taper en texte
      // ISO soit utiliser les cellules date du modèle généré (les deux
      // marchent indifféremment).
      const dateNaissance = normaliserDate(lit('Date de naissance'));
      const contratDebut = normaliserDate(lit('Début de contrat'));
      const contratFin = normaliserDate(lit('Fin de contrat'));
      verifierDateIso(numLigne, 'Date de naissance', dateNaissance, erreurs);
      verifierDateIso(numLigne, 'Début de contrat', contratDebut, erreurs);
      verifierDateIso(numLigne, 'Fin de contrat', contratFin, erreurs);
      if (
        REGEX_DATE_ISO.test(contratDebut) &&
        REGEX_DATE_ISO.test(contratFin) &&
        contratFin <= contratDebut
      ) {
        erreurs.push({
          ligne: numLigne,
          colonne: 'Fin de contrat',
          message: 'La fin de contrat doit être strictement postérieure au début (R2).',
        });
      }

      // Responsables légaux (demande 5) : blocs saisis (prénom, nom ou email
      // renseigné) — 1 minimum exigé si la date de naissance donne un·e
      // MINEUR·E, emails différents de l'apprenti·e et uniques (sauf
      // responsable déjà connu — fratrie).
      const responsables: SaisieResponsable[] = [1, 2]
        .map((n) => ({
          prenom: lit(`Prénom resp. légal ${n}`),
          nom: lit(`Nom resp. légal ${n}`),
          email: lit(`Email resp. légal ${n}`),
          telephone: lit(`Téléphone resp. légal ${n}`) || undefined,
          lienParente: lit(`Lien resp. légal ${n}`) || undefined,
        }))
        .filter((r) => `${r.prenom}${r.nom}${r.email}`.trim() !== '');
      if (REGEX_DATE_ISO.test(dateNaissance)) {
        const vr = validerResponsablesLegaux({
          emailApprenti: email,
          dateNaissance,
          responsables,
          contexte: {
            emailsAutresUtilisateurs: [...emailsExistants],
            emailsResponsablesExistants: [...emailsResponsablesExistants],
          },
        });
        for (const message of vr.erreurs) {
          erreurs.push({ ligne: numLigne, colonne: 'Responsables légaux', message });
        }
      }

      // On ne pousse la ligne dans `lignesValides` que si tous ses champs
      // sont OK (sinon on accumule juste les erreurs).
      const erreursAvantPush = erreurs.filter((e) => e.ligne === numLigne).length;
      if (erreursAvantPush === 0) {
        lignesValides.push({
          prenom,
          nom: nom.toUpperCase(),
          email,
          dateNaissance,
          contratDebut,
          contratFin,
          responsables,
        } as LigneValide<T>);
      }
    } else if (type === 'maitre') {
      const entreprise = lit('Entreprise');
      const fonction = lit('Fonction');
      if (!entreprise) {
        erreurs.push({
          ligne: numLigne,
          colonne: 'Entreprise',
          message: 'Entreprise obligatoire pour un maître.',
        });
      }
      if (!fonction) {
        erreurs.push({
          ligne: numLigne,
          colonne: 'Fonction',
          message: 'Fonction obligatoire pour un maître.',
        });
      }
      const erreursAvantPush = erreurs.filter((e) => e.ligne === numLigne).length;
      if (erreursAvantPush === 0) {
        lignesValides.push({
          prenom,
          nom: nom.toUpperCase(),
          email,
          entreprise,
          fonction,
        } as LigneValide<T>);
      }
    } else if (type === 'formateur') {
      const erreursAvantPush = erreurs.filter((e) => e.ligne === numLigne).length;
      if (erreursAvantPush === 0) {
        lignesValides.push({
          prenom,
          nom: nom.toUpperCase(),
          email,
        } as LigneValide<T>);
      }
    }
  }

  if (lignesValides.length === 0 && erreurs.length === 0) {
    erreurs.push({
      ligne: 0,
      colonne: null,
      message: "Aucune ligne de donnée à importer (le fichier ne contient que l'en-tête).",
    });
  }

  return {
    type,
    // Si on a la moindre erreur, on n'expose pas les lignes valides : la
    // politique d'import est « tout-ou-rien » (validée pilote).
    lignes: erreurs.length === 0 ? lignesValides : [],
    erreurs,
    ok: erreurs.length === 0 && lignesValides.length > 0,
  };
}

/**
 * Convertit une valeur de cellule potentiellement au format date Excel
 * (nombre serial = jours depuis 1900-01-00) en ISO `YYYY-MM-DD`. Si la
 * valeur ne ressemble pas à un serial Excel raisonnable, on la retourne
 * telle quelle (l'appelant validera ensuite avec `verifierDateIso`).
 *
 * Plage acceptée : 1000 (≈ 1902-09-27) à 60000 (≈ 2064-04-22) — assez
 * large pour couvrir tout cas d'usage métier, assez étroite pour
 * disqualifier les codes postaux français (qui commencent souvent à
 * 60xxx-69xxx).
 */
export function normaliserDate(valeur: string): string {
  if (!valeur) return '';
  // Déjà au format ISO ? On ne touche à rien.
  if (REGEX_DATE_ISO.test(valeur)) return valeur;
  // Numérique pur sans signe ni décimale → tenter conversion serial Excel.
  if (/^\d+$/.test(valeur)) {
    const serial = parseInt(valeur, 10);
    if (serial >= 1000 && serial <= 60000) {
      // 25569 = 1970-01-01 ; on retire 1 jour pour le bug Excel 1900.
      const ms = (serial - 25569) * 86_400_000;
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime())) {
        return d.toISOString().slice(0, 10);
      }
    }
  }
  return valeur;
}

function verifierDateIso(
  ligne: number,
  colonne: string,
  valeur: string,
  erreurs: ErreurLigne[],
): void {
  if (!valeur) {
    erreurs.push({ ligne, colonne, message: `${colonne} obligatoire.` });
    return;
  }
  if (!REGEX_DATE_ISO.test(valeur)) {
    erreurs.push({
      ligne,
      colonne,
      message: `${colonne} attendue au format AAAA-MM-JJ (reçu : « ${valeur} »).`,
    });
    return;
  }
  // Vérification que la date est réellement valide (rejette 2025-02-30)
  const d = new Date(valeur);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== valeur) {
    erreurs.push({
      ligne,
      colonne,
      message: `${colonne} : date invalide « ${valeur} ».`,
    });
  }
}
