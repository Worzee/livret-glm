import type { DocumentAdministratif, Role } from '@/types';

/**
 * Documents administratifs nominatifs (10 juillet 2026 — demande direction,
 * arbitrages pilote de la session de cadrage) :
 *
 *   - déposés par la coordination (coordo / admin — ressource `documents.gerer`)
 *     pour UN·E apprenti·e (documents nominatifs : engagements de la partie 1
 *     du livret papier, convention, règlement…) ;
 *   - consultables par tous les rôles ayant accès au livret, SAUF si le
 *     déposant a coché « réservé à l'apprenti·e » → apprenti·e + coordo +
 *     admin uniquement (maître / tuteur et formateur référent exclus) ;
 *   - **attestation de prise de connaissance obligatoire** : signature
 *     manuscrite tactile de l'apprenti·e (ressource `documents.attester`),
 *     document par document, horodatée (R19), sans retrait possible —
 *     rappelée dans le PDF de synthèse et suivie par le centre d'alertes.
 *
 * ⚠ Maquette : le binaire vit en data-URL (localStorage) — d'où le plafond de
 * taille. Étape 2 : stockage Nuage (Nextcloud apps.education.fr) via WebDAV,
 * cf. STACK_GRETA_LYON.md §3.4.
 *
 * Pures fonctions — pas d'effet de bord.
 */

/** Rôles autorisés à consulter un document « réservé à l'apprenti·e ». */
const ROLES_DOCUMENT_RESERVE: ReadonlyArray<Role> = ['apprenti', 'coordo', 'admin'];

/** Plafond de taille d'un fichier déposé (maquette localStorage : 2 Mo). */
export const TAILLE_MAX_DOCUMENT_OCTETS = 2 * 1024 * 1024;

/** Types de fichiers acceptés au dépôt (PDF + images de scans). */
export const TYPES_DOCUMENT_AUTORISES: ReadonlyArray<string> = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

/** Le rôle peut-il consulter ce document (règle du flag « réservé ») ? */
export function peutConsulterDocument(role: Role, document: DocumentAdministratif): boolean {
  if (!document.reserveApprenti) return true;
  return ROLES_DOCUMENT_RESERVE.includes(role);
}

/**
 * Documents d'un·e apprenti·e visibles par le rôle actif, du plus ancien au
 * plus récent dépôt (ordre de lecture naturel de la « partie 1 »).
 */
export function documentsApprentiVisibles(
  documents: ReadonlyArray<DocumentAdministratif>,
  apprentiId: string,
  role: Role,
): DocumentAdministratif[] {
  return documents
    .filter((d) => d.apprentiId === apprentiId && peutConsulterDocument(role, d))
    .sort((a, b) => a.deposeLe.localeCompare(b.deposeLe));
}

export interface ResultatSuppressionDocument {
  ok: boolean;
  raison?: string;
}

/**
 * Un document attesté par l'apprenti·e est insupprimable : l'attestation est
 * un acte engagé (esprit R21 — pas de « dé-signature »). Le coordo remplace
 * un document périmé en en déposant un nouveau.
 */
export function peutSupprimerDocument(
  document: DocumentAdministratif,
): ResultatSuppressionDocument {
  if (document.attestation.signe) {
    return {
      ok: false,
      raison:
        "Suppression impossible : ce document a été attesté par l'apprenti·e (signature engagée). Déposez un nouveau document si celui-ci est périmé.",
    };
  }
  return { ok: true };
}

/** Documents encore en attente de la signature de l'apprenti·e. */
export function documentsNonAttestes(
  documents: ReadonlyArray<DocumentAdministratif>,
): DocumentAdministratif[] {
  return documents.filter((d) => !d.attestation.signe);
}

export interface ResultatValidationDepot {
  ok: boolean;
  erreurs: string[];
}

/** Validation du formulaire de dépôt (titre, type de fichier, taille). */
export function validerDepotDocument(depot: {
  titre: string;
  nomFichier: string;
  mimeType: string;
  taille: number;
}): ResultatValidationDepot {
  const erreurs: string[] = [];
  if (depot.titre.trim().length === 0) {
    erreurs.push('Le titre du document est obligatoire.');
  }
  if (!TYPES_DOCUMENT_AUTORISES.includes(depot.mimeType)) {
    erreurs.push('Format non pris en charge : déposez un PDF ou une image (JPEG, PNG).');
  }
  if (depot.taille > TAILLE_MAX_DOCUMENT_OCTETS) {
    erreurs.push(
      `Fichier trop volumineux : la taille est plafonnée à ${Math.round(TAILLE_MAX_DOCUMENT_OCTETS / 1024 / 1024)} Mo dans la maquette (stockage Nuage prévu en étape 2).`,
    );
  }
  return { ok: erreurs.length === 0, erreurs };
}
