import { useState } from 'react';
import { CheckCircle2, Lock, RotateCcw, ShieldCheck } from 'lucide-react';
import type { Livret } from '@/types';
import { useLivretStore } from '@/store/useLivretStore';
import { useUserStore } from '@/store/useUserStore';
import { peutEditer, libelleRole } from '@/lib/droits';
import {
  estCloture,
  motifBlocageCloture,
  peutCloturer,
} from '@/lib/cloture-livret';

/**
 * Bandeau de clôture du livret (R22).
 *
 *  - Tant que la clôture n'est pas possible : bandeau gris informatif (motif).
 *  - Quand elle est possible : bandeau d'action vert avec bouton.
 *  - Quand le livret est clôturé : bandeau bleu avec rappel des coordonnées de
 *    clôture et, pour le formateur, un bouton de réouverture (cas d'erreur).
 *
 * Référence : cahier des charges v1.3, section 8.5.
 */
interface BandeauClotureProps {
  livret: Livret;
}

export function BandeauCloture({ livret }: BandeauClotureProps) {
  const cloturer = useLivretStore((s) => s.cloturerLivret);
  const rouvrir = useLivretStore((s) => s.rouvrirLivret);
  const roleActif = useUserStore((s) => s.roleActif);
  const utilisateurActif = useUserStore((s) => s.utilisateurActif);
  const [confirmation, setConfirmation] = useState<'cloture' | 'reouverture' | null>(null);

  const droitCloture = peutEditer(roleActif, 'cloturer-livret');

  // ── Cas 1 — livret déjà clôturé ─────────────────────────────────────────
  if (estCloture(livret) && livret.cloture) {
    const dateLisible = new Date(livret.cloture.dateCloture).toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
    return (
      <section
        aria-label="Livret clôturé"
        className="flex flex-col gap-3 rounded-lg border border-blue-300 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-medium text-blue-900">Ce livret est clôturé.</p>
            <p className="text-sm text-blue-900/80">
              Clôturé le <strong>{dateLisible}</strong> par{' '}
              <strong>{livret.cloture.auteurNom}</strong> ({libelleRole(livret.cloture.auteurRole)}).
              Les grilles d'évaluation finales sont en lecture seule.
            </p>
          </div>
        </div>
        {droitCloture && (
          <div className="flex shrink-0 items-center gap-2">
            {confirmation === 'reouverture' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    rouvrir(livret.id);
                    setConfirmation(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Confirmer la réouverture
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmation(null)}
                  className="rounded-md border border-blue-300 bg-white px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  Annuler
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmation('reouverture')}
                className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-white px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                aria-label="Rouvrir le livret pour permettre des modifications"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Rouvrir
              </button>
            )}
          </div>
        )}
      </section>
    );
  }

  // ── Cas 2 — pas le droit : on n'affiche rien (silence pour les autres rôles)
  if (!droitCloture) return null;

  // ── Cas 3 — pré-conditions non remplies, message gris informatif ─────────
  if (!peutCloturer(livret)) {
    return (
      <section
        aria-label="Clôture du livret indisponible"
        className="flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-4"
      >
        <Lock className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-medium">Clôture du livret indisponible</p>
          <p className="text-sm text-muted-foreground">
            {motifBlocageCloture(livret)}
          </p>
        </div>
      </section>
    );
  }

  // ── Cas 4 — clôture possible : bouton d'action ──────────────────────────
  return (
    <section
      aria-label="Clôture du livret"
      className="flex flex-col gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-medium text-emerald-900">
            Toutes les fiches de période sont verrouillées.
          </p>
          <p className="text-sm text-emerald-900/80">
            Vous pouvez clôturer le livret. Les grilles d'évaluation finales passeront
            en lecture seule. Cette action est traçable et réversible (réouverture
            possible par le formateur référent).
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {confirmation === 'cloture' ? (
          <>
            <button
              type="button"
              onClick={() => {
                cloturer(
                  livret.id,
                  utilisateurActif.id,
                  `${utilisateurActif.prenom} ${utilisateurActif.nom}`,
                  roleActif,
                );
                setConfirmation(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Confirmer la clôture
            </button>
            <button
              type="button"
              onClick={() => setConfirmation(null)}
              className="rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
            >
              Annuler
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmation('cloture')}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Clôturer le livret
          </button>
        )}
      </div>
    </section>
  );
}
