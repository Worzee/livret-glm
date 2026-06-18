import { PDFDownloadLink } from '@react-pdf/renderer';
import type {
  Apprenti,
  AttitudeProfessionnelle,
  Etablissement,
  Formateur,
  Formation,
  Livret,
  Maitre,
  QuestionBanque,
  Referentiel,
} from '@/types';
import { EntretienPdf, FichesSuiviPdf, LivretPdf, PeriodePdf } from './LivretPdf';
import type { VarianteExportPdf } from './BoutonExportPdf';
import {
  nomFichierEntretien,
  nomFichierFichesSuivi,
  nomFichierPdf,
  nomFichierPeriode,
  nomFichierPeriodeCentre,
} from './format';

/**
 * Wrapper du `PDFDownloadLink` chargé en lazy (cf. BoutonExportPdf).
 * Tout le code lourd (`@react-pdf/renderer`, `LivretPdf`, sections) reste hors
 * du bundle initial tant que l'utilisateur n'a pas cliqué sur le bouton.
 *
 * La `variante` choisit le document à générer (16 juin 2026) :
 *   - livret      : le livret complet (toutes sections)
 *   - periode     : une seule fiche de période en entreprise
 *   - entretien   : un seul entretien tripartite
 *   - fiches-suivi : la page « Fiches de suivi » (événements de suivi)
 *
 * Sortie par défaut pour que `React.lazy(() => import('./ExportPdfLazy'))`
 * fonctionne sans couche supplémentaire.
 */
interface ExportPdfLazyProps {
  variante: VarianteExportPdf;
  livret: Livret;
  apprenti: Apprenti;
  maitre: Maitre;
  /** Second maître / tuteur optionnel (juin 2026). */
  maitreSecond?: Maitre;
  formateur: Formateur;
  formation: Formation;
  referentiel: Referentiel;
  etablissement?: Etablissement;
  banqueQuestions: Record<string, QuestionBanque>;
  attitudes: ReadonlyArray<AttitudeProfessionnelle>;
}

export default function ExportPdfLazy({ variante, ...donnees }: ExportPdfLazyProps) {
  const { apprenti, livret } = donnees;

  let document: React.ReactElement;
  let fileName: string;
  let ariaLabel: string;

  switch (variante.type) {
    case 'periode': {
      const fiche = livret.fichesSuivi.find((f) => f.id === variante.ficheId);
      // Garde : si la fiche a disparu entre le clic et le rendu, on retombe sur
      // le livret complet plutôt que d'échouer.
      if (!fiche) {
        document = <LivretPdf {...donnees} />;
        fileName = nomFichierPdf(apprenti.nom, apprenti.prenom);
        ariaLabel = 'Télécharger le livret au format PDF';
        break;
      }
      document = <PeriodePdf {...donnees} fiche={fiche} />;
      fileName = nomFichierPeriode(apprenti.nom, apprenti.prenom, fiche.numeroPeriode);
      ariaLabel = `Télécharger la période ${fiche.numeroPeriode} au format PDF`;
      break;
    }
    case 'periode-centre': {
      const fiche = livret.fichesSuiviCentre.find((f) => f.id === variante.ficheId);
      // Garde : si la fiche a disparu entre le clic et le rendu, on retombe sur
      // le livret complet plutôt que d'échouer.
      if (!fiche) {
        document = <LivretPdf {...donnees} />;
        fileName = nomFichierPdf(apprenti.nom, apprenti.prenom);
        ariaLabel = 'Télécharger le livret au format PDF';
        break;
      }
      document = <PeriodePdf {...donnees} fiche={fiche} lieu="centre" />;
      fileName = nomFichierPeriodeCentre(apprenti.nom, apprenti.prenom, fiche.numeroPeriode);
      ariaLabel = `Télécharger la période en centre ${fiche.numeroPeriode} au format PDF`;
      break;
    }
    case 'entretien':
      document = <EntretienPdf {...donnees} numero={variante.numero} />;
      fileName = nomFichierEntretien(apprenti.nom, apprenti.prenom, variante.numero);
      ariaLabel = `Télécharger l'entretien tripartite ${variante.numero} au format PDF`;
      break;
    case 'fiches-suivi':
      document = <FichesSuiviPdf {...donnees} />;
      fileName = nomFichierFichesSuivi(apprenti.nom, apprenti.prenom);
      ariaLabel = 'Télécharger les fiches de suivi au format PDF';
      break;
    case 'livret':
    default:
      document = <LivretPdf {...donnees} />;
      fileName = nomFichierPdf(apprenti.nom, apprenti.prenom);
      ariaLabel = 'Télécharger le livret au format PDF';
  }

  return (
    <PDFDownloadLink
      document={document}
      fileName={fileName}
      className="inline-flex items-center gap-1.5 rounded-md bouton-plein-couleur-role px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={ariaLabel}
    >
      {({ loading, error }) => {
        if (error) return 'Erreur — voir la console';
        if (loading) return 'Génération du PDF…';
        return 'Télécharger le PDF';
      }}
    </PDFDownloadLink>
  );
}
