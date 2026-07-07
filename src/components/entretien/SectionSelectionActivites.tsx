import { useState } from 'react';
import { CheckCircle2, ListChecks, Lock, RotateCcw } from 'lucide-react';
import type { Activite, Apprenti, ModeleActivites, SelectionActivitesEntreprise } from '@/types';
import { useLivretStore } from '@/store/useLivretStore';
import { useUserStore } from '@/store/useUserStore';
import { useUtilisateursStore } from '@/store/useUtilisateursStore';
import { peutEditer } from '@/lib/droits';
import { estSelectionnee, estValidee } from '@/lib/selection-competences-entreprise';
import { DialogInvaliderSelection, HistoriqueInvalidations } from './SectionSelectionCompetences';
import { cn } from '@/lib/utils';

/**
 * Section « Activités prévues en entreprise » dans l'entretien tripartite —
 * remplace la sélection des compétences pour les formations en mode
 * activités (juillet 2026 — chantier référentiels/compétences #4, arbitrage
 * pilote Q4 : mêmes règles que la sélection de compétences).
 *
 * Toutes les activités du modèle sont cochées par défaut ; le maître /
 * tuteur et le formateur référent décochent celles non prévues sur le
 * terrain. La sélection se fige à la 3ᵉ signature de l'entretien (cf.
 * `useLivretStore.signerEntretien`) ; une fois validée, seul le formateur
 * référent peut l'invalider via un motif R10. La grille « Synthèse » se
 * restreint aux compétences couvertes par les activités retenues.
 */

interface SectionSelectionActivitesProps {
  livretId: string;
  apprenti: Apprenti;
  /** Modèle d'activités de la formation (résolu côté page). */
  modele: ModeleActivites;
  selection: SelectionActivitesEntreprise;
  /** Vrai si les 3 signatures de l'entretien sont posées (R9). */
  entretienVerrouille: boolean;
}

export function SectionSelectionActivites({
  livretId,
  apprenti,
  modele,
  selection,
  entretienVerrouille,
}: SectionSelectionActivitesProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const utilisateurActif = useUserStore((s) => s.utilisateurActif);
  const utilisateurs = useUtilisateursStore.getState();
  const toggleActivite = useLivretStore((s) => s.toggleSelectionActiviteEntreprise);
  const invalider = useLivretStore((s) => s.invaliderSelectionActivitesEntreprise);

  const [dialogOuverte, setDialogOuverte] = useState(false);

  const validee = estValidee(selection);
  // Mêmes rôles que la sélection de compétences (maître + formateur).
  const peutCoEditer =
    !validee && peutEditer(roleActif, 'entretien.selection-competences-entreprise');
  const peutInvalider = validee && peutEditer(roleActif, 'fiche.deverrouiller');

  const totalActivites = modele.activites.length;
  const nbCochees = selection.ids.length;

  const formateurNom = nomUtilisateur(utilisateurs.formateurs[apprenti.formateurReferentId]);
  const maitreNom = nomUtilisateur(utilisateurs.maitres[apprenti.maitreApprentissageId]);

  return (
    <section className="space-y-3" aria-labelledby="titre-selection-activites">
      <header className="space-y-1">
        <h2 id="titre-selection-activites" className="text-lg font-medium flex items-center gap-2">
          <ListChecks className="h-5 w-5 texte-couleur-role" aria-hidden="true" />
          Activités prévues en entreprise
        </h2>
        <p className="text-xs text-muted-foreground">
          Cette formation est évaluée <strong>par activités</strong>. Toutes les activités du modèle
          sont activées par défaut ; le <strong>maître / tuteur</strong> et le{' '}
          <strong>formateur référent</strong> décochent celles qui ne seront pas confiées sur le
          terrain. La sélection sera figée à la 3<sup>ᵉ</sup> signature de l'entretien.
        </p>
      </header>

      {validee && selection.validePar ? (
        <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <Lock className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-medium">
              Sélection validée : {nbCochees} activité{nbCochees > 1 ? 's' : ''} sur{' '}
              {totalActivites}
            </p>
            <p className="text-xs">
              Figée le{' '}
              {new Date(selection.validePar.dateIso).toLocaleString('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}{' '}
              par {formateurNom} (formateur référent) et {maitreNom} (maître / tuteur).
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-medium">
              Sélection en cours : {nbCochees} activité{nbCochees > 1 ? 's' : ''} sur{' '}
              {totalActivites}
            </p>
            <p className="text-xs">
              La sélection sera figée automatiquement à la 3<sup>ᵉ</sup> signature de l'entretien.
            </p>
          </div>
        </div>
      )}

      <ul className="space-y-1 rounded-lg border border-border bg-card p-3">
        {modele.activites.map((a) => (
          <ActiviteCase
            key={a.id}
            activite={a}
            cochee={estSelectionnee(selection, a.id)}
            editable={peutCoEditer}
            onToggle={() => toggleActivite(livretId, a.id)}
          />
        ))}
      </ul>

      {peutInvalider && !entretienVerrouille && (
        <button
          type="button"
          onClick={() => setDialogOuverte(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Modifier la sélection (motif requis)
        </button>
      )}
      {peutInvalider && entretienVerrouille && (
        <p className="text-xs text-muted-foreground italic">
          L'entretien étant intégralement signé, la sélection ne peut plus être modifiée tant que
          l'entretien lui-même n'est pas déverrouillé.
        </p>
      )}

      {selection.historiqueInvalidations.length > 0 && (
        <HistoriqueInvalidations selection={selection} />
      )}

      <DialogInvaliderSelection
        ouvert={dialogOuverte}
        titre="Modifier la sélection des activités en entreprise"
        onAnnuler={() => setDialogOuverte(false)}
        onConfirmer={(motif) => {
          invalider(
            livretId,
            utilisateurActif.id,
            `${utilisateurActif.prenom} ${utilisateurActif.nom}`,
            roleActif,
            motif,
          );
          setDialogOuverte(false);
        }}
      />
    </section>
  );
}

function nomUtilisateur(u?: { prenom: string; nom: string }): string {
  return u ? `${u.prenom} ${u.nom}` : 'Personne non rattachée';
}

interface ActiviteCaseProps {
  activite: Activite;
  cochee: boolean;
  editable: boolean;
  onToggle: () => void;
}

function ActiviteCase({ activite, cochee, editable, onToggle }: ActiviteCaseProps) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <input
        type="checkbox"
        checked={cochee}
        disabled={!editable}
        onChange={onToggle}
        aria-label={`Activité ${activite.libelle} prévue en entreprise`}
        data-testid={`selection-act-${activite.id}`}
        className="mt-1 h-4 w-4 rounded border-input accent-[hsl(var(--ring))] focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
      <span
        className={cn(
          'flex-1',
          !cochee && 'text-muted-foreground',
          !editable && 'cursor-not-allowed',
        )}
      >
        {activite.libelle}
        {activite.description && (
          <span className="block text-xs text-muted-foreground">{activite.description}</span>
        )}
      </span>
    </li>
  );
}
