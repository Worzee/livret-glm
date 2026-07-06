import { useState } from 'react';
import { Activity, Target } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { useReferentielsStore } from '@/store/useReferentielsStore';
import { useEtablissementsStore } from '@/store/useEtablissementsStore';
import { useAttitudesStore } from '@/store/useAttitudesStore';
import { useActivitesStore } from '@/store/useActivitesStore';
import { peutEditer } from '@/lib/droits';
import { modeEffectif } from '@/lib/mode-evaluation';
import { referentielEvaluable } from '@/lib/limite-referentiel';
import { libelleRole } from '@/lib/droits';
import { referentielCapCuisine } from '@/fixtures/referentiel-cap-cuisine';
import { formatriceSophieDubois, maitreKarimBenali } from '@/fixtures/utilisateurs';
import { getMaitreByIdFromStore } from '@/store/useUtilisateursStore';
import { formationCapCuisine } from '@/fixtures/formations';
import { GrilleCompetences } from '@/components/evaluation/GrilleCompetences';
import { SyntheseAttitudes } from '@/components/evaluation/SyntheseAttitudes';
import { BandeauCloture } from '@/components/evaluation/BandeauCloture';
import { BoutonExportPdf } from '@/components/pdf/BoutonExportPdf';
import { AucunApprentiSelectionne } from '@/components/common/AucunApprentiSelectionne';
import { cn } from '@/lib/utils';

/**
 * Page Synthèse (CDC §5.4 et §5.5 — anciennement « Évaluation finale »,
 * renommée en juillet 2026, chantier référentiels/compétences #3).
 *
 * Deux onglets :
 *   - Compétences abordées en stage (sélection entreprise, avec synthèse
 *     graphique par bloc — colonne unique « Acquis en entreprise »)
 *   - Attitudes professionnelles — agrégation en lecture seule des
 *     évaluations portées à chaque période en entreprise (juillet 2026)
 *
 * R24 : consultable par tous les rôles, mode lecture si non-éditeur (la seule
 * différence est l'édition des cellules, gérée par la grille).
 */

type Onglet = 'competences' | 'attitudes';

export function Synthese() {
  const [onglet, setOnglet] = useState<Onglet>('competences');
  const roleActif = useUserStore((s) => s.roleActif);
  const formations = useFormationsStore((s) => s.formations);
  const referentiels = useReferentielsStore((s) => s.referentiels);
  const etablissements = useEtablissementsStore((s) => s.etablissements);
  const attitudesMap = useAttitudesStore((s) => s.attitudes);
  const modeles = useActivitesStore((s) => s.modeles);
  const ctx = useApprentiActif();

  if (!ctx) return <AucunApprentiSelectionne />;
  const { apprenti, livret } = ctx;
  const formation = formations[apprenti.formationId] ?? formationCapCuisine;
  // Résolution du référentiel via la formation. Fallback sur le CAP Cuisine
  // si la formation n'a pas (encore) de référentiel défini ou si l'id pointe
  // vers un référentiel supprimé — comportement raisonnable pour la maquette.
  // Filtré des compétences exclues (limite des lignes évaluables).
  const referentiel = referentielEvaluable(
    referentiels[formation.referentielId] ?? referentielCapCuisine,
  );
  // Chantier #4 : en mode activités, la grille reste PAR COMPÉTENCES mais
  // s'alimente par la projection des activités évaluées sur les fiches.
  const modeleActivites =
    modeEffectif(formation) === 'activites' && formation.modeleActivitesId
      ? modeles[formation.modeleActivitesId]
      : undefined;
  const etablissement = etablissements[formation.lieuId];
  const maitre = getMaitreByIdFromStore(apprenti.maitreApprentissageId) ?? maitreKarimBenali;
  const maitreSecond = apprenti.maitreApprentissageSecondId
    ? getMaitreByIdFromStore(apprenti.maitreApprentissageSecondId)
    : undefined;

  // Les attitudes ne se saisissent plus ici (synthèse lecture seule) — seule
  // la grille des compétences entreprise reste éditable (maître / tuteur).
  const aDroitEdition = peutEditer(roleActif, 'grille-competences.entreprise');

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Synthèse</h1>
          <p className="text-muted-foreground">
            {modeleActivites
              ? 'Synthèse par compétences, alimentée par les activités évaluées en période (formation en mode activités), et attitudes professionnelles.'
              : 'Synthèse des compétences abordées en stage et des attitudes professionnelles. Les valeurs non saisies héritent des évaluations des fiches de suivi par période.'}
          </p>
          <p className="text-xs text-muted-foreground">
            Apprenti·e :{' '}
            <strong>
              {apprenti.prenom} {apprenti.nom}
            </strong>
          </p>
          {!aDroitEdition && (
            <p className="text-xs text-muted-foreground italic">
              Vous consultez en mode <strong>{libelleRole(roleActif)}</strong> — toutes les cellules
              sont en lecture seule.
            </p>
          )}
        </div>
        <BoutonExportPdf
          livret={livret}
          apprenti={apprenti}
          maitre={maitre}
          maitreSecond={maitreSecond}
          formateur={formatriceSophieDubois}
          formation={formation}
          referentiel={referentiel}
          etablissement={etablissement}
          attitudes={Object.values(attitudesMap)}
          modeleActivites={modeleActivites}
        />
      </header>

      <BandeauCloture livret={livret} />

      <div role="tablist" aria-label="Sections de la synthèse" className="border-b border-border">
        <Onglet
          titre="Compétences"
          Icon={Target}
          actif={onglet === 'competences'}
          onClick={() => setOnglet('competences')}
        />
        <Onglet
          titre="Attitudes professionnelles"
          Icon={Activity}
          actif={onglet === 'attitudes'}
          onClick={() => setOnglet('attitudes')}
        />
      </div>

      <div role="tabpanel">
        {onglet === 'competences' && (
          <GrilleCompetences referentiel={referentiel} modeleActivites={modeleActivites} />
        )}
        {onglet === 'attitudes' && <SyntheseAttitudes />}
      </div>
    </div>
  );
}

interface OngletProps {
  titre: string;
  Icon: typeof Target;
  actif: boolean;
  onClick: () => void;
}

function Onglet({ titre, Icon, actif, onClick }: OngletProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={actif}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        // Onglet actif : suit la couleur du rôle actif via la variable --ring
        // (équilibrage graphique mai 2026).
        actif
          ? 'texte-couleur-role border-b-[hsl(var(--ring))]'
          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {titre}
    </button>
  );
}
