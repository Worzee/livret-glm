import { type ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { libelleRole, peutEditer, rolesAutorises, type Ressource } from '@/lib/droits';
import { cn } from '@/lib/utils';

/**
 * Wrapper qui matérialise le droit d'édition d'un champ.
 * Référence : cahier des charges v1.3, sections 6 et 14.4.
 *
 * - Si le rôle actif PEUT éditer : rendu enfant tel quel + bordure d'indication
 * - Sinon : rendu en lecture seule, badge "verrou", tooltip listant les rôles habilités
 *
 * Usage :
 *   <ChampEditable ressource="entretien.questions-apprenti">
 *     <textarea ... />
 *   </ChampEditable>
 */

interface ChampEditableProps {
  /** Identifiant de la ressource (cf. lib/droits.ts). */
  ressource: Ressource;
  /** Rendu en mode édition. */
  children: ReactNode;
  /** Rendu alternatif en lecture seule. Si omis, on affiche `children` désactivé. */
  rendererLecture?: ReactNode;
  /** Classe additionnelle sur le wrapper. */
  className?: string;
}

export function ChampEditable({
  ressource,
  children,
  rendererLecture,
  className,
}: ChampEditableProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const editable = peutEditer(roleActif, ressource);
  const autorises = rolesAutorises(ressource);
  const tooltipText = `Modifiable par : ${autorises.map(libelleRole).join(', ')}`;

  return (
    <div
      className={cn(
        'relative rounded-md border-l-2 transition-colors',
        editable ? 'border-l-primary' : 'border-l-muted opacity-70',
        className,
      )}
      data-editable={editable}
      title={tooltipText}
    >
      {!editable && (
        <span
          aria-hidden="true"
          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
        >
          <Lock className="h-3 w-3" />
          Lecture
        </span>
      )}
      <div className={cn(!editable && 'pointer-events-none select-text')}>
        {editable ? children : (rendererLecture ?? children)}
      </div>
    </div>
  );
}
