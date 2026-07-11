import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  Flag,
  Lock,
  PenLine,
  PlayCircle,
  UserX,
  X,
} from 'lucide-react';
import type { Apprenti, DocumentAdministratif, Livret, Role } from '@/types';
import { alertesTableauBord, type AlerteTableauBord, type TypeAlerte } from '@/lib/alertes';

/**
 * Centre d'alertes du tableau de bord (3 juillet 2026) : « qu'est-ce qui
 * attend mon action ? », calculé par rôle sur le périmètre accessible.
 * Un clic active l'apprenti·e concerné·e et navigue vers la page cible.
 */

const ICONES: Record<TypeAlerte, React.ReactNode> = {
  'alerte-r7': <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />,
  'point-alerte-entretien': <Flag className="h-4 w-4 text-amber-600" aria-hidden="true" />,
  'document-a-attester': <FileText className="h-4 w-4 text-amber-600" aria-hidden="true" />,
  'signature-entretien': <PenLine className="texte-couleur-role h-4 w-4" aria-hidden="true" />,
  'signature-fiche': <PenLine className="texte-couleur-role h-4 w-4" aria-hidden="true" />,
  'entretien-a-initialiser': (
    <PlayCircle className="texte-couleur-role h-4 w-4" aria-hidden="true" />
  ),
  'fiche-a-verrouiller': <Lock className="texte-couleur-role h-4 w-4" aria-hidden="true" />,
  'affectation-incomplete': <UserX className="h-4 w-4 text-amber-600" aria-hidden="true" />,
};

interface CentreAlertesProps {
  role: Role;
  apprentis: Apprenti[];
  livrets: Record<string, Livret>;
  /** Documents administratifs (10 juillet 2026) — suivi des attestations. */
  documents: DocumentAdministratif[];
  onOuvrir: (alerte: AlerteTableauBord) => void;
  /**
   * Marque « traité » un point d'alerte de l'entretien (8 juillet 2026 — coordo
   * / admin). Fourni uniquement quand le rôle a la ressource
   * `point-alerte.traiter` ; absent → pas de case à cocher.
   */
  onTraiter?: (alerte: AlerteTableauBord) => void;
}

export function CentreAlertes({
  role,
  apprentis,
  livrets,
  documents,
  onOuvrir,
  onTraiter,
}: CentreAlertesProps) {
  const alertes = useMemo(
    () => alertesTableauBord(role, apprentis, livrets, new Date(), documents),
    [role, apprentis, livrets, documents],
  );

  if (apprentis.length === 0) return null;

  if (alertes.length === 0) {
    return (
      <p
        data-testid="centre-alertes-vide"
        className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground"
      >
        <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
        Aucune action en attente sur votre périmètre.
      </p>
    );
  }

  return (
    <section
      aria-label="Actions en attente"
      data-testid="centre-alertes"
      className="bordure-gauche-couleur-role rounded-lg border border-border bg-card"
    >
      <header className="flex items-center gap-2 border-b border-border p-3">
        <Bell className="texte-couleur-role h-4 w-4" aria-hidden="true" />
        <h2 className="text-sm font-medium">
          À traiter <span className="text-muted-foreground">({alertes.length})</span>
        </h2>
      </header>
      <ul className="divide-y divide-border">
        {alertes.map((alerte) =>
          alerte.type === 'point-alerte-entretien' && onTraiter ? (
            // Point d'alerte de l'entretien : le libellé ouvre l'entretien
            // (contexte), la case « traité » le retire de « À traiter ».
            <li key={alerte.id} className="flex items-center gap-2 p-3 text-sm">
              <span className="shrink-0">{ICONES[alerte.type]}</span>
              <button
                type="button"
                onClick={() => onOuvrir(alerte)}
                data-testid={`alerte-${alerte.id}`}
                className="min-w-0 flex-1 truncate rounded text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <strong className="font-medium">{alerte.apprentiNom}</strong>
                <span className="text-muted-foreground"> : {alerte.message}</span>
              </button>
              <BoutonTraiter
                idBase={alerte.id}
                ariaLabel={`Marquer traité : ${alerte.apprentiNom} — ${alerte.message}`}
                onConfirmer={() => onTraiter(alerte)}
              />
            </li>
          ) : (
            <li key={alerte.id}>
              <button
                type="button"
                onClick={() => onOuvrir(alerte)}
                data-testid={`alerte-${alerte.id}`}
                className="group flex w-full items-center gap-2 p-3 text-left text-sm hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="shrink-0">{ICONES[alerte.type]}</span>
                <span className="min-w-0 flex-1 truncate">
                  <strong className="font-medium">{alerte.apprentiNom}</strong>
                  <span className="text-muted-foreground"> : {alerte.message}</span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}

/**
 * Bouton « Traité » avec confirmation à 2 clics (8 juillet 2026), au pattern de
 * `BoutonSupprimer` : 1ᵉʳ clic → « Confirmez-vous avoir réglé ce problème ?
 * [✓] [✗] » ; ✓ marque le point d'alerte traité (il sort de « À traiter »).
 * Esc ou 10 s d'inactivité annulent — pas d'action irréversible sans validation.
 */
function BoutonTraiter({
  idBase,
  ariaLabel,
  onConfirmer,
}: {
  idBase: string;
  ariaLabel: string;
  onConfirmer: () => void;
}) {
  const [confirmation, setConfirmation] = useState(false);

  useEffect(() => {
    if (!confirmation) return;
    const t = setTimeout(() => setConfirmation(false), 10_000);
    return () => clearTimeout(t);
  }, [confirmation]);

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
        aria-label="Confirmer le traitement du point d'alerte"
        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 p-0.5"
      >
        <span className="px-1.5 text-xs font-medium text-emerald-900">
          Confirmez-vous avoir réglé ce problème ?
        </span>
        <button
          type="button"
          onClick={() => {
            onConfirmer();
            setConfirmation(false);
          }}
          data-testid={`confirmer-traiter-${idBase}`}
          aria-label="Confirmer : problème réglé"
          className="inline-flex h-7 w-7 items-center justify-center rounded-sm bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setConfirmation(false)}
          aria-label="Annuler"
          className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmation(true)}
      data-testid={`traiter-${idBase}`}
      aria-label={ariaLabel}
      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-input px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      Traité
    </button>
  );
}
