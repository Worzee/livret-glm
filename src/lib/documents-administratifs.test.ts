import { describe, expect, it } from 'vitest';
import type { DocumentAdministratif } from '@/types';
import {
  documentsApprentiVisibles,
  documentsNonAttestes,
  etatDocumentsObligatoires,
  libelleDocument,
  LIBELLES_TYPE_DOCUMENT,
  peutAttesterDocument,
  peutConsulterDocument,
  peutSupprimerDocument,
  TAILLE_MAX_DOCUMENT_OCTETS,
  TYPES_DOCUMENTS_OBLIGATOIRES,
  typesObligatoiresManquants,
  validerDepotDocument,
} from './documents-administratifs';

/**
 * Documents administratifs nominatifs (10 juillet 2026 — demande direction ;
 * v2 le 13 juillet 2026 — réunion DG). Arbitrages : typologie de 4 documents
 * OBLIGATOIRES + « autre » (titre libre, seul type acceptant le flag
 * « réservé »), attestation simple horodatée SANS signature manuscrite,
 * possible uniquement après lecture (`consulteParApprentiLe`), remplacement
 * par type avec attestation remise à zéro.
 */

function doc(sur: Partial<DocumentAdministratif> = {}): DocumentAdministratif {
  return {
    id: 'doc-1',
    apprentiId: 'u-apprenti-lea',
    type: 'contrat-pedagogique',
    nomFichier: 'contrat.pdf',
    mimeType: 'application/pdf',
    taille: 12_345,
    dataUrl: 'data:application/pdf;base64,JVBERi0xLjQ=',
    reserveApprenti: false,
    deposeParId: 'u-coordo-martine',
    deposeParNom: 'Martine LEFÈVRE',
    deposeParRole: 'coordo',
    deposeLe: '2026-07-01T10:00:00.000Z',
    attestation: { attestee: false },
    ...sur,
  };
}

describe('typologie des documents', () => {
  it('expose 4 types obligatoires distincts, hors « autre »', () => {
    expect(TYPES_DOCUMENTS_OBLIGATOIRES).toEqual([
      'contrat-pedagogique',
      'protection-donnees',
      'droit-image',
      'reglement-interieur',
    ]);
    expect(TYPES_DOCUMENTS_OBLIGATOIRES).not.toContain('autre');
  });

  it('libelleDocument : libellé de la typologie pour les 4 types, titre saisi pour « autre »', () => {
    expect(libelleDocument(doc())).toBe('Contrat pédagogique');
    expect(libelleDocument(doc({ type: 'protection-donnees' }))).toBe(
      'Information relative à la protection des données',
    );
    expect(libelleDocument(doc({ type: 'droit-image' }))).toBe("Droit à l'image");
    expect(libelleDocument(doc({ type: 'reglement-interieur' }))).toBe(
      'Accusé réception du règlement intérieur',
    );
    expect(libelleDocument(doc({ type: 'autre', titre: 'Convention nominative' }))).toBe(
      'Convention nominative',
    );
    // Filet : « autre » sans titre retombe sur le libellé générique.
    expect(libelleDocument(doc({ type: 'autre' }))).toBe(LIBELLES_TYPE_DOCUMENT.autre);
  });
});

describe('peutConsulterDocument', () => {
  it('un document non réservé est consultable par tous les rôles', () => {
    const d = doc();
    for (const role of ['apprenti', 'maitre', 'formateur', 'coordo', 'admin'] as const) {
      expect(peutConsulterDocument(role, d)).toBe(true);
    }
  });

  it("un document réservé n'est consultable que par l'apprenti·e, le coordo et l'admin", () => {
    const d = doc({ type: 'autre', titre: 'Convention', reserveApprenti: true });
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
      type: 'autre',
      titre: 'Convention',
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
      doc({
        consulteParApprentiLe: '2026-07-02T09:00:00.000Z',
        attestation: { attestee: true, dateAttestation: '2026-07-02T10:00:00.000Z' },
      }),
    );
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(/attesté/i);
  });
});

describe('peutAttesterDocument — « lu et attesté » (13 juillet 2026)', () => {
  it("refuse tant que l'apprenti·e n'a pas consulté le document", () => {
    const r = peutAttesterDocument(doc());
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(/consultez/i);
  });

  it('accepte après consultation', () => {
    expect(
      peutAttesterDocument(doc({ consulteParApprentiLe: '2026-07-02T09:00:00.000Z' })).ok,
    ).toBe(true);
  });

  it('refuse un document déjà attesté', () => {
    const r = peutAttesterDocument(
      doc({
        consulteParApprentiLe: '2026-07-02T09:00:00.000Z',
        attestation: { attestee: true, dateAttestation: '2026-07-02T10:00:00.000Z' },
      }),
    );
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(/déjà attesté/i);
  });
});

describe('documentsNonAttestes', () => {
  it("liste les documents en attente de l'attestation", () => {
    const docs = [
      doc({ id: 'd1' }),
      doc({
        id: 'd2',
        consulteParApprentiLe: '2026-07-02T09:00:00.000Z',
        attestation: { attestee: true, dateAttestation: '2026-07-02T10:00:00.000Z' },
      }),
    ];
    expect(documentsNonAttestes(docs).map((d) => d.id)).toEqual(['d1']);
  });
});

describe('typesObligatoiresManquants — anomalie de dépôt (13 juillet 2026)', () => {
  it("liste les 4 types quand rien n'est déposé", () => {
    expect(typesObligatoiresManquants([])).toEqual(TYPES_DOCUMENTS_OBLIGATOIRES);
  });

  it('retire les types déposés — « autre » ne compte pas', () => {
    const docs = [
      doc({ id: 'd1', type: 'contrat-pedagogique' }),
      doc({ id: 'd2', type: 'droit-image' }),
      doc({ id: 'd3', type: 'autre', titre: 'Convention' }),
    ];
    expect(typesObligatoiresManquants(docs)).toEqual(['protection-donnees', 'reglement-interieur']);
  });

  it('aucun manquant quand les 4 types sont déposés (même non attestés)', () => {
    const docs = TYPES_DOCUMENTS_OBLIGATOIRES.map((type, i) => doc({ id: `d${i}`, type }));
    expect(typesObligatoiresManquants(docs)).toEqual([]);
  });
});

describe('etatDocumentsObligatoires — synthèse par type (PDF, page)', () => {
  it("rend les 4 types dans l'ordre avec leur état", () => {
    const docs = [
      doc({ id: 'd1', type: 'contrat-pedagogique' }),
      doc({
        id: 'd2',
        type: 'reglement-interieur',
        consulteParApprentiLe: '2026-07-02T09:00:00.000Z',
        attestation: { attestee: true, dateAttestation: '2026-07-02T10:00:00.000Z' },
      }),
      doc({ id: 'd3', type: 'autre', titre: 'Convention' }),
    ];
    const etats = etatDocumentsObligatoires(docs);
    expect(etats.map((e) => e.type)).toEqual(TYPES_DOCUMENTS_OBLIGATOIRES);
    expect(etats.map((e) => e.etat)).toEqual(['a-attester', 'manquant', 'manquant', 'atteste']);
    expect(etats[0].document?.id).toBe('d1');
    expect(etats[1].document).toBeUndefined();
    expect(etats[0].libelle).toBe('Contrat pédagogique');
  });
});

describe('validerDepotDocument', () => {
  const depotValide = {
    type: 'reglement-interieur' as const,
    titre: '',
    nomFichier: 'reglement.pdf',
    mimeType: 'application/pdf',
    taille: 100_000,
    reserveApprenti: false,
  };

  it('accepte un PDF ou une image sous le plafond de taille', () => {
    expect(validerDepotDocument(depotValide).ok).toBe(true);
    expect(validerDepotDocument({ ...depotValide, mimeType: 'image/jpeg' }).ok).toBe(true);
    expect(validerDepotDocument({ ...depotValide, mimeType: 'image/png' }).ok).toBe(true);
  });

  it('les 4 types obligatoires ne demandent PAS de titre', () => {
    expect(validerDepotDocument({ ...depotValide, titre: '' }).ok).toBe(true);
  });

  it('refuse un titre vide pour le type « autre »', () => {
    const r = validerDepotDocument({ ...depotValide, type: 'autre', titre: '   ' });
    expect(r.ok).toBe(false);
    expect(r.erreurs.join(' ')).toMatch(/titre/i);
  });

  it('accepte « autre » avec un titre', () => {
    expect(
      validerDepotDocument({ ...depotValide, type: 'autre', titre: 'Convention nominative' }).ok,
    ).toBe(true);
  });

  it('refuse le flag « réservé » hors type « autre » (arbitrage 2026-07-13)', () => {
    const r = validerDepotDocument({ ...depotValide, reserveApprenti: true });
    expect(r.ok).toBe(false);
    expect(r.erreurs.join(' ')).toMatch(/réservé/i);
    expect(
      validerDepotDocument({
        ...depotValide,
        type: 'autre',
        titre: 'Convention',
        reserveApprenti: true,
      }).ok,
    ).toBe(true);
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
      type: 'autre',
      titre: '',
      nomFichier: 'x.zip',
      mimeType: 'application/zip',
      taille: TAILLE_MAX_DOCUMENT_OCTETS + 1,
      reserveApprenti: false,
    });
    expect(r.ok).toBe(false);
    expect(r.erreurs).toHaveLength(3);
  });
});
