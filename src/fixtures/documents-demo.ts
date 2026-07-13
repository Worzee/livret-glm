import type { DocumentAdministratif, TypeDocumentAdministratif } from '@/types';
import { creerPdfDemo } from './pdf-demo';
import { TYPES_DOCUMENTS_OBLIGATOIRES } from '@/lib/documents-administratifs';

/**
 * Documents administratifs de démonstration (10 juillet 2026 — demande
 * direction ; v2 le 13 juillet 2026 — réunion DG : typologie de 4 documents
 * OBLIGATOIRES + « autre »).
 *
 * Six apprenti·e·s portent un dossier COMPLET (4 types attestés) pour que le
 * centre d'alertes de démo reste lisible ; les cas pédagogiques vivent sur :
 *
 *   - Léa : contrat pédagogique et règlement intérieur ATTESTÉS ; protection
 *     des données déposée NON attestée ; droit à l'image MANQUANT (anomalie
 *     « dépôt à effectuer » côté coordo / admin) ; convention « Autre »
 *     RÉSERVÉE à l'apprentie, non attestée (invisible du maître et du
 *     formateur) ;
 *   - Yanis : contrat pédagogique public NON attesté → alerte visible aussi
 *     de son formateur référent (Marc TISSIER), 3 autres types attestés.
 */

// ── PDF de démo partagés (1 par type — le contenu importe peu, il illustre) ──

const PDF_PAR_TYPE: Record<TypeDocumentAdministratif, ReturnType<typeof creerPdfDemo>> = {
  'contrat-pedagogique': creerPdfDemo('Contrat pedagogique', [
    "Engagements reciproques du CFA, de l'entreprise et de l'apprenti(e).",
    'Document de demonstration genere par la maquette (aucune donnee reelle).',
    '',
    "L'apprenti(e) atteste en avoir pris connaissance apres lecture.",
  ]),
  'protection-donnees': creerPdfDemo('Information relative a la protection des donnees', [
    'Information RGPD : donnees collectees, finalites, durees, droits.',
    'Document de demonstration genere par la maquette (aucune donnee reelle).',
  ]),
  'droit-image': creerPdfDemo("Droit a l'image", [
    "Autorisation d'utilisation de l'image de l'apprenti(e).",
    'Document de demonstration genere par la maquette (aucune donnee reelle).',
  ]),
  'reglement-interieur': creerPdfDemo('Accuse reception du reglement interieur', [
    'Accuse de reception du reglement interieur du CFA.',
    'Document de demonstration genere par la maquette (aucune donnee reelle).',
  ]),
  autre: creerPdfDemo('Convention de formation nominative', [
    "Document nominatif reserve a l'apprenti(e) (coordination et administration).",
    'Document de demonstration genere par la maquette (aucune donnee reelle).',
  ]),
};

const DEPOSANTS = {
  martine: { deposeParId: 'u-coordo-martine', deposeParNom: 'Martine LEFÈVRE' },
  bernard: { deposeParId: 'u-coordo-bernard', deposeParNom: 'Bernard PETIT' },
} as const;

interface OptionsDocDemo {
  /** Dossier suivi par quel coordo (déposant). */
  coordo: keyof typeof DEPOSANTS;
  deposeLe: string;
  /** Renseigné → document consulté puis attesté à cette date. */
  attesteLe?: string;
}

function slugFichier(type: TypeDocumentAdministratif, apprenti: string): string {
  return `${type}-${apprenti}.pdf`;
}

function docDemo(
  apprenti: string,
  type: TypeDocumentAdministratif,
  { coordo, deposeLe, attesteLe }: OptionsDocDemo,
): DocumentAdministratif {
  const pdf = PDF_PAR_TYPE[type];
  return {
    id: `docadm-${apprenti}-${type}`,
    apprentiId: `u-apprenti-${apprenti}`,
    type,
    nomFichier: slugFichier(type, apprenti),
    mimeType: 'application/pdf',
    taille: pdf.taille,
    dataUrl: pdf.dataUrl,
    reserveApprenti: false,
    ...DEPOSANTS[coordo],
    deposeParRole: 'coordo',
    deposeLe,
    // Consultation ~1 h avant l'attestation (« lu et attesté »).
    ...(attesteLe
      ? {
          consulteParApprentiLe: new Date(Date.parse(attesteLe) - 3_600_000).toISOString(),
          attestation: { attestee: true, dateAttestation: attesteLe },
        }
      : { attestation: { attestee: false } }),
  };
}

/** Dossier complet : les 4 types obligatoires, tous attestés. */
function dossierComplet(
  apprenti: string,
  coordo: keyof typeof DEPOSANTS,
  deposeLe: string,
  attesteLe: string,
): DocumentAdministratif[] {
  return TYPES_DOCUMENTS_OBLIGATOIRES.map((type) =>
    docDemo(apprenti, type, { coordo, deposeLe, attesteLe }),
  );
}

export const documentsDemo: DocumentAdministratif[] = [
  // ── Léa MARTIN (CAP) — cas de démo principal ──────────────────────────────
  docDemo('lea', 'contrat-pedagogique', {
    coordo: 'martine',
    deposeLe: '2025-09-03T09:00:00.000Z',
    attesteLe: '2025-09-05T14:30:00.000Z',
  }),
  docDemo('lea', 'protection-donnees', {
    coordo: 'martine',
    deposeLe: '2025-09-03T09:02:00.000Z',
    // Non consultée, non attestée → alerte « attestation attendue ».
  }),
  // droit-image : MANQUANT → anomalie « dépôt à effectuer » (coordo / admin).
  docDemo('lea', 'reglement-interieur', {
    coordo: 'martine',
    deposeLe: '2025-09-03T09:04:00.000Z',
    attesteLe: '2025-09-05T14:35:00.000Z',
  }),
  {
    ...docDemo('lea', 'autre', {
      coordo: 'martine',
      deposeLe: '2025-09-03T09:05:00.000Z',
    }),
    id: 'docadm-lea-convention',
    titre: 'Convention de formation nominative',
    nomFichier: 'convention-lea-martin.pdf',
    reserveApprenti: true,
  },

  // ── Yanis BELKACEM (BTS) — contrat non attesté, visible de Marc TISSIER ──
  docDemo('yanis', 'contrat-pedagogique', {
    coordo: 'martine',
    deposeLe: '2025-09-10T10:00:00.000Z',
  }),
  docDemo('yanis', 'protection-donnees', {
    coordo: 'martine',
    deposeLe: '2025-09-10T10:02:00.000Z',
    attesteLe: '2025-09-12T08:30:00.000Z',
  }),
  docDemo('yanis', 'droit-image', {
    coordo: 'martine',
    deposeLe: '2025-09-10T10:04:00.000Z',
    attesteLe: '2025-09-12T08:35:00.000Z',
  }),
  docDemo('yanis', 'reglement-interieur', {
    coordo: 'martine',
    deposeLe: '2025-09-10T10:06:00.000Z',
    attesteLe: '2025-09-12T08:40:00.000Z',
  }),

  // ── Dossiers complets (centre d'alertes de démo sans bruit) ───────────────
  ...dossierComplet('theo', 'martine', '2025-09-03T10:00:00.000Z', '2025-09-08T09:00:00.000Z'),
  ...dossierComplet('sofia', 'martine', '2025-09-03T10:30:00.000Z', '2025-09-09T11:00:00.000Z'),
  ...dossierComplet('camille', 'martine', '2025-09-04T09:00:00.000Z', '2025-09-10T16:00:00.000Z'),
  ...dossierComplet('minh', 'bernard', '2025-09-04T10:00:00.000Z', '2025-09-09T10:00:00.000Z'),
  ...dossierComplet('aya', 'bernard', '2025-09-04T10:30:00.000Z', '2025-09-10T14:00:00.000Z'),
  ...dossierComplet('luca', 'bernard', '2025-09-05T09:00:00.000Z', '2025-09-11T09:30:00.000Z'),
];
