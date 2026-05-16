import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  GraduationCap,
  Lock,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import type { Formation, Role } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { useEtablissementsStore } from '@/store/useEtablissementsStore';
import { useUtilisateursStore } from '@/store/useUtilisateursStore';
import { libelleRole, peutEditer } from '@/lib/droits';
import { evaluerVerrouFormation } from '@/lib/formation-verrou';
import { ModaleFormation } from '@/components/admin/ModaleFormation';
import { cn } from '@/lib/utils';

/**
 * Page d'administration — gestion des formations.
 * Référence : cahier des charges v1.3, section 6 (matrice droits) et §7.1.
 *
 * CRUD complet réservé aux rôles `coordo` et `admin`. Édition par ligne via
 * ModaleFormation. Suppression bloquée tant qu'au moins un·e apprenti·e est
 * rattaché·e à la formation (cohérence référentielle, cf. `formation-verrou`).
 */

export function GestionFormations() {
  const roleActif = useUserStore((s) => s.roleActif);
  const formations = useFormationsStore((s) => s.formations);
  const supprimerFormation = useFormationsStore((s) => s.supprimerFormation);
  const etablissements = useEtablissementsStore((s) => s.etablissements);
  const apprentis = useUtilisateursStore((s) => s.apprentis);

  const [requete, setRequete] = useState('');
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [formationEnEdition, setFormationEnEdition] = useState<Formation | undefined>();
  const [confirmationSuppression, setConfirmationSuppression] = useState<string | null>(null);

  // Auto-annulation 10 s de la confirmation (cohérent avec les autres patterns).
  useEffect(() => {
    if (!confirmationSuppression) return;
    const t = setTimeout(() => setConfirmationSuppression(null), 10_000);
    return () => clearTimeout(t);
  }, [confirmationSuppression]);

  const peutCreer = peutEditer(roleActif, 'admin.formations.creer');
  const peutModifier = peutEditer(roleActif, 'admin.formations.modifier');
  const peutSupprimer = peutEditer(roleActif, 'admin.formations.supprimer');

  const apprentisListe = useMemo(() => Object.values(apprentis), [apprentis]);
  // Pré-calcul du nombre d'apprenti·e·s rattaché·e·s à chaque formation.
  const compteurs = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of apprentisListe) {
      m[a.formationId] = (m[a.formationId] ?? 0) + 1;
    }
    return m;
  }, [apprentisListe]);

  const liste = useMemo(() => {
    let r = Object.values(formations);
    if (requete.trim()) {
      const q = requete.toLowerCase();
      r = r.filter(
        (f) =>
          f.intitule.toLowerCase().includes(q) ||
          f.niveau.toLowerCase().includes(q) ||
          f.annee.toLowerCase().includes(q),
      );
    }
    return [...r].sort((a, b) => {
      // Tri par année décroissante (la plus récente en haut), puis intitulé.
      if (a.annee !== b.annee) return b.annee.localeCompare(a.annee);
      return a.intitule.localeCompare(b.intitule, 'fr-FR');
    });
  }, [formations, requete]);

  if (!peutCreer) {
    return <AccesRefuse roleActif={roleActif} />;
  }

  function ouvrirCreation() {
    setFormationEnEdition(undefined);
    setModaleOuverte(true);
  }
  function ouvrirEdition(f: Formation) {
    setFormationEnEdition(f);
    setModaleOuverte(true);
  }

  function declencherSuppression(f: Formation) {
    if (confirmationSuppression !== f.id) {
      setConfirmationSuppression(f.id);
      return;
    }
    supprimerFormation(f.id);
    setConfirmationSuppression(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" aria-hidden="true" />
            <h1 className="text-2xl font-semibold">Gestion des formations</h1>
          </div>
          <p className="text-muted-foreground">
            Création et administration des formations (intitulé, niveau, dates, lieu, référentiel).
          </p>
        </div>
        <button
          type="button"
          onClick={ouvrirCreation}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouvelle formation
        </button>
      </header>

      {/* Filtre */}
      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          placeholder="Filtrer par intitulé, niveau ou année"
          aria-label="Filtrer les formations"
          className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {liste.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {Object.keys(formations).length === 0
            ? 'Aucune formation enregistrée. Cliquez sur « Nouvelle formation » pour démarrer.'
            : 'Aucune formation ne correspond à vos critères.'}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {liste.map((f) => {
            const enConfirmation = confirmationSuppression === f.id;
            const verrou = evaluerVerrouFormation(f.id, apprentisListe);
            const editable = peutModifier;
            const supprimable = peutSupprimer && !verrou.verrouille;
            return (
              <article
                key={f.id}
                className={cn(
                  'rounded-lg border bg-card p-5 space-y-3 transition-colors',
                  enConfirmation ? 'border-red-300 bg-red-50/50' : 'border-border',
                )}
              >
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{f.intitule}</h3>
                    <p className="text-sm text-muted-foreground">
                      {f.niveau} · Année {f.annee}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1">
                    {editable && (
                      <button
                        type="button"
                        onClick={() => ouvrirEdition(f)}
                        aria-label={`Modifier ${f.intitule}`}
                        className="rounded-md border border-input bg-background p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                    {peutSupprimer && (
                      <button
                        type="button"
                        disabled={!supprimable}
                        onClick={() => declencherSuppression(f)}
                        aria-label={
                          enConfirmation
                            ? `Confirmer la suppression de ${f.intitule}`
                            : `Supprimer ${f.intitule}`
                        }
                        title={verrou.raison}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md p-1.5 transition-colors',
                          enConfirmation
                            ? 'border border-red-300 bg-red-600 text-white hover:bg-red-700'
                            : 'border border-input bg-background text-muted-foreground hover:bg-secondary hover:text-foreground',
                          !supprimable && 'opacity-40 cursor-not-allowed hover:bg-background',
                        )}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {enConfirmation && (
                          <span className="text-xs font-medium">Confirmer</span>
                        )}
                      </button>
                    )}
                  </div>
                </header>

                <dl className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CalendarDays
                      className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="sr-only">Période</dt>
                      <dd>
                        Du{' '}
                        <time dateTime={f.dateDebut}>
                          {new Date(f.dateDebut).toLocaleDateString('fr-FR')}
                        </time>{' '}
                        au{' '}
                        <time dateTime={f.dateFin}>
                          {new Date(f.dateFin).toLocaleDateString('fr-FR')}
                        </time>
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin
                      className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="sr-only">Lieu</dt>
                      <dd>
                        {(() => {
                          const eta = etablissements[f.lieuId];
                          if (!eta) {
                            return (
                              <span className="italic text-muted-foreground">
                                Établissement non spécifié
                              </span>
                            );
                          }
                          return (
                            <>
                              <span className="font-medium">{eta.nom}</span>
                              {eta.adresse && (
                                <>
                                  <br />
                                  <span className="text-muted-foreground">
                                    {eta.adresse}
                                    {eta.codePostal && eta.ville && (
                                      <>
                                        , {eta.codePostal} {eta.ville}
                                      </>
                                    )}
                                  </span>
                                </>
                              )}
                            </>
                          );
                        })()}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users
                      className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="sr-only">Apprenti·e·s</dt>
                      <dd className="text-muted-foreground">
                        {compteurs[f.id]
                          ? `${compteurs[f.id]} apprenti·e${compteurs[f.id] > 1 ? '·s' : ''} rattaché·e${compteurs[f.id] > 1 ? '·s' : ''}`
                          : 'Aucun·e apprenti·e rattaché·e'}
                      </dd>
                    </div>
                  </div>
                </dl>

                {verrou.verrouille && peutSupprimer && (
                  <p className="text-xs italic text-amber-700">{verrou.raison}</p>
                )}
              </article>
            );
          })}
        </div>
      )}

      <ModaleFormation
        // `key` distincte par mode → force un remount frais à chaque
        // ouverture (création / édition d'une formation donnée). Évite la
        // persistance d'un state local entre deux ouvertures consécutives.
        key={modaleOuverte ? formationEnEdition?.id ?? 'creation' : 'fermee'}
        ouvert={modaleOuverte}
        formation={formationEnEdition}
        onAnnuler={() => {
          setModaleOuverte(false);
          setFormationEnEdition(undefined);
        }}
      />
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
            La gestion des formations est réservée aux rôles{' '}
            <strong>Coordinateur·rice</strong> et <strong>Administrateur·rice</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
