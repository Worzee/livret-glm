import { useEffect, useRef, useState } from 'react';
import { Eraser, PenLine, ShieldAlert } from 'lucide-react';
import type { Role } from '@/types';
import { ZoneSignature, type ZoneSignatureHandle } from './ZoneSignature';
import { cn } from '@/lib/utils';

/**
 * Bouton de signature avec confirmation explicite + signature manuscrite
 * tactile (CDC v1.5 §14.C — juin 2026).
 *
 * Une signature engage la responsabilité de la partie qui l'appose et ne peut
 * être retirée que par déverrouillage (R10, formateur référent uniquement).
 * Cette friction délibérée évite les signatures réflexes.
 *
 *  - 1er clic : ouvre l'encart d'engagement avec la zone de signature
 *    manuscrite (doigt / stylet / souris).
 *  - « Confirmer » reste désactivé tant que le tracé n'est pas significatif
 *    (≥ 60 px cumulés) ; il appelle alors `onConfirmer(tracePng)`.
 *  - Bouton "Annuler" ou Esc : revient au bouton initial (tracé abandonné).
 *  - Auto-annulation après 60 s sans confirmation pour ne pas piéger l'utilisateur.
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
  /**
   * Callback déclenché à la confirmation. `trace` : PNG (data-URL) de la
   * signature manuscrite, stocké dans `SignaturePartie.trace`.
   */
  onConfirmer: (trace: string) => void;
  /**
   * Rôle qui signe — détermine la couleur de fond du bouton.
   * Refonte mai 2026 (équilibrage graphique) : bg-role-X au lieu de bg-primary.
   * + `responsable` depuis le 13 juillet 2026 (slot « représentant légal »).
   */
  role: Extract<Role, 'apprenti' | 'maitre' | 'formateur' | 'responsable'>;
  /**
   * Phrase de conséquence affichée dans l'encart d'engagement. Par défaut, la
   * mention R10 des fiches / entretiens ; les documents administratifs
   * (10 juillet 2026) passent leur propre mention (aucun déverrouillage).
   */
  mentionRetrait?: string;
  /** Libellé du bouton initial (défaut : « Signer en tant que {nomCourt} »). */
  libelleBouton?: string;
}

const CLASSE_BG_ROLE: Record<'apprenti' | 'maitre' | 'formateur' | 'responsable', string> = {
  apprenti: 'bg-role-apprenti text-white',
  maitre: 'bg-role-maitre text-white',
  formateur: 'bg-role-formateur text-white',
  responsable: 'bg-role-responsable text-white',
};

export function BoutonSigner({
  nomCourt,
  libelleEngagement,
  disabled,
  raisonsBlocage,
  onConfirmer,
  role,
  mentionRetrait = 'Elle sera horodatée à l’instant de la confirmation et ne pourra être retirée que via un déverrouillage par le formateur référent (R10).',
  libelleBouton,
}: BoutonSignerProps) {
  const [confirmation, setConfirmation] = useState(false);
  // Le tracé manuscrit est-il exploitable (≥ 60 px cumulés) ?
  const [traceValide, setTraceValide] = useState(false);
  const zoneRef = useRef<ZoneSignatureHandle>(null);

  // Auto-annulation après 60 s (le tracé au doigt prend plus de temps que
  // l'ancienne confirmation à 2 clics).
  useEffect(() => {
    if (!confirmation) return;
    const t = setTimeout(() => setConfirmation(false), 60_000);
    return () => clearTimeout(t);
  }, [confirmation]);

  // Tracé remis à zéro à chaque ouverture/fermeture de l'encart.
  useEffect(() => {
    setTraceValide(false);
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
            : cn(CLASSE_BG_ROLE[role], 'hover:opacity-90'),
        )}
      >
        <PenLine className="h-4 w-4" aria-hidden="true" />
        {libelleBouton ?? `Signer en tant que ${nomCourt}`}
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
          Vous allez signer en tant que <strong>{libelleEngagement}</strong>.{' '}
          <strong>Dessinez votre signature ci-dessous</strong> (au doigt, au stylet ou à la souris).{' '}
          {mentionRetrait}
        </p>
      </div>

      <ZoneSignature ref={zoneRef} onChangeSignificative={setTraceValide} />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => zoneRef.current?.effacer()}
          className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Eraser className="h-4 w-4" aria-hidden="true" />
          Effacer
        </button>
        <button
          type="button"
          onClick={() => setConfirmation(false)}
          className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Annuler
        </button>
        <button
          type="button"
          disabled={!traceValide}
          title={traceValide ? undefined : 'Dessinez votre signature pour confirmer.'}
          onClick={() => {
            const trace = zoneRef.current?.exporterPng() ?? '';
            onConfirmer(trace);
            setConfirmation(false);
          }}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            traceValide
              ? cn(CLASSE_BG_ROLE[role], 'hover:opacity-90')
              : 'bg-muted text-muted-foreground cursor-not-allowed',
          )}
        >
          <PenLine className="h-4 w-4" aria-hidden="true" />
          Confirmer
        </button>
      </div>
    </div>
  );
}
