import { useState } from 'react';
import { Activity, Target } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { peutEditer } from '@/lib/droits';
import { libelleRole } from '@/lib/droits';
import { referentielCapCuisine } from '@/fixtures/referentiel-cap-cuisine';
import {
  formatriceSophieDubois,
  getMaitreById,
  maitreKarimBenali,
} from '@/fixtures/utilisateurs';
import { formationsDemo, formationCapCuisine } from '@/fixtures/formations';
import { GrilleCompetences } from '@/components/evaluation/GrilleCompetences';
import { GrilleAttitudes } from '@/components/evaluation/GrilleAttitudes';
import { BandeauCloture } from '@/components/evaluation/BandeauCloture';
import { BoutonExportPdf } from '@/components/pdf/BoutonExportPdf';
import { AucunApprentiSelectionne } from '@/components/common/AucunApprentiSelectionne';
import { cn } from '@/lib/utils';

/**
 * Page Évaluation finale (CDC §5.4 et §5.5).
 *
 * Deux onglets :
 *   - Compétences (avec synthèse graphique par bloc)
 *   - Attitudes professionnelles
 *
 * R24 : consultable par tous les rôles, mode lecture si non-éditeur (la seule
 * différence est l'édition des cellules, gérée par chaque grille).
 */

type Onglet = 'competences' | 'attitudes';

export function EvaluationFinale() {
  const [onglet, setOnglet] = useState<Onglet>('competences');
  const roleActif = useUserStore((s) => s.roleActif);
  const ctx = useApprentiActif();

  if (!ctx) return <AucunApprentiSelectionne />;
  const { apprenti, livret } = ctx;
  const formation = formationsDemo[apprenti.formationId] ?? formationCapCuisine;
  const maitre = getMaitreById(apprenti.maitreApprentissageId) ?? maitreKarimBenali;

  const aDroitEdition =
    peutEditer(roleActif, 'grille-competences.entreprise') ||
    peutEditer(roleActif, 'grille-competences.centre') ||
    peutEditer(roleActif, 'grille-attitudes.maitre') ||
    peutEditer(roleActif, 'grille-attitudes.formateur');

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Évaluation finale</h1>
          <p className="text-muted-foreground">
            Bilan de fin de formation — synthèse des compétences acquises et des attitudes
            professionnelles. Les valeurs non saisies héritent des évaluations des fiches de suivi
            par période.
          </p>
          <p className="text-xs text-muted-foreground">
            Apprenti·e : <strong>{apprenti.prenom} {apprenti.nom}</strong>
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
          formateur={formatriceSophieDubois}
          formation={formation}
          referentiel={referentielCapCuisine}
        />
      </header>

      <BandeauCloture livret={livret} />

      <div role="tablist" aria-label="Sections de l'évaluation finale" className="border-b border-border">
        <Onglet titre="Compétences" Icon={Target} actif={onglet === 'competences'} onClick={() => setOnglet('competences')} />
        <Onglet titre="Attitudes professionnelles" Icon={Activity} actif={onglet === 'attitudes'} onClick={() => setOnglet('attitudes')} />
      </div>

      <div role="tabpanel">
        {onglet === 'competences' && <GrilleCompetences referentiel={referentielCapCuisine} />}
        {onglet === 'attitudes' && <GrilleAttitudes referentiel={referentielCapCuisine} />}
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
        actif
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {titre}
    </button>
  );
}
