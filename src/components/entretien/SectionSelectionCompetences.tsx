import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ListChecks, Lock, RotateCcw, X } from 'lucide-react';
import type { Apprenti, Competence, Referentiel, SelectionCompetencesEntreprise } from '@/types';
import { useLivretStore } from '@/store/useLivretStore';
import { useUserStore } from '@/store/useUserStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { useReferentielsStore } from '@/store/useReferentielsStore';
import { useUtilisateursStore } from '@/store/useUtilisateursStore';
import { libelleRole, peutEditer } from '@/lib/droits';
import { estSelectionnee, estValidee } from '@/lib/selection-competences-entreprise';
import { grouperParSousFamille } from '@/lib/grouper-competences';
import {
  LONGUEUR_MAX_MOTIF,
  LONGUEUR_MIN_MOTIF,
  validerMotifDeverrouillage,
} from '@/lib/deverrouillage-fiche';
import { referentielCapCuisine } from '@/fixtures/referentiel-cap-cuisine';
import { cn } from '@/lib/utils';

/**
 * Section « Compétences abordées en entreprise » dans l'entretien tripartite.
 * Référence : CDC v1.5 addendum (mai 2026).
 *
 * 13 juin 2026 : toutes les compétences sont activées par défaut.
 * 1ᵉʳ juillet 2026 (réunion direction) : le **maître / tuteur ET le formateur
 * référent** décochent celles non abordées en entreprise. La sélection est
 * figée automatiquement à la 3ᵉ signature de l'entretien (cf.
 * `useLivretStore.signerEntretien`). Une fois validée, seul le formateur
 * référent peut l'invalider via un motif R10.
 */

interface SectionSelectionCompetencesProps {
  livretId: string;
  apprenti: Apprenti;
  selection: SelectionCompetencesEntreprise;
  /** Vrai si les 3 signatures de l'entretien sont posées (R9). */
  entretienVerrouille: boolean;
}

export function SectionSelectionCompetences({
  livretId,
  apprenti,
  selection,
  entretienVerrouille,
}: SectionSelectionCompetencesProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const utilisateurActif = useUserStore((s) => s.utilisateurActif);
  const formations = useFormationsStore((s) => s.formations);
  const referentiels = useReferentielsStore((s) => s.referentiels);
  const utilisateurs = useUtilisateursStore.getState();
  const toggleCompetence = useLivretStore((s) => s.toggleSelectionCompetenceEntreprise);
  const invalider = useLivretStore((s) => s.invaliderSelectionCompetencesEntreprise);

  const [dialogOuverte, setDialogOuverte] = useState(false);

  // Résolution du référentiel courant — fallback CAP Cuisine cohérent avec
  // TableauTriColonnes / GrilleCompetences.
  const referentiel: Referentiel = useMemo(() => {
    const formation = formations[apprenti.formationId];
    return (formation && referentiels[formation.referentielId]) ?? referentielCapCuisine;
  }, [apprenti.formationId, formations, referentiels]);

  const validee = estValidee(selection);
  const peutCoEditer =
    !validee && peutEditer(roleActif, 'entretien.selection-competences-entreprise');
  const peutInvalider = validee && peutEditer(roleActif, 'fiche.deverrouiller');

  const totalCompetences = referentiel.blocs.reduce((n, b) => n + b.competences.length, 0);
  const nbCochees = selection.ids.length;

  return (
    <section className="space-y-3" aria-labelledby="titre-selection-competences">
      <header className="space-y-1">
        <h2
          id="titre-selection-competences"
          className="text-lg font-medium flex items-center gap-2"
        >
          <ListChecks className="h-5 w-5 texte-couleur-role" aria-hidden="true" />
          Compétences abordées en entreprise
        </h2>
        <p className="text-xs text-muted-foreground">
          Toutes les compétences sont activées par défaut. Le <strong>maître / tuteur</strong> et
          le <strong>formateur référent</strong> décochent celles qui ne seront pas abordées sur le
          terrain. La sélection sera figée à la 3<sup>ᵉ</sup> signature de l'entretien.
        </p>
      </header>

      <BadgeStatut
        selection={selection}
        nbCochees={nbCochees}
        totalCompetences={totalCompetences}
        formateurNom={nomUtilisateur(utilisateurs.formateurs[apprenti.formateurReferentId])}
        maitreNom={nomUtilisateur(utilisateurs.maitres[apprenti.maitreApprentissageId])}
      />

      <div className="rounded-lg border border-border bg-card">
        {referentiel.blocs.map((bloc, idxBloc) => (
          <div
            key={bloc.id}
            className={cn('p-3 space-y-2', idxBloc > 0 && 'border-t border-border')}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {bloc.libelle}
            </p>
            {grouperParSousFamille(bloc).map((g, i) => (
              <div key={g.sousFamille ?? `__plat-${i}`} className={cn(g.sousFamille && 'mt-1')}>
                {g.sousFamille && (
                  <p className="text-xs font-medium text-foreground/70">{g.sousFamille}</p>
                )}
                <ul className={cn('space-y-1', g.sousFamille && 'ml-3 border-l border-border pl-2')}>
                  {g.competences.map((c) => (
                    <CompetenceCase
                      key={c.id}
                      competence={c}
                      cochee={estSelectionnee(selection, c.id)}
                      editable={peutCoEditer}
                      onToggle={() => toggleCompetence(livretId, c.id)}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>

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

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

function nomUtilisateur(u?: { prenom: string; nom: string }): string {
  return u ? `${u.prenom} ${u.nom}` : 'Personne non rattachée';
}

interface BadgeStatutProps {
  selection: SelectionCompetencesEntreprise;
  nbCochees: number;
  totalCompetences: number;
  formateurNom: string;
  maitreNom: string;
}

function BadgeStatut({
  selection,
  nbCochees,
  totalCompetences,
  formateurNom,
  maitreNom,
}: BadgeStatutProps) {
  if (estValidee(selection) && selection.validePar) {
    const date = new Date(selection.validePar.dateIso).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    return (
      <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        <Lock className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="font-medium">
            Sélection validée — {nbCochees} compétence{nbCochees > 1 ? 's' : ''} sur{' '}
            {totalCompetences}
          </p>
          <p className="text-xs">
            Figée le {date} par {formateurNom} (formateur référent) et {maitreNom} (maître /
            tuteur).
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <p className="font-medium">
          Sélection en cours — {nbCochees} compétence{nbCochees > 1 ? 's' : ''} sur{' '}
          {totalCompetences}
        </p>
        <p className="text-xs">
          La sélection sera figée automatiquement à la 3<sup>ᵉ</sup> signature de l'entretien.
        </p>
      </div>
    </div>
  );
}

interface CompetenceCaseProps {
  competence: Competence;
  cochee: boolean;
  editable: boolean;
  onToggle: () => void;
}

function CompetenceCase({ competence, cochee, editable, onToggle }: CompetenceCaseProps) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <input
        type="checkbox"
        checked={cochee}
        disabled={!editable}
        onChange={onToggle}
        aria-label={`Compétence ${competence.libelle} abordée en entreprise`}
        data-testid={`selection-comp-${competence.id}`}
        className="mt-1 h-4 w-4 rounded border-input accent-[hsl(var(--ring))] focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
      <span
        className={cn(
          'flex-1',
          !cochee && 'text-muted-foreground',
          !editable && 'cursor-not-allowed',
        )}
      >
        {competence.libelle}
      </span>
    </li>
  );
}

function HistoriqueInvalidations({ selection }: { selection: SelectionCompetencesEntreprise }) {
  return (
    <details className="rounded-md border border-border bg-secondary/30 p-3 text-xs">
      <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
        Historique des invalidations ({selection.historiqueInvalidations.length})
      </summary>
      <ol className="mt-2 space-y-2 pl-2">
        {selection.historiqueInvalidations.map((e) => (
          <li key={e.id} className="border-l-2 border-border pl-2">
            <p className="font-medium">
              <time dateTime={e.dateIso}>
                {new Date(e.dateIso).toLocaleString('fr-FR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </time>{' '}
              — {e.auteurNom} ({libelleRole(e.auteurRole)})
            </p>
            <p className="text-muted-foreground italic">« {e.motif} »</p>
          </li>
        ))}
      </ol>
    </details>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dialog d'invalidation R10
// ─────────────────────────────────────────────────────────────────────────────

interface DialogInvaliderSelectionProps {
  ouvert: boolean;
  onAnnuler: () => void;
  onConfirmer: (motif: string) => void;
}

function DialogInvaliderSelection({
  ouvert,
  onAnnuler,
  onConfirmer,
}: DialogInvaliderSelectionProps) {
  const [motif, setMotif] = useState('');
  const [tentativeSoumission, setTentativeSoumission] = useState(false);
  const titreId = useId();
  const motifId = useId();
  const erreurId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ouvert) {
      setMotif('');
      setTentativeSoumission(false);
      const t = setTimeout(() => textareaRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [ouvert]);

  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onAnnuler();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ouvert, onAnnuler]);

  if (!ouvert) return null;

  const validation = validerMotifDeverrouillage(motif);
  const afficherErreur = tentativeSoumission && !validation.ok;
  const longueur = motif.trim().length;

  function soumettre() {
    setTentativeSoumission(true);
    if (validation.ok) {
      onConfirmer(motif.trim());
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titreId}
    >
      <button
        type="button"
        aria-label="Fermer la modale"
        onClick={onAnnuler}
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
      />
      <div className="relative w-full max-w-lg rounded-lg border border-border bg-card shadow-lg">
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <div>
              <h2 id={titreId} className="text-lg font-semibold">
                Modifier la sélection des compétences en entreprise
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Un motif explicite est obligatoire pour la traçabilité.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onAnnuler}
            aria-label="Fermer"
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <strong>Attention.</strong> La sélection actuelle sera <strong>invalidée</strong>{' '}
            (validation conjointe retirée). Vous pourrez ensuite la modifier avant qu'une nouvelle
            validation conjointe ne soit apposée. Les fiches et la grille finale s'aligneront sur la
            nouvelle sélection (les saisies existantes restent visibles).
          </div>

          <label htmlFor={motifId} className="text-sm font-medium">
            Motif de la modification <span className="text-red-600">*</span>
          </label>
          <textarea
            id={motifId}
            ref={textareaRef}
            rows={4}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Ex. : ajout des compétences de pâtisserie suite à un changement de poste en entreprise."
            aria-invalid={afficherErreur}
            aria-describedby={afficherErreur ? erreurId : undefined}
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            maxLength={LONGUEUR_MAX_MOTIF + 50}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Minimum {LONGUEUR_MIN_MOTIF} caractères, maximum {LONGUEUR_MAX_MOTIF}.
            </span>
            <span aria-live="polite">
              {longueur} caractère{longueur > 1 ? 's' : ''}
            </span>
          </div>
          {afficherErreur && (
            <p id={erreurId} role="alert" className="text-sm text-red-700">
              {validation.raison}
            </p>
          )}
        </div>

        <div className="flex flex-row-reverse items-center gap-2 border-t border-border bg-secondary/30 p-3">
          <button
            type="button"
            onClick={soumettre}
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Confirmer la modification
          </button>
          <button
            type="button"
            onClick={onAnnuler}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
