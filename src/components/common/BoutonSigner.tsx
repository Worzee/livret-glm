import { useEffect, useState } from 'react';
import { PenLine, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Bouton de signature avec confirmation explicite (2 clics).
 *
 * Une signature engage la responsabilité de la partie qui l'appose et ne peut
 * être retirée que par déverrouillage (R10, formateur référent uniquement).
 * Cette friction délibérée évite les signatures réflexes.
 *
 *  - 1er clic : affiche un récapitulatif de l'engagement avec date prévue.
 *  - 2ᵉ clic sur "Confirmer" : appelle `onConfirmer()`.
 *  - Bouton "Annuler" ou Esc : revient au bouton initial.
 *  - Auto-annulation après 30 s sans confirmation pour ne pas piéger l'utilisateur.
 *
 * Référence : cahier des charges v1.3, R19 (horodatage ISO 8601 au clic) et R21
 * (retrait impossible sauf via R10).
 */
interface BoutonSignerProps {
  /** Libellé court : prénom / surnom de la partie qui signe. */
  nomCourt: string;
  /** Libellé long pour le récap : « Apprenti·e — Léa MARTIN ». */
  libelleEngagement: string;
  /** Désactivé tant que les champs requis (R20 / R8) ne sont pas remplis. */
  disabled: boolean;
  /** Liste des raisons de blocage R20/R8 (affichées en infobulle). */
  raisonsBlocage?: ReadonlyArray<string>;
  /** Callback déclenché au 2ᵉ clic. */
  onConfirmer: () => void;
}

export function BoutonSigner({
  nomCourt,
  libelleEngagement,
  disabled,
  raisonsBlocage,
  onConfirmer,
}: BoutonSignerProps) {
  const [confirmation, setConfirmation] = useState(false);

  // Auto-annulation après 30 s
  useEffect(() => {
    if (!confirmation) return;
    const t = setTimeout(() => setConfirmation(false), 30_000);
    return () => clearTimeout(t);
  }, [confirmation]);

  // Esc pour annuler la confirmation
  useEffect(() => {
    if (!confirmation) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmation(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmation]);

  if (!confirmation) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setConfirmation(true)}
        title={disabled ? raisonsBlocage?.join(' · ') : ''}
        className={cn(
          'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          disabled
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:opacity-90',
        )}
      >
        <PenLine className="h-4 w-4" aria-hidden="true" />
        Signer en tant que {nomCourt}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Confirmer la signature"
      className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3"
    >
      <div className="flex items-start gap-2 text-xs text-amber-900">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          Vous allez signer en tant que <strong>{libelleEngagement}</strong>. La
          signature sera horodatée à l'instant du clic et ne pourra être retirée
          que via un déverrouillage par le formateur référent (R10).
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setConfirmation(false)}
          className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirmer();
            setConfirmation(false);
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <PenLine className="h-4 w-4" aria-hidden="true" />
          Confirmer
        </button>
      </div>
    </div>
  );
}
