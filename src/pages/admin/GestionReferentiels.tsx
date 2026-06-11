import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  Layers,
  Library,
  Lock,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { BlocCompetences, Formation, Referentiel, Role } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useReferentielsStore } from '@/store/useReferentielsStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { libelleRole, peutEditer } from '@/lib/droits';
import { evaluerVerrouReferentiel } from '@/lib/referentiel-verrou';
import { ModaleImportReferentiel } from '@/components/admin/ModaleImportReferentiel';
import { cn } from '@/lib/utils';

/**
 * Page d'administration — gestion des référentiels de compétences.
 * Référence : cahier des charges v1.3, extension 3 phase C.
 *
 * Réservée aux rôles `coordo` et `admin` (matrice §6 — `admin.referentiels.gerer`).
 * Permet d'importer un nouveau référentiel via CSV, de visualiser ceux existants,
 * et de les supprimer (avec verrou de cohérence : pas de suppression tant qu'au
 * moins une formation y est rattachée).
 */

export function GestionReferentiels() {
  const roleActif = useUserStore((s) => s.roleActif);
  const referentiels = useReferentielsStore((s) => s.referentiels);
  const supprimerReferentiel = useReferentielsStore((s) => s.supprimerReferentiel);
  const formations = useFormationsStore((s) => s.formations);

  const [modaleImportOuverte, setModaleImportOuverte] = useState(false);
  const [confirmationSuppression, setConfirmationSuppression] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmationSuppression) return;
    const t = setTimeout(() => setConfirmationSuppression(null), 10_000);
    return () => clearTimeout(t);
  }, [confirmationSuppression]);

  const peutGerer = peutEditer(roleActif, 'admin.referentiels.gerer');

  const formationsListe = useMemo(() => Object.values(formations), [formations]);
  const liste = useMemo(() => {
    return Object.values(referentiels).sort((a, b) =>
      a.formation.localeCompare(b.formation, 'fr-FR'),
    );
  }, [referentiels]);

  if (!peutGerer) {
    return <AccesRefuse roleActif={roleActif} />;
  }

  function declencherSuppression(r: Referentiel) {
    if (confirmationSuppression !== r.id) {
      setConfirmationSuppression(r.id);
      return;
    }
    supprimerReferentiel(r.id);
    setConfirmationSuppression(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Library className="h-5 w-5 texte-couleur-role" aria-hidden="true" />
            <h1 className="text-2xl font-semibold">Gestion des référentiels</h1>
          </div>
          <p className="text-muted-foreground">
            Référentiels de compétences disponibles pour les formations. Importez un CSV à 2 ou 3
            colonnes pour ajouter un nouveau référentiel.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModaleImportOuverte(true)}
          className="inline-flex items-center gap-1.5 rounded-md bouton-plein-couleur-role px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Importer un référentiel
        </button>
      </header>

      {liste.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Aucun référentiel importé. Cliquez sur « Importer un référentiel » pour démarrer.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {liste.map((r) => {
            const enConfirmation = confirmationSuppression === r.id;
            const verrou = evaluerVerrouReferentiel(r.id, formationsListe);
            const supprimable = !verrou.verrouille;
            const nbCompetences = r.blocs.reduce((n, b) => n + b.competences.length, 0);
            const sousFamilles = new Set<string>();
            for (const b of r.blocs) {
              for (const c of b.competences) {
                if (c.sousFamille) sousFamilles.add(c.sousFamille);
              }
            }
            const formationsRattachees = formationsListe
              .filter((f) => f.referentielId === r.id)
              .sort((a, b) => a.intitule.localeCompare(b.intitule, 'fr-FR'));
            return (
              <article
                key={r.id}
                className={cn(
                  'rounded-lg border bg-card p-5 space-y-3 transition-colors',
                  enConfirmation ? 'border-red-300 bg-red-50/50' : 'border-border',
                )}
              >
                <header className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold flex items-center gap-2">
                      <BookOpen className="h-4 w-4 shrink-0 texte-couleur-role" aria-hidden="true" />
                      <span className="truncate">{r.formation}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <code className="rounded bg-secondary px-1 py-0.5">{r.id}</code>
                      {r.source && (
                        <span className="ml-2 inline-flex items-center gap-1">
                          <Sparkles className="h-3 w-3" aria-hidden="true" />
                          {libelleSource(r.source)}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!supprimable}
                    onClick={() => declencherSuppression(r)}
                    aria-label={
                      enConfirmation
                        ? `Confirmer la suppression de ${r.formation}`
                        : `Supprimer ${r.formation}`
                    }
                    title={verrou.raison}
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

                <dl className="space-y-1.5 text-sm">
                  <Statistique
                    Icon={Layers}
                    label={`${r.blocs.length} bloc${r.blocs.length > 1 ? 's' : ''}`}
                  />
                  <Statistique
                    Icon={BookOpen}
                    label={`${nbCompetences} compétence${nbCompetences > 1 ? 's' : ''}`}
                  />
                  {r.niveauxColonnes === 3 && (
                    <Statistique
                      Icon={Layers}
                      label={`${sousFamilles.size} sous-famille${sousFamilles.size > 1 ? 's' : ''} (référentiel à 3 niveaux)`}
                    />
                  )}
                  {r.attitudes.length > 0 && (
                    <Statistique
                      Icon={Sparkles}
                      label={`${r.attitudes.length} attitude${r.attitudes.length > 1 ? 's' : ''} professionnelle${r.attitudes.length > 1 ? 's' : ''}`}
                    />
                  )}
                </dl>

                <FormationsRattachees formations={formationsRattachees} />

                {/* Détail des blocs en lecture seule. Le choix des compétences
                    abordées en entreprise se fait désormais par livret, à
                    l'entretien tripartite (cf. CDC v1.5 addendum). */}
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Voir les compétences
                  </summary>
                  <div className="mt-2 space-y-3 pl-2">
                    {r.blocs.map((b) => (
                      <BlocDetail key={b.id} bloc={b} />
                    ))}
                  </div>
                </details>

                {verrou.verrouille && (
                  <p className="text-xs italic text-amber-700">{verrou.raison}</p>
                )}
              </article>
            );
          })}
        </div>
      )}

      <ModaleImportReferentiel
        ouvert={modaleImportOuverte}
        onAnnuler={() => setModaleImportOuverte(false)}
      />
    </div>
  );
}

function libelleSource(source: NonNullable<Referentiel['source']>): string {
  switch (source) {
    case 'fixture':
      return 'Fixture intégrée';
    case 'import-csv':
      return 'Import CSV';
    case 'import-xlsx':
      return 'Import Excel';
    case 'edition-manuelle':
      return 'Édition manuelle';
  }
}

function Statistique({
  Icon,
  label,
}: {
  Icon: typeof Library;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

/**
 * Affiche en une ligne la (les) formation(s) actuellement rattachée(s) au
 * référentiel — relation N:1 portée par `Formation.referentielId`.
 * Lecture seule : le rattachement se modifie depuis la page Formations.
 */
function FormationsRattachees({ formations }: { formations: ReadonlyArray<Formation> }) {
  if (formations.length === 0) {
    return (
      <p
        className="flex items-start gap-2 rounded-md bg-secondary/30 px-2 py-1.5 text-xs italic text-muted-foreground"
        data-testid="ref-formations-rattachees"
      >
        <GraduationCap className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          Aucune formation rattachée — à rattacher depuis la page <em>Formations</em>.
        </span>
      </p>
    );
  }
  const libelles = formations.map((f) => `${f.intitule} (${f.annee})`).join(', ');
  return (
    <p
      className="flex items-start gap-2 rounded-md bg-secondary/30 px-2 py-1.5 text-xs"
      data-testid="ref-formations-rattachees"
    >
      <GraduationCap
        className="h-3.5 w-3.5 shrink-0 mt-0.5 texte-couleur-role"
        aria-hidden="true"
      />
      <span>
        <span className="font-medium">
          Utilisé par {formations.length} formation{formations.length > 1 ? 's' : ''} :
        </span>{' '}
        {libelles}
      </span>
    </p>
  );
}

interface BlocDetailProps {
  bloc: BlocCompetences;
}

function BlocDetail({ bloc }: BlocDetailProps) {
  return (
    <div className="rounded-md border border-border bg-secondary/20 p-2">
      <p className="text-xs font-medium text-foreground">
        {bloc.code} — {bloc.libelle}
        <span className="ml-2 text-muted-foreground font-normal">
          ({bloc.competences.length} compétence{bloc.competences.length > 1 ? 's' : ''})
        </span>
      </p>
      <ul className="mt-1.5 space-y-0.5">
        {bloc.competences.map((c) => (
          <li key={c.id} className="text-xs">
            <strong className="font-medium">{c.code}</strong>{' '}
            {c.sousFamille && (
              <span className="text-muted-foreground">[{c.sousFamille}]</span>
            )}{' '}
            {c.libelle}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AccesRefuse({ roleActif }: { roleActif: Role }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
      <div className="flex items-start gap-3">
        <Lock className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-medium text-amber-900">
            Accès réservé à l'administration
          </h1>
          <p className="mt-2 text-sm text-amber-900/80">
            Vous êtes actuellement connecté·e en tant que <strong>{libelleRole(roleActif)}</strong>.
            La gestion des référentiels est réservée aux rôles{' '}
            <strong>Coordinateur·rice</strong> et <strong>Administrateur·rice</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

