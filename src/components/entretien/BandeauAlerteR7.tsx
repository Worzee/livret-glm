import { AlertTriangle } from 'lucide-react';
import type { AlerteR7 } from '@/lib/regles-entretien';

/**
 * Bandeau ambre R7 : entretien tripartite non tenu dans les délais.
 * Référence : cahier des charges v1.3, section 8.2 (R7).
 *
 * S'affiche en haut de la page si le délai légal de 60 jours après
 * `contratDebut` est dépassé sans entretien complet (3 signatures).
 */

interface BandeauAlerteR7Props {
  alerte: AlerteR7;
}

export function BandeauAlerteR7({ alerte }: BandeauAlerteR7Props) {
  if (!alerte.declenchee) return null;

  return (
    <div
      role="alert"
      className="rounded-md border border-amber-300 bg-amber-50 p-4 flex items-start gap-3"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" aria-hidden="true" />
      <div className="space-y-1">
        <h2 className="font-medium text-amber-900">
          Entretien tripartite non tenu dans les délais réglementaires (R7)
        </h2>
        <p className="text-sm text-amber-900/90">
          L'entretien tripartite doit avoir lieu dans les <strong>60 jours</strong> suivant la
          signature du contrat. Date butoir attendue :{' '}
          <strong>
            <time dateTime={alerte.dateButoir}>
              {new Date(alerte.dateButoir).toLocaleDateString('fr-FR')}
            </time>
          </strong>{' '}
          ({alerte.joursDepasses} jour{alerte.joursDepasses > 1 ? 's' : ''} de retard).
        </p>
        <p className="text-xs text-amber-800/80">
          Cette alerte est informative — la maquette n'empêche pas la poursuite de la saisie.
        </p>
      </div>
    </div>
  );
}
