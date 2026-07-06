import { useId, useState } from 'react';
import { AlertTriangle, Info, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LigneEvaluationFinaleCompetence, NiveauMaitrise, Referentiel } from '@/types';
import { useLivretStore } from '@/store/useLivretStore';
import { useUserStore } from '@/store/useUserStore';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { peutEditer } from '@/lib/droits';
import { estCloture } from '@/lib/cloture-livret';
import {
  creerSelectionVierge,
  estValidee,
  restreindreReferentielALaSelection,
} from '@/lib/selection-competences-entreprise';
import {
  confirmationRequisePourEcraserHeritage,
  synthetiserCompetences,
  valeurEffective,
} from '@/lib/synthese-evaluation';
import { calculerStatsParBloc } from '@/lib/stats-bloc';
import { grouperParSousFamille } from '@/lib/grouper-competences';
import { SelecteurNiveau } from '@/components/common/SelecteurNiveau';
import { SyntheseBloc } from './SyntheseBloc';
import { cn } from '@/lib/utils';

/**
 * Grille de synthèse des compétences abordées en stage (CDC §5.4 — menu
 * « Synthèse », anciennement « Évaluation finale », juillet 2026).
 *
 * Vue par bloc, restreinte aux compétences de la sélection entreprise
 * (validée à l'entretien tripartite), une seule colonne d'évaluation :
 *   - Acquis en entreprise (saisie maître d'apprentissage)
 * (La colonne « Acquis en centre » a disparu avec le tableau de compétences
 * des fiches centre — juillet 2026.)
 *
 * Les valeurs non saisies héritent par défaut de la synthèse calculée à partir
 * des fiches de suivi (last-write-wins). Le badge "Vue en Période N" signale
 * visuellement la source du report pour respecter la transparence demandée.
 */

interface GrilleCompetencesProps {
  referentiel: Referentiel;
}

/**
 * Écrasement d'héritage en attente de confirmation (retours coordos juin
 * 2026) : la colonne « Acquis en entreprise » reporte les fiches de période —
 * le maître / tuteur doit confirmer explicitement avant de remplacer.
 */
interface EcrasementEnAttente {
  competenceId: string;
  libelleCompetence: string;
  nouvelleValeur: NiveauMaitrise;
  valeurHeritee: NiveauMaitrise;
  numeroPeriode?: number;
}

export function GrilleCompetences({ referentiel }: GrilleCompetencesProps) {
  const ctx = useApprentiActif();
  const setLigne = useLivretStore((s) => s.setLigneCompetenceFinale);
  const roleActif = useUserStore((s) => s.roleActif);
  const [ecrasement, setEcrasement] = useState<EcrasementEnAttente | null>(null);

  if (!ctx) return null;
  const { livret } = ctx;

  // R22 — la clôture rend toutes les cellules en lecture seule.
  const livretFige = estCloture(livret);
  const peutEditerEntreprise =
    !livretFige && peutEditer(roleActif, 'grille-competences.entreprise');

  // Fallback défensif : un livret persisté avant le bump v7→v8 peut ne pas
  // avoir le sous-objet `selectionCompetencesEntreprise`. La migration store
  // est censée reset, mais on protège quand même la chaîne de rendu.
  const selection = livret.selectionCompetencesEntreprise ?? creerSelectionVierge();
  const selectionValidee = estValidee(selection);

  // Juillet 2026 : la grille ne présente QUE les compétences abordées en
  // stage (sélection entreprise) — blocs sans compétence retenue masqués.
  const referentielSelectionne = restreindreReferentielALaSelection(referentiel, selection);

  // Synthèse héritée des fiches ENTREPRISE (R23 — recalculée à chaque render).
  const synthese = synthetiserCompetences(livret.fichesSuivi, referentielSelectionne);
  const lignes = livret.evaluationFinaleCompetences.lignes;
  const stats = calculerStatsParBloc(referentielSelectionne, lignes, synthese);

  // CDC v1.5 addendum — Q2(b) : tant que la sélection n'est pas validée à
  // l'entretien tripartite, la grille finale n'est pas affichée. Un message
  // explicite invite à finaliser la décision conjointe.
  if (!selectionValidee) {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
      >
        <Info className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-medium">
            Sélection des compétences abordées en entreprise non validée
          </p>
          <p>
            La grille de synthèse s'affichera dès que le formateur référent et le maître
            d'apprentissage auront validé conjointement la liste des compétences travaillées en
            entreprise pour cet·te apprenti·e. Cette décision se prend à l'
            <Link className="underline hover:no-underline" to="/livret/entretien">
              entretien tripartite
            </Link>{' '}
            (figée à la 3<sup>ᵉ</sup> signature).
          </p>
        </div>
      </div>
    );
  }

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

      {/* ── Grilles éditables détaillées (compétences de la sélection) ───── */}
      {referentielSelectionne.blocs.map((bloc) => {
        const groupes = grouperParSousFamille(bloc);
        const aDesSousFamilles =
          referentielSelectionne.niveauxColonnes === 3 &&
          groupes.some((g) => g.sousFamille !== undefined);
        return (
          <section key={bloc.id} className="space-y-3">
            <h2 className="text-lg font-medium">{bloc.libelle}</h2>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left w-1/2">Compétence</th>
                    <th className="px-3 py-2 text-left">Acquis en entreprise</th>
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
                          colSpan={3}
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
                        } satisfies LigneEvaluationFinaleCompetence);

                      return (
                        <tr key={c.id} className="align-top">
                          <td className="px-3 py-3">
                            <div className="text-sm">{c.libelle}</div>
                          </td>
                          <td className="px-3 py-3 border-l-2 border-l-role-maitre/20">
                            <CelluleNiveau
                              ligne={ligne}
                              synthese={synthese}
                              editable={peutEditerEntreprise}
                              onChange={(v) => {
                                // Garde-fou : remplacer une valeur héritée
                                // des périodes exige une confirmation.
                                if (confirmationRequisePourEcraserHeritage(ligne, synthese, v)) {
                                  const heritage = valeurEffective(ligne, synthese);
                                  setEcrasement({
                                    competenceId: c.id,
                                    libelleCompetence: c.libelle,
                                    nouvelleValeur: v as NiveauMaitrise,
                                    valeurHeritee: heritage.valeur as NiveauMaitrise,
                                    numeroPeriode: heritage.numeroPeriode,
                                  });
                                } else {
                                  setLigne(livret.id, c.id, { acquisEntreprise: v });
                                }
                              }}
                              ariaLabel={`Acquis en entreprise pour ${c.libelle}`}
                            />
                          </td>
                          {/* Séparateur neutre : le commentaire reste partagé,
                              pas de teinte de rôle. */}
                          <td className="px-3 py-3 min-w-[200px] border-l-2 border-l-border">
                            <CelluleCommentaire
                              valeur={ligne.commentaire ?? ''}
                              editable={peutEditerEntreprise}
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

      {ecrasement && (
        <ModaleConfirmationHeritage
          ecrasement={ecrasement}
          onAnnuler={() => setEcrasement(null)}
          onConfirmer={() => {
            setLigne(livret.id, ecrasement.competenceId, {
              acquisEntreprise: ecrasement.nouvelleValeur,
            });
            setEcrasement(null);
          }}
        />
      )}
    </div>
  );
}

const LIBELLE_NIVEAU: Record<NiveauMaitrise, string> = {
  maitrise: 'Maîtrisé',
  partiel: 'Partiel',
  'non-maitrise': 'Non maîtrisé',
};

/**
 * Modale de confirmation avant écrasement d'une évaluation héritée des
 * fiches de période (retours coordos juin 2026). Tant qu'elle n'est pas
 * confirmée, la cellule conserve son report automatique.
 */
function ModaleConfirmationHeritage({
  ecrasement,
  onAnnuler,
  onConfirmer,
}: {
  ecrasement: EcrasementEnAttente;
  onAnnuler: () => void;
  onConfirmer: () => void;
}) {
  const titreId = useId();
  const provenance =
    ecrasement.numeroPeriode !== undefined
      ? `de la fiche de la Période ${ecrasement.numeroPeriode}`
      : 'des fiches de période';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titreId}
      data-testid="confirmation-heritage"
    >
      {/* Arrière-plan */}
      <button
        type="button"
        aria-label="Fermer la modale"
        onClick={onAnnuler}
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
      />

      {/* Contenu */}
      <div className="relative w-full max-w-lg rounded-lg border border-border bg-card shadow-lg">
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <h2 id={titreId} className="text-lg font-semibold">
              Remplacer une évaluation héritée ?
            </h2>
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

        <div className="space-y-3 p-4 text-sm">
          <p>
            L'évaluation « <strong>{LIBELLE_NIVEAU[ecrasement.valeurHeritee]}</strong> » de{' '}
            <strong>{ecrasement.libelleCompetence}</strong> provient {provenance} (report
            automatique).
          </p>
          <p>
            Confirmez-vous son remplacement par «{' '}
            <strong>{LIBELLE_NIVEAU[ecrasement.nouvelleValeur]}</strong> » dans la synthèse ? La
            cellule ne suivra plus les fiches de période. Le bouton « Non renseigné » permettra de
            revenir au report automatique.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <button
            type="button"
            onClick={onAnnuler}
            data-testid="confirmation-heritage-annuler"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirmer}
            data-testid="confirmation-heritage-confirmer"
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Remplacer l'évaluation
          </button>
        </div>
      </div>
    </div>
  );
}

interface CelluleNiveauProps {
  ligne: LigneEvaluationFinaleCompetence;
  synthese: ReturnType<typeof synthetiserCompetences>;
  editable: boolean;
  onChange: (v: NiveauMaitrise | null) => void;
  ariaLabel: string;
}

function CelluleNiveau({ ligne, synthese, editable, onChange, ariaLabel }: CelluleNiveauProps) {
  const eff = valeurEffective(ligne, synthese);
  return (
    <div className="flex flex-col items-start gap-1">
      <SelecteurNiveau
        editable={editable}
        mode="greta"
        valeur={eff.valeur}
        onChange={(v) => onChange(v as NiveauMaitrise | null)}
        ariaLabel={ariaLabel}
        permetEffacer
      />
      {eff.source === 'synthese' && (
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs italic text-muted-foreground">
          <Sparkles className="h-3 w-3 shrink-0" aria-hidden="true" />
          {eff.numeroPeriode !== undefined
            ? `Vue en Période ${eff.numeroPeriode}`
            : 'Vue dans les fiches'}
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
