import type { NiveauAppreciation } from '@/types';
import { NUMEROS_ENTRETIEN } from '@/types';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { useAttitudesStore } from '@/store/useAttitudesStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { lignesSyntheseAttitudes } from '@/lib/attitudes';
import { cn } from '@/lib/utils';

/**
 * Synthèse des attitudes professionnelles (retours coordos juin 2026).
 *
 * Les attitudes sont évaluées par le maître / tuteur **à chaque entretien
 * tripartite** (cf. `SectionMaitre`). Cet onglet de l'évaluation finale en
 * présente l'historique en **lecture seule** : une ligne par attitude, une
 * colonne par entretien de la formation (E1..EN) — on visualise la
 * progression au fil du parcours.
 *
 * 3 juillet 2026 : les 4 attitudes **obligatoires** (critères de
 * l'appréciation générale du maître, trame officielle E1) ouvrent le tableau,
 * au-dessus des attitudes optionnelles retenues à l'E1.
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

  // 3 juillet 2026 : 4 obligatoires (appréciation du maître) en tête, puis
  // les attitudes RETENUES pour ce livret (choix fait à l'E1).
  const lignes = lignesSyntheseAttitudes(
    Object.values(attitudesMap),
    livret.attitudesSelectionnees ?? [],
    livret.entretiens,
  );
  const aucuneOptionnelle = lignes.every((l) => l.obligatoire);
  const nombreEntretiens = formations[apprenti.formationId]?.nombreEntretiens ?? 2;
  const numeros = NUMEROS_ENTRETIEN.filter((n) => n <= nombreEntretiens);

  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-lg font-medium">Attitudes professionnelles</h2>
        <p className="text-xs text-muted-foreground">
          Synthèse en lecture seule des évaluations portées par le maître / tuteur à chaque
          entretien tripartite. Les 4 premières attitudes (obligatoires) reprennent son appréciation
          générale ; les suivantes sont les attitudes optionnelles retenues à l'entretien 1. La
          saisie se fait dans la section « Maître / Tuteur » de chaque entretien.
        </p>
      </header>

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
                {numeros.map((n) => {
                  const niveau = ligne.niveaux[n];
                  return (
                    <td
                      key={n}
                      className="px-3 py-3 text-center border-l-2 border-l-border"
                      aria-label={`Entretien ${n} — ${ligne.libelle} : ${
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

      {aucuneOptionnelle && (
        <p className="rounded-md border border-dashed border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
          Aucune attitude optionnelle retenue pour ce livret — le choix se fait à l'entretien
          tripartite 1 (maître / tuteur + formateur référent), puis les attitudes retenues sont
          évaluées à chaque entretien.
        </p>
      )}
    </section>
  );
}
