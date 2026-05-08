import { CalendarDays, Construction, MapPin, Plus } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { libelleRole, peutEditer } from '@/lib/droits';
import { formationsDemo } from '@/fixtures/formations';
import type { Role } from '@/types';

/**
 * Page d'administration — gestion des formations.
 * Réservée au rôle coordo.
 *
 * Sprint 1 : liste les formations existantes (fixtures) + bouton "Créer" désactivé.
 * Le formulaire CRUD viendra dans un sprint dédié.
 */
export function GestionFormations() {
  const roleActif = useUserStore((s) => s.roleActif);
  const peutCreer = peutEditer(roleActif, 'admin.formations.creer');

  if (!peutCreer) {
    return <AccesRefuse roleActif={roleActif} />;
  }

  const formations = Object.values(formationsDemo);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Gestion des formations</h1>
        <p className="text-muted-foreground">
          Création et administration des formations (intitulé, dates, lieux).
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <Construction className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm">
            Sprint 1 — placeholder. Le formulaire de création/édition sera implémenté dans un
            sprint dédié à l'administration.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Formations existantes</h2>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60 disabled:cursor-not-allowed"
            title="Formulaire à venir dans un sprint dédié"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouvelle formation
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {formations.map((f) => (
            <article key={f.id} className="rounded-lg border border-border bg-card p-5 space-y-3">
              <header>
                <h3 className="font-semibold">{f.intitule}</h3>
                <p className="text-sm text-muted-foreground">
                  {f.niveau} · Année {f.annee}
                </p>
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
                      <span className="font-medium">{f.lieu.nom}</span>
                      {f.lieu.adresse && (
                        <>
                          <br />
                          <span className="text-muted-foreground">
                            {f.lieu.adresse}
                            {f.lieu.codePostal && f.lieu.ville && (
                              <>
                                , {f.lieu.codePostal} {f.lieu.ville}
                              </>
                            )}
                          </span>
                        </>
                      )}
                    </dd>
                  </div>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function AccesRefuse({ roleActif }: { roleActif: Role }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
      <h1 className="text-lg font-medium text-amber-900">Accès réservé au coordinateur·rice</h1>
      <p className="mt-2 text-sm text-amber-900/80">
        Vous êtes actuellement connecté·e en tant que <strong>{libelleRole(roleActif)}</strong>.
        La gestion des formations est réservée au rôle <strong>Coordinateur·rice</strong>.
      </p>
    </div>
  );
}
