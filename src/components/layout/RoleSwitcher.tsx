import { Crown, GraduationCap, HardHat, ShieldCheck, UserCog } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { libelleRole } from '@/lib/droits';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

/**
 * Sélecteur de rôle visible dans le header.
 * Référence : cahier des charges v1.3, sections 4.2 et 14.4.
 *
 * Cinq boutons d'égale importance, code couleur par rôle.
 * Le rôle Coordo et le rôle Admin sont ajoutés en extension métier au CDC v1.3.
 */

const ROLES_CONFIG: Array<{
  role: Role;
  Icon: typeof GraduationCap;
  classeActive: string;
  libelleCourt?: string;
}> = [
  { role: 'apprenti', Icon: GraduationCap, classeActive: 'bg-role-apprenti text-white' },
  { role: 'maitre', Icon: HardHat, classeActive: 'bg-role-maitre text-white' },
  { role: 'formateur', Icon: UserCog, classeActive: 'bg-role-formateur text-white' },
  { role: 'coordo', Icon: ShieldCheck, classeActive: 'bg-role-coordo text-white' },
  { role: 'admin', Icon: Crown, classeActive: 'bg-role-admin text-white', libelleCourt: 'Admin' },
];

export function RoleSwitcher() {
  const roleActif = useUserStore((s) => s.roleActif);
  const changerRole = useUserStore((s) => s.changerRole);

  return (
    <div
      role="radiogroup"
      aria-label="Sélection du rôle de démonstration"
      className="flex items-center gap-1 rounded-lg border border-border bg-secondary p-1"
    >
      {ROLES_CONFIG.map(({ role, Icon, classeActive, libelleCourt }) => {
        const actif = roleActif === role;
        const libelle = libelleCourt ?? libelleRole(role);
        return (
          <button
            key={role}
            type="button"
            role="radio"
            aria-checked={actif}
            aria-label={libelleRole(role)}
            onClick={() => changerRole(role)}
            className={cn(
              // Touch target ≥ 36 px en mode compact mobile, élargi en desktop.
              'flex items-center justify-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
              'min-w-9 min-h-9',
              'lg:px-3',
              'hover:bg-background',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              actif && classeActive,
              actif && 'hover:opacity-90',
            )}
            title={libelleRole(role)}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {/* Sur mobile : icône seule (libellé porté par aria-label).
                À partir de lg : libellé visible. */}
            <span className="hidden lg:inline">{libelle}</span>
          </button>
        );
      })}
    </div>
  );
}
