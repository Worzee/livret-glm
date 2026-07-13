import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DocumentAdministratif, Role, TypeDocumentAdministratif } from '@/types';
import { documentsDemo } from '@/fixtures/documents-demo';
import { peutSupprimerDocument } from '@/lib/documents-administratifs';

/**
 * Store des documents administratifs nominatifs (10 juillet 2026 — demande
 * direction ; v2 le 13 juillet 2026 — réunion DG). Cf.
 * `lib/documents-administratifs` pour les règles (typologie 4 obligatoires +
 * « autre », visibilité « réservé », attestation après lecture, verrou de
 * suppression).
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

interface DocumentsStore {
  documents: Record<string, DocumentAdministratif>;

  /**
   * Dépose un document pour un·e apprenti·e (coordo / admin — ressource
   * `documents.gerer`). La validation du formulaire (`validerDepotDocument`)
   * est faite côté UI. Un type obligatoire déjà déposé est REMPLACÉ (même
   * attesté — l'attestation repart de zéro, arbitrage 2026-07-13) ; l'ancien
   * binaire est supprimé (budget localStorage — l'étape 2 archivera sur
   * Nuage). @returns l'id du document créé.
   */
  deposerDocument: (input: DepotDocumentInput) => string;

  /**
   * Trace la PREMIÈRE consultation du document par l'apprenti·e (« lu et
   * attesté », 13 juillet 2026) — prérequis de l'attestation. No-op si déjà
   * consulté.
   */
  marquerConsultationApprenti: (id: string) => void;

  /**
   * Attestation de prise de connaissance par l'apprenti·e (ressource
   * `documents.attester`) — confirmation horodatée sans signature manuscrite
   * (13 juillet 2026), sans retrait possible. No-op si le document est déjà
   * attesté ou n'a pas été consulté.
   */
  attesterDocument: (id: string) => void;

  /**
   * Supprime un document non attesté (coordo / admin). Bloqué si l'apprenti·e
   * a attesté (`peutSupprimerDocument` — acte engagé, esprit R21).
   * @returns true si supprimé, false si bloqué.
   */
  supprimerDocument: (id: string) => boolean;

  /** Réinitialise le store aux fixtures (utilisé par BoutonReinitialiserDemo). */
  reinitialiser: () => void;
}

// v1 — création du store (10 juillet 2026, demande direction) : 3 documents
//      de démo, attestation par signature manuscrite tactile.
// v2 — 13 juillet 2026 (réunion DG) : typologie (4 types obligatoires +
//      « autre »), attestation simple sans tracé conditionnée à la lecture
//      (`consulteParApprentiLe`), remplacement par type. Fixtures : 6
//      apprenti·e·s au dossier complet + cas de démo sur Léa et Yanis.
const VERSION_SCHEMA = 2;

function etatInitial(): Pick<DocumentsStore, 'documents'> {
  return {
    documents: Object.fromEntries(documentsDemo.map((d) => [d.id, d])),
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

      supprimerDocument: (id) => {
        const document = get().documents[id];
        if (!document) return false;
        if (!peutSupprimerDocument(document).ok) return false;
        const { [id]: _retire, ...sansLui } = get().documents;
        void _retire;
        set({ documents: sansLui });
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
