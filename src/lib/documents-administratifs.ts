import type {
  DocumentAdministratif,
  DocumentFormation,
  Role,
  TypeDocumentAdministratif,
} from '@/types';

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
export function documentsNonAttestes<T extends DocumentAdministratif>(
  documents: ReadonlyArray<T>,
): T[] {
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

/** Contrôles communs à tout dépôt : titre pour « autre », format, taille. */
function erreursDepotCommunes(depot: {
  type: TypeDocumentAdministratif;
  titre: string;
  mimeType: string;
  taille: number;
}): string[] {
  const erreurs: string[] = [];
  if (depot.type === 'autre' && depot.titre.trim().length === 0) {
    erreurs.push('Le titre du document est obligatoire pour un « Autre document ».');
  }
  if (!TYPES_DOCUMENT_AUTORISES.includes(depot.mimeType)) {
    erreurs.push('Format non pris en charge : déposez un PDF ou une image (JPEG, PNG).');
  }
  if (depot.taille > TAILLE_MAX_DOCUMENT_OCTETS) {
    erreurs.push(
      `Fichier trop volumineux : la taille est plafonnée à ${Math.round(TAILLE_MAX_DOCUMENT_OCTETS / 1024 / 1024)} Mo dans la maquette (stockage Nuage prévu en étape 2).`,
    );
  }
  return erreurs;
}

/**
 * Validation du dépôt NOMINATIF : titre exigé pour « autre » seulement, flag
 * « réservé » refusé hors « autre » (arbitrage 2026-07-13), type de fichier
 * et taille plafonnée.
 */
export function validerDepotDocument(depot: {
  type: TypeDocumentAdministratif;
  titre: string;
  nomFichier: string;
  mimeType: string;
  taille: number;
  reserveApprenti: boolean;
}): ResultatValidationDepot {
  const erreurs = erreursDepotCommunes(depot);
  if (depot.type !== 'autre' && depot.reserveApprenti) {
    erreurs.push(
      "Les 4 documents obligatoires sont visibles de tous les rôles du livret : seul un « Autre document » peut être réservé à l'apprenti·e.",
    );
  }
  return { ok: erreurs.length === 0, erreurs };
}

// ─────────────────────────────────────────────────────────────────────────────
// Documents au niveau formation (13 juillet 2026 — réunion DG, demande 4)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Types autorisés au dépôt EN MASSE (niveau formation) : tous SAUF le contrat
 * pédagogique, nominatif par nature (arbitrage 2026-07-13, demande 4). Jamais
 * de flag « réservé » en masse (document générique).
 */
export const TYPES_DOCUMENT_FORMATION: ReadonlyArray<TypeDocumentAdministratif> = [
  'protection-donnees',
  'droit-image',
  'reglement-interieur',
  'autre',
];

/**
 * Document effectif présenté à un·e apprenti·e : nominatif tel quel, ou
 * projection d'un document de formation (attestation/consultation de CET·TE
 * apprenti·e). `porteeFormation` distingue les mutations à router (store) et
 * l'affichage (badge « Document de la formation », pas de suppression depuis
 * la page apprenti·e).
 */
export interface DocumentApprentiEffectif extends DocumentAdministratif {
  porteeFormation?: boolean;
}

/** Projette un document de formation sur un·e apprenti·e donné·e. */
export function projeterDocumentFormation(
  document: DocumentFormation,
  apprentiId: string,
): DocumentApprentiEffectif {
  return {
    id: document.id,
    apprentiId,
    type: document.type,
    titre: document.titre,
    nomFichier: document.nomFichier,
    mimeType: document.mimeType,
    taille: document.taille,
    dataUrl: document.dataUrl,
    reserveApprenti: false,
    deposeParId: document.deposeParId,
    deposeParNom: document.deposeParNom,
    deposeParRole: document.deposeParRole,
    deposeLe: document.deposeLe,
    consulteParApprentiLe: document.consultations[apprentiId],
    attestation: document.attestations[apprentiId] ?? { attestee: false },
    porteeFormation: true,
  };
}

/**
 * Documents EFFECTIFS d'un·e apprenti·e, visibles par le rôle actif : ses
 * documents nominatifs (règle du flag « réservé ») + les documents de SA
 * formation projetés. **Le nominatif prime** : un document de formation d'un
 * type obligatoire est écarté si l'apprenti·e possède un nominatif du même
 * type (arbitrage 3, demande 4) ; les « autre » coexistent. Trié par date de
 * dépôt. C'est LA liste à utiliser partout (page, alertes, bandeaux, PDF).
 */
export function documentsEffectifsApprenti(
  nominatifs: ReadonlyArray<DocumentAdministratif>,
  documentsFormation: ReadonlyArray<DocumentFormation>,
  apprenti: { id: string; formationId?: string },
  role: Role,
): DocumentApprentiEffectif[] {
  const propres = documentsApprentiVisibles(nominatifs, apprenti.id, role);
  const typesNominatifs = new Set(propres.filter((d) => d.type !== 'autre').map((d) => d.type));
  const projetes = documentsFormation
    .filter(
      (d) =>
        d.formationId === apprenti.formationId &&
        (d.type === 'autre' || !typesNominatifs.has(d.type)),
    )
    .map((d) => projeterDocumentFormation(d, apprenti.id));
  return [...propres, ...projetes].sort((a, b) => a.deposeLe.localeCompare(b.deposeLe));
}

/**
 * Un document de formation devient insupprimable dès qu'UN·E apprenti·e a
 * attesté (esprit R21 — arbitrage 5, demande 4). On remplace en redéposant le
 * même type (les attestations de toute la promo repartent alors de zéro).
 */
export function peutSupprimerDocumentFormation(
  document: DocumentFormation,
): ResultatSuppressionDocument {
  if (Object.values(document.attestations).some((a) => a.attestee)) {
    return {
      ok: false,
      raison:
        'Suppression impossible : au moins un·e apprenti·e a attesté ce document (attestation engagée). Redéposez un document du même type si celui-ci est périmé — les attestations repartiront de zéro.',
    };
  }
  return { ok: true };
}

/**
 * Validation du dépôt AU NIVEAU FORMATION : contrat pédagogique refusé
 * (nominatif par nature), titre exigé pour « autre », format et taille.
 */
export function validerDepotDocumentFormation(depot: {
  type: TypeDocumentAdministratif;
  titre: string;
  nomFichier: string;
  mimeType: string;
  taille: number;
}): ResultatValidationDepot {
  const erreurs = erreursDepotCommunes(depot);
  if (depot.type === 'contrat-pedagogique') {
    erreurs.push(
      'Le contrat pédagogique est nominatif par nature : déposez-le apprenti·e par apprenti·e depuis la page Documents administratifs.',
    );
  }
  return { ok: erreurs.length === 0, erreurs };
}
