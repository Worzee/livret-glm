import { Check, CircleDashed, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Trio de boutons Oui / Non / Non renseigné, pour les démarches administratives,
 * conditions pratiques, aides demandées (CDC §5.2).
 */

interface CaseOuiNonProps {
  editable: boolean;
  valeur: boolean | null;
  onChange?: (v: boolean | null) => void;
  ariaLabel: string;
  className?: string;
}

export function CaseOuiNon({
  editable,
  valeur,
  onChange,
  ariaLabel,
  className,
}: CaseOuiNonProps) {
  if (!editable) {
    if (valeur === null) {
      return (
        <span className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground', className)}>
          <CircleDashed className="h-3.5 w-3.5" aria-hidden="true" />
          Non renseigné
        </span>
      );
    }
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs font-medium',
          valeur ? 'text-niveau-maitrise' : 'text-niveau-non-maitrise',
          className,
        )}
      >
        {valeur ? (
          <>
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Oui
          </>
        ) : (
          <>
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Non
          </>
        )}
      </span>
    );
  }

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn('inline-flex gap-1', className)}>
      <button
        type="button"
        role="radio"
        aria-checked={valeur === true}
        onClick={() => onChange?.(valeur === true ? null : true)}
        className={cn(
          'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          valeur === true
            ? 'bg-niveau-maitrise text-white border-transparent'
            : 'border-border bg-background text-niveau-maitrise hover:bg-secondary',
        )}
      >
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
        Oui
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={valeur === false}
        onClick={() => onChange?.(valeur === false ? null : false)}
        className={cn(
          'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          valeur === false
            ? 'bg-niveau-non-maitrise text-white border-transparent'
            : 'border-border bg-background text-niveau-non-maitrise hover:bg-secondary',
        )}
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
        Non
      </button>
    </div>
  );
}
