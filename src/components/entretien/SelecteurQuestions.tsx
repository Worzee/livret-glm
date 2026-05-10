import { useEffect, useId, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ListChecks, X } from 'lucide-react';
import type { CibleQuestion, QuestionBanque } from '@/types';
import { useBanqueQuestionsStore } from '@/store/useBanqueQuestionsStore';
import { cn } from '@/lib/utils';

/**
 * Modale de sélection des questions pour l'entretien tripartite.
 * Référence : refonte mai 2026.
 *
 * Le formateur référent y choisit, parmi la banque (filtrée par `cible`),
 * les questions à poser pour ce livret précis. L'ordre du tableau retourné
 * détermine l'ordre d'affichage dans `SectionApprenti` / `SectionMaitre`.
 *
 * Conception :
 *   - Liste avec checkbox + boutons ↑/↓ pour réordonner.
 *   - Validation à la confirmation (« Enregistrer ») — pas d'auto-save pour
 *     éviter de mutiler les réponses déjà saisies si on coche/décoche par
 *     erreur. Les réponses orphelines sont nettoyées au moment du save.
 *   - Esc / clic backdrop / Annuler ferment sans rien persister.
 */

interface SelecteurQuestionsProps {
  ouvert: boolean;
  cible: CibleQuestion;
  /** Liste actuelle (ids) — détermine l'état initial des checkboxes + ordre. */
  selectionInitiale: string[];
  onAnnuler: () => void;
  onValider: (questionIds: string[]) => void;
}

export function SelecteurQuestions({
  ouvert,
  cible,
  selectionInitiale,
  onAnnuler,
  onValider,
}: SelecteurQuestionsProps) {
  const banque = useBanqueQuestionsStore((s) => s.questions);
  const titreId = useId();

  const questionsCible = useMemo(
    () =>
      Object.values(banque)
        .filter((q) => q.cible === cible)
        .sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr-FR')),
    [banque, cible],
  );

  // État local de la sélection ordonnée (tableau d'ids).
  const [selection, setSelection] = useState<string[]>(selectionInitiale);

  // Reset à chaque ouverture pour éviter les états zombies.
  useEffect(() => {
    if (ouvert) setSelection(selectionInitiale);
  }, [ouvert, selectionInitiale]);

  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onAnnuler();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ouvert, onAnnuler]);

  if (!ouvert) return null;

  function toggle(id: string) {
    setSelection((s) =>
      s.includes(id) ? s.filter((i) => i !== id) : [...s, id],
    );
  }

  function deplacer(id: string, sens: -1 | 1) {
    setSelection((s) => {
      const idx = s.indexOf(id);
      if (idx === -1) return s;
      const cible = idx + sens;
      if (cible < 0 || cible >= s.length) return s;
      const copie = [...s];
      [copie[idx], copie[cible]] = [copie[cible], copie[idx]];
      return copie;
    });
  }

  // Liste affichée : ordonnée par sélection (sélectionnées d'abord, dans
  // l'ordre choisi), puis non-sélectionnées (ordre alphabétique).
  const idsSelectionnes = new Set(selection);
  const ordreAffichage: QuestionBanque[] = [
    ...selection
      .map((id) => banque[id])
      .filter((q): q is QuestionBanque => !!q && q.cible === cible),
    ...questionsCible.filter((q) => !idsSelectionnes.has(q.id)),
  ];

  const titreCible = cible === 'apprenti' ? "l'apprenti·e" : 'le maître';

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
        onClick={onAnnuler}
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
      />

      <div className="relative w-full max-w-xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <ListChecks className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <h2 id={titreId} className="text-lg font-semibold">
                Choisir les questions à poser à {titreCible}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Cochez les questions à inclure. Les flèches ↑/↓ déterminent l'ordre
                d'affichage.
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

        <div className="p-4">
          {ordreAffichage.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Aucune question disponible dans la banque pour {titreCible}. Demandez à
              un coordinateur·rice ou un administrateur·rice d'en ajouter.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {ordreAffichage.map((q) => {
                const coche = idsSelectionnes.has(q.id);
                const positionDansSelection = selection.indexOf(q.id);
                const peutMonter = coche && positionDansSelection > 0;
                const peutDescendre =
                  coche && positionDansSelection < selection.length - 1;
                return (
                  <li
                    key={q.id}
                    data-testid={`selecteur-q-${q.id}`}
                    className={cn(
                      'flex items-start gap-2 rounded-md border px-2 py-2 text-sm',
                      coche
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border bg-background',
                    )}
                  >
                    <label className="flex items-start gap-2 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={coche}
                        onChange={() => toggle(q.id)}
                        className="mt-0.5 h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <span className="flex-1">
                        <span className="font-medium text-foreground">{q.libelle}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({libelleType(q.type)})
                        </span>
                        {coche && positionDansSelection >= 0 && (
                          <span className="ml-2 inline-block rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            #{positionDansSelection + 1}
                          </span>
                        )}
                      </span>
                    </label>
                    {coche && (
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          type="button"
                          disabled={!peutMonter}
                          onClick={() => deplacer(q.id, -1)}
                          aria-label={`Monter ${q.libelle}`}
                          className={cn(
                            'rounded p-0.5 transition-colors',
                            peutMonter
                              ? 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                              : 'opacity-30 cursor-not-allowed',
                          )}
                        >
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={!peutDescendre}
                          onClick={() => deplacer(q.id, 1)}
                          aria-label={`Descendre ${q.libelle}`}
                          className={cn(
                            'rounded p-0.5 transition-colors',
                            peutDescendre
                              ? 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                              : 'opacity-30 cursor-not-allowed',
                          )}
                        >
                          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="sticky bottom-0 flex flex-row-reverse items-center gap-2 border-t border-border bg-secondary/30 p-3">
          <button
            type="button"
            onClick={() => onValider(selection)}
            data-testid="selecteur-q-valider"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Enregistrer ({selection.length} sélectionnée
            {selection.length > 1 ? 's' : ''})
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

function libelleType(type: QuestionBanque['type']): string {
  switch (type) {
    case 'texte-court':
      return 'texte court';
    case 'texte-long':
      return 'texte long';
    case 'oui-non':
      return 'oui / non';
  }
}
