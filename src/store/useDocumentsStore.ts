import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DocumentAdministratif, Role } from '@/types';
import { documentsDemo } from '@/fixtures/documents-demo';
import { peutSupprimerDocument } from '@/lib/documents-administratifs';

/**
 * Store des documents administratifs nominatifs (10 juillet 2026 — demande
 * direction). Cf. `lib/documents-administratifs` pour les règles (visibilité
 * « réservé à l'apprenti·e », attestation obligatoire, verrou de suppression).
 *
 * ⚠ Maquette : les fichiers vivent en data-URL dans le localStorage (taille
 * plafonnée à l'import — `TAILLE_MAX_DOCUMENT_OCTETS`). Étape 2 : binaires
 * déportés sur Nuage (Nextcloud apps.education.fr) via WebDAV, le store ne
 * conservant qu'une référence (STACK_GRETA_LYON.md §3.4, TODO-etape-2.md).
 */

interface DepotDocumentInput {
  apprentiId: string;
  titre: string;
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
   * est faite côté UI. @returns l'id du document créé.
   */
  deposerDocument: (input: DepotDocumentInput) => string;

  /**
   * Attestation de prise de connaissance par l'apprenti·e (ressource
   * `documents.attester`) — signature manuscrite tactile, horodatée (R19),
   * sans retrait possible. No-op si le document est déjà attesté.
   */
  attesterDocument: (id: string, trace: string) => void;

  /**
   * Supprime un document non attesté (coordo / admin). Bloqué si l'apprenti·e
   * a signé (`peutSupprimerDocument` — acte engagé, esprit R21).
   * @returns true si supprimé, false si bloqué.
   */
  supprimerDocument: (id: string) => boolean;

  /** Réinitialise le store aux fixtures (utilisé par BoutonReinitialiserDemo). */
  reinitialiser: () => void;
}

// v1 — création du store (10 juillet 2026, demande direction) : 3 documents
//      de démo (Léa ×2 dont 1 réservé, Yanis ×1 non attesté).
const VERSION_SCHEMA = 1;

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
          titre: input.titre.trim(),
          deposeLe: new Date().toISOString(),
          attestation: { signe: false },
        };
        set({ documents: { ...get().documents, [id]: document } });
        return id;
      },

      attesterDocument: (id, trace) =>
        set((s) => {
          const document = s.documents[id];
          if (!document || document.attestation.signe) return s;
          return {
            documents: {
              ...s.documents,
              [id]: {
                ...document,
                attestation: {
                  signe: true,
                  dateSignature: new Date().toISOString(),
                  trace: trace || undefined,
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
