import { StyleSheet, Font } from '@react-pdf/renderer';

/**
 * Styles partagés du PDF du livret d'apprentissage.
 * Référence : cahier des charges v1.3, section 5.6.
 *
 * Design délibérément sobre : police Helvetica intégrée (pas de fetch font),
 * palette monochrome avec accents pour les rôles (cohérent avec le design system
 * web mais simplifié — @react-pdf n'a pas accès à Tailwind).
 */

// Pas d'embed font externe — Helvetica est intégrée à @react-pdf/renderer.
// On désactive l'hyphenation pour éviter les coupures de mots imprévues.
Font.registerHyphenationCallback((word) => [word]);

export const COULEURS = {
  texte: '#0f172a',
  texteSecondaire: '#475569',
  borduresLeger: '#cbd5e1',
  borduresFort: '#94a3b8',
  fond: '#ffffff',
  fondSecondaire: '#f1f5f9',
  primaire: '#1e3a8a',
  // Aligné sur la charte UI (tailwind.config.ts > theme.colors.role) —
  // corrige un bug historique où les 3 couleurs étaient inversées entre
  // PDF et UI (apprenti=violet PDF vs bleu UI, etc.).
  apprenti: '#1e40af', // bleu (UI: blue-800)
  maitre: '#059669', // vert (UI: emerald-600)
  formateur: '#7c3aed', // violet (UI: violet-600)
  coordo: '#c2410c', // orange foncé (UI: orange-700)
  admin: '#a16207', // or foncé (UI: yellow-700)
  alerte: '#b45309',
  succes: '#15803d',
} as const;

export const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 36,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: COULEURS.texte,
  },
  // ── En-tête / pied de page ─────────────────────────────────────────────
  enTetePage: {
    position: 'absolute',
    top: 12,
    left: 36,
    right: 36,
    fontSize: 8,
    color: COULEURS.texteSecondaire,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: COULEURS.borduresLeger,
    paddingBottom: 4,
  },
  piedDePage: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    fontSize: 8,
    color: COULEURS.texteSecondaire,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: COULEURS.borduresLeger,
    paddingTop: 4,
  },
  // ── Page de garde ───────────────────────────────────────────────────────
  garde: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  // Logo officiel scindé (3 juillet 2026) : bloc « République française »
  // (Marianne) à gauche, bloc « Réseau GRETA CFA — Académie de Lyon » à
  // droite ; le titre du document passe SOUS cette rangée.
  gardeMarque: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gardeLogoRepublique: {
    width: 60,
    height: 52,
    objectFit: 'contain',
  },
  gardeLogoReseau: {
    width: 97,
    height: 52,
    objectFit: 'contain',
  },
  gardeTitreBloc: {
    marginTop: 24,
  },
  gardeTitre: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: COULEURS.primaire,
  },
  gardeSousTitre: {
    fontSize: 14,
    color: COULEURS.texteSecondaire,
    marginTop: 4,
  },
  gardeBlocIdentite: {
    marginTop: 36,
  },
  gardeNom: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
  },
  gardeFormation: {
    fontSize: 14,
    marginTop: 6,
  },
  gardeMetadonnees: {
    fontSize: 11,
    color: COULEURS.texteSecondaire,
    marginTop: 24,
    lineHeight: 1.5,
  },
  gardeMetadonneesLigne: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  gardeMetadonneesLabel: {
    width: 130,
    color: COULEURS.texteSecondaire,
  },
  gardeMetadonneesValeur: {
    flex: 1,
    color: COULEURS.texte,
  },
  gardeBandeauDemo: {
    backgroundColor: COULEURS.alerte,
    color: '#ffffff',
    padding: 8,
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
  },
  gardeMentions: {
    fontSize: 8,
    color: COULEURS.texteSecondaire,
    marginTop: 8,
    textAlign: 'center',
  },
  // ── Titres de section ───────────────────────────────────────────────────
  h1: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: COULEURS.primaire,
    marginBottom: 12,
  },
  h2: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: COULEURS.texte,
    marginTop: 14,
    marginBottom: 6,
  },
  h3: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COULEURS.texte,
    marginTop: 10,
    marginBottom: 4,
  },
  paragraphe: {
    marginBottom: 4,
    lineHeight: 1.4,
  },
  italique: {
    fontStyle: 'italic',
    color: COULEURS.texteSecondaire,
  },
  vide: {
    fontStyle: 'italic',
    color: COULEURS.texteSecondaire,
  },
  // ── Tableaux ────────────────────────────────────────────────────────────
  tableau: {
    borderWidth: 0.5,
    borderColor: COULEURS.borduresLeger,
    marginBottom: 8,
  },
  tableauLigne: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: COULEURS.borduresLeger,
  },
  tableauLigneSansBordure: {
    flexDirection: 'row',
  },
  tableauEnTete: {
    backgroundColor: COULEURS.fondSecondaire,
    fontFamily: 'Helvetica-Bold',
  },
  tableauCellule: {
    padding: 4,
    fontSize: 9,
    borderRightWidth: 0.5,
    borderRightColor: COULEURS.borduresLeger,
  },
  tableauCelluleDerniere: {
    padding: 4,
    fontSize: 9,
  },
  // ── Encarts ─────────────────────────────────────────────────────────────
  encart: {
    borderWidth: 0.5,
    borderColor: COULEURS.borduresLeger,
    backgroundColor: COULEURS.fondSecondaire,
    padding: 8,
    marginBottom: 8,
  },
  encartTitre: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  encartCloture: {
    borderWidth: 1,
    borderColor: COULEURS.primaire,
    backgroundColor: '#eef2ff',
    padding: 10,
    marginBottom: 12,
  },
  // ── Signatures ──────────────────────────────────────────────────────────
  signaturesRangee: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  signatureCarte: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: COULEURS.borduresLeger,
    padding: 8,
    minHeight: 60,
  },
  signatureCarteApprenti: {
    borderLeftWidth: 3,
    borderLeftColor: COULEURS.apprenti,
  },
  signatureCarteMaitre: {
    borderLeftWidth: 3,
    borderLeftColor: COULEURS.maitre,
  },
  signatureCarteFormateur: {
    borderLeftWidth: 3,
    borderLeftColor: COULEURS.formateur,
  },
  signatureLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginBottom: 4,
  },
  signatureValeur: {
    fontSize: 9,
    color: COULEURS.succes,
  },
  signatureManquante: {
    fontSize: 9,
    fontStyle: 'italic',
    color: COULEURS.texteSecondaire,
  },
  // ── Champs clé/valeur ───────────────────────────────────────────────────
  paire: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  paireLabel: {
    width: 140,
    color: COULEURS.texteSecondaire,
    fontSize: 9,
  },
  paireValeur: {
    flex: 1,
    fontSize: 9,
  },
  // ── Liste à puces ───────────────────────────────────────────────────────
  liste: {
    marginLeft: 12,
    marginBottom: 4,
  },
  listeItem: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  listePuce: {
    width: 8,
  },
  // ── Couleurs niveaux (pastilles texte) ──────────────────────────────────
  niveauMaitrise: {
    color: COULEURS.succes,
    fontFamily: 'Helvetica-Bold',
  },
  niveauPartiel: {
    color: COULEURS.alerte,
    fontFamily: 'Helvetica-Bold',
  },
  niveauNonMaitrise: {
    color: '#dc2626',
    fontFamily: 'Helvetica-Bold',
  },
  niveauNonFait: {
    color: COULEURS.texteSecondaire,
    fontStyle: 'italic',
  },
  // ── Bandeaux d'état fiche ───────────────────────────────────────────────
  badgeEtat: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    borderRadius: 3,
    color: '#ffffff',
  },
});
