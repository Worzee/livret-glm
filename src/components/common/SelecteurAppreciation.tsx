import { CircleDashed } from 'lucide-react';
import type { NiveauAppreciation } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Sélecteur d'appréciation 4 niveaux : ++, +, -, --
 * Référence : cahier des charges v1.3, sections 5.2 et 14.2.
 *
 * Utilisé dans la grille d'appréciation du maître d'apprentissage (entretien)
 * et dans la grille finale des attitudes professionnelles (sprint 4).
 */

interface OptionAppreciation {
  valeur: NiveauAppreciation;
  symbole: string;
  libelle: string;
  classes: string; // bg + text
  classesContour: string; // text seul (mode lecture / non sélectionné)
}

const OPTIONS: Record<NiveauAppreciation, OptionAppreciation> = {
  plusplus: {
    valeur: 'plusplus',
    symbole: '++',
    libelle: 'Très bien',
    classes: 'bg-appreciation-plusplus text-white',
    classesContour: 'text-appreciation-plusplus',
  },
  plus: {
    valeur: 'plus',
    symbole: '+',
    libelle: 'Bien',
    classes: 'bg-appreciation-plus text-white',
    classesContour: 'text-appreciation-plus',
  },
  moins: {
    valeur: 'moins',
    symbole: '–',
    libelle: 'À améliorer',
    classes: 'bg-appreciation-moins text-white',
    classesContour: 'text-appreciation-moins',
  },
  moinsmoins: {
    valeur: 'moinsmoins',
    symbole: '– –',
    libelle: 'Insuffisant',
    classes: 'bg-appreciation-moinsmoins text-white',
    classesContour: 'text-appreciation-moinsmoins',
  },
};

const ORDRE: NiveauAppreciation[] = ['plusplus', 'plus', 'moins', 'moinsmoins'];

interface SelecteurAppreciationProps {
  editable: boolean;
  valeur: NiveauAppreciation | null | undefined;
  onChange?: (v: NiveauAppreciation | null) => void;
  ariaLabel?: string;
  className?: string;
}

export function SelecteurAppreciation({
  editable,
  valeur,
  onChange,
  ariaLabel,
  className,
}: SelecteurAppreciationProps) {
  // ── Lecture ────────────────────────────────────────────────────────────────
  if (!editable) {
    if (!valeur) {
      return (
        <span
          className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground', className)}
        >
          <CircleDashed className="h-3.5 w-3.5" aria-hidden="true" />
          Non renseigné
        </span>
      );
    }
    const opt = OPTIONS[valeur];
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium',
          opt.classesContour,
          className,
        )}
        title={opt.libelle}
      >
        <span className="font-mono text-sm font-bold">{opt.symbole}</span>
        {opt.libelle}
      </span>
    );
  }

  // ── Édition ────────────────────────────────────────────────────────────────
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel ?? "Sélection de l'appréciation"}
      className={cn('flex flex-wrap gap-1', className)}
    >
      {ORDRE.map((n) => {
        const opt = OPTIONS[n];
        const selectionne = valeur === n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={selectionne}
            onClick={() => onChange?.(selectionne ? null : n)}
            title={opt.libelle}
            className={cn(
              'inline-flex h-9 min-w-[3rem] items-center justify-center rounded-md border px-2 text-sm font-mono font-bold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              selectionne
                ? opt.classes + ' border-transparent'
                : 'border-border bg-background ' + opt.classesContour + ' hover:bg-secondary',
            )}
          >
            {opt.symbole}
          </button>
        );
      })}
    </div>
  );
}
