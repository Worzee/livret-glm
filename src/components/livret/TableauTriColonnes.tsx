import { useMemo } from 'react';
import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import type {
  Competence,
  FicheSuiviPeriode,
  LigneSuiviEntreprise,
  Referentiel,
  SelectionCompetencesEntreprise,
} from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { useReferentielsStore } from '@/store/useReferentielsStore';
import { peutEditer } from '@/lib/droits';
import { peutEncoreEditerFiche } from '@/lib/transitions-fiche';
import { estSelectionnee, estValidee } from '@/lib/selection-competences-entreprise';
import { referentielCapCuisine } from '@/fixtures/referentiel-cap-cuisine';
import { SelecteurNiveau } from '@/components/common/SelecteurNiveau';
import { BoutonSupprimer } from '@/components/common/BoutonSupprimer';
import { cn } from '@/lib/utils';

/**
 * Tableau tri-colonnes — cœur de la co-édition.
 * Référence : cahier des charges v1.3, sections 5.3 et 11.3.
 *
 * Colonnes :
 *   1. Activité (compétence) — affichage seul, vient du référentiel
 *   2. Évaluation GRETA CFA  — éditable par formateur
 *   3. Évaluation entreprise — éditable par maître
 *   4. Retour apprenti·e     — éditable par apprenti·e
 *
 * Affichage :
 *   - Desktop (≥ md) : tableau classique
 *   - Mobile (< md)  : empilement vertical par compétence (CDC §11.3)
 */

interface TableauTriColonnesProps {
  livretId: string;
  fiche: FicheSuiviPeriode;
}

export function TableauTriColonnes({ livretId, fiche }: TableauTriColonnesProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const setEval = useLivretStore((s) => s.setEvaluationLigne);
  const ajouter = useLivretStore((s) => s.ajouterLigneSuiviEntreprise);
  const supprimer = useLivretStore((s) => s.supprimerLigneSuiviEntreprise);
  const livretCourant = useLivretStore((s) => s.livrets[livretId]);
  const ctx = useApprentiActif();
  const formations = useFormationsStore((s) => s.formations);
  const referentiels = useReferentielsStore((s) => s.referentiels);

  // Sélection des compétences abordées en entreprise pour ce livret
  // (CDC v1.5 addendum). Tant que la sélection n'est pas validée à
  // l'entretien tripartite, le sélecteur d'ajout est désactivé et un
  // bandeau invite à finaliser la décision conjointe.
  const selection: SelectionCompetencesEntreprise | undefined =
    livretCourant?.selectionCompetencesEntreprise;
  const selectionValidee = selection ? estValidee(selection) : false;

  // Résolution du référentiel courant via la formation de l'apprenti·e actif·ve.
  // Fallback sur le CAP Cuisine si la formation n'a pas (encore) de référentiel
  // — cohérent avec EvaluationFinale.
  const referentiel: Referentiel = useMemo(() => {
    const formation = ctx ? formations[ctx.apprenti.formationId] : undefined;
    return (formation && referentiels[formation.referentielId]) ?? referentielCapCuisine;
  }, [ctx, formations, referentiels]);

  // Lookup des compétences par id pour l'affichage des lignes existantes
  // (calculé dynamiquement depuis le référentiel courant).
  const competencesParId = useMemo(() => {
    const m = new Map<string, Competence>();
    for (const b of referentiel.blocs) {
      for (const c of b.competences) {
        m.set(c.id, c);
      }
    }
    return m;
  }, [referentiel]);

  // R21 : chaque colonne se ferme dès que le rôle propriétaire a signé,
  // pour que la signature ne porte pas sur des contenus modifiés a posteriori.
  // Réouvrable uniquement via un déverrouillage R10.
  const peutEditerGreta =
    peutEditer(roleActif, 'fiche.evaluation-greta') && peutEncoreEditerFiche(fiche, 'formateur');
  const peutEditerEntreprise =
    peutEditer(roleActif, 'fiche.evaluation-entreprise') && peutEncoreEditerFiche(fiche, 'maitre');
  const peutEditerRetour =
    peutEditer(roleActif, 'fiche.retour-apprenti') && peutEncoreEditerFiche(fiche, 'apprenti');
  // Ajout d'une ligne ouvert au formateur — la grille des compétences à
  // évaluer relève de sa colonne « centre ». On réutilise ce droit comme
  // garde-fou plutôt que d'ajouter une ressource matrice dédiée.
  const peutAjouterLigne =
    peutEditer(roleActif, 'fiche.evaluation-greta') && peutEncoreEditerFiche(fiche, 'formateur');
  // Note : ajout d'une ligne ouvert au formateur (qui structure la grille).
  // Le maître/apprenti peuvent compléter mais pas créer de ligne.

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Suivi de la formation en entreprise</h3>
          <p className="text-xs text-muted-foreground">
            Co-édition tripartite par compétence du référentiel.
          </p>
        </div>
        {peutAjouterLigne && selectionValidee && selection && (
          <AjouterCompetence
            referentiel={referentiel}
            selection={selection}
            onAjouter={(id) => ajouter(livretId, fiche.id, id)}
            competencesPresentes={
              fiche.suiviEntreprise.map((l) => l.competenceId).filter(Boolean) as string[]
            }
          />
        )}
      </header>

      {!selectionValidee && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-medium">
              Sélection des compétences abordées en entreprise non validée
            </p>
            <p className="text-xs">
              La liste des compétences à travailler en entreprise pour cet·te apprenti·e doit être
              définie conjointement par le formateur référent et le maître / tuteur, puis validée à
              l'
              <Link className="underline hover:no-underline" to="/livret/entretien">
                entretien tripartite
              </Link>
              . Les lignes déjà saisies restent visibles ci-dessous.
            </p>
          </div>
        </div>
      )}

      {/* ── Desktop : tableau ──────────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left w-1/4">Activité (compétence)</th>
              <th className="px-3 py-2 text-left">Évaluation GRETA CFA</th>
              <th className="px-3 py-2 text-left">Évaluation entreprise</th>
              <th className="px-3 py-2 text-left w-1/3">Retour apprenti·e</th>
              {peutAjouterLigne && <th className="w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {fiche.suiviEntreprise.length === 0 && (
              <tr>
                <td
                  colSpan={peutAjouterLigne ? 5 : 4}
                  className="px-3 py-6 text-center text-sm italic text-muted-foreground"
                >
                  Aucune compétence travaillée pour cette période.
                </td>
              </tr>
            )}
            {fiche.suiviEntreprise.map((l) => (
              <LigneTableau
                key={l.id}
                ligne={l}
                competencesParId={competencesParId}
                peutEditerGreta={peutEditerGreta}
                peutEditerEntreprise={peutEditerEntreprise}
                peutEditerRetour={peutEditerRetour}
                peutSupprimer={peutAjouterLigne}
                onChangeGreta={(v) =>
                  setEval(livretId, fiche.id, l.id, { type: 'evaluationGreta', valeur: v })
                }
                onChangeEntreprise={(v) =>
                  setEval(livretId, fiche.id, l.id, { type: 'evaluationEntreprise', valeur: v })
                }
                onChangeRetour={(v) =>
                  setEval(livretId, fiche.id, l.id, { type: 'retourApprenti', valeur: v })
                }
                onSupprimer={() => supprimer(livretId, fiche.id, l.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile : empilement vertical (CDC §11.3) ───────────────────── */}
      <div className="md:hidden space-y-3">
        {fiche.suiviEntreprise.length === 0 && (
          <p className="rounded-lg border border-border p-4 text-center text-sm italic text-muted-foreground">
            Aucune compétence travaillée pour cette période.
          </p>
        )}
        {fiche.suiviEntreprise.map((l) => (
          <CarteCompetence
            key={l.id}
            ligne={l}
            competencesParId={competencesParId}
            peutEditerGreta={peutEditerGreta}
            peutEditerEntreprise={peutEditerEntreprise}
            peutEditerRetour={peutEditerRetour}
            peutSupprimer={peutAjouterLigne}
            onChangeGreta={(v) =>
              setEval(livretId, fiche.id, l.id, { type: 'evaluationGreta', valeur: v })
            }
            onChangeEntreprise={(v) =>
              setEval(livretId, fiche.id, l.id, { type: 'evaluationEntreprise', valeur: v })
            }
            onChangeRetour={(v) =>
              setEval(livretId, fiche.id, l.id, { type: 'retourApprenti', valeur: v })
            }
            onSupprimer={() => supprimer(livretId, fiche.id, l.id)}
          />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────────────────────────────────────

interface CelluleProps {
  ligne: LigneSuiviEntreprise;
  competencesParId: ReadonlyMap<string, Competence>;
  peutEditerGreta: boolean;
  peutEditerEntreprise: boolean;
  peutEditerRetour: boolean;
  peutSupprimer: boolean;
  onChangeGreta: (v: LigneSuiviEntreprise['evaluationGreta']) => void;
  onChangeEntreprise: (v: LigneSuiviEntreprise['evaluationEntreprise']) => void;
  onChangeRetour: (v: string) => void;
  onSupprimer: () => void;
}

function libelleCompetence(
  ligne: LigneSuiviEntreprise,
  competencesParId: ReadonlyMap<string, Competence>,
): { code: string; libelle: string } {
  if (ligne.competenceId) {
    const c = competencesParId.get(ligne.competenceId);
    if (c) return { code: c.code, libelle: c.libelle };
  }
  return { code: 'AD-HOC', libelle: ligne.libelleLibre ?? 'Activité libre' };
}

function LigneTableau(props: CelluleProps) {
  const { ligne, competencesParId } = props;
  const { code, libelle } = libelleCompetence(ligne, competencesParId);

  return (
    <tr className="align-top hover:bg-secondary/30">
      <td className="px-3 py-3">
        <div className="font-medium text-sm">{code}</div>
        <div className="text-xs text-muted-foreground">{libelle}</div>
      </td>
      <td className="px-3 py-3 border-l-2 border-l-role-formateur/20">
        <SelecteurNiveau
          editable={props.peutEditerGreta}
          mode="entreprise"
          valeur={ligne.evaluationGreta}
          onChange={(v) => props.onChangeGreta(v as LigneSuiviEntreprise['evaluationGreta'])}
          ariaLabel={`Évaluation GRETA pour ${code}`}
        />
      </td>
      <td className="px-3 py-3 border-l-2 border-l-role-maitre/20">
        <SelecteurNiveau
          editable={props.peutEditerEntreprise}
          mode="entreprise"
          valeur={ligne.evaluationEntreprise}
          onChange={(v) =>
            props.onChangeEntreprise(v as LigneSuiviEntreprise['evaluationEntreprise'])
          }
          ariaLabel={`Évaluation entreprise pour ${code}`}
        />
      </td>
      <td className="px-3 py-3 border-l-2 border-l-role-apprenti/20">
        {props.peutEditerRetour ? (
          <textarea
            rows={2}
            className="w-full resize-y rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={ligne.retourApprenti}
            placeholder="Vos observations…"
            onChange={(e) => props.onChangeRetour(e.target.value)}
          />
        ) : (
          <span className={cn('text-sm', !ligne.retourApprenti && 'text-muted-foreground italic')}>
            {ligne.retourApprenti || '—'}
          </span>
        )}
      </td>
      {props.peutSupprimer && (
        <td className="px-3 py-3">
          <BoutonSupprimer
            ariaLabel={`Supprimer la compétence ${code}`}
            question={`Supprimer ${code} ?`}
            onConfirmer={props.onSupprimer}
            variant="icon"
          />
        </td>
      )}
    </tr>
  );
}

function CarteCompetence(props: CelluleProps) {
  const { ligne, competencesParId } = props;
  const { code, libelle } = libelleCompetence(ligne, competencesParId);

  return (
    <article className="rounded-lg border border-border bg-card p-4 space-y-3">
      <header className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium text-sm">{code}</div>
          <div className="text-xs text-muted-foreground">{libelle}</div>
        </div>
        <div className="flex items-center gap-1">
          <Pastille valeur={ligne.evaluationGreta} title="GRETA" />
          <Pastille valeur={ligne.evaluationEntreprise} title="Entreprise" />
          <Pastille
            valeur={ligne.retourApprenti ? 'rempli' : 'vide'}
            title="Retour apprenti·e"
            mode="binaire"
          />
        </div>
      </header>

      <div className="space-y-2 border-l-2 border-l-role-formateur/30 pl-3">
        <span className="text-xs font-medium text-role-formateur">🎓 GRETA CFA</span>
        <SelecteurNiveau
          editable={props.peutEditerGreta}
          mode="entreprise"
          valeur={ligne.evaluationGreta}
          onChange={(v) => props.onChangeGreta(v as LigneSuiviEntreprise['evaluationGreta'])}
          ariaLabel={`Évaluation GRETA pour ${code}`}
        />
      </div>

      <div className="space-y-2 border-l-2 border-l-role-maitre/30 pl-3">
        <span className="text-xs font-medium text-role-maitre">🏭 Entreprise</span>
        <SelecteurNiveau
          editable={props.peutEditerEntreprise}
          mode="entreprise"
          valeur={ligne.evaluationEntreprise}
          onChange={(v) =>
            props.onChangeEntreprise(v as LigneSuiviEntreprise['evaluationEntreprise'])
          }
          ariaLabel={`Évaluation entreprise pour ${code}`}
        />
      </div>

      <div className="space-y-2 border-l-2 border-l-role-apprenti/30 pl-3">
        <span className="text-xs font-medium text-role-apprenti">👤 Retour apprenti·e</span>
        {props.peutEditerRetour ? (
          <textarea
            rows={3}
            className="w-full resize-y rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={ligne.retourApprenti}
            placeholder="Vos observations…"
            onChange={(e) => props.onChangeRetour(e.target.value)}
          />
        ) : (
          <p className={cn('text-sm', !ligne.retourApprenti && 'text-muted-foreground italic')}>
            {ligne.retourApprenti || '—'}
          </p>
        )}
      </div>

      {props.peutSupprimer && (
        <div className="text-right">
          <BoutonSupprimer
            ariaLabel={`Supprimer la compétence ${code}`}
            question={`Supprimer ${code} ?`}
            onConfirmer={props.onSupprimer}
            variant="text"
          />
        </div>
      )}
    </article>
  );
}

interface PastilleProps {
  valeur: LigneSuiviEntreprise['evaluationGreta'] | string | null;
  title: string;
  mode?: 'standard' | 'binaire';
}

function Pastille({ valeur, title, mode = 'standard' }: PastilleProps) {
  let couleur = 'bg-niveau-non-fait';
  if (mode === 'binaire') {
    couleur = valeur === 'rempli' ? 'bg-niveau-maitrise' : 'bg-slate-200';
  } else {
    if (valeur === 'maitrise') couleur = 'bg-niveau-maitrise';
    else if (valeur === 'partiel') couleur = 'bg-niveau-partiel';
    else if (valeur === 'non-maitrise') couleur = 'bg-niveau-non-maitrise';
    else if (valeur === 'non-fait') couleur = 'bg-niveau-non-fait';
    else couleur = 'bg-slate-200';
  }
  return (
    <span
      title={title}
      aria-label={`${title} : ${valeur ?? 'non renseigné'}`}
      className={cn('inline-block h-3 w-3 rounded-full ring-1 ring-white', couleur)}
    />
  );
}

// ── Sous-composant : ajouter une compétence depuis le référentiel ────────────
interface AjouterCompetenceProps {
  /** Référentiel courant — résolu côté parent depuis la formation de l'apprenti·e. */
  referentiel: Referentiel;
  /** Sélection validée des compétences abordées en entreprise pour ce livret. */
  selection: SelectionCompetencesEntreprise;
  onAjouter: (competenceId: string | null) => void;
  competencesPresentes: string[];
}

function AjouterCompetence({
  referentiel,
  selection,
  onAjouter,
  competencesPresentes,
}: AjouterCompetenceProps) {
  return (
    <select
      onChange={(e) => {
        const v = e.target.value;
        if (v === '') return;
        if (v === '__libre') onAjouter(null);
        else onAjouter(v);
        e.target.value = '';
      }}
      defaultValue=""
      className="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label="Ajouter une compétence à la fiche"
    >
      <option value="" disabled>
        + Ajouter une compétence…
      </option>
      {referentiel.blocs.flatMap((bloc) => {
        // Filtrage : seules les compétences présentes dans la sélection
        // validée du livret apparaissent au sélecteur (CDC v1.5 addendum).
        // Les lignes déjà saisies pour des compétences ensuite décochées
        // restent affichées plus haut dans le tableau (cohérence historique).
        const competencesAbordees = bloc.competences.filter((c) =>
          estSelectionnee(selection, c.id),
        );
        if (competencesAbordees.length === 0) return [];

        // Si le référentiel est à 3 niveaux et que le bloc a des sous-familles,
        // on génère un optgroup par paire (bloc, sous-famille). HTML n'autorise
        // pas l'imbrication d'optgroups — on aplatit en utilisant un libellé
        // composite « Bloc — Sous-famille ».
        const aDesSousFamilles =
          referentiel.niveauxColonnes === 3 && competencesAbordees.some((c) => c.sousFamille);
        if (!aDesSousFamilles) {
          return [
            <optgroup key={bloc.id} label={`${bloc.code} — ${bloc.libelle}`}>
              {competencesAbordees.map((c) => (
                <option key={c.id} value={c.id} disabled={competencesPresentes.includes(c.id)}>
                  {c.code} {c.libelle}
                  {competencesPresentes.includes(c.id) ? ' (déjà présente)' : ''}
                </option>
              ))}
            </optgroup>,
          ];
        }
        // Groupement par sous-famille en préservant l'ordre d'apparition
        const groupes = new Map<string, typeof competencesAbordees>();
        for (const c of competencesAbordees) {
          const cle = c.sousFamille ?? '';
          if (!groupes.has(cle)) groupes.set(cle, []);
          groupes.get(cle)!.push(c);
        }
        return [...groupes.entries()].map(([sousFamille, comps]) => (
          <optgroup
            key={`${bloc.id}-${sousFamille}`}
            label={sousFamille ? `${bloc.code} — ${sousFamille}` : `${bloc.code} — ${bloc.libelle}`}
          >
            {comps.map((c) => (
              <option key={c.id} value={c.id} disabled={competencesPresentes.includes(c.id)}>
                {c.code} {c.libelle}
                {competencesPresentes.includes(c.id) ? ' (déjà présente)' : ''}
              </option>
            ))}
          </optgroup>
        ));
      })}
      <option value="__libre">+ Activité libre (hors référentiel)</option>
    </select>
  );
}
