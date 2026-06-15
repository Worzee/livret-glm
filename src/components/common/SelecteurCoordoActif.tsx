import { ClipboardList } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { useUtilisateursStore } from '@/store/useUtilisateursStore';
import { cn } from '@/lib/utils';

/**
 * Sélecteur du coordo actif (artifice de démonstration — juin 2026).
 *
 * En production, un·e coordo authentifié·e ne verrait que son propre
 * périmètre. En maquette, ce bandeau permet de basculer entre les coordos
 * pour démontrer que chacun·e ne voit que ses apprenti·e·s (`Apprenti.coordoId`).
 *
 * Visible uniquement en rôle `coordo` et s'il existe plus d'un·e coordo.
 * Réutilisé sur le tableau de bord et les pages d'administration filtrées
 * par périmètre (affectations, utilisateurs) — il était auparavant cantonné
 * au tableau de bord, d'où la confusion « je ne peux pas changer de coordo
 * depuis la page Affectations ».
 */
export function SelecteurCoordoActif() {
  const roleActif = useUserStore((s) => s.roleActif);
  const coordoActifId = useUserStore((s) => s.coordoActifId);
  const setCoordoActif = useUserStore((s) => s.setCoordoActif);
  const coordos = useUtilisateursStore((s) => s.coordos);
  const apprentis = useUtilisateursStore((s) => s.apprentis);

  const liste = Object.values(coordos);
  if (roleActif !== 'coordo' || liste.length < 2) return null;

  return (
    <fieldset className="rounded-lg border border-role-coordo/40 bg-role-coordo/5 p-3">
      <legend className="flex items-center gap-1.5 px-1.5 text-xs font-medium text-role-coordo">
        <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
        Périmètre consulté (coordinateur·rice actif·ve)
      </legend>
      <div className="flex flex-wrap gap-2">
        {liste.map((c) => {
          const actif = c.id === coordoActifId;
          const nb = Object.values(apprentis).filter((a) => a.coordoId === c.id).length;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCoordoActif(c.id)}
              aria-pressed={actif}
              data-testid={`coordo-actif-${c.id}`}
              className={cn(
                'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                actif
                  ? 'border-role-coordo bg-role-coordo text-white'
                  : 'border-input bg-background hover:bg-secondary',
              )}
            >
              <span className="font-medium">
                {c.prenom} {c.nom}
              </span>
              <span className={cn('text-xs', actif ? 'text-white/85' : 'text-muted-foreground')}>
                · {nb} apprenti·e·s
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
