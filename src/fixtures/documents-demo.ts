import type {
  AttestationLecture,
  DocumentAdministratif,
  DocumentFormation,
  TypeDocumentAdministratif,
} from '@/types';
import { creerPdfDemo } from './pdf-demo';
import { TYPES_DOCUMENTS_OBLIGATOIRES } from '@/lib/documents-administratifs';

/**
 * Documents administratifs de démonstration (10 juillet 2026 — demande
 * direction ; v2/v3 le 13 juillet 2026 — réunion DG : typologie de 4
 * documents OBLIGATOIRES + « autre », puis documents AU NIVEAU FORMATION).
 *
 * Le **règlement intérieur** illustre le dépôt en masse (demande 4) : un
 * document de FORMATION par promo (CAP + BTS), attesté individuellement —
 * tou·te·s ont attesté SAUF Sofia (alerte « attestation attendue »).
 *
 * Les dossiers nominatifs restent COMPLETS (3 types attestés) pour que le
 * centre d'alertes de démo reste lisible ; les cas pédagogiques vivent sur :
 *
 *   - Léa : contrat pédagogique ATTESTÉ ; protection des données déposée NON
 *     attestée ; droit à l'image MANQUANT (anomalie « dépôt à effectuer »
 *     côté coordo / admin) ; convention « Autre » RÉSERVÉE à l'apprentie,
 *     non attestée (invisible du maître et du formateur) ;
 *   - Yanis : contrat pédagogique public NON attesté → alerte visible aussi
 *     de son formateur référent (Marc TISSIER), autres types attestés.
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

/**
 * Dossier nominatif complet : les types obligatoires attestés, SAUF le
 * règlement intérieur qui vit désormais au niveau FORMATION (demande 4 —
 * `documentsFormationDemo`).
 */
function dossierComplet(
  apprenti: string,
  coordo: keyof typeof DEPOSANTS,
  deposeLe: string,
  attesteLe: string,
): DocumentAdministratif[] {
  return TYPES_DOCUMENTS_OBLIGATOIRES.filter((type) => type !== 'reglement-interieur').map((type) =>
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
  // reglement-interieur : porté par la FORMATION (docform-cap-reglement).
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
  // reglement-interieur : porté par la FORMATION (docform-bts-reglement).

  // ── Dossiers complets (centre d'alertes de démo sans bruit) ───────────────
  ...dossierComplet('theo', 'martine', '2025-09-03T10:00:00.000Z', '2025-09-08T09:00:00.000Z'),
  ...dossierComplet('sofia', 'martine', '2025-09-03T10:30:00.000Z', '2025-09-09T11:00:00.000Z'),
  ...dossierComplet('camille', 'martine', '2025-09-04T09:00:00.000Z', '2025-09-10T16:00:00.000Z'),
  ...dossierComplet('minh', 'bernard', '2025-09-04T10:00:00.000Z', '2025-09-09T10:00:00.000Z'),
  ...dossierComplet('aya', 'bernard', '2025-09-04T10:30:00.000Z', '2025-09-10T14:00:00.000Z'),
  ...dossierComplet('luca', 'bernard', '2025-09-05T09:00:00.000Z', '2025-09-11T09:30:00.000Z'),
];

// ─────────────────────────────────────────────────────────────────────────────
// Documents au niveau FORMATION (13 juillet 2026 — demande 4, dépôt en masse)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lectures + attestations individuelles : consultation ~1 h avant chaque
 * attestation (« lu et attesté »).
 */
function attestationsFormation(attesteLePar: Record<string, string>): {
  consultations: Record<string, string>;
  attestations: Record<string, AttestationLecture>;
} {
  const consultations: Record<string, string> = {};
  const attestations: Record<string, AttestationLecture> = {};
  for (const [apprenti, attesteLe] of Object.entries(attesteLePar)) {
    consultations[`u-apprenti-${apprenti}`] = new Date(
      Date.parse(attesteLe) - 3_600_000,
    ).toISOString();
    attestations[`u-apprenti-${apprenti}`] = { attestee: true, dateAttestation: attesteLe };
  }
  return { consultations, attestations };
}

export const documentsFormationDemo: DocumentFormation[] = [
  // CAP Cuisine : règlement intérieur de la promo — tou·te·s ont attesté SAUF
  // Sofia (alerte « attestation attendue » chez Martine et Sophie).
  {
    id: 'docform-cap-reglement',
    formationId: 'f-cap-cuisine-2025',
    type: 'reglement-interieur',
    nomFichier: 'reglement-interieur-cap-cuisine.pdf',
    mimeType: 'application/pdf',
    taille: PDF_PAR_TYPE['reglement-interieur'].taille,
    dataUrl: PDF_PAR_TYPE['reglement-interieur'].dataUrl,
    ...DEPOSANTS.martine,
    deposeParRole: 'coordo',
    deposeLe: '2025-09-02T08:30:00.000Z',
    ...attestationsFormation({
      lea: '2025-09-05T14:35:00.000Z',
      theo: '2025-09-08T09:05:00.000Z',
      minh: '2025-09-09T10:05:00.000Z',
      aya: '2025-09-10T14:05:00.000Z',
      luca: '2025-09-11T09:35:00.000Z',
      // sofia : non attesté (cas de démo).
    }),
  },
  // BTS MHR : règlement intérieur de la promo — attesté par les 2 apprentis.
  {
    id: 'docform-bts-reglement',
    formationId: 'f-bts-mhr-2025',
    type: 'reglement-interieur',
    nomFichier: 'reglement-interieur-bts-mhr.pdf',
    mimeType: 'application/pdf',
    taille: PDF_PAR_TYPE['reglement-interieur'].taille,
    dataUrl: PDF_PAR_TYPE['reglement-interieur'].dataUrl,
    ...DEPOSANTS.martine,
    deposeParRole: 'coordo',
    deposeLe: '2025-09-02T08:35:00.000Z',
    ...attestationsFormation({
      camille: '2025-09-10T16:05:00.000Z',
      yanis: '2025-09-12T08:40:00.000Z',
    }),
  },
];
