import { AlertTriangle, Check, CircleDashed, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Trio de boutons Oui / Non / Non renseigné, pour les questions oui/non de
 * la trame de l'entretien tripartite (CDC §5.2).
 *
 * 7 juillet 2026 (demande pilote) : la **polarité** suit la formulation de
 * la question. Sur les questions formulées positivement (défaut,
 * `oui-positif`), « Oui » est la norme (vert) et « Non » l'alerte (rouge).
 * Sur la rubrique « Difficultés éventuelles » (`oui-negatif`), « Oui »
 * déclare une difficulté (rouge, icône d'alerte) et « Non » est la norme
 * (vert) — plus naturel que l'ancien « Oui » = situation satisfaisante.
 */

export type PolariteOuiNon = 'oui-positif' | 'oui-negatif';

// Classes littérales (JIT Tailwind : pas d'interpolation dynamique).
const VERT_TEXTE = 'text-niveau-maitrise';
const VERT_PLEIN = 'bg-niveau-maitrise text-white border-transparent';
const ROUGE_TEXTE = 'text-niveau-non-maitrise';
const ROUGE_PLEIN = 'bg-niveau-non-maitrise text-white border-transparent';

interface CaseOuiNonProps {
  editable: boolean;
  valeur: boolean | null;
  onChange?: (v: boolean | null) => void;
  ariaLabel: string;
  className?: string;
  /** Sens de l'alerte (défaut : « Non » = alerte). */
  polarite?: PolariteOuiNon;
}

export function CaseOuiNon({
  editable,
  valeur,
  onChange,
  ariaLabel,
  className,
  polarite = 'oui-positif',
}: CaseOuiNonProps) {
  // Couleur portée par la sémantique : vert pour la réponse « norme »,
  // rouge pour la réponse qui déclenche un point d'alerte.
  const ouiEstAlerte = polarite === 'oui-negatif';
  const texteOui = ouiEstAlerte ? ROUGE_TEXTE : VERT_TEXTE;
  const pleinOui = ouiEstAlerte ? ROUGE_PLEIN : VERT_PLEIN;
  const texteNon = ouiEstAlerte ? VERT_TEXTE : ROUGE_TEXTE;
  const pleinNon = ouiEstAlerte ? VERT_PLEIN : ROUGE_PLEIN;
  const IconeOui = ouiEstAlerte ? AlertTriangle : Check;
  const IconeNon = ouiEstAlerte ? Check : X;

  if (!editable) {
    if (valeur === null) {
      return (
        <span
          className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground', className)}
        >
          <CircleDashed className="h-3.5 w-3.5" aria-hidden="true" />
          Non renseigné
        </span>
      );
    }
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs font-medium',
          valeur ? texteOui : texteNon,
          className,
        )}
      >
        {valeur ? (
          <>
            <IconeOui className="h-3.5 w-3.5" aria-hidden="true" />
            Oui
          </>
        ) : (
          <>
            <IconeNon className="h-3.5 w-3.5" aria-hidden="true" />
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
          valeur === true ? pleinOui : `border-border bg-background hover:bg-secondary ${texteOui}`,
        )}
      >
        <IconeOui className="h-3.5 w-3.5" aria-hidden="true" />
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
            ? pleinNon
            : `border-border bg-background hover:bg-secondary ${texteNon}`,
        )}
      >
        <IconeNon className="h-3.5 w-3.5" aria-hidden="true" />
        Non
      </button>
    </div>
  );
}
