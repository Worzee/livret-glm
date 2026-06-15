import { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import {
  LONGUEUR_MAX_MOTIF,
  LONGUEUR_MIN_MOTIF,
  validerMotifDeverrouillage,
} from '@/lib/deverrouillage-fiche';

/**
 * Modale de déverrouillage d'une fiche signée (R10).
 *
 *  - Champ motif obligatoire (>= 10 caractères, <= 500).
 *  - Avertissement explicite : le déverrouillage invalide les 3 signatures.
 *  - Esc / clic sur l'arrière-plan / bouton Annuler ferment la modale sans action.
 *  - Validation : appelle `onConfirmer(motif)` puis ferme la modale.
 *
 * Référence : cahier des charges v1.3, §6 (note transverse) et §8.3 R21.
 */
interface DialogDeverrouillageProps {
  ouvert: boolean;
  onAnnuler: () => void;
  onConfirmer: (motif: string) => void;
  /** Numéro de la période ciblée — affiché dans le titre pour clarté. */
  numeroPeriode: number;
}

export function DialogDeverrouillage({
  ouvert,
  onAnnuler,
  onConfirmer,
  numeroPeriode,
}: DialogDeverrouillageProps) {
  const [motif, setMotif] = useState('');
  const [tentativeSoumission, setTentativeSoumission] = useState(false);
  const titreId = useId();
  const motifId = useId();
  const erreurId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset à chaque ouverture / fermeture
  useEffect(() => {
    if (ouvert) {
      setMotif('');
      setTentativeSoumission(false);
      // Petit délai pour que la modale soit bien rendue avant focus.
      const t = setTimeout(() => textareaRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [ouvert]);

  // Esc pour fermer
  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onAnnuler();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ouvert, onAnnuler]);

  if (!ouvert) return null;

  const validation = validerMotifDeverrouillage(motif);
  const afficherErreur = tentativeSoumission && !validation.ok;
  const longueur = motif.trim().length;

  function soumettre() {
    setTentativeSoumission(true);
    if (validation.ok) {
      onConfirmer(motif.trim());
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titreId}
    >
      {/* Arrière-plan */}
      <button
        type="button"
        aria-label="Fermer la modale"
        onClick={onAnnuler}
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
      />

      {/* Contenu de la modale */}
      <div className="relative w-full max-w-lg rounded-lg border border-border bg-card shadow-lg">
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <div>
              <h2 id={titreId} className="text-lg font-semibold">
                Déverrouiller la fiche de la période {numeroPeriode}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Un motif explicite est obligatoire pour la traçabilité.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onAnnuler}
            aria-label="Fermer"
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <strong>Attention.</strong> Le déverrouillage invalide les{' '}
            <strong>trois signatures</strong> de la fiche (apprenti·e, maître, formateur). La fiche
            repassera en état <em>en cours</em> et devra être re-signée par chaque partie.
          </div>

          <label htmlFor={motifId} className="text-sm font-medium">
            Motif du déverrouillage <span className="text-red-600">*</span>
          </label>
          <textarea
            id={motifId}
            ref={textareaRef}
            rows={4}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Ex. : erreur de saisie sur l'évaluation du bloc 2 — à corriger en accord avec le maître."
            aria-invalid={afficherErreur}
            aria-describedby={afficherErreur ? erreurId : undefined}
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            maxLength={LONGUEUR_MAX_MOTIF + 50}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Minimum {LONGUEUR_MIN_MOTIF} caractères, maximum {LONGUEUR_MAX_MOTIF}.
            </span>
            <span aria-live="polite">
              {longueur} caractère{longueur > 1 ? 's' : ''}
            </span>
          </div>
          {afficherErreur && (
            <p id={erreurId} role="alert" className="text-sm text-red-700">
              {validation.raison}
            </p>
          )}
        </div>

        <div className="flex flex-row-reverse items-center gap-2 border-t border-border bg-secondary/30 p-3">
          <button
            type="button"
            onClick={soumettre}
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Confirmer le déverrouillage
          </button>
          <button
            type="button"
            onClick={onAnnuler}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
