import { useEffect } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { useLivretStore } from '@/store/useLivretStore';
import { useUserStore } from '@/store/useUserStore';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { peutEditer } from '@/lib/droits';
import { calculerAlerteR7 } from '@/lib/regles-entretien';
import { formationsDemo, formationCapCuisine } from '@/fixtures/formations';
import { AucunApprentiSelectionne } from '@/components/common/AucunApprentiSelectionne';
import { EntretienHeader } from '@/components/entretien/EntretienHeader';
import { EntretienProgression } from '@/components/entretien/EntretienProgression';
import { BandeauAlerteR7 } from '@/components/entretien/BandeauAlerteR7';
import { SectionApprenti } from '@/components/entretien/SectionApprenti';
import { SectionMaitre } from '@/components/entretien/SectionMaitre';
import { SectionFormateur } from '@/components/entretien/SectionFormateur';
import { BlocSignaturesEntretien } from '@/components/entretien/BlocSignaturesEntretien';

/**
 * Page Entretien tripartite (CDC §5.2).
 *
 * Orchestre l'ensemble des sections, en respectant :
 *   - R6  : un seul entretien par livret (initialisation idempotente)
 *   - R7  : bandeau d'alerte si > 60 j sans entretien complet
 *   - R8  : verrouillage de la section d'un rôle dès qu'il a signé
 *   - R9  : verrouillage total dès 3 signatures
 *   - Barre de progression globale + par rôle
 */
export function EntretienTripartite() {
  const ctx = useApprentiActif();
  const initialiser = useLivretStore((s) => s.initialiserEntretien);
  const roleActif = useUserStore((s) => s.roleActif);

  // R6 : pas d'auto-initialisation. L'entretien doit être créé par un acte
  // explicite (clic « Initialiser ») pour préserver l'alerte R7 dans les cas
  // démonstratifs où l'entretien manque volontairement (ex: Sofia PEREIRA).
  // Note : `useEffect` reste là pour respecter les règles des hooks (toujours
  // appelé dans le même ordre), mais ne fait rien désormais.
  useEffect(() => {}, []);

  if (!ctx) return <AucunApprentiSelectionne />;
  const { apprenti, livret } = ctx;
  const formation = formationsDemo[apprenti.formationId] ?? formationCapCuisine;
  const entretien = livret.entretienTripartite;
  const peutInitialiser = peutEditer(roleActif, 'organisation-suivi');

  // Pas d'entretien : seul un rôle pédagogique (formateur en pratique) peut
  // l'initialiser via un clic explicite. L'effet ci-dessus le fait
  // automatiquement en mode démo, mais on garde un fallback explicite.
  if (!entretien) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Entretien tripartite</h1>
          <p className="text-muted-foreground">
            L'entretien doit avoir lieu dans les 60 jours suivant la signature du contrat (R7).
          </p>
        </header>
        <div className="rounded-lg border border-border bg-card p-6 text-center space-y-3">
          <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground" aria-hidden="true" />
          <p className="text-sm">Aucun entretien tripartite n'a encore été initialisé.</p>
          {peutInitialiser && (
            <button
              type="button"
              onClick={() => initialiser(livret.id)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Initialiser l'entretien
            </button>
          )}
        </div>
      </div>
    );
  }

  // R9 : 3 signatures → fiche figée pour tous
  const ficheVerrouillee =
    entretien.signatures.apprenti.signe &&
    entretien.signatures.maitre.signe &&
    entretien.signatures.formateur.signe;

  // R7 : alerte si délai dépassé
  const alerteR7 = calculerAlerteR7(apprenti, entretien);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Entretien tripartite</h1>
        <p className="text-muted-foreground">
          Entretien d'évaluation à tenir dans les 2 mois suivant la signature du contrat
          d'apprentissage (CDC §5.2).
        </p>
      </header>

      <BandeauAlerteR7 alerte={alerteR7} />

      <EntretienHeader
        livretId={livret.id}
        apprenti={apprenti}
        formation={formation}
        entretien={entretien}
        ficheVerrouillee={ficheVerrouillee}
      />

      <EntretienProgression entretien={entretien} />

      <SectionApprenti livretId={livret.id} entretien={entretien} />
      <SectionMaitre livretId={livret.id} entretien={entretien} />
      <SectionFormateur livretId={livret.id} entretien={entretien} />

      <BlocSignaturesEntretien
        livretId={livret.id}
        entretien={entretien}
        ficheVerrouillee={ficheVerrouillee}
      />
    </div>
  );
}
