import { Activity, Lock } from 'lucide-react';
import type { Livret } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { useAttitudesStore } from '@/store/useAttitudesStore';
import { peutEditer } from '@/lib/droits';
import { selectionAttitudesFigee } from '@/lib/selection-attitudes';
import { cn } from '@/lib/utils';

/**
 * Choix des attitudes professionnelles à évaluer (13 juin 2026).
 *
 * Affichée UNIQUEMENT dans l'entretien tripartite 1 : le maître / tuteur et
 * le formateur référent y cochent ensemble les attitudes du catalogue qui
 * seront évaluées par le maître **à chaque entretien** (E1 compris). Le
 * choix se fige à la 3ᵉ signature de l'E1 — même mécanique que la sélection
 * des compétences abordées en entreprise.
 */

interface SectionSelectionAttitudesProps {
  livret: Livret;
}

export function SectionSelectionAttitudes({ livret }: SectionSelectionAttitudesProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const toggle = useLivretStore((s) => s.toggleAttitudeSelectionnee);
  const attitudesMap = useAttitudesStore((s) => s.attitudes);

  const catalogue = Object.values(attitudesMap);
  const selection = new Set(livret.attitudesSelectionnees);
  const figee = selectionAttitudesFigee(livret);
  const editable = peutEditer(roleActif, 'entretien.attitudes-selection') && !figee;

  return (
    <section
      data-testid="selection-attitudes"
      className="space-y-3 rounded-lg border border-border bg-card p-4"
    >
      <header className="space-y-1">
        <h2 className="flex items-center gap-2 text-lg font-medium">
          <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Choix des attitudes professionnelles
        </h2>
        <p className="text-xs text-muted-foreground">
          Le maître / tuteur et le formateur référent retiennent ensemble, pendant cet entretien,
          les attitudes qui seront évaluées par le maître à <strong>chaque</strong> entretien
          tripartite. Le choix se fige à la 3<sup>ᵉ</sup> signature de cet entretien.
        </p>
        <p className="text-xs font-medium">
          {selection.size} attitude{selection.size > 1 ? 's' : ''} retenue
          {selection.size > 1 ? 's' : ''} sur {catalogue.length}
        </p>
      </header>

      {figee && (
        <div className="bandeau-info-couleur-role inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Choix figé — l'entretien 1 est signé par les 3 parties.
        </div>
      )}

      <ul className="grid gap-2 sm:grid-cols-2">
        {catalogue.map((a) => {
          const cochee = selection.has(a.id);
          return (
            <li key={a.id}>
              <label
                className={cn(
                  'flex items-start gap-2.5 rounded-md border px-3 py-2 text-sm transition-colors',
                  cochee ? 'border-ring bg-secondary/40' : 'border-border bg-background',
                  editable ? 'cursor-pointer hover:bg-secondary/60' : 'opacity-80',
                )}
              >
                <input
                  type="checkbox"
                  checked={cochee}
                  disabled={!editable}
                  onChange={() => toggle(livret.id, a.id)}
                  data-testid={`selection-attitude-${a.id}`}
                  className="mt-0.5 h-4 w-4 accent-[hsl(var(--ring))]"
                  aria-label={`Retenir l'attitude : ${a.libelle}`}
                />
                <span>
                  {a.libelle}
                  {a.description && (
                    <span className="block text-xs text-muted-foreground">{a.description}</span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
