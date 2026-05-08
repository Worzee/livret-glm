import { NavLink } from 'react-router-dom';
import {
  CalendarRange,
  ClipboardList,
  FileDown,
  GraduationCap,
  LayoutDashboard,
  Link2,
  Notebook,
  Target,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/useUserStore';

/**
 * Sidebar de navigation principale.
 * Référence : cahier des charges v1.3, sections 5 et 10.
 *
 * Structure :
 *   - section "Livret" : visible pour tous les rôles
 *   - section "Administration" : visible uniquement pour le rôle coordo
 *
 * En sprint 1 : liens statiques vers les pages placeholder.
 * Les sprints suivants y ajouteront les indicateurs de complétude (CDC §10.4).
 */

const LIENS_LIVRET = [
  { to: '/', label: 'Tableau de bord', Icon: LayoutDashboard },
  { to: '/livret/organisation-suivi', label: 'Organisation du suivi', Icon: CalendarRange },
  { to: '/livret/entretien', label: 'Entretien tripartite', Icon: ClipboardList },
  { to: '/livret/fiches-suivi', label: 'Fiches de suivi', Icon: Notebook },
  { to: '/livret/evaluation-finale', label: 'Évaluation finale', Icon: Target },
  { to: '/livret/export', label: 'Export PDF', Icon: FileDown },
];

const LIENS_ADMIN = [
  { to: '/admin/utilisateurs', label: 'Utilisateurs', Icon: Users },
  { to: '/admin/formations', label: 'Formations', Icon: GraduationCap },
  { to: '/admin/affectations', label: 'Affectations', Icon: Link2 },
];

interface LienItem {
  to: string;
  label: string;
  Icon: typeof LayoutDashboard;
}

function LienNav({ to, label, Icon }: LienItem) {
  return (
    <li>
      <NavLink
        to={to}
        end={to === '/'}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            'hover:bg-secondary',
            isActive && 'bg-secondary text-primary',
          )
        }
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span>{label}</span>
      </NavLink>
    </li>
  );
}

export function Sidebar() {
  const roleActif = useUserStore((s) => s.roleActif);
  // L'admin a accès à tous les écrans, y compris l'administration.
  const voitAdministration = roleActif === 'coordo' || roleActif === 'admin';

  return (
    <aside className="hidden md:block w-60 shrink-0 border-r border-border bg-card">
      <nav aria-label="Navigation du livret" className="p-3 space-y-6">
        <div>
          <h2 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Livret
          </h2>
          <ul className="space-y-1">
            {LIENS_LIVRET.map((lien) => (
              <LienNav key={lien.to} {...lien} />
            ))}
          </ul>
        </div>

        {voitAdministration && (
          <div>
            <h2 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Administration
            </h2>
            <ul className="space-y-1">
              {LIENS_ADMIN.map((lien) => (
                <LienNav key={lien.to} {...lien} />
              ))}
            </ul>
          </div>
        )}
      </nav>
    </aside>
  );
}
