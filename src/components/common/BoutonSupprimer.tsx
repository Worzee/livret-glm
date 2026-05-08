import { useEffect, useState } from 'react';
import { Check, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Bouton de suppression avec confirmation à 2 clics.
 *
 * Cohérent avec le reste de l'UI (signature, clôture R22, réinit démo) :
 *   - 1ᵉʳ clic : le bouton se transforme en mini-panneau « Supprimer ? [✓] [✗] ».
 *   - 2ᵉ clic sur ✓ : appelle `onConfirmer()`.
 *   - Clic sur ✗, Esc, ou auto-annulation après 10 s : retour à l'état initial.
 *
 * Deux variantes de présentation :
 *   - `icon` (compact) : poubelle simple → mini-panneau (cellule de tableau).
 *   - `text` : poubelle + libellé "Supprimer" → mini-panneau (cartes mobile).
 */
interface BoutonSupprimerProps {
  /** Libellé long pour l'aria-label du bouton initial (ex : « Supprimer la compétence C2-1 »). */
  ariaLabel: string;
  /** Question affichée pendant la confirmation (ex : « Supprimer ? »). */
  question?: string;
  onConfirmer: () => void;
  variant?: 'icon' | 'text';
  /** Petit texte affiché à côté du bouton initial en mode `text`. */
  texteInitial?: string;
}

export function BoutonSupprimer({
  ariaLabel,
  question = 'Supprimer ?',
  onConfirmer,
  variant = 'icon',
  texteInitial = 'Supprimer',
}: BoutonSupprimerProps) {
  const [confirmation, setConfirmation] = useState(false);

  // Auto-annulation après 10 s
  useEffect(() => {
    if (!confirmation) return;
    const t = setTimeout(() => setConfirmation(false), 10_000);
    return () => clearTimeout(t);
  }, [confirmation]);

  // Esc pour annuler
  useEffect(() => {
    if (!confirmation) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmation(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmation]);

  if (confirmation) {
    return (
      <span
        role="group"
        aria-label="Confirmer la suppression"
        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 p-0.5"
      >
        <span className="px-1.5 text-xs font-medium text-red-900">{question}</span>
        <button
          type="button"
          onClick={() => {
            onConfirmer();
            setConfirmation(false);
          }}
          aria-label="Confirmer la suppression"
          className="inline-flex h-7 w-7 items-center justify-center rounded-sm bg-red-600 text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setConfirmation(false)}
          aria-label="Annuler"
          className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-red-200 bg-white text-red-700 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </span>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={() => setConfirmation(true)}
        aria-label={ariaLabel}
        className="rounded-md p-1 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmation(true)}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
        'text-muted-foreground hover:bg-destructive hover:text-destructive-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      {texteInitial}
    </button>
  );
}
