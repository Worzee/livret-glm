import { Link, Outlet } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { BandeauDemo } from './BandeauDemo';
import { RoleSwitcher } from './RoleSwitcher';
import { Sidebar } from './Sidebar';
import { BoutonReinitialiserDemo } from './BoutonReinitialiserDemo';
import { IndicateurEnregistrement } from '@/components/common/IndicateurEnregistrement';
import { useUserStore } from '@/store/useUserStore';
import { libelleRole } from '@/lib/droits';

/**
 * Coquille applicative — bandeau démo + header + sidebar + outlet.
 * Référence : cahier des charges v1.3, section 14.4.
 */
export function AppShell() {
  const utilisateurActif = useUserStore((s) => s.utilisateurActif);
  const roleActif = useUserStore((s) => s.roleActif);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BandeauDemo />

      <header className="border-b border-border bg-card">
        <div className="container flex flex-wrap items-center gap-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-3 text-foreground hover:text-primary transition-colors"
            aria-label="Accueil — Livret d'apprentissage GRETA Lyon Métropole"
          >
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm"
            >
              GLM
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-semibold">Livret d'apprentissage</span>
              <span className="text-xs text-muted-foreground">GRETA Lyon Métropole — Démo</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              <span>
                Connecté en tant que <strong className="text-foreground">{utilisateurActif.prenom} {utilisateurActif.nom}</strong>{' '}
                <span className="text-xs">({libelleRole(roleActif)})</span>
              </span>
            </div>
            <RoleSwitcher />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <div className="container py-6">
            <Outlet />
          </div>
        </main>
      </div>

      <footer className="border-t border-border bg-card py-3">
        <div className="container flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-center text-xs text-muted-foreground sm:text-left">
            Cette maquette ne collecte aucune donnée. Aucun tracker, aucun analytics, aucune
            télémétrie. Les données saisies restent dans votre navigateur (localStorage).
          </p>
          <BoutonReinitialiserDemo />
        </div>
      </footer>

      <IndicateurEnregistrement />
    </div>
  );
}
