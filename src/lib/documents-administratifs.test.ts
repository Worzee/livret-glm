import { describe, expect, it } from 'vitest';
import type { DocumentAdministratif } from '@/types';
import {
  documentsApprentiVisibles,
  documentsNonAttestes,
  peutConsulterDocument,
  peutSupprimerDocument,
  TAILLE_MAX_DOCUMENT_OCTETS,
  validerDepotDocument,
} from './documents-administratifs';

/**
 * Documents administratifs nominatifs (10 juillet 2026 — demande direction).
 * Arbitrages pilote : dépôt coordo/admin, visibilité tous rôles sauf flag
 * « réservé à l'apprenti·e » (→ apprenti + coordo + admin), attestation par
 * signature tactile de l'apprenti·e obligatoire.
 */

function doc(sur: Partial<DocumentAdministratif> = {}): DocumentAdministratif {
  return {
    id: 'doc-1',
    apprentiId: 'u-apprenti-lea',
    titre: 'Partie 1 — Engagements du livret',
    nomFichier: 'engagements.pdf',
    mimeType: 'application/pdf',
    taille: 12_345,
    dataUrl: 'data:application/pdf;base64,JVBERi0xLjQ=',
    reserveApprenti: false,
    deposeParId: 'u-coordo-martine',
    deposeParNom: 'Martine LEFÈVRE',
    deposeParRole: 'coordo',
    deposeLe: '2026-07-01T10:00:00.000Z',
    attestation: { signe: false },
    ...sur,
  };
}

describe('peutConsulterDocument', () => {
  it('un document non réservé est consultable par tous les rôles', () => {
    const d = doc();
    for (const role of ['apprenti', 'maitre', 'formateur', 'coordo', 'admin'] as const) {
      expect(peutConsulterDocument(role, d)).toBe(true);
    }
  });

  it("un document réservé n'est consultable que par l'apprenti·e, le coordo et l'admin", () => {
    const d = doc({ reserveApprenti: true });
    expect(peutConsulterDocument('apprenti', d)).toBe(true);
    expect(peutConsulterDocument('coordo', d)).toBe(true);
    expect(peutConsulterDocument('admin', d)).toBe(true);
    expect(peutConsulterDocument('maitre', d)).toBe(false);
    expect(peutConsulterDocument('formateur', d)).toBe(false);
  });
});

describe('documentsApprentiVisibles', () => {
  const docs = [
    doc({ id: 'd1', apprentiId: 'a1', deposeLe: '2026-07-02T10:00:00.000Z' }),
    doc({
      id: 'd2',
      apprentiId: 'a1',
      reserveApprenti: true,
      deposeLe: '2026-07-01T10:00:00.000Z',
    }),
    doc({ id: 'd3', apprentiId: 'a2' }),
  ];

  it('filtre par apprenti·e et par visibilité du rôle, trié par date de dépôt', () => {
    expect(documentsApprentiVisibles(docs, 'a1', 'formateur').map((d) => d.id)).toEqual(['d1']);
    expect(documentsApprentiVisibles(docs, 'a1', 'coordo').map((d) => d.id)).toEqual(['d2', 'd1']);
    expect(documentsApprentiVisibles(docs, 'a1', 'apprenti').map((d) => d.id)).toEqual([
      'd2',
      'd1',
    ]);
    expect(documentsApprentiVisibles(docs, 'a2', 'maitre').map((d) => d.id)).toEqual(['d3']);
  });
});

describe('peutSupprimerDocument', () => {
  it('un document non attesté est supprimable', () => {
    expect(peutSupprimerDocument(doc()).ok).toBe(true);
  });

  it("un document attesté par l'apprenti·e est insupprimable (acte engagé)", () => {
    const r = peutSupprimerDocument(
      doc({ attestation: { signe: true, dateSignature: '2026-07-02T10:00:00.000Z' } }),
    );
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(/attesté/i);
  });
});

describe('documentsNonAttestes', () => {
  it('liste les documents en attente de signature', () => {
    const docs = [
      doc({ id: 'd1' }),
      doc({ id: 'd2', attestation: { signe: true, dateSignature: '2026-07-02T10:00:00.000Z' } }),
    ];
    expect(documentsNonAttestes(docs).map((d) => d.id)).toEqual(['d1']);
  });
});

describe('validerDepotDocument', () => {
  const depotValide = {
    titre: 'Règlement intérieur',
    nomFichier: 'reglement.pdf',
    mimeType: 'application/pdf',
    taille: 100_000,
  };

  it('accepte un PDF ou une image sous le plafond de taille', () => {
    expect(validerDepotDocument(depotValide).ok).toBe(true);
    expect(validerDepotDocument({ ...depotValide, mimeType: 'image/jpeg' }).ok).toBe(true);
    expect(validerDepotDocument({ ...depotValide, mimeType: 'image/png' }).ok).toBe(true);
  });

  it('refuse un titre vide', () => {
    const r = validerDepotDocument({ ...depotValide, titre: '   ' });
    expect(r.ok).toBe(false);
    expect(r.erreurs.join(' ')).toMatch(/titre/i);
  });

  it('refuse un type de fichier non autorisé', () => {
    const r = validerDepotDocument({ ...depotValide, mimeType: 'application/zip' });
    expect(r.ok).toBe(false);
    expect(r.erreurs.join(' ')).toMatch(/PDF/i);
  });

  it('refuse un fichier au-delà du plafond (localStorage — étape 2 : Nuage)', () => {
    const r = validerDepotDocument({ ...depotValide, taille: TAILLE_MAX_DOCUMENT_OCTETS + 1 });
    expect(r.ok).toBe(false);
    expect(r.erreurs.join(' ')).toMatch(/taille|Mo/i);
  });

  it('cumule les erreurs', () => {
    const r = validerDepotDocument({
      titre: '',
      nomFichier: 'x.zip',
      mimeType: 'application/zip',
      taille: TAILLE_MAX_DOCUMENT_OCTETS + 1,
    });
    expect(r.ok).toBe(false);
    expect(r.erreurs).toHaveLength(3);
  });
});
