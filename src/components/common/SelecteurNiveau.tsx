import { Check, CircleDashed, CircleDot, X } from 'lucide-react';
import type { NiveauMaitrise, NiveauMaitriseEntreprise } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Sélecteur de niveau de maîtrise avec code couleur.
 * Référence : cahier des charges v1.3, sections 5.3 et 14.2.
 *
 * - Mode `greta` : 3 niveaux (Maîtrisé, Partiel, Non maîtrisé)
 * - Mode `entreprise` : 4 niveaux (idem + Non fait)
 *
 * Affichage :
 *   - lecture : pastille colorée + libellé
 *   - édition : 3-4 boutons radio horizontaux compacts
 */

type Niveau = NiveauMaitriseEntreprise; // surensemble qui contient 'non-fait'

interface OptionNiveau {
  valeur: Niveau;
  libelle: string;
  Icon: typeof Check;
  couleurFond: string; // bg-niveau-* (état sélectionné)
  couleurTexte: string; // text-niveau-* (puce non sélectionnée)
}

const OPTIONS: Record<Niveau, OptionNiveau> = {
  maitrise: {
    valeur: 'maitrise',
    libelle: 'Maîtrisé',
    Icon: Check,
    couleurFond: 'bg-niveau-maitrise text-white',
    couleurTexte: 'text-niveau-maitrise',
  },
  partiel: {
    valeur: 'partiel',
    libelle: 'Partiel',
    Icon: CircleDot,
    couleurFond: 'bg-niveau-partiel text-white',
    couleurTexte: 'text-niveau-partiel',
  },
  'non-maitrise': {
    valeur: 'non-maitrise',
    libelle: 'Non maîtrisé',
    Icon: X,
    couleurFond: 'bg-niveau-non-maitrise text-white',
    couleurTexte: 'text-niveau-non-maitrise',
  },
  'non-fait': {
    valeur: 'non-fait',
    libelle: 'Non fait',
    Icon: CircleDashed,
    couleurFond: 'bg-niveau-non-fait text-white',
    couleurTexte: 'text-niveau-non-fait',
  },
};

interface SelecteurNiveauProps {
  /** Si false, affiche en lecture seule. */
  editable: boolean;
  /** Mode (3 ou 4 niveaux). */
  mode: 'greta' | 'entreprise';
  /** Valeur sélectionnée, ou null si non renseigné. */
  valeur: NiveauMaitrise | NiveauMaitriseEntreprise | null;
  /** Callback appelé quand l'utilisateur·ice clique sur une option. */
  onChange?: (valeur: NiveauMaitrise | NiveauMaitriseEntreprise | null) => void;
  /** Étiquette accessible pour les lecteurs d'écran. */
  ariaLabel?: string;
  className?: string;
}

const NIVEAUX_GRETA: Niveau[] = ['maitrise', 'partiel', 'non-maitrise'];
const NIVEAUX_ENTREPRISE: Niveau[] = ['maitrise', 'partiel', 'non-maitrise', 'non-fait'];

export function SelecteurNiveau({
  editable,
  mode,
  valeur,
  onChange,
  ariaLabel,
  className,
}: SelecteurNiveauProps) {
  const niveauxAffiches = mode === 'greta' ? NIVEAUX_GRETA : NIVEAUX_ENTREPRISE;

  // ── Mode lecture seule ────────────────────────────────────────────────────
  if (!editable) {
    if (valeur === null) {
      return (
        <span className={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
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
          opt.couleurTexte,
          className,
        )}
      >
        <opt.Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {opt.libelle}
      </span>
    );
  }

  // ── Mode édition ──────────────────────────────────────────────────────────
  const handleClick = (n: Niveau) => {
    if (!onChange) return;
    // Cliquer sur la valeur sélectionnée la désélectionne (toggle)
    onChange(valeur === n ? null : n);
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel ?? 'Sélection du niveau de maîtrise'}
      className={cn('flex flex-wrap gap-1.5', className)}
    >
      {niveauxAffiches.map((n) => {
        const opt = OPTIONS[n];
        const selectionne = valeur === n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={selectionne}
            onClick={() => handleClick(n)}
            title={opt.libelle}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              selectionne
                ? opt.couleurFond + ' border-transparent'
                : 'border-border bg-background ' + opt.couleurTexte + ' hover:bg-secondary',
            )}
          >
            <opt.Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{opt.libelle}</span>
          </button>
        );
      })}
    </div>
  );
}
