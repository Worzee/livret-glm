import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Page introuvable</h1>
      <p className="text-muted-foreground">
        L'URL demandée ne correspond à aucune page de la maquette.
      </p>
      <Link
        to="/"
        className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Retour au tableau de bord
      </Link>
    </div>
  );
}
