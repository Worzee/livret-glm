import { useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  Download,
  Gauge,
  GraduationCap,
  ListTodo,
  Lock,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { Activite, Formation, ModeleActivites, Referentiel, Role } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useActivitesStore } from '@/store/useActivitesStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { useReferentielsStore } from '@/store/useReferentielsStore';
import { libelleRole, peutEditer } from '@/lib/droits';
import { calculerBalayage } from '@/lib/balayage-referentiel';
import { modeEffectif } from '@/lib/mode-evaluation';
import { evaluerVerrouModeleActivites } from '@/lib/modele-activites-verrou';
import { referentielEvaluable } from '@/lib/limite-referentiel';
import {
  genererXlsxGabaritActivites,
  NOM_FICHIER_GABARIT_ACTIVITES,
} from '@/lib/modele-xlsx-activites';
import { ModaleImportModeleActivites } from '@/components/admin/ModaleImportModeleActivites';
import { cn } from '@/lib/utils';

/**
 * Page d'administration — modèles d'activités et mode d'évaluation
 * (juillet 2026 — chantier référentiels/compétences #4).
 *
 * Réservée aux rôles `coordo` et `admin` (matrice §6 — `admin.activites.gerer`).
 * Permet d'importer un modèle d'activités pour une formation, de mapper
 * chaque activité sur les compétences du référentiel (jauge de balayage),
 * puis — balayage complet — de basculer la formation en mode « activités ».
 * La bascule est verrouillée dès la première saisie signée dans la promo.
 */

export function GestionActivites() {
  const roleActif = useUserStore((s) => s.roleActif);
  const modeles = useActivitesStore((s) => s.modeles);
  const supprimerModele = useActivitesStore((s) => s.supprimerModele);
  const formations = useFormationsStore((s) => s.formations);
  const referentiels = useReferentielsStore((s) => s.referentiels);

  const [modaleImportOuverte, setModaleImportOuverte] = useState(false);
  const [confirmationSuppression, setConfirmationSuppression] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmationSuppression) return;
    const t = setTimeout(() => setConfirmationSuppression(null), 10_000);
    return () => clearTimeout(t);
  }, [confirmationSuppression]);

  const peutGerer = peutEditer(roleActif, 'admin.activites.gerer');

  const formationsListe = useMemo(() => Object.values(formations), [formations]);
  const liste = useMemo(
    () => Object.values(modeles).sort((a, b) => a.nom.localeCompare(b.nom, 'fr-FR')),
    [modeles],
  );

  if (!peutGerer) {
    return <AccesRefuse roleActif={roleActif} />;
  }

  function declencherSuppression(m: ModeleActivites) {
    if (confirmationSuppression !== m.id) {
      setConfirmationSuppression(m.id);
      return;
    }
    supprimerModele(m.id);
    setConfirmationSuppression(null);
  }

  // Gabarit Excel à remplir puis réimporter (même pattern de téléchargement
  // que la page Import Excel des utilisateurs).
  function telechargerGabarit() {
    const bytes = genererXlsxGabaritActivites();
    const blob = new Blob([new Uint8Array(bytes)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = NOM_FICHIER_GABARIT_ACTIVITES;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 texte-couleur-role" aria-hidden="true" />
            <h1 className="text-2xl font-semibold">Modèles d'activités</h1>
          </div>
          <p className="text-muted-foreground">
            Certaines formations s'évaluent par <strong>activités</strong> plutôt que par
            compétences. Importez un modèle pour une formation, mappez chaque activité sur les
            compétences de son référentiel, puis basculez la formation en mode activités quand le
            balayage est complet. Le référentiel de compétences reste impératif : la Synthèse reste
            par compétences, alimentée par la projection des activités.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={telechargerGabarit}
            data-testid="telecharger-gabarit-activites"
            title="Fichier Excel à remplir (une activité par ligne) puis à réimporter"
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Télécharger le gabarit Excel
          </button>
          <button
            type="button"
            onClick={() => setModaleImportOuverte(true)}
            data-testid="ouvrir-import-modele-activites"
            className="inline-flex items-center gap-1.5 rounded-md bouton-plein-couleur-role px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Importer un modèle
          </button>
        </div>
      </header>

      {liste.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Aucun modèle d'activités importé. Cliquez sur « Importer un modèle » pour démarrer.
        </div>
      ) : (
        <div className="space-y-4">
          {liste.map((m) => {
            const enConfirmation = confirmationSuppression === m.id;
            const verrou = evaluerVerrouModeleActivites(m.id, formationsListe);
            const referentiel = referentiels[m.referentielId];
            const formationsRattachees = formationsListe
              .filter((f) => f.modeleActivitesId === m.id)
              .sort((a, b) => a.intitule.localeCompare(b.intitule, 'fr-FR'));
            return (
              <CarteModele
                key={m.id}
                modele={m}
                referentiel={referentiel}
                formationsRattachees={formationsRattachees}
                enConfirmation={enConfirmation}
                supprimable={!verrou.verrouille}
                raisonVerrou={verrou.raison}
                onSupprimer={() => declencherSuppression(m)}
              />
            );
          })}
        </div>
      )}

      <ModaleImportModeleActivites
        ouvert={modaleImportOuverte}
        onAnnuler={() => setModaleImportOuverte(false)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Carte d'un modèle : stats, jauge de balayage, éditeur de mapping, mode
// ─────────────────────────────────────────────────────────────────────────────

interface CarteModeleProps {
  modele: ModeleActivites;
  referentiel?: Referentiel;
  formationsRattachees: Formation[];
  enConfirmation: boolean;
  supprimable: boolean;
  raisonVerrou?: string;
  onSupprimer: () => void;
}

function CarteModele({
  modele,
  referentiel,
  formationsRattachees,
  enConfirmation,
  supprimable,
  raisonVerrou,
  onSupprimer,
}: CarteModeleProps) {
  const referentielFiltre = referentiel ? referentielEvaluable(referentiel) : undefined;
  const balayage = referentielFiltre ? calculerBalayage(modele, referentielFiltre) : undefined;
  const libellesCompetences = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of referentiel?.blocs ?? []) {
      for (const c of b.competences) map.set(c.id, c.libelle);
    }
    return map;
  }, [referentiel]);

  return (
    <article
      data-testid={`modele-activites-${modele.id}`}
      className={cn(
        'rounded-lg border bg-card p-5 space-y-3 transition-colors',
        enConfirmation ? 'border-red-300 bg-red-50/50' : 'border-border',
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold flex items-center gap-2">
            <ClipboardList className="h-4 w-4 shrink-0 texte-couleur-role" aria-hidden="true" />
            <span className="truncate">{modele.nom}</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            <code className="rounded bg-secondary px-1 py-0.5">{modele.id}</code>
            <span className="ml-2">
              {modele.activites.length} activité{modele.activites.length > 1 ? 's' : ''}
            </span>
            {modele.source && (
              <span className="ml-2 inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                {libelleSourceModele(modele.source)}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          disabled={!supprimable}
          onClick={onSupprimer}
          aria-label={
            enConfirmation ? `Confirmer la suppression de ${modele.nom}` : `Supprimer ${modele.nom}`
          }
          title={raisonVerrou}
          className={cn(
            'inline-flex items-center gap-1 rounded-md p-1.5 transition-colors shrink-0',
            enConfirmation
              ? 'border border-red-300 bg-red-600 text-white hover:bg-red-700'
              : 'border border-input bg-background text-muted-foreground hover:bg-secondary hover:text-foreground',
            !supprimable && 'opacity-40 cursor-not-allowed hover:bg-background',
          )}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          {enConfirmation && <span className="text-xs font-medium">Confirmer</span>}
        </button>
      </header>

      {/* Jauge de balayage — conditionne le déblocage du mode activités. */}
      {balayage ? (
        <JaugeBalayage
          modeleId={modele.id}
          balayage={balayage}
          libellesCompetences={libellesCompetences}
        />
      ) : (
        <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-800">
          Référentiel <code>{modele.referentielId}</code> introuvable — le mapping ne peut pas être
          vérifié.
        </p>
      )}

      {/* Formations rattachées + choix du mode d'évaluation. */}
      {formationsRattachees.length === 0 ? (
        <p className="flex items-start gap-2 rounded-md bg-secondary/30 px-2 py-1.5 text-xs italic text-muted-foreground">
          <GraduationCap className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>Aucune formation rattachée — réimportez le modèle pour une formation.</span>
        </p>
      ) : (
        formationsRattachees.map((f) => (
          <EncartModeFormation
            key={f.id}
            formation={f}
            balayageComplet={balayage?.complet ?? false}
          />
        ))
      )}

      {/* Éditeur de mapping activité → compétences. */}
      {referentielFiltre && (
        <details className="text-sm" data-testid={`mapping-editeur-${modele.id}`}>
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Mapping activités ↔ compétences
          </summary>
          <div className="mt-2 space-y-3 pl-2">
            {modele.activites.map((a) => (
              <EditeurMappingActivite
                key={a.id}
                modeleId={modele.id}
                activite={a}
                referentiel={referentielFiltre}
              />
            ))}
          </div>
        </details>
      )}

      {raisonVerrou && <p className="text-xs italic text-amber-700">{raisonVerrou}</p>}
    </article>
  );
}

function libelleSourceModele(source: NonNullable<ModeleActivites['source']>): string {
  switch (source) {
    case 'fixture':
      return 'Fixture intégrée';
    case 'import-csv':
      return 'Import CSV';
    case 'import-xlsx':
      return 'Import Excel';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Jauge de balayage
// ─────────────────────────────────────────────────────────────────────────────

interface JaugeBalayageProps {
  modeleId: string;
  balayage: ReturnType<typeof calculerBalayage>;
  libellesCompetences: ReadonlyMap<string, string>;
}

function JaugeBalayage({ modeleId, balayage, libellesCompetences }: JaugeBalayageProps) {
  const pct =
    balayage.total > 0 ? Math.round((balayage.couvertes.length / balayage.total) * 100) : 0;
  return (
    <div
      data-testid={`balayage-${modeleId}`}
      className={cn(
        'space-y-1.5 rounded-md border p-3 text-sm',
        balayage.complet
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-amber-200 bg-amber-50 text-amber-900',
      )}
    >
      <p className="flex items-center gap-2 font-medium">
        <Gauge className="h-4 w-4 shrink-0" aria-hidden="true" />
        Balayage du référentiel : {balayage.couvertes.length}/{balayage.total} compétences couvertes{' '}
        {balayage.complet ? '— complet ✓' : ''}
      </p>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-white/70"
      >
        <div
          className={cn('h-full', balayage.complet ? 'bg-emerald-500' : 'bg-amber-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {balayage.manquantes.length > 0 && (
        <p className="text-xs">
          <strong>Non couvertes :</strong>{' '}
          {balayage.manquantes.map((id) => libellesCompetences.get(id) ?? id).join(' · ')}
        </p>
      )}
      {balayage.orphelines.length > 0 && (
        <p className="text-xs">
          ⚠ {balayage.orphelines.length} mapping{balayage.orphelines.length > 1 ? 's' : ''} orphelin
          {balayage.orphelines.length > 1 ? 's' : ''} (compétence disparue ou exclue) — à nettoyer
          dans l'éditeur.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Encart du mode d'évaluation d'une formation rattachée
// ─────────────────────────────────────────────────────────────────────────────

function EncartModeFormation({
  formation,
  balayageComplet,
}: {
  formation: Formation;
  balayageComplet: boolean;
}) {
  const setModeEvaluation = useFormationsStore((s) => s.setModeEvaluation);
  const [erreur, setErreur] = useState<string | null>(null);
  const mode = modeEffectif(formation);
  const cible = mode === 'activites' ? 'competences' : 'activites';

  function basculer() {
    const r = setModeEvaluation(formation.id, cible);
    setErreur(r.ok ? null : (r.raison ?? 'Bascule refusée.'));
  }

  return (
    <div className="space-y-1 rounded-md bg-secondary/30 px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <GraduationCap className="h-4 w-4 shrink-0 texte-couleur-role" aria-hidden="true" />
        <span className="font-medium">
          {formation.intitule} ({formation.annee})
        </span>
        <BadgeMode mode={mode} formationId={formation.id} />
        <button
          type="button"
          onClick={basculer}
          disabled={cible === 'activites' && !balayageComplet}
          data-testid={`basculer-mode-${formation.id}`}
          title={
            cible === 'activites' && !balayageComplet
              ? 'Complétez le mapping (balayage complet requis) pour débloquer le mode activités.'
              : undefined
          }
          className={cn(
            'rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            cible === 'activites' && !balayageComplet && 'cursor-not-allowed opacity-50',
          )}
        >
          {cible === 'activites' ? 'Passer en mode activités' : 'Repasser en mode compétences'}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        La bascule est libre tant qu'aucune saisie n'est signée dans la promo, puis verrouillée
        (entretien ou fiche signés).
      </p>
      {erreur && (
        <p
          role="alert"
          data-testid={`erreur-mode-${formation.id}`}
          className="text-xs text-red-700"
        >
          {erreur}
        </p>
      )}
    </div>
  );
}

/** Badge du mode d'évaluation — réutilisé sur les cartes formation. */
export function BadgeMode({
  mode,
  formationId,
}: {
  mode: 'competences' | 'activites';
  formationId: string;
}) {
  return (
    <span
      data-testid={`badge-mode-${formationId}`}
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        mode === 'activites' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-700',
      )}
    >
      {mode === 'activites' ? 'Mode activités' : 'Mode compétences'}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Éditeur de mapping d'une activité
// ─────────────────────────────────────────────────────────────────────────────

function EditeurMappingActivite({
  modeleId,
  activite,
  referentiel,
}: {
  modeleId: string;
  activite: Activite;
  referentiel: Referentiel;
}) {
  const setMapping = useActivitesStore((s) => s.setMappingActivite);
  const [erreur, setErreur] = useState<string | null>(null);

  function toggle(competenceId: string) {
    const actuels = new Set(activite.competenceIds);
    if (actuels.has(competenceId)) actuels.delete(competenceId);
    else actuels.add(competenceId);
    const r = setMapping(modeleId, activite.id, [...actuels]);
    setErreur(r.ok ? null : (r.raison ?? 'Modification refusée.'));
  }

  return (
    <div className="rounded-md border border-border bg-secondary/20 p-3 space-y-2">
      <p className="text-xs font-medium">
        {activite.libelle}
        <span className="ml-2 font-normal text-muted-foreground">
          ({activite.competenceIds.length} compétence
          {activite.competenceIds.length > 1 ? 's' : ''} couverte
          {activite.competenceIds.length > 1 ? 's' : ''})
        </span>
      </p>
      {activite.description && (
        <p className="text-xs text-muted-foreground">{activite.description}</p>
      )}
      <div className="space-y-1.5">
        {referentiel.blocs.map((b) => (
          <div key={b.id}>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {b.libelle}
            </p>
            <ul className="mt-0.5 space-y-0.5">
              {b.competences.map((c) => (
                <li key={c.id} className="flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={activite.competenceIds.includes(c.id)}
                    onChange={() => toggle(c.id)}
                    aria-label={`L'activité ${activite.libelle} couvre ${c.libelle}`}
                    data-testid={`mapping-${activite.id}-${c.id}`}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-input accent-[hsl(var(--ring))]"
                  />
                  <span>{c.libelle}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {erreur && (
        <p role="alert" className="text-xs text-red-700">
          {erreur}
        </p>
      )}
    </div>
  );
}

function AccesRefuse({ roleActif }: { roleActif: Role }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
      <div className="flex items-start gap-3">
        <Lock className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-medium text-amber-900">Accès réservé à l'administration</h1>
          <p className="mt-2 text-sm text-amber-900/80">
            Vous êtes actuellement connecté·e en tant que <strong>{libelleRole(roleActif)}</strong>.
            La gestion des modèles d'activités est réservée aux rôles{' '}
            <strong>Coordinateur·rice</strong> et <strong>Administrateur·rice</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
