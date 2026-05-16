import { useMemo } from 'react';
import { ExternalLink, Info, Link2, Lock, Shield } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { usePronoteStore } from '@/store/usePronoteStore';
import { peutEditer } from '@/lib/droits';

/**
 * Page utilisateur — accès aux liens externes Pronote WEB.
 * Référence : refonte mai 2026.
 *
 * Visible pour TOUS les rôles. Affiche la liste des liens Pronote configurés
 * par les coordo + admin depuis `/admin/pronote`. Chaque utilisateur·rice
 * s'identifie ensuite avec ses propres credentials côté Pronote (pas de SSO
 * côté maquette).
 *
 * Si aucun lien n'est configuré, la page affiche un message guidant :
 *   - vers la page d'administration (si rôle autorisé)
 *   - vers le pilote (sinon)
 */
export function PronoteWeb() {
  const roleActif = useUserStore((s) => s.roleActif);
  const liensMap = usePronoteStore((s) => s.liens);

  const liens = useMemo(
    () =>
      Object.values(liensMap).sort((a, b) =>
        a.libelle.localeCompare(b.libelle, 'fr-FR'),
      ),
    [liensMap],
  );

  const peutGerer = peutEditer(roleActif, 'admin.pronote.gerer');

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-semibold">Pronote WEB</h1>
        </div>
        <p className="text-muted-foreground">
          Accès direct aux espaces Pronote du GRETA depuis le livret
          d'apprentissage.
        </p>
      </header>

      {/* Bloc explicatif — toujours affiché */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden="true" />
          <div className="space-y-2 text-sm">
            <h2 className="font-medium text-foreground">À propos de Pronote</h2>
            <p>
              Pronote est l'outil de communication et de suivi pédagogique utilisé par
              le GRETA Lyon Métropole. Il permet aux apprenti·e·s, maîtres
              d'apprentissage, formateur·rice·s, coordinateur·rice·s et administrateur·rice·s
              de consulter les informations qui les concernent (emploi du temps,
              notes, messagerie, etc.).
            </p>
            <p>
              <strong>Identifiants propres à chacun·e :</strong> chaque utilisateur·rice
              dispose de ses propres identifiants Pronote, à utiliser directement sur
              le site Pronote. Le livret d'apprentissage ne stocke aucun mot de passe
              — il vous redirige simplement vers l'espace concerné.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-md bg-secondary/40 p-3 text-xs">
          <Shield
            className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5"
            aria-hidden="true"
          />
          <p className="text-muted-foreground">
            <strong>Sécurité.</strong> Les liens ci-dessous ouvrent Pronote dans un
            nouvel onglet. Le livret d'apprentissage ne récupère aucune donnée Pronote.
            Vous restez maître·sse de vos identifiants à tout moment.
          </p>
        </div>
      </section>

      {/* Liste des liens — ou message d'attente */}
      {liens.length === 0 ? (
        <section className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm space-y-3">
          <p className="text-muted-foreground italic">
            Aucun lien Pronote n'est configuré pour le moment.
          </p>
          {peutGerer ? (
            <p>
              Rendez-vous sur la page{' '}
              <a
                href="/admin/pronote"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Administration → Pronote
              </a>{' '}
              pour ajouter une URL.
            </p>
          ) : (
            <p className="text-muted-foreground">
              Contactez un coordinateur·rice ou administrateur·rice pour qu'il/elle
              configure les liens Pronote.
            </p>
          )}
        </section>
      ) : (
        <section className="space-y-3" data-testid="pronote-liens">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Espaces disponibles
          </h2>
          <ul className="space-y-2">
            {liens.map((l) => (
              <li key={l.id}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`pronote-lien-${l.id}`}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ExternalLink
                    className="h-5 w-5 shrink-0 text-primary mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {l.libelle}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        — Ouvre dans un nouvel onglet
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground break-all">
                      {l.url}
                    </p>
                    {l.description && (
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {l.description}
                      </p>
                    )}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {peutGerer && liens.length > 0 && (
        <p className="text-xs text-muted-foreground italic">
          <Lock className="inline h-3 w-3 mr-1" aria-hidden="true" />
          Configuration réservée aux rôles Coordinateur·rice et Administrateur·rice —{' '}
          <a
            href="/admin/pronote"
            className="text-primary underline-offset-2 hover:underline"
          >
            modifier les liens
          </a>
        </p>
      )}
    </div>
  );
}
