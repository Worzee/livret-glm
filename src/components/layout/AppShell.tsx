import { Link, Outlet } from 'react-router-dom';
import { Building2, GraduationCap, HardHat, UserCog } from 'lucide-react';
import logoGreta from '@/assets/logo-greta.png';
import { RoleSwitcher } from './RoleSwitcher';
import { Sidebar, MobileMenu } from './Sidebar';
import { BoutonReinitialiserDemo } from './BoutonReinitialiserDemo';
import { IndicateurEnregistrement } from '@/components/common/IndicateurEnregistrement';
import { useUserStore } from '@/store/useUserStore';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { useUtilisateursStore } from '@/store/useUtilisateursStore';
import { libelleRole } from '@/lib/droits';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

/**
 * Classe de scoping qui modifie la variable CSS `--ring` selon le rôle actif.
 * Appliquée sur le wrapper racine, elle recolore tous les `focus-visible:ring-ring`
 * du sous-arbre (boutons, cartes, liens, inputs). Cf. `src/styles/index.css`.
 */
const CLASSE_ROLE_ACTIF: Record<Role, string> = {
  apprenti: 'role-actif-apprenti',
  maitre: 'role-actif-maitre',
  formateur: 'role-actif-formateur',
  coordo: 'role-actif-coordo',
  admin: 'role-actif-admin',
};

/**
 * Coquille applicative — bandeau démo + header + sidebar + outlet.
 * Référence : cahier des charges v1.3, section 14.4.
 */
export function AppShell() {
  const utilisateurActif = useUserStore((s) => s.utilisateurActif);
  const roleActif = useUserStore((s) => s.roleActif);
  const ctxApprenti = useApprentiActif();
  const maitres = useUtilisateursStore((s) => s.maitres);
  const formateurs = useUtilisateursStore((s) => s.formateurs);

  // Trio contextuel — visible uniquement quand un·e apprenti·e est actif·ve
  // (donc pas sur les pages /admin/...). Aide à comprendre « qui voit quoi »
  // au-delà du rôle de démonstration.
  const trio = ctxApprenti
    ? {
        apprenti: ctxApprenti.apprenti,
        maitre: maitres[ctxApprenti.apprenti.maitreApprentissageId],
        formateur: formateurs[ctxApprenti.apprenti.formateurReferentId],
      }
    : null;

  return (
    <div className={cn('min-h-screen flex flex-col bg-background', CLASSE_ROLE_ACTIF[roleActif])}>
      {/* Le bandeau « MAQUETTE DE DÉMONSTRATION » (CDC §21.6) a été retiré le
          12 juin 2026 (retours coordos) — le statut de démo est acquis. La
          mention reste sur la page de garde du PDF exporté. */}
      <header className="border-b border-border bg-card">
        <div className="container flex flex-wrap items-center gap-3 py-3">
          {/* Bouton hamburger (mobile uniquement) */}
          <MobileMenu />

          <Link
            to="/"
            className="flex items-center gap-3 text-foreground hover:text-primary transition-colors"
            aria-label="Accueil - Livret d'apprentissage GRETA Lyon Métropole"
          >
            {/* Logo officiel du réseau GRETA CFA — Académie de Lyon (remplace
                le carré « GLM » de la maquette, juin 2026). */}
            <img
              src={logoGreta}
              alt=""
              aria-hidden="true"
              className="h-8 md:h-10 w-auto shrink-0"
            />
            <span className="hidden sm:flex flex-col leading-tight">
              <span className="font-semibold">Livret d'apprentissage</span>
              <span className="text-xs text-muted-foreground">GRETA Lyon Métropole - Démo</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end gap-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                <span>
                  Connecté en tant que{' '}
                  <strong className="text-foreground">
                    {utilisateurActif.prenom} {utilisateurActif.nom}
                  </strong>{' '}
                  <span className="text-xs">({libelleRole(roleActif)})</span>
                </span>
              </div>
              {trio && <TrioContextuel trio={trio} testid="header-trio-contextuel" />}
            </div>
            <RoleSwitcher />
          </div>
        </div>

        {/* Bandeau contextuel mobile — apparaît sous le header, visible
            uniquement sur < lg quand un·e apprenti·e est actif·ve.
            Évite la duplication avec le bloc desktop ci-dessus. */}
        {trio && (
          <div className="lg:hidden border-t border-border/60 bg-card/60">
            <div className="container py-1.5">
              <TrioContextuel trio={trio} testid="header-trio-contextuel-mobile" />
            </div>
          </div>
        )}
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

// ─────────────────────────────────────────────────────────────────────────────
// Trio contextuel — apprenti·e / maître / formateur référent du livret consulté
// ─────────────────────────────────────────────────────────────────────────────

interface TrioContextuelProps {
  trio: {
    apprenti: { prenom: string; nom: string };
    maitre?: { prenom: string; nom: string };
    formateur?: { prenom: string; nom: string };
  };
  /** Permet d'instancier 2× le composant (desktop + mobile) sans collision E2E. */
  testid: string;
}

function TrioContextuel({ trio, testid }: TrioContextuelProps) {
  const fmt = (p?: { prenom: string; nom: string }) => (p ? `${p.prenom} ${p.nom}` : '-');
  // `flex-wrap` permet le wrap gracieux sur mobile (Pixel 5 = 393px) ; sur
  // desktop tout tient sur une ligne.
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" data-testid={testid}>
      <span className="inline-flex items-center gap-1" title="Apprenti·e">
        <GraduationCap className="h-3.5 w-3.5 shrink-0 text-role-apprenti" aria-hidden="true" />
        <span className="sr-only">Apprenti·e :</span>
        <strong className="font-medium text-foreground">{fmt(trio.apprenti)}</strong>
      </span>
      <span aria-hidden="true" className="text-muted-foreground/40">
        ·
      </span>
      <span className="inline-flex items-center gap-1" title="Maître / Tuteur">
        <HardHat className="h-3.5 w-3.5 shrink-0 text-role-maitre" aria-hidden="true" />
        <span className="sr-only">Maître / Tuteur :</span>
        <strong className="font-medium text-foreground">{fmt(trio.maitre)}</strong>
      </span>
      <span aria-hidden="true" className="text-muted-foreground/40">
        ·
      </span>
      <span className="inline-flex items-center gap-1" title="Formateur référent">
        <UserCog className="h-3.5 w-3.5 shrink-0 text-role-formateur" aria-hidden="true" />
        <span className="sr-only">Formateur référent :</span>
        <strong className="font-medium text-foreground">{fmt(trio.formateur)}</strong>
      </span>
    </div>
  );
}
