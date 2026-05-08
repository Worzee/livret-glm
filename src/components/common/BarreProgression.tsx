import { cn } from '@/lib/utils';

/**
 * Barre de progression simple (0-100%).
 * Référence : cahier des charges v1.3, section 5.2 (entretien tripartite).
 */

interface BarreProgressionProps {
  valeur: number;
  /** Étiquette accessible. */
  label: string;
  /** Couleur de fond personnalisée (sinon : primary). */
  classeBarre?: string;
  /** Affiche le pourcentage à droite. */
  afficherPct?: boolean;
  className?: string;
}

export function BarreProgression({
  valeur,
  label,
  classeBarre,
  afficherPct = true,
  className,
}: BarreProgressionProps) {
  const pct = Math.max(0, Math.min(100, valeur));
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        {afficherPct && <span className="tabular-nums text-muted-foreground">{pct} %</span>}
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} : ${pct} pour cent`}
        className="h-2 w-full overflow-hidden rounded-full bg-secondary"
      >
        <div
          className={cn('h-full rounded-full transition-all', classeBarre ?? 'bg-primary')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
