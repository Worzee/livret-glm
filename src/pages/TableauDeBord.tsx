import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { libelleRole } from '@/lib/droits';
import { apprentiLeaMartin } from '@/fixtures/utilisateurs';

/**
 * Tableau de bord — point d'entrée par rôle.
 * Référence : cahier des charges v1.3, section 10.1.
 *
 * En sprint 1 : placeholder différencié par rôle, avec lien vers le livret de Léa.
 * Sprints suivants : liste/cartes des apprenti·e·s, recherche, filtres (CDC §10.3).
 */
export function TableauDeBord() {
  const roleActif = useUserStore((s) => s.roleActif);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d'accueil pour le rôle <strong>{libelleRole(roleActif)}</strong>.
        </p>
      </header>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <Construction className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-3">
            <p className="text-sm">
              Sprint 1 — placeholder. Ce tableau de bord listera bientôt les apprenti·e·s
              accessibles selon le rôle actif (cf. cahier des charges §10).
            </p>
            <Link
              to={`/livret/${apprentiLeaMartin.id}`}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Ouvrir le livret de démonstration ({apprentiLeaMartin.prenom} {apprentiLeaMartin.nom})
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
