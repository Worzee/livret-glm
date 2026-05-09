import { Sparkles } from 'lucide-react';
import type {
  BlocCompetences,
  Competence,
  LigneEvaluationFinaleCompetence,
  NiveauMaitrise,
  Referentiel,
} from '@/types';
import { useLivretStore } from '@/store/useLivretStore';
import { useUserStore } from '@/store/useUserStore';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { peutEditer } from '@/lib/droits';
import { estCloture } from '@/lib/cloture-livret';
import { synthetiserCompetences, valeurEffective } from '@/lib/synthese-evaluation';
import { calculerStatsParBloc } from '@/lib/stats-bloc';
import { SelecteurNiveau } from '@/components/common/SelecteurNiveau';
import { SyntheseBloc } from './SyntheseBloc';
import { cn } from '@/lib/utils';

/**
 * Grille d'évaluation finale des compétences en entreprise (CDC §5.4).
 *
 * Vue par bloc, deux colonnes :
 *   - Acquis en entreprise (saisie maître d'apprentissage)
 *   - Acquis en centre (saisie formateur référent)
 *
 * Les valeurs non saisies héritent par défaut de la synthèse calculée à partir
 * des fiches de suivi (last-write-wins). Le badge "Hérité" signale visuellement
 * cette source de donnée pour respecter la transparence demandée.
 */

interface GrilleCompetencesProps {
  referentiel: Referentiel;
}

export function GrilleCompetences({ referentiel }: GrilleCompetencesProps) {
  const ctx = useApprentiActif();
  const setLigne = useLivretStore((s) => s.setLigneCompetenceFinale);
  const roleActif = useUserStore((s) => s.roleActif);

  if (!ctx) return null;
  const { livret } = ctx;

  // R22 — la clôture rend toutes les cellules en lecture seule.
  const livretFige = estCloture(livret);
  const peutEditerEntreprise =
    !livretFige && peutEditer(roleActif, 'grille-competences.entreprise');
  const peutEditerCentre = !livretFige && peutEditer(roleActif, 'grille-competences.centre');

  // Synthèse héritée des fiches (R23 — recalculée à chaque render)
  const synthese = synthetiserCompetences(livret.fichesSuivi, referentiel);
  const lignes = livret.evaluationFinaleCompetences.lignes;
  const stats = calculerStatsParBloc(referentiel, lignes, synthese);

  return (
    <div className="space-y-6">
      {/* ── Synthèse graphique par bloc ───────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Synthèse par bloc de compétences</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {stats.map((s) => (
            <SyntheseBloc key={s.bloc.id} stats={s} />
          ))}
        </div>
      </section>

      {/* ── Grilles éditables détaillées ─────────────────────────────────── */}
      {referentiel.blocs.map((bloc) => {
        const groupes = grouperParSousFamille(bloc);
        const aDesSousFamilles =
          referentiel.niveauxColonnes === 3 &&
          groupes.some((g) => g.sousFamille !== undefined);
        return (
          <section key={bloc.id} className="space-y-3">
            <h2 className="text-lg font-medium">
              {bloc.code} — {bloc.libelle}
            </h2>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left w-1/3">Compétence</th>
                    <th className="px-3 py-2 text-left">Acquis en entreprise</th>
                    <th className="px-3 py-2 text-left">Acquis en centre</th>
                    <th className="px-3 py-2 text-left">Commentaire</th>
                  </tr>
                </thead>
                {groupes.map((g, idxGroupe) => (
                  <tbody
                    key={g.sousFamille ?? `__plat-${idxGroupe}`}
                    className="divide-y divide-border"
                  >
                    {aDesSousFamilles && g.sousFamille && (
                      <tr className="bg-secondary/20">
                        <td
                          colSpan={4}
                          className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground"
                        >
                          {g.sousFamille}
                        </td>
                      </tr>
                    )}
                    {g.competences.map((c) => {
                      const ligne =
                        lignes.find((l) => l.competenceId === c.id) ??
                        ({
                          competenceId: c.id,
                          acquisEntreprise: null,
                          acquisCentre: null,
                        } satisfies LigneEvaluationFinaleCompetence);

                      return (
                        <tr key={c.id} className="align-top">
                          <td className="px-3 py-3">
                            <div className="font-medium text-sm">{c.code}</div>
                            <div className="text-xs text-muted-foreground">{c.libelle}</div>
                          </td>
                          <td className="px-3 py-3 border-l-2 border-l-role-maitre/20">
                            <CelluleNiveau
                              ligne={ligne}
                              synthese={synthese}
                              colonne="acquisEntreprise"
                              editable={peutEditerEntreprise}
                              onChange={(v) =>
                                setLigne(livret.id, c.id, { acquisEntreprise: v })
                              }
                              ariaLabel={`Acquis en entreprise pour ${c.code}`}
                            />
                          </td>
                          <td className="px-3 py-3 border-l-2 border-l-role-formateur/20">
                            <CelluleNiveau
                              ligne={ligne}
                              synthese={synthese}
                              colonne="acquisCentre"
                              editable={peutEditerCentre}
                              onChange={(v) =>
                                setLigne(livret.id, c.id, { acquisCentre: v })
                              }
                              ariaLabel={`Acquis en centre pour ${c.code}`}
                            />
                          </td>
                          <td className="px-3 py-3 min-w-[200px]">
                            <CelluleCommentaire
                              valeur={ligne.commentaire ?? ''}
                              editable={peutEditerEntreprise || peutEditerCentre}
                              onChange={(v) => setLigne(livret.id, c.id, { commentaire: v })}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                ))}
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

/**
 * Regroupe les compétences d'un bloc par sous-famille en préservant l'ordre
 * d'apparition. Si aucune compétence n'a de sous-famille, retourne un seul
 * groupe sans titre (équivalent au comportement plat existant).
 */
function grouperParSousFamille(
  bloc: BlocCompetences,
): Array<{ sousFamille?: string; competences: Competence[] }> {
  const groupes: Array<{ sousFamille?: string; competences: Competence[] }> = [];
  const indexParCle = new Map<string, number>();
  for (const c of bloc.competences) {
    const cle = c.sousFamille ?? '__plat';
    let idx = indexParCle.get(cle);
    if (idx === undefined) {
      idx = groupes.length;
      indexParCle.set(cle, idx);
      groupes.push({ sousFamille: c.sousFamille, competences: [] });
    }
    groupes[idx].competences.push(c);
  }
  return groupes;
}

interface CelluleNiveauProps {
  ligne: LigneEvaluationFinaleCompetence;
  synthese: ReturnType<typeof synthetiserCompetences>;
  colonne: 'acquisEntreprise' | 'acquisCentre';
  editable: boolean;
  onChange: (v: NiveauMaitrise | null) => void;
  ariaLabel: string;
}

function CelluleNiveau({
  ligne,
  synthese,
  colonne,
  editable,
  onChange,
  ariaLabel,
}: CelluleNiveauProps) {
  const eff = valeurEffective(ligne, synthese, colonne);
  return (
    <div className="flex flex-col items-start gap-1">
      <SelecteurNiveau
        editable={editable}
        mode="greta"
        valeur={eff.valeur}
        onChange={(v) => onChange(v as NiveauMaitrise | null)}
        ariaLabel={ariaLabel}
      />
      {eff.source === 'synthese' && (
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs italic text-muted-foreground">
          <Sparkles className="h-3 w-3 shrink-0" aria-hidden="true" />
          Hérité des fiches
        </span>
      )}
    </div>
  );
}

function CelluleCommentaire({
  valeur,
  editable,
  onChange,
}: {
  valeur: string;
  editable: boolean;
  onChange: (v: string) => void;
}) {
  if (!editable) {
    return (
      <span className={cn('text-sm', !valeur && 'text-muted-foreground italic')}>
        {valeur || '—'}
      </span>
    );
  }
  return (
    <textarea
      rows={2}
      value={valeur}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Commentaire optionnel"
      className="w-full resize-y rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}
