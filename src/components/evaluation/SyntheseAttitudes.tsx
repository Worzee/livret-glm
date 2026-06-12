import type { NiveauAppreciation } from '@/types';
import { NUMEROS_ENTRETIEN } from '@/types';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { useAttitudesStore } from '@/store/useAttitudesStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { cn } from '@/lib/utils';

/**
 * Synthèse des attitudes professionnelles (retours coordos juin 2026).
 *
 * Les attitudes sont évaluées par le maître / tuteur **à chaque entretien
 * tripartite** (cf. `SectionMaitre`). Cet onglet de l'évaluation finale en
 * présente l'historique en **lecture seule** : une ligne par attitude du
 * catalogue global, une colonne par entretien de la formation (E1..EN) —
 * on visualise la progression au fil du parcours.
 */

const LIBELLE_APPRECIATION: Record<NiveauAppreciation, string> = {
  plusplus: '++',
  plus: '+',
  moins: '-',
  moinsmoins: '--',
};

const CLASSE_APPRECIATION: Record<NiveauAppreciation, string> = {
  plusplus: 'bg-emerald-100 text-emerald-800',
  plus: 'bg-emerald-50 text-emerald-700',
  moins: 'bg-amber-100 text-amber-800',
  moinsmoins: 'bg-red-100 text-red-800',
};

export function SyntheseAttitudes() {
  const ctx = useApprentiActif();
  const attitudesMap = useAttitudesStore((s) => s.attitudes);
  const formations = useFormationsStore((s) => s.formations);

  if (!ctx) return null;
  const { apprenti, livret } = ctx;

  const attitudes = Object.values(attitudesMap);
  const nombreEntretiens = formations[apprenti.formationId]?.nombreEntretiens ?? 2;
  const numeros = NUMEROS_ENTRETIEN.filter((n) => n <= nombreEntretiens);

  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-lg font-medium">Attitudes professionnelles</h2>
        <p className="text-xs text-muted-foreground">
          Synthèse en lecture seule des évaluations portées par le maître / tuteur à chaque
          entretien tripartite. La saisie se fait dans la section « Maître / Tuteur » de chaque
          entretien.
        </p>
      </header>

      {attitudes.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
          Aucune attitude dans le catalogue. Un administrateur·rice peut en créer depuis{' '}
          <em>Administration → Attitudes</em>.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left w-1/2">Attitude</th>
                {numeros.map((n) => (
                  <th key={n} className="px-3 py-2 text-center">
                    Entretien {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {attitudes.map((att) => (
                <tr key={att.id} className="align-top">
                  <td className="px-3 py-3">
                    <div className="font-medium text-sm">{att.libelle}</div>
                    {att.description && (
                      <p className="text-xs text-muted-foreground">{att.description}</p>
                    )}
                  </td>
                  {numeros.map((n) => {
                    const entretien = livret.entretiens[n];
                    const niveau = entretien?.evaluationsAttitudes[att.id] ?? null;
                    return (
                      <td
                        key={n}
                        className="px-3 py-3 text-center border-l-2 border-l-border"
                        aria-label={`Entretien ${n} — ${att.libelle} : ${
                          niveau ? LIBELLE_APPRECIATION[niveau] : 'non évaluée'
                        }`}
                      >
                        {niveau ? (
                          <span
                            className={cn(
                              'inline-block rounded px-2 py-0.5 text-xs font-semibold',
                              CLASSE_APPRECIATION[niveau],
                            )}
                          >
                            {LIBELLE_APPRECIATION[niveau]}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
