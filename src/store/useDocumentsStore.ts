import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  DocumentAdministratif,
  DocumentFormation,
  Role,
  TypeDocumentAdministratif,
} from '@/types';
import { documentsDemo, documentsFormationDemo } from '@/fixtures/documents-demo';
import {
  peutSupprimerDocument,
  peutSupprimerDocumentFormation,
} from '@/lib/documents-administratifs';

/**
 * Store des documents administratifs (10 juillet 2026 — demande direction ;
 * v2 puis v3 le 13 juillet 2026 — réunion DG). Deux portées :
 *
 *   - `documents` : documents NOMINATIFS, par apprenti·e ;
 *   - `documentsFormation` : documents déposés AU NIVEAU FORMATION (dépôt en
 *     masse — demande 4), stockés une fois, attestations individuelles
 *     indexées par apprenti·e.
 *
 * Cf. `lib/documents-administratifs` pour les règles (typologie, primauté du
 * nominatif, attestation après lecture, verrous de suppression).
 *
 * ⚠ Maquette : les fichiers vivent en data-URL dans le localStorage (taille
 * plafonnée à l'import — `TAILLE_MAX_DOCUMENT_OCTETS`). Étape 2 : binaires
 * déportés sur Nuage (Nextcloud apps.education.fr) via WebDAV, le store ne
 * conservant qu'une référence (STACK_GRETA_LYON.md §3.4, TODO-etape-2.md).
 */

interface DepotDocumentInput {
  apprentiId: string;
  /** Type de la typologie — le titre n'est saisi que pour « autre ». */
  type: TypeDocumentAdministratif;
  titre?: string;
  nomFichier: string;
  mimeType: string;
  taille: number;
  dataUrl: string;
  reserveApprenti: boolean;
  deposeParId: string;
  deposeParNom: string;
  deposeParRole: Role;
}

interface DepotDocumentFormationInput {
  formationId: string;
  /** Jamais `contrat-pedagogique` (validé par `validerDepotDocumentFormation`). */
  type: TypeDocumentAdministratif;
  titre?: string;
  nomFichier: string;
  mimeType: string;
  taille: number;
  dataUrl: string;
  deposeParId: string;
  deposeParNom: string;
  deposeParRole: Role;
}

interface DocumentsStore {
  documents: Record<string, DocumentAdministratif>;
  documentsFormation: Record<string, DocumentFormation>;

  /**
   * Dépose un document NOMINATIF pour un·e apprenti·e (coordo / admin —
   * ressource `documents.gerer`). La validation du formulaire
   * (`validerDepotDocument`) est faite côté UI. Un type obligatoire déjà
   * déposé est REMPLACÉ (même attesté — l'attestation repart de zéro,
   * arbitrage 2026-07-13) ; l'ancien binaire est supprimé (budget
   * localStorage — l'étape 2 archivera sur Nuage). @returns l'id créé.
   */
  deposerDocument: (input: DepotDocumentInput) => string;

  /**
   * Dépose un document AU NIVEAU FORMATION (dépôt en masse — demande 4,
   * 13 juillet 2026). Un type (≠ « autre ») déjà déposé pour la formation est
   * REMPLACÉ : toutes les attestations de la promo repartent de zéro.
   * @returns l'id créé.
   */
  deposerDocumentFormation: (input: DepotDocumentFormationInput) => string;

  /**
   * Trace la PREMIÈRE consultation du document par l'apprenti·e (« lu et
   * attesté », 13 juillet 2026) — prérequis de l'attestation. No-op si déjà
   * consulté.
   */
  marquerConsultationApprenti: (id: string) => void;

  /** Consultation d'un document de FORMATION par un·e apprenti·e. */
  marquerConsultationFormationApprenti: (id: string, apprentiId: string) => void;

  /**
   * Attestation de prise de connaissance par l'apprenti·e (ressource
   * `documents.attester`) — confirmation horodatée sans signature manuscrite
   * (13 juillet 2026), sans retrait possible. No-op si le document est déjà
   * attesté ou n'a pas été consulté.
   */
  attesterDocument: (id: string) => void;

  /** Attestation individuelle d'un document de FORMATION. */
  attesterDocumentFormation: (id: string, apprentiId: string) => void;

  /**
   * Supprime un document nominatif non attesté (coordo / admin). Bloqué si
   * l'apprenti·e a attesté (`peutSupprimerDocument` — acte engagé, esprit
   * R21). @returns true si supprimé, false si bloqué.
   */
  supprimerDocument: (id: string) => boolean;

  /**
   * Supprime un document de formation tant que PERSONNE n'a attesté
   * (`peutSupprimerDocumentFormation` — arbitrage 5, demande 4).
   * @returns true si supprimé, false si bloqué.
   */
  supprimerDocumentFormation: (id: string) => boolean;

  /** Réinitialise le store aux fixtures (utilisé par BoutonReinitialiserDemo). */
  reinitialiser: () => void;
}

// v1 — création du store (10 juillet 2026, demande direction) : 3 documents
//      de démo, attestation par signature manuscrite tactile.
// v2 — 13 juillet 2026 (réunion DG, demande 3) : typologie (4 types
//      obligatoires + « autre »), attestation simple sans tracé conditionnée
//      à la lecture (`consulteParApprentiLe`), remplacement par type.
// v3 — 13 juillet 2026 (réunion DG, demande 4) : documents AU NIVEAU
//      FORMATION (`documentsFormation` — dépôt en masse, attestations
//      individuelles indexées par apprenti·e). Fixtures : le règlement
//      intérieur devient un document de formation (CAP + BTS).
const VERSION_SCHEMA = 3;

function etatInitial(): Pick<DocumentsStore, 'documents' | 'documentsFormation'> {
  return {
    documents: Object.fromEntries(documentsDemo.map((d) => [d.id, d])),
    documentsFormation: Object.fromEntries(documentsFormationDemo.map((d) => [d.id, d])),
  };
}

export const useDocumentsStore = create<DocumentsStore>()(
  persist(
    (set, get) => ({
      ...etatInitial(),

      deposerDocument: (input) => {
        const id = `docadm-${crypto.randomUUID().slice(0, 8)}`;
        const document: DocumentAdministratif = {
          id,
          ...input,
          titre: input.type === 'autre' ? input.titre?.trim() : undefined,
          deposeLe: new Date().toISOString(),
          attestation: { attestee: false },
        };
        const documents = { ...get().documents };
        // Un seul document actif par type obligatoire : le nouveau dépôt
        // remplace l'ancien (attestation remise à zéro — arbitrage 2026-07-13).
        if (input.type !== 'autre') {
          for (const existant of Object.values(documents)) {
            if (existant.apprentiId === input.apprentiId && existant.type === input.type) {
              delete documents[existant.id];
            }
          }
        }
        documents[id] = document;
        set({ documents });
        return id;
      },

      deposerDocumentFormation: (input) => {
        const id = `docform-${crypto.randomUUID().slice(0, 8)}`;
        const document: DocumentFormation = {
          id,
          ...input,
          titre: input.type === 'autre' ? input.titre?.trim() : undefined,
          deposeLe: new Date().toISOString(),
          consultations: {},
          attestations: {},
        };
        const documentsFormation = { ...get().documentsFormation };
        // Remplacement par type pour la formation : les attestations de toute
        // la promo repartent de zéro (arbitrage 4, demande 4).
        if (input.type !== 'autre') {
          for (const existant of Object.values(documentsFormation)) {
            if (existant.formationId === input.formationId && existant.type === input.type) {
              delete documentsFormation[existant.id];
            }
          }
        }
        documentsFormation[id] = document;
        set({ documentsFormation });
        return id;
      },

      marquerConsultationApprenti: (id) =>
        set((s) => {
          const document = s.documents[id];
          if (!document || document.consulteParApprentiLe) return s;
          return {
            documents: {
              ...s.documents,
              [id]: { ...document, consulteParApprentiLe: new Date().toISOString() },
            },
          };
        }),

      marquerConsultationFormationApprenti: (id, apprentiId) =>
        set((s) => {
          const document = s.documentsFormation[id];
          if (!document || document.consultations[apprentiId]) return s;
          return {
            documentsFormation: {
              ...s.documentsFormation,
              [id]: {
                ...document,
                consultations: {
                  ...document.consultations,
                  [apprentiId]: new Date().toISOString(),
                },
              },
            },
          };
        }),

      attesterDocument: (id) =>
        set((s) => {
          const document = s.documents[id];
          if (!document || document.attestation.attestee || !document.consulteParApprentiLe) {
            return s;
          }
          return {
            documents: {
              ...s.documents,
              [id]: {
                ...document,
                attestation: { attestee: true, dateAttestation: new Date().toISOString() },
              },
            },
          };
        }),

      attesterDocumentFormation: (id, apprentiId) =>
        set((s) => {
          const document = s.documentsFormation[id];
          if (
            !document ||
            document.attestations[apprentiId]?.attestee ||
            !document.consultations[apprentiId]
          ) {
            return s;
          }
          return {
            documentsFormation: {
              ...s.documentsFormation,
              [id]: {
                ...document,
                attestations: {
                  ...document.attestations,
                  [apprentiId]: { attestee: true, dateAttestation: new Date().toISOString() },
                },
              },
            },
          };
        }),

      supprimerDocument: (id) => {
        const document = get().documents[id];
        if (!document) return false;
        if (!peutSupprimerDocument(document).ok) return false;
        const { [id]: _retire, ...sansLui } = get().documents;
        void _retire;
        set({ documents: sansLui });
        return true;
      },

      supprimerDocumentFormation: (id) => {
        const document = get().documentsFormation[id];
        if (!document) return false;
        if (!peutSupprimerDocumentFormation(document).ok) return false;
        const { [id]: _retire, ...sansLui } = get().documentsFormation;
        void _retire;
        set({ documentsFormation: sansLui });
        return true;
      },

      reinitialiser: () => set(etatInitial()),
    }),
    {
      name: 'livret-documents',
      version: VERSION_SCHEMA,
      // Migration en cas de bump : reset aux fixtures (stratégie générale).
      migrate: () => etatInitial(),
    },
  ),
);
