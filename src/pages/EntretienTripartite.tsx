import { ClipboardList, Plus } from 'lucide-react';
import { useParams } from 'react-router-dom';
import type { NumeroEntretien } from '@/types';
import { useLivretStore } from '@/store/useLivretStore';
import { useUserStore } from '@/store/useUserStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { peutEditer } from '@/lib/droits';
import { calculerAlerteR7, peutInitialiserEntretien } from '@/lib/regles-entretien';
import { cn } from '@/lib/utils';
import { formationCapCuisine } from '@/fixtures/formations';
import { AucunApprentiSelectionne } from '@/components/common/AucunApprentiSelectionne';
import { NotFound } from '@/pages/NotFound';
import { EntretienHeader } from '@/components/entretien/EntretienHeader';
import { EntretienProgression } from '@/components/entretien/EntretienProgression';
import { BandeauAlerteR7 } from '@/components/entretien/BandeauAlerteR7';
import { SectionApprenti } from '@/components/entretien/SectionApprenti';
import { SectionMaitre } from '@/components/entretien/SectionMaitre';
import { SectionFormateur } from '@/components/entretien/SectionFormateur';
import { SectionTrameEntretien1 } from '@/components/entretien/SectionTrameEntretien1';
import { SectionSelectionCompetences } from '@/components/entretien/SectionSelectionCompetences';
import { SectionSelectionAttitudes } from '@/components/entretien/SectionSelectionAttitudes';
import { BlocSignaturesEntretien } from '@/components/entretien/BlocSignaturesEntretien';
import { BoutonExportPdf } from '@/components/pdf/BoutonExportPdf';
import { useDonneesLivretPdf } from '@/components/pdf/useDonneesLivretPdf';
import { creerSelectionVierge } from '@/lib/selection-competences-entreprise';

/**
 * Page Entretien tripartite (CDC §5.2 + chantier #2 mai 2026, étendu
 * juin 2026 : jusqu'à 4 entretiens pour les formations de 2 ans).
 *
 * Jusqu'à 4 entretiens par livret (E1..E4), accessibles via la route
 * `/livret/entretien/:numero`. Le nombre autorisé est défini par la
 * formation (`Formation.nombreEntretiens`) — un numéro au-delà rend un
 * NotFound. Chaque entretien est généré par un événement de motif
 * `entretien-tripartite-{N}` dans l'organisation du suivi — voir page
 * « Fiches de suivi ».
 *
 * Particularité E1 vs E2 :
 *   - **E1 uniquement** : auto-marquage de la sélection des compétences
 *     abordées en entreprise à la 3ᵉ signature (CDC v1.5 §12).
 *   - **E1 uniquement** : section « Sélection des compétences abordées
 *     en entreprise » affichée (E2 ne fige rien).
 *   - **R7 (alerte > 60 j)** : appliquée à E1 uniquement.
 */
export function EntretienTripartite() {
  const params = useParams();
  const ctx = useApprentiActif();
  const initialiser = useLivretStore((s) => s.initialiserEntretien);
  const roleActif = useUserStore((s) => s.roleActif);
  const formations = useFormationsStore((s) => s.formations);
  const donneesPdf = useDonneesLivretPdf();

  const numero = parseNumeroEntretien(params.numero);
  if (numero === null) return <NotFound />;

  if (!ctx) return <AucunApprentiSelectionne />;
  const { apprenti, livret } = ctx;
  const formation = formations[apprenti.formationId] ?? formationCapCuisine;
  // Le numéro demandé doit exister pour cette formation (juin 2026 : le
  // nombre d'entretiens est défini par le coordo au niveau formation).
  if (numero > formation.nombreEntretiens) return <NotFound />;
  const entretien = livret.entretiens[numero];
  // L'initialisation reste un acte pédagogique du formateur référent —
  // ressource dédiée depuis l'ouverture d'`organisation-suivi` au coordo.
  const peutInitialiser = peutEditer(roleActif, 'entretien.gestion');

  const titre = `Entretien tripartite n° ${numero}`;
  const isE1 = numero === 1;

  // Cas « pas encore initialisé » — bouton « Initialiser » pour le formateur.
  if (!entretien) {
    // Séquencement juin 2026 : l'entretien précédent doit être signé par
    // les 3 parties avant de pouvoir initialiser celui-ci.
    const sequencement = peutInitialiserEntretien(numero, livret.entretiens);
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">{titre}</h1>
          <p className="text-muted-foreground">
            {isE1
              ? "L'entretien doit avoir lieu dans les 60 jours suivant la signature du contrat (R7)."
              : "Bilan de suivi — à programmer selon l'organisation du suivi."}
          </p>
        </header>
        <div className="rounded-lg border border-border bg-card p-6 text-center space-y-3">
          <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground" aria-hidden="true" />
          <p className="text-sm">
            Cet entretien n'a pas encore été initialisé. Pensez à créer l'événement
            <strong> « Entretien Tripartite {numero} » </strong>
            depuis la page <em>Fiches de suivi</em> pour qu'il apparaisse dans la sidebar.
          </p>
          {peutInitialiser && !sequencement.ok && (
            <p
              role="alert"
              className="mx-auto max-w-md rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800"
            >
              {sequencement.raison}
            </p>
          )}
          {peutInitialiser && (
            <button
              type="button"
              disabled={!sequencement.ok}
              onClick={() => initialiser(livret.id, numero)}
              data-testid={`init-entretien-${numero}`}
              title={sequencement.ok ? undefined : sequencement.raison}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium',
                sequencement.ok
                  ? 'bg-role-formateur text-white hover:opacity-90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed',
              )}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Initialiser l'entretien {numero}
            </button>
          )}
        </div>
      </div>
    );
  }

  // R9 : 3 signatures → entretien figé pour tous
  const ficheVerrouillee =
    entretien.signatures.apprenti.signe &&
    entretien.signatures.maitre.signe &&
    entretien.signatures.formateur.signe;

  // R7 : alerte uniquement sur E1 (E2 = bilan mi-parcours, hors délai légal)
  const alerteR7 = isE1
    ? calculerAlerteR7(apprenti, entretien)
    : { declenchee: false, joursDepasses: 0, dateButoir: '' };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{titre}</h1>
          <p className="text-muted-foreground">
            {isE1
              ? "Entretien d'évaluation à tenir dans les 2 mois suivant la signature du contrat d'apprentissage (CDC §5.2)."
              : "Bilan mi-parcours — point d'étape sur la progression de l'apprenti·e."}
          </p>
        </div>
        {donneesPdf && (
          <BoutonExportPdf
            {...donneesPdf}
            variante={{ type: 'entretien', numero }}
            label="Exporter cet entretien"
          />
        )}
      </header>

      {isE1 && <BandeauAlerteR7 alerte={alerteR7} />}

      <EntretienHeader
        livretId={livret.id}
        numero={numero}
        apprenti={apprenti}
        formation={formation}
        entretien={entretien}
        ficheVerrouillee={ficheVerrouillee}
      />

      {/* La barre de progression repose sur les questions apprenti/maître ;
          E1 utilise la trame (récap d'alertes dédié) → masquée pour E1. */}
      {!isE1 && <EntretienProgression entretien={entretien} />}

      {/* La section « Sélection des compétences abordées en entreprise » est
          réservée à l'Entretien 1 (CDC v1.5 §12 — décision conjointe initiale
          figée à la 3ᵉ signature de E1). E2 = bilan mi-parcours, ne fige
          aucune sélection. */}
      {isE1 && (
        <SectionSelectionCompetences
          livretId={livret.id}
          apprenti={apprenti}
          selection={livret.selectionCompetencesEntreprise ?? creerSelectionVierge()}
          entretienVerrouille={ficheVerrouillee}
        />
      )}

      {/* Choix des attitudes professionnelles (13 juin 2026) — réservé à
          l'E1 : maître + formateur retiennent les attitudes qui seront
          évaluées à chaque entretien ; figé à la 3ᵉ signature de E1. */}
      {isE1 && <SectionSelectionAttitudes livret={livret} />}

      {/* E1 (« première visite ») : trame officielle GRETA (rubriques
          thématiques + grille enrichie + récap des alertes). Les entretiens
          2 à 4 conservent les sections apprenti / maître / formateur. */}
      {isE1 ? (
        <SectionTrameEntretien1
          livretId={livret.id}
          numero={numero}
          entretien={entretien}
          entretienVerrouille={ficheVerrouillee}
        />
      ) : (
        <>
          <SectionApprenti livretId={livret.id} numero={numero} entretien={entretien} />
          <SectionMaitre livretId={livret.id} numero={numero} entretien={entretien} />
          <SectionFormateur livretId={livret.id} numero={numero} entretien={entretien} />
        </>
      )}

      <BlocSignaturesEntretien
        livretId={livret.id}
        numero={numero}
        entretien={entretien}
        ficheVerrouillee={ficheVerrouillee}
      />
    </div>
  );
}

function parseNumeroEntretien(s: string | undefined): NumeroEntretien | null {
  if (s === '1') return 1;
  if (s === '2') return 2;
  if (s === '3') return 3;
  if (s === '4') return 4;
  return null;
}
