import { lazy, Suspense, useState } from 'react';
import { AlertTriangle, FileDown } from 'lucide-react';
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
import { useUserStore } from '@/store/useUserStore';
import { peutEditer } from '@/lib/droits';
import { estimerNombrePages } from './format';

/**
 * Bouton "Exporter le livret" (CDC §5.6).
 *
 * Comportement :
 *  - Visible uniquement pour les rôles disposant du droit `export-pdf`
 *    (formateur référent, par défaut — cf. matrice des droits §6).
 *  - 1er clic : si > 50 pages estimées (CDC §C14), affiche un avertissement
 *    de durée. Sinon, déclenche directement le chargement de @react-pdf.
 *  - 2ᵉ clic (ou clic confirmation) : monte `<ExportPdfLazy>` qui charge le
 *    bundle PDF et expose `<PDFDownloadLink>` pour récupérer le fichier.
 *
 * Le composant `ExportPdfLazy` est importé via `React.lazy()` ; tant que
 * l'utilisateur ne clique pas, ni @react-pdf/renderer ni LivretPdf ne sont
 * inclus dans le chunk initial — ce qui garde le bundle initial à ~92 KB.
 */

const ExportPdfLazy = lazy(() => import('./ExportPdfLazy'));

const SEUIL_PAGES_AVERTISSEMENT = 50;

interface BoutonExportPdfProps {
  livret: Livret;
  apprenti: Apprenti;
  maitre: Maitre;
  formateur: Formateur;
  formation: Formation;
  referentiel: Referentiel;
  /** Établissement (résolu depuis `formation.lieuId`). */
  etablissement?: Etablissement;
  /** Banque indexée des questions de l'entretien (refonte mai 2026). */
  banqueQuestions: Record<string, QuestionBanque>;
  /** Catalogue global des attitudes professionnelles (juin 2026). */
  attitudes: ReadonlyArray<AttitudeProfessionnelle>;
}

export function BoutonExportPdf(props: BoutonExportPdfProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const [demande, setDemande] = useState(false);
  const [confirmationGros, setConfirmationGros] = useState(false);

  if (!peutEditer(roleActif, 'export-pdf')) return null;

  const totalDeverrouillages = props.livret.fichesSuivi.reduce(
    (n, f) => n + f.historiqueDeverrouillages.length,
    0,
  );
  const pagesEstimees = estimerNombrePages(
    props.livret.fichesSuivi.length,
    totalDeverrouillages,
  );
  const livretVolumineux = pagesEstimees > SEUIL_PAGES_AVERTISSEMENT;

  if (demande) {
    return (
      <Suspense
        fallback={
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-3 py-1.5 text-sm text-muted-foreground">
            <FileDown className="h-4 w-4 animate-pulse" aria-hidden="true" />
            Préparation du PDF…
          </span>
        }
      >
        <ExportPdfLazy {...props} />
      </Suspense>
    );
  }

  if (confirmationGros) {
    return (
      <div
        role="alertdialog"
        aria-label="Avertissement livret volumineux"
        className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3"
      >
        <div className="flex items-start gap-2 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Le livret contient environ <strong>{pagesEstimees} pages</strong>. La
            génération peut prendre quelques secondes.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirmationGros(false)}
            className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmationGros(false);
              setDemande(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md bouton-plein-couleur-role px-3 py-1.5 text-sm font-medium"
          >
            <FileDown className="h-4 w-4" aria-hidden="true" />
            Générer quand même
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (livretVolumineux) setConfirmationGros(true);
        else setDemande(true);
      }}
      className="inline-flex items-center gap-1.5 rounded-md bouton-plein-couleur-role px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Exporter le livret au format PDF"
    >
      <FileDown className="h-4 w-4" aria-hidden="true" />
      Exporter le livret
    </button>
  );
}
