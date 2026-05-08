import { AlertTriangle } from 'lucide-react';

/**
 * Bandeau de démonstration NON DISMISSABLE en haut de l'application.
 * Référence : cahier des charges v1.3, section 21.6.
 *
 * S'affiche sur toutes les pages, ne peut pas être fermé.
 */
export function BandeauDemo() {
  return (
    <div
      role="alert"
      className="bg-amber-50 border-b border-amber-300 text-amber-900"
    >
      <div className="container flex items-center gap-3 py-2 text-sm">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="leading-tight">
          <strong>MAQUETTE DE DÉMONSTRATION</strong> — Données fictives, non conforme RGPD. Ne pas
          saisir de données réelles d'apprenti·e·s.
        </p>
      </div>
    </div>
  );
}
