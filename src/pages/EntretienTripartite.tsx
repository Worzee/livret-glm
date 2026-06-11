import { ClipboardList, Plus } from 'lucide-react';
import { useParams } from 'react-router-dom';
import type { NumeroEntretien } from '@/types';
import { useLivretStore } from '@/store/useLivretStore';
import { useUserStore } from '@/store/useUserStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { peutEditer } from '@/lib/droits';
import { calculerAlerteR7 } from '@/lib/regles-entretien';
import { formationCapCuisine } from '@/fixtures/formations';
import { AucunApprentiSelectionne } from '@/components/common/AucunApprentiSelectionne';
import { NotFound } from '@/pages/NotFound';
import { EntretienHeader } from '@/components/entretien/EntretienHeader';
import { EntretienProgression } from '@/components/entretien/EntretienProgression';
import { BandeauAlerteR7 } from '@/components/entretien/BandeauAlerteR7';
import { SectionApprenti } from '@/components/entretien/SectionApprenti';
import { SectionMaitre } from '@/components/entretien/SectionMaitre';
import { SectionFormateur } from '@/components/entretien/SectionFormateur';
import { SectionSelectionCompetences } from '@/components/entretien/SectionSelectionCompetences';
import { BlocSignaturesEntretien } from '@/components/entretien/BlocSignaturesEntretien';
import { creerSelectionVierge } from '@/lib/selection-competences-entreprise';

/**
 * Page Entretien tripartite (CDC §5.2 + chantier #2 mai 2026).
 *
 * Refonte : 2 entretiens par livret (E1, E2), accessibles via la route
 * `/livret/entretien/:numero`. Chaque entretien est généré par un
 * événement de motif `entretien-tripartite-{1|2}` dans l'organisation
 * du suivi — voir page « Fiches de suivi ».
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

  const numero = parseNumeroEntretien(params.numero);
  if (numero === null) return <NotFound />;

  if (!ctx) return <AucunApprentiSelectionne />;
  const { apprenti, livret } = ctx;
  const formation = formations[apprenti.formationId] ?? formationCapCuisine;
  const entretien = numero === 1 ? livret.entretien1 : livret.entretien2;
  const peutInitialiser = peutEditer(roleActif, 'organisation-suivi');

  const titre = `Entretien tripartite n° ${numero}`;
  const isE1 = numero === 1;

  // Cas « pas encore initialisé » — bouton « Initialiser » pour le formateur.
  if (!entretien) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">{titre}</h1>
          <p className="text-muted-foreground">
            {isE1
              ? "L'entretien doit avoir lieu dans les 60 jours suivant la signature du contrat (R7)."
              : 'Bilan mi-parcours — à programmer selon l\'organisation du suivi.'}
          </p>
        </header>
        <div className="rounded-lg border border-border bg-card p-6 text-center space-y-3">
          <ClipboardList
            className="h-10 w-10 mx-auto text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm">
            Cet entretien n'a pas encore été initialisé. Pensez à créer l'événement
            <strong> « Entretien Tripartite {numero} » </strong>
            depuis la page <em>Fiches de suivi</em> pour qu'il apparaisse dans la sidebar.
          </p>
          {peutInitialiser && (
            <button
              type="button"
              onClick={() => initialiser(livret.id, numero)}
              data-testid={`init-entretien-${numero}`}
              className="inline-flex items-center gap-2 rounded-md bg-role-formateur px-4 py-2 text-sm font-medium text-white hover:opacity-90"
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
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{titre}</h1>
        <p className="text-muted-foreground">
          {isE1
            ? "Entretien d'évaluation à tenir dans les 2 mois suivant la signature du contrat d'apprentissage (CDC §5.2)."
            : "Bilan mi-parcours — point d'étape sur la progression de l'apprenti·e."}
        </p>
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

      <EntretienProgression entretien={entretien} />

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

      <SectionApprenti livretId={livret.id} numero={numero} entretien={entretien} />
      <SectionMaitre livretId={livret.id} numero={numero} entretien={entretien} />
      <SectionFormateur livretId={livret.id} numero={numero} entretien={entretien} />

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
  return null;
}
