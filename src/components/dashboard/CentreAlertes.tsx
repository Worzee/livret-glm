import { useMemo } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Lock,
  PenLine,
  PlayCircle,
  UserX,
} from 'lucide-react';
import type { Apprenti, Formation, Livret, Role } from '@/types';
import { alertesTableauBord, type AlerteTableauBord, type TypeAlerte } from '@/lib/alertes';

/**
 * Centre d'alertes du tableau de bord (3 juillet 2026) : « qu'est-ce qui
 * attend mon action ? », calculé par rôle sur le périmètre accessible.
 * Un clic active l'apprenti·e concerné·e et navigue vers la page cible.
 */

const ICONES: Record<TypeAlerte, React.ReactNode> = {
  'alerte-r7': <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />,
  'signature-entretien': <PenLine className="texte-couleur-role h-4 w-4" aria-hidden="true" />,
  'signature-fiche': <PenLine className="texte-couleur-role h-4 w-4" aria-hidden="true" />,
  'entretien-a-initialiser': (
    <PlayCircle className="texte-couleur-role h-4 w-4" aria-hidden="true" />
  ),
  'fiche-a-verrouiller': <Lock className="texte-couleur-role h-4 w-4" aria-hidden="true" />,
  'affectation-incomplete': <UserX className="h-4 w-4 text-amber-600" aria-hidden="true" />,
};

interface CentreAlertesProps {
  role: Role;
  apprentis: Apprenti[];
  livrets: Record<string, Livret>;
  formations: Record<string, Formation>;
  onOuvrir: (alerte: AlerteTableauBord) => void;
}

export function CentreAlertes({
  role,
  apprentis,
  livrets,
  formations,
  onOuvrir,
}: CentreAlertesProps) {
  const alertes = useMemo(
    () => alertesTableauBord(role, apprentis, livrets, formations),
    [role, apprentis, livrets, formations],
  );

  if (apprentis.length === 0) return null;

  if (alertes.length === 0) {
    return (
      <p
        data-testid="centre-alertes-vide"
        className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground"
      >
        <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
        Aucune action en attente sur votre périmètre.
      </p>
    );
  }

  return (
    <section
      aria-label="Actions en attente"
      data-testid="centre-alertes"
      className="bordure-gauche-couleur-role rounded-lg border border-border bg-card"
    >
      <header className="flex items-center gap-2 border-b border-border p-3">
        <Bell className="texte-couleur-role h-4 w-4" aria-hidden="true" />
        <h2 className="text-sm font-medium">
          À traiter <span className="text-muted-foreground">({alertes.length})</span>
        </h2>
      </header>
      <ul className="divide-y divide-border">
        {alertes.map((alerte) => (
          <li key={alerte.id}>
            <button
              type="button"
              onClick={() => onOuvrir(alerte)}
              data-testid={`alerte-${alerte.id}`}
              className="group flex w-full items-center gap-2 p-3 text-left text-sm hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="shrink-0">{ICONES[alerte.type]}</span>
              <span className="min-w-0 flex-1 truncate">
                <strong className="font-medium">{alerte.apprentiNom}</strong>
                <span className="text-muted-foreground"> — {alerte.message}</span>
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
