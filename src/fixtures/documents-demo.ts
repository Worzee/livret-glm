import type { DocumentAdministratif } from '@/types';
import { creerPdfDemo } from './pdf-demo';

/**
 * Documents administratifs de démonstration (10 juillet 2026 — demande
 * direction). Trois documents nominatifs pour faire vivre tous les cas :
 *
 *   - Léa / « Partie 1 » : public, ATTESTÉ (signature historique sans tracé —
 *     rétrocompatibilité des fixtures, comme les signatures de fiches) ;
 *   - Léa / « Convention » : RÉSERVÉ à l'apprentie (invisible du maître et du
 *     formateur), non attesté → alerte côté coordo / admin uniquement ;
 *   - Yanis / « Partie 1 » : public, non attesté → alerte visible aussi de
 *     son formateur référent (Marc TISSIER).
 */

const pdfEngagements = creerPdfDemo('Livret d’apprentissage - Partie 1', [
  'Engagements des parties et informations generales du livret papier.',
  'Document de demonstration genere par la maquette (aucune donnee reelle).',
  '',
  'L’apprenti(e) atteste en avoir pris connaissance par signature.',
]);

const pdfConvention = creerPdfDemo('Convention de formation nominative', [
  'Document nominatif reserve a l’apprenti(e) (coordination et administration).',
  'Document de demonstration genere par la maquette (aucune donnee reelle).',
]);

export const documentsDemo: DocumentAdministratif[] = [
  {
    id: 'docadm-lea-engagements',
    apprentiId: 'u-apprenti-lea',
    titre: "Partie 1 - Engagements du livret d'apprentissage",
    nomFichier: 'partie1-engagements-lea-martin.pdf',
    mimeType: 'application/pdf',
    taille: pdfEngagements.taille,
    dataUrl: pdfEngagements.dataUrl,
    reserveApprenti: false,
    deposeParId: 'u-coordo-martine',
    deposeParNom: 'Martine LEFÈVRE',
    deposeParRole: 'coordo',
    deposeLe: '2025-09-03T09:00:00.000Z',
    attestation: { signe: true, dateSignature: '2025-09-05T14:30:00.000Z' },
  },
  {
    id: 'docadm-lea-convention',
    apprentiId: 'u-apprenti-lea',
    titre: 'Convention de formation nominative',
    nomFichier: 'convention-lea-martin.pdf',
    mimeType: 'application/pdf',
    taille: pdfConvention.taille,
    dataUrl: pdfConvention.dataUrl,
    reserveApprenti: true,
    deposeParId: 'u-coordo-martine',
    deposeParNom: 'Martine LEFÈVRE',
    deposeParRole: 'coordo',
    deposeLe: '2025-09-03T09:05:00.000Z',
    attestation: { signe: false },
  },
  {
    id: 'docadm-yanis-engagements',
    apprentiId: 'u-apprenti-yanis',
    titre: "Partie 1 - Engagements du livret d'apprentissage",
    nomFichier: 'partie1-engagements-yanis-belkacem.pdf',
    mimeType: 'application/pdf',
    taille: pdfEngagements.taille,
    dataUrl: pdfEngagements.dataUrl,
    reserveApprenti: false,
    deposeParId: 'u-coordo-martine',
    deposeParNom: 'Martine LEFÈVRE',
    deposeParRole: 'coordo',
    deposeLe: '2025-09-10T10:00:00.000Z',
    attestation: { signe: false },
  },
];
