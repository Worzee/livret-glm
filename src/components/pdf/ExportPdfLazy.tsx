import { PDFDownloadLink } from '@react-pdf/renderer';
import type {
  Apprenti,
  Formateur,
  Formation,
  Livret,
  Maitre,
  QuestionBanque,
  Referentiel,
} from '@/types';
import { LivretPdf } from './LivretPdf';
import { nomFichierPdf } from './format';

/**
 * Wrapper du `PDFDownloadLink` chargé en lazy (cf. BoutonExportPdf).
 * Tout le code lourd (`@react-pdf/renderer`, `LivretPdf`, sections) reste hors
 * du bundle initial tant que l'utilisateur n'a pas cliqué sur le bouton.
 *
 * Sortie par défaut pour que `React.lazy(() => import('./ExportPdfLazy'))`
 * fonctionne sans couche supplémentaire.
 */
interface ExportPdfLazyProps {
  livret: Livret;
  apprenti: Apprenti;
  maitre: Maitre;
  formateur: Formateur;
  formation: Formation;
  referentiel: Referentiel;
  banqueQuestions: Record<string, QuestionBanque>;
}

export default function ExportPdfLazy({
  livret,
  apprenti,
  maitre,
  formateur,
  formation,
  referentiel,
  banqueQuestions,
}: ExportPdfLazyProps) {
  const document = (
    <LivretPdf
      livret={livret}
      apprenti={apprenti}
      maitre={maitre}
      formateur={formateur}
      formation={formation}
      referentiel={referentiel}
      banqueQuestions={banqueQuestions}
    />
  );

  return (
    <PDFDownloadLink
      document={document}
      fileName={nomFichierPdf(apprenti.nom, apprenti.prenom)}
      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Télécharger le livret au format PDF"
    >
      {({ loading, error }) => {
        if (error) return 'Erreur — voir la console';
        if (loading) return 'Génération du PDF…';
        return 'Télécharger le PDF';
      }}
    </PDFDownloadLink>
  );
}
