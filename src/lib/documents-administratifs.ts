import type { DocumentAdministratif, Role, TypeDocumentAdministratif } from '@/types';

/**
 * Documents administratifs nominatifs (10 juillet 2026 — demande direction ;
 * v2 le 13 juillet 2026 — réunion DG, arbitrages pilote) :
 *
 *   - déposés par la coordination (coordo / admin — ressource `documents.gerer`)
 *     pour UN·E apprenti·e, sous un type de la TYPOLOGIE : 4 types OBLIGATOIRES
 *     (contrat pédagogique, protection des données, droit à l'image, règlement
 *     intérieur) + « autre » (titre libre) ;
 *   - une **anomalie « document manquant »** remonte au coordo / admin tant
 *     qu'un type obligatoire n'est pas déposé (cf. `lib/alertes`) ;
 *   - consultables par tous les rôles ayant accès au livret, SAUF si le
 *     déposant a coché « réservé à l'apprenti·e » (type « autre » uniquement)
 *     → apprenti·e + coordo + admin (maître / tuteur et formateur exclus) ;
 *   - **attestation de prise de connaissance obligatoire** : confirmation
 *     simple horodatée (esprit R19), SANS signature manuscrite, possible
 *     uniquement APRÈS consultation du document (« lu et attesté »), sans
 *     retrait possible — rappelée dans le PDF de synthèse et suivie par le
 *     centre d'alertes ;
 *   - redéposer un type déjà déposé REMPLACE l'ancien document (attestation
 *     remise à zéro — géré par `useDocumentsStore`).
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

/**
 * Les 4 types de documents OBLIGATOIRES (13 juillet 2026 — réunion DG), dans
 * l'ordre d'affichage (liste déroulante, bandeau d'état, PDF de synthèse).
 */
export const TYPES_DOCUMENTS_OBLIGATOIRES: ReadonlyArray<TypeDocumentAdministratif> = [
  'contrat-pedagogique',
  'protection-donnees',
  'droit-image',
  'reglement-interieur',
];

/** Libellés officiels de la typologie (formulation de la direction). */
export const LIBELLES_TYPE_DOCUMENT: Record<TypeDocumentAdministratif, string> = {
  'contrat-pedagogique': 'Contrat pédagogique',
  'protection-donnees': 'Information relative à la protection des données',
  'droit-image': "Droit à l'image",
  'reglement-interieur': 'Accusé réception du règlement intérieur',
  autre: 'Autre document',
};

/**
 * Libellé affiché d'un document : celui de la typologie pour les 4 types
 * obligatoires, le titre saisi pour « autre » (filet : libellé générique).
 */
export function libelleDocument(document: DocumentAdministratif): string {
  if (document.type === 'autre') {
    return document.titre?.trim() || LIBELLES_TYPE_DOCUMENT.autre;
  }
  return LIBELLES_TYPE_DOCUMENT[document.type];
}

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
 * un acte engagé (esprit R21 — pas de retrait). Le coordo remplace un document
 * périmé en redéposant le même type (l'attestation repart alors de zéro).
 */
export function peutSupprimerDocument(
  document: DocumentAdministratif,
): ResultatSuppressionDocument {
  if (document.attestation.attestee) {
    return {
      ok: false,
      raison:
        "Suppression impossible : ce document a été attesté par l'apprenti·e (attestation engagée). Redéposez un document du même type si celui-ci est périmé — l'attestation repartira de zéro.",
    };
  }
  return { ok: true };
}

export interface ResultatAttestation {
  ok: boolean;
  raison?: string;
}

/**
 * « Lu et attesté » (13 juillet 2026) : l'attestation n'est possible qu'après
 * consultation du document par l'apprenti·e (`consulteParApprentiLe`), et une
 * seule fois (pas de retrait — esprit R21).
 */
export function peutAttesterDocument(document: DocumentAdministratif): ResultatAttestation {
  if (document.attestation.attestee) {
    return { ok: false, raison: 'Ce document est déjà attesté.' };
  }
  if (!document.consulteParApprentiLe) {
    return {
      ok: false,
      raison:
        "Consultez d'abord le document (bouton « Consulter ») : l'attestation confirme que vous l'avez lu.",
    };
  }
  return { ok: true };
}

/** Documents encore en attente de l'attestation de l'apprenti·e. */
export function documentsNonAttestes(
  documents: ReadonlyArray<DocumentAdministratif>,
): DocumentAdministratif[] {
  return documents.filter((d) => !d.attestation.attestee);
}

/**
 * Types obligatoires SANS document déposé pour l'apprenti·e — alimente
 * l'anomalie « document manquant » du centre d'alertes (coordo / admin).
 * @param documentsApprenti documents déjà filtrés sur UN·E apprenti·e.
 */
export function typesObligatoiresManquants(
  documentsApprenti: ReadonlyArray<DocumentAdministratif>,
): TypeDocumentAdministratif[] {
  const presents = new Set(documentsApprenti.map((d) => d.type));
  return TYPES_DOCUMENTS_OBLIGATOIRES.filter((type) => !presents.has(type));
}

export type EtatDocumentObligatoire = 'manquant' | 'a-attester' | 'atteste';

export interface EtatTypeObligatoire {
  type: TypeDocumentAdministratif;
  libelle: string;
  etat: EtatDocumentObligatoire;
  /** Document déposé pour ce type — absent quand `etat === 'manquant'`. */
  document?: DocumentAdministratif;
}

/**
 * État des 4 documents obligatoires d'un·e apprenti·e, dans l'ordre de la
 * typologie — bandeau d'état de la page et PDF de synthèse (13 juillet 2026).
 * @param documentsApprenti documents déjà filtrés sur UN·E apprenti·e.
 */
export function etatDocumentsObligatoires(
  documentsApprenti: ReadonlyArray<DocumentAdministratif>,
): EtatTypeObligatoire[] {
  return TYPES_DOCUMENTS_OBLIGATOIRES.map((type) => {
    const document = documentsApprenti.find((d) => d.type === type);
    return {
      type,
      libelle: LIBELLES_TYPE_DOCUMENT[type],
      etat: !document ? 'manquant' : document.attestation.attestee ? 'atteste' : 'a-attester',
      document,
    };
  });
}

export interface ResultatValidationDepot {
  ok: boolean;
  erreurs: string[];
}

/**
 * Validation du formulaire de dépôt : titre exigé pour « autre » seulement,
 * flag « réservé » refusé hors « autre » (arbitrage 2026-07-13), type de
 * fichier et taille plafonnée.
 */
export function validerDepotDocument(depot: {
  type: TypeDocumentAdministratif;
  titre: string;
  nomFichier: string;
  mimeType: string;
  taille: number;
  reserveApprenti: boolean;
}): ResultatValidationDepot {
  const erreurs: string[] = [];
  if (depot.type === 'autre' && depot.titre.trim().length === 0) {
    erreurs.push('Le titre du document est obligatoire pour un « Autre document ».');
  }
  if (depot.type !== 'autre' && depot.reserveApprenti) {
    erreurs.push(
      "Les 4 documents obligatoires sont visibles de tous les rôles du livret : seul un « Autre document » peut être réservé à l'apprenti·e.",
    );
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
