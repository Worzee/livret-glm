import { ClipboardList, Eye, Plus } from 'lucide-react';
import { entretienVierge, useLivretStore } from '@/store/useLivretStore';
import { useUserStore } from '@/store/useUserStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { peutEditer } from '@/lib/droits';
import { calculerAlerteR7 } from '@/lib/regles-entretien';
import { estMotifEntretienTripartite } from '@/lib/organisation-suivi';
import { formationCapCuisine } from '@/fixtures/formations';
import { AucunApprentiSelectionne } from '@/components/common/AucunApprentiSelectionne';
import { EntretienHeader } from '@/components/entretien/EntretienHeader';
import { BandeauAlerteR7 } from '@/components/entretien/BandeauAlerteR7';
import { SectionTrameEntretien } from '@/components/entretien/SectionTrameEntretien';
import { SectionSelectionCompetences } from '@/components/entretien/SectionSelectionCompetences';
import { SectionSelectionActivites } from '@/components/entretien/SectionSelectionActivites';
import { SectionSelectionAttitudes } from '@/components/entretien/SectionSelectionAttitudes';
import { useActivitesStore } from '@/store/useActivitesStore';
import { modeEffectif } from '@/lib/mode-evaluation';
import { BlocSignaturesEntretien } from '@/components/entretien/BlocSignaturesEntretien';
import { BoutonExportPdf } from '@/components/pdf/BoutonExportPdf';
import { useDonneesLivretPdf } from '@/components/pdf/useDonneesLivretPdf';
import { creerSelectionVierge } from '@/lib/selection-competences-entreprise';

/**
 * Page Entretien tripartite (CDC §5.2 + chantier #2 mai 2026).
 *
 * Juillet 2026 : l'entretien tripartite est **unique et obligatoire** — les
 * entretiens 2 à 4 ont été supprimés, le suivi ultérieur passe par les
 * fiches de suivi. Route `/livret/entretien`. L'entretien est généré par un
 * événement de motif `entretien-tripartite` dans l'organisation du suivi —
 * voir page « Fiches de suivi ».
 *
 *   - Auto-marquage de la sélection des compétences abordées en entreprise
 *     à la 3ᵉ signature (CDC v1.5 §12).
 *   - R7 (alerte > 60 j après le début du contrat).
 *   - Contenu : trame officielle GRETA (« première visite »).
 */
export function EntretienTripartite() {
  const ctx = useApprentiActif();
  const initialiser = useLivretStore((s) => s.initialiserEntretien);
  const roleActif = useUserStore((s) => s.roleActif);
  const formations = useFormationsStore((s) => s.formations);
  const modeles = useActivitesStore((s) => s.modeles);
  const donneesPdf = useDonneesLivretPdf();

  if (!ctx) return <AucunApprentiSelectionne />;
  const { apprenti, livret } = ctx;
  const formation = formations[apprenti.formationId] ?? formationCapCuisine;
  // Chantier #4 : en mode activités, la sélection §12 porte sur les
  // ACTIVITÉS du modèle de la formation (mêmes règles de validation).
  const modeleActivites =
    modeEffectif(formation) === 'activites' && formation.modeleActivitesId
      ? modeles[formation.modeleActivitesId]
      : undefined;
  const entretien = livret.entretien;
  // Initialisation ouverte au formateur référent, au coordo et à l'admin
  // (18 juin 2026 — la coordination peut amorcer un entretien).
  const peutInitialiser = peutEditer(roleActif, 'entretien.gestion');

  const titre = 'Entretien tripartite';

  // Aperçu lecture seule (1ᵉʳ juillet 2026 — réunion direction) : dès que
  // l'événement « Entretien Tripartite » existe dans les fiches de suivi,
  // l'entretien est consultable par tous en lecture seule ; l'initialisation
  // (formateur / coordo) ouvre la saisie.
  const evenementExiste = livret.organisationSuivi.evenements.some((evt) =>
    estMotifEntretienTripartite(evt.motif),
  );

  // Cas « pas d'événement ni d'entretien » — écran d'attente + bouton
  // « Initialiser » pour le formateur / coordo.
  if (!entretien && !evenementExiste) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">{titre}</h1>
          <p className="text-muted-foreground">
            L'entretien doit avoir lieu dans les 60 jours suivant la signature du contrat (R7).
          </p>
        </header>
        <div className="rounded-lg border border-border bg-card p-6 text-center space-y-3">
          <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground" aria-hidden="true" />
          <p className="text-sm">
            L'entretien n'a pas encore été initialisé. Pensez à créer l'événement
            <strong> « Entretien Tripartite » </strong>
            depuis la page <em>Fiches de suivi</em> pour qu'il apparaisse dans la sidebar.
          </p>
          {peutInitialiser && (
            <button
              type="button"
              onClick={() => initialiser(livret.id)}
              data-testid="init-entretien"
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-role-formateur text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Initialiser l'entretien
            </button>
          )}
        </div>
      </div>
    );
  }

  // Aperçu lecture seule : entretien non initialisé mais événement créé —
  // on affiche la structure vierge (non persistée) avec tous les champs
  // inertes via <fieldset disabled>.
  const apercu = !entretien;
  const entretienAffiche = entretien ?? entretienVierge();

  // R9 : 3 signatures → entretien figé pour tous
  const ficheVerrouillee =
    entretienAffiche.signatures.apprenti.signe &&
    entretienAffiche.signatures.maitre.signe &&
    entretienAffiche.signatures.formateur.signe;

  const alerteR7 = calculerAlerteR7(apprenti, entretienAffiche);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{titre}</h1>
          <p className="text-muted-foreground">
            Entretien d'évaluation à tenir dans les 2 mois suivant la signature du contrat
            d'apprentissage (CDC §5.2). Le suivi ultérieur passe par les fiches de suivi.
          </p>
        </div>
        {donneesPdf && !apercu && (
          <BoutonExportPdf
            {...donneesPdf}
            variante={{ type: 'entretien' }}
            label="Exporter cet entretien"
          />
        )}
      </header>

      {/* Bandeau d'aperçu (1ᵉʳ juillet 2026) : entretien consultable par tous
          dès que son événement de suivi existe ; la saisie s'ouvre à
          l'initialisation (formateur / coordo). */}
      {apercu && (
        <div
          role="note"
          data-testid="apercu-entretien"
          className="bandeau-info-couleur-role space-y-3 rounded-lg border p-4"
        >
          <div className="flex items-start gap-2 text-sm">
            <Eye className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              <strong>Consultation en lecture seule.</strong> L'entretien n'a pas encore été
              initialisé — les champs s'ouvriront à la saisie après initialisation par le formateur
              référent ou la coordination.
            </p>
          </div>
          {peutInitialiser && (
            <button
              type="button"
              onClick={() => initialiser(livret.id)}
              data-testid="init-entretien"
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-role-formateur text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Initialiser l'entretien
            </button>
          )}
        </div>
      )}

      <BandeauAlerteR7 alerte={alerteR7} />

      {/* En aperçu, le fieldset désactive nativement tous les champs et
          boutons des sections — aucun composant enfant à modifier. */}
      <fieldset disabled={apercu} className="m-0 min-w-0 space-y-6 border-0 p-0">
        <EntretienHeader
          livretId={livret.id}
          apprenti={apprenti}
          formation={formation}
          entretien={entretienAffiche}
          ficheVerrouillee={ficheVerrouillee}
        />

        {/* Sélection « entreprise » (CDC v1.5 §12 — décision conjointe figée
            à la 3ᵉ signature de l'entretien). En mode activités (chantier
            #4), la section porte sur les activités du modèle. */}
        {modeleActivites ? (
          <SectionSelectionActivites
            livretId={livret.id}
            apprenti={apprenti}
            modele={modeleActivites}
            selection={livret.selectionActivitesEntreprise ?? creerSelectionVierge()}
            entretienVerrouille={ficheVerrouillee}
          />
        ) : (
          <SectionSelectionCompetences
            livretId={livret.id}
            apprenti={apprenti}
            selection={livret.selectionCompetencesEntreprise ?? creerSelectionVierge()}
            entretienVerrouille={ficheVerrouillee}
          />
        )}

        {/* Choix des attitudes professionnelles (13 juin 2026) : maître +
            formateur retiennent les attitudes évaluées pendant l'entretien ;
            figé à la 3ᵉ signature. */}
        <SectionSelectionAttitudes livret={livret} />

        {/* Trame officielle GRETA (« première visite ») : rubriques
            thématiques + grille enrichie + récap des alertes. */}
        <SectionTrameEntretien
          livretId={livret.id}
          entretien={entretienAffiche}
          entretienVerrouille={ficheVerrouillee}
        />
      </fieldset>

      {/* Les signatures n'ont pas de sens avant l'initialisation — le bandeau
          d'aperçu les remplace. */}
      {!apercu && (
        <BlocSignaturesEntretien
          livretId={livret.id}
          entretien={entretienAffiche}
          ficheVerrouillee={ficheVerrouillee}
        />
      )}
    </div>
  );
}
