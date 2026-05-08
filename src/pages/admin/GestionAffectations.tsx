import { Construction, Link2 } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { libelleRole, peutEditer } from '@/lib/droits';

/**
 * Page d'administration — gestion des affectations.
 * Associe chaque apprenti·e à : une formation, un maître d'apprentissage,
 * un formateur référent.
 *
 * Sprint 1 : placeholder. L'écran réel viendra dans un sprint dédié.
 */
export function GestionAffectations() {
  const roleActif = useUserStore((s) => s.roleActif);

  if (!peutEditer(roleActif, 'admin.affectations.gerer')) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
        <h1 className="text-lg font-medium text-amber-900">Accès réservé au coordinateur·rice</h1>
        <p className="mt-2 text-sm text-amber-900/80">
          Vous êtes actuellement connecté·e en tant que <strong>{libelleRole(roleActif)}</strong>.
          La gestion des affectations est réservée au rôle <strong>Coordinateur·rice</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Gestion des affectations</h1>
        <p className="text-muted-foreground">
          Association apprenti·e ↔ formation ↔ maître d'apprentissage ↔ formateur référent.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <Construction className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-2">
            <p className="text-sm">
              Sprint 1 — placeholder. L'écran d'affectation permettra au coordinateur·rice de
              relier chaque apprenti·e à sa formation, son maître d'apprentissage et son formateur
              référent. Implémentation dans un sprint dédié à l'administration.
            </p>
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
              Ressource :{' '}
              <code className="rounded bg-muted px-1 py-0.5">admin.affectations.gerer</code>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
