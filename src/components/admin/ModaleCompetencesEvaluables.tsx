import { useEffect, useId, useState } from 'react';
import { AlertTriangle, ListChecks, X } from 'lucide-react';
import type { Referentiel } from '@/types';
import { useReferentielsStore } from '@/store/useReferentielsStore';
import { useParametresStore } from '@/store/useParametresStore';
import { compterCompetencesEvaluables } from '@/lib/limite-referentiel';
import { grouperParSousFamille } from '@/lib/grouper-competences';
import { cn } from '@/lib/utils';

/**
 * Modale de gestion des lignes évaluables d'un référentiel (juillet 2026 —
 * chantier référentiels #2).
 *
 * Les compétences décochées à l'import (`exclue: true`) sont conservées dans
 * le référentiel ; le coordo / l'admin peut ici les réactiver — ou en exclure
 * d'autres — tant que le total évaluable respecte le seuil global. Chaque
 * bascule est persistée immédiatement (auto-save, pattern du projet) et
 * réaligne les sélections non validées des livrets des formations rattachées
 * (même cascade qu'un réimport).
 */

interface ModaleCompetencesEvaluablesProps {
  ouvert: boolean;
  referentiel: Referentiel;
  onFermer: () => void;
}

export function ModaleCompetencesEvaluables({
  ouvert,
  referentiel,
  onFermer,
}: ModaleCompetencesEvaluablesProps) {
  const basculer = useReferentielsStore((s) => s.basculerExclusionCompetence);
  const seuil = useParametresStore((s) => s.seuilCompetencesEvaluables);
  // Live re-read : le référentiel du store évolue à chaque bascule.
  const referentielCourant = useReferentielsStore(
    (s) => s.referentiels[referentiel.id] ?? referentiel,
  );

  const titreId = useId();
  const [refus, setRefus] = useState<string | null>(null);

  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ouvert, onFermer]);

  if (!ouvert) return null;

  const nbEvaluables = compterCompetencesEvaluables(referentielCourant);

  function toggle(competenceId: string) {
    const r = basculer(referentielCourant.id, competenceId);
    setRefus(r.ok ? null : (r.raison ?? 'Modification refusée.'));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titreId}
    >
      <button
        type="button"
        aria-label="Fermer la modale"
        onClick={onFermer}
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
      />

      <div className="relative w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <ListChecks className="h-5 w-5 shrink-0 texte-couleur-role" aria-hidden="true" />
            <div>
              <h2 id={titreId} className="text-lg font-semibold">
                Lignes évaluables — {referentielCourant.formation}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Les compétences décochées sont conservées mais n'apparaissent plus dans les grilles,
                fiches et sélections. Toute modification réaligne les sélections non validées des
                livrets concernés.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <p
            data-testid="excl-compteur"
            className={cn(
              'text-sm font-semibold',
              nbEvaluables <= seuil ? 'text-emerald-700' : 'text-red-700',
            )}
          >
            {nbEvaluables} / {seuil} ligne{nbEvaluables > 1 ? 's' : ''} évaluable
            {nbEvaluables > 1 ? 's' : ''}
          </p>

          {refus && (
            <p
              role="alert"
              data-testid="excl-refus"
              className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900"
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {refus}
            </p>
          )}

          <div className="space-y-3 rounded-md border border-border bg-secondary/20 p-3">
            {referentielCourant.blocs.map((bloc) => (
              <div key={bloc.id} className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {bloc.libelle}
                </p>
                {grouperParSousFamille(bloc).map((g, i) => (
                  <div key={g.sousFamille ?? `__plat-${i}`}>
                    {g.sousFamille && (
                      <p className="text-xs font-medium text-foreground/70">{g.sousFamille}</p>
                    )}
                    <ul
                      className={cn(
                        'space-y-0.5',
                        g.sousFamille && 'ml-3 border-l border-border pl-2',
                      )}
                    >
                      {g.competences.map((c) => (
                        <li key={c.id}>
                          <label className="flex cursor-pointer items-start gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={!c.exclue}
                              onChange={() => toggle(c.id)}
                              data-testid={`excl-${c.id}`}
                              className="mt-1"
                            />
                            <span className={cn(c.exclue && 'text-muted-foreground line-through')}>
                              {c.libelle}
                              {c.description && (
                                <span className="block text-xs text-muted-foreground no-underline">
                                  {c.description}
                                </span>
                              )}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-row-reverse items-center gap-2 border-t border-border bg-secondary/30 p-3">
          <button
            type="button"
            onClick={onFermer}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-secondary"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
