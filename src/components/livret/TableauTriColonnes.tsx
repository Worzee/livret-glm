import { Trash2 } from 'lucide-react';
import type { FicheSuiviPeriode, LigneSuiviEntreprise } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { peutEditer } from '@/lib/droits';
import { peutEncoreEditerFiche } from '@/lib/transitions-fiche';
import { competencesParId, referentielCapCuisine } from '@/fixtures/referentiel-cap-cuisine';
import { SelecteurNiveau } from '@/components/common/SelecteurNiveau';
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

  // R21 : chaque colonne se ferme dès que le rôle propriétaire a signé,
  // pour que la signature ne porte pas sur des contenus modifiés a posteriori.
  // Réouvrable uniquement via un déverrouillage R10.
  const peutEditerGreta =
    peutEditer(roleActif, 'fiche.evaluation-greta') && peutEncoreEditerFiche(fiche, 'formateur');
  const peutEditerEntreprise =
    peutEditer(roleActif, 'fiche.evaluation-entreprise') && peutEncoreEditerFiche(fiche, 'maitre');
  const peutEditerRetour =
    peutEditer(roleActif, 'fiche.retour-apprenti') && peutEncoreEditerFiche(fiche, 'apprenti');
  const peutAjouterLigne =
    peutEditer(roleActif, 'fiche.suivi-greta-cfa') && peutEncoreEditerFiche(fiche, 'formateur');
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
        {peutAjouterLigne && (
          <AjouterCompetence
            onAjouter={(id) => ajouter(livretId, fiche.id, id)}
            competencesPresentes={fiche.suiviEntreprise.map((l) => l.competenceId).filter(Boolean) as string[]}
          />
        )}
      </header>

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
  peutEditerGreta: boolean;
  peutEditerEntreprise: boolean;
  peutEditerRetour: boolean;
  peutSupprimer: boolean;
  onChangeGreta: (v: LigneSuiviEntreprise['evaluationGreta']) => void;
  onChangeEntreprise: (v: LigneSuiviEntreprise['evaluationEntreprise']) => void;
  onChangeRetour: (v: string) => void;
  onSupprimer: () => void;
}

function libelleCompetence(ligne: LigneSuiviEntreprise): { code: string; libelle: string } {
  if (ligne.competenceId) {
    const c = competencesParId.get(ligne.competenceId);
    if (c) return { code: c.code, libelle: c.libelle };
  }
  return { code: 'AD-HOC', libelle: ligne.libelleLibre ?? 'Activité libre' };
}

function LigneTableau(props: CelluleProps) {
  const { ligne } = props;
  const { code, libelle } = libelleCompetence(ligne);

  return (
    <tr className="align-top hover:bg-secondary/30">
      <td className="px-3 py-3">
        <div className="font-medium text-sm">{code}</div>
        <div className="text-xs text-muted-foreground">{libelle}</div>
      </td>
      <td className="px-3 py-3 border-l-2 border-l-role-formateur/20">
        <SelecteurNiveau
          editable={props.peutEditerGreta}
          mode="greta"
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
          <button
            type="button"
            onClick={props.onSupprimer}
            className="rounded-md p-1 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
            aria-label={`Supprimer la compétence ${code}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </td>
      )}
    </tr>
  );
}

function CarteCompetence(props: CelluleProps) {
  const { ligne } = props;
  const { code, libelle } = libelleCompetence(ligne);

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
          mode="greta"
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
          <button
            type="button"
            onClick={props.onSupprimer}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Supprimer
          </button>
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
  onAjouter: (competenceId: string | null) => void;
  competencesPresentes: string[];
}

function AjouterCompetence({ onAjouter, competencesPresentes }: AjouterCompetenceProps) {
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
      {referentielCapCuisine.blocs.map((bloc) => (
        <optgroup key={bloc.id} label={`${bloc.code} — ${bloc.libelle}`}>
          {bloc.competences.map((c) => (
            <option key={c.id} value={c.id} disabled={competencesPresentes.includes(c.id)}>
              {c.code} {c.libelle}
              {competencesPresentes.includes(c.id) ? ' (déjà présente)' : ''}
            </option>
          ))}
        </optgroup>
      ))}
      <option value="__libre">+ Activité libre (hors référentiel)</option>
    </select>
  );
}
