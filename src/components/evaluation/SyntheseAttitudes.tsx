import type { NiveauAppreciation } from '@/types';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { useAttitudesStore } from '@/store/useAttitudesStore';
import { lignesSyntheseAttitudes } from '@/lib/attitudes';
import { cn } from '@/lib/utils';

/**
 * Synthèse des attitudes professionnelles (retours coordos juin 2026).
 *
 * Les attitudes sont évaluées par le maître / tuteur **lors de l'entretien
 * tripartite**. Cet onglet de l'évaluation finale en présente le résultat en
 * **lecture seule** : une ligne par attitude, le niveau évalué à l'entretien.
 *
 * 3 juillet 2026 : les 4 attitudes **obligatoires** (critères de
 * l'appréciation générale du maître, trame officielle) ouvrent le tableau,
 * au-dessus des attitudes optionnelles retenues à l'entretien.
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

  if (!ctx) return null;
  const { livret } = ctx;

  // 3 juillet 2026 : 4 obligatoires (appréciation du maître) en tête, puis
  // les attitudes RETENUES pour ce livret (choix fait à l'entretien).
  const lignes = lignesSyntheseAttitudes(
    Object.values(attitudesMap),
    livret.attitudesSelectionnees ?? [],
    livret.entretien,
  );
  const aucuneOptionnelle = lignes.every((l) => l.obligatoire);

  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-lg font-medium">Attitudes professionnelles</h2>
        <p className="text-xs text-muted-foreground">
          Synthèse en lecture seule des évaluations portées par le maître / tuteur lors de
          l'entretien tripartite. Les 4 premières attitudes (obligatoires) reprennent son
          appréciation générale ; les suivantes sont les attitudes optionnelles retenues à
          l'entretien. La saisie se fait dans la page « Entretien tripartite ».
        </p>
      </header>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left w-1/2">Attitude</th>
              <th className="px-3 py-2 text-center">Entretien tripartite</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lignes.map((ligne) => (
              <tr
                key={ligne.id}
                className="align-top"
                data-testid={`synthese-attitude-${ligne.id}`}
              >
                <td className="px-3 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">{ligne.libelle}</span>
                    {ligne.obligatoire && (
                      <span className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Obligatoire
                      </span>
                    )}
                  </div>
                  {ligne.description && (
                    <p className="text-xs text-muted-foreground">{ligne.description}</p>
                  )}
                </td>
                <td
                  className="px-3 py-3 text-center border-l-2 border-l-border"
                  aria-label={`Entretien tripartite — ${ligne.libelle} : ${
                    ligne.niveau ? LIBELLE_APPRECIATION[ligne.niveau] : 'non évaluée'
                  }`}
                >
                  {ligne.niveau ? (
                    <span
                      className={cn(
                        'inline-block rounded px-2 py-0.5 text-xs font-semibold',
                        CLASSE_APPRECIATION[ligne.niveau],
                      )}
                    >
                      {LIBELLE_APPRECIATION[ligne.niveau]}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {aucuneOptionnelle && (
        <p className="rounded-md border border-dashed border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
          Aucune attitude optionnelle retenue pour ce livret — le choix se fait à l'entretien
          tripartite (maître / tuteur + formateur référent), qui les évalue pendant l'entretien.
        </p>
      )}
    </section>
  );
}
