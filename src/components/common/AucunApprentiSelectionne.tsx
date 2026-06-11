import { Link } from 'react-router-dom';
import { Inbox, ArrowLeft } from 'lucide-react';

/**
 * Affiché quand une page livret est ouverte alors qu'aucun·e apprenti·e
 * n'est sélectionné·e (id stocké invalide, ou état dégradé après réinit).
 *
 * Renvoie vers le tableau de bord, où l'utilisateur·rice fait son choix.
 */
export function AucunApprentiSelectionne() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
      <Inbox
        className="mx-auto mb-3 h-8 w-8 text-muted-foreground"
        aria-hidden="true"
      />
      <h2 className="text-base font-medium">Aucun·e apprenti·e sélectionné·e</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Choisissez un·e apprenti·e depuis le tableau de bord pour ouvrir son
        livret.
      </p>
      <Link
        to="/"
        className="mt-4 inline-flex items-center gap-2 rounded-md bouton-plein-couleur-role px-4 py-2 text-sm font-medium"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour au tableau de bord
      </Link>
    </div>
  );
}
