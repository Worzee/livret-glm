import { useMemo } from 'react';
import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import type {
  Competence,
  FicheSuiviPeriode,
  LieuFiche,
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
 *   2. Évaluation — éditable par le maître (entreprise) ou le formateur (centre)
 *   3. Retour apprenti·e — éditable par l'apprenti·e
 *
 * Paramétrage par `lieu` (17 juin 2026) :
 *   - entreprise : colonne `evaluationEntreprise` (maître / tuteur) ; ajout de
 *     compétence ouvert au formateur + maître, restreint à la sélection validée
 *     à l'entretien tripartite.
 *   - centre : colonne `evaluationGreta` (formateur référent) ; ajout réservé au
 *     formateur, libre sur tout le référentiel (le CFA couvre potentiellement
 *     tout le programme — pas de gate « sélection validée »).
 *
 * Affichage :
 *   - Desktop (≥ md) : tableau classique
 *   - Mobile (< md)  : empilement vertical par compétence (CDC §11.3)
 */

interface TableauTriColonnesProps {
  livretId: string;
  fiche: FicheSuiviPeriode;
  lieu?: LieuFiche;
}

export function TableauTriColonnes({ livretId, fiche, lieu = 'entreprise' }: TableauTriColonnesProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const setEval = useLivretStore((s) => s.setEvaluationLigne);
  const ajouter = useLivretStore((s) => s.ajouterLigneSuiviEntreprise);
  const supprimer = useLivretStore((s) => s.supprimerLigneSuiviEntreprise);
  const livretCourant = useLivretStore((s) => s.livrets[livretId]);
  const ctx = useApprentiActif();
  const formations = useFormationsStore((s) => s.formations);
  const referentiels = useReferentielsStore((s) => s.referentiels);

  const estCentre = lieu === 'centre';
  // Colonne d'évaluation ciblée selon le lieu : `evaluationGreta` (formateur,
  // centre) ou `evaluationEntreprise` (maître, entreprise).
  const champEval: 'evaluationEntreprise' | 'evaluationGreta' = estCentre
    ? 'evaluationGreta'
    : 'evaluationEntreprise';

  // Sélection des compétences abordées en entreprise (CDC v1.5 addendum) — ne
  // s'applique QU'À l'entreprise. Au centre, le formateur pioche librement.
  const selection: SelectionCompetencesEntreprise | undefined =
    livretCourant?.selectionCompetencesEntreprise;
  const selectionValidee = selection ? estValidee(selection) : false;

  // Résolution du référentiel courant via la formation de l'apprenti·e actif·ve.
  const referentiel: Referentiel = useMemo(() => {
    const formation = ctx ? formations[ctx.apprenti.formationId] : undefined;
    return (formation && referentiels[formation.referentielId]) ?? referentielCapCuisine;
  }, [ctx, formations, referentiels]);

  const competencesParId = useMemo(() => {
    const m = new Map<string, Competence>();
    for (const b of referentiel.blocs) {
      for (const c of b.competences) {
        m.set(c.id, c);
      }
    }
    return m;
  }, [referentiel]);

  // R21 : chaque colonne se ferme dès que le rôle propriétaire a signé.
  // Réouvrable uniquement via un déverrouillage R10.
  const peutEditerEval = estCentre
    ? peutEditer(roleActif, 'fiche.evaluation-greta') && peutEncoreEditerFiche(fiche, 'formateur')
    : peutEditer(roleActif, 'fiche.evaluation-entreprise') &&
      peutEncoreEditerFiche(fiche, 'maitre');
  const peutEditerRetour =
    peutEditer(roleActif, 'fiche.retour-apprenti') && peutEncoreEditerFiche(fiche, 'apprenti');

  // Ajout / retrait d'une compétence sur la fiche.
  //  - entreprise : formateur + maître / tuteur (17 juin 2026), filtré par la
  //    sélection validée à l'entretien tripartite.
  //  - centre : formateur seul, libre sur tout le référentiel.
  const roleProprietaireAjout = roleActif === 'maitre' ? 'maitre' : 'formateur';
  const peutAjouterLigne = estCentre
    ? peutEditer(roleActif, 'fiche.evaluation-greta') && peutEncoreEditerFiche(fiche, 'formateur')
    : peutEditer(roleActif, 'fiche.ajouter-competence') &&
      peutEncoreEditerFiche(fiche, roleProprietaireAjout);

  // Au centre, le sélecteur propose tout le référentiel (selection = undefined).
  const selectionAjout = estCentre ? undefined : selection;
  const sectionAjoutVisible = estCentre
    ? peutAjouterLigne
    : peutAjouterLigne && selectionValidee && !!selection;

  // Libellés et teintes dérivés du lieu.
  const titreSection = estCentre
    ? 'Suivi de la formation en centre'
    : 'Suivi de la formation en entreprise';
  const sousTitreSection = estCentre
    ? 'Compétences travaillées au CFA, évaluées par le formateur référent.'
    : 'Co-édition tripartite par compétence du référentiel.';
  const libelleEval = estCentre ? 'Évaluation centre' : 'Évaluation entreprise';
  const emojiEval = estCentre ? '🎓 Centre' : '🏭 Entreprise';
  const classeTexteEval = estCentre ? 'text-role-formateur' : 'text-role-maitre';
  const bordureEval = estCentre ? 'border-l-role-formateur/20' : 'border-l-role-maitre/20';
  const bordureEvalCarte = estCentre ? 'border-l-role-formateur/30' : 'border-l-role-maitre/30';

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">{titreSection}</h3>
          <p className="text-xs text-muted-foreground">{sousTitreSection}</p>
        </div>
        {sectionAjoutVisible && (
          <AjouterCompetence
            referentiel={referentiel}
            selection={selectionAjout}
            onAjouter={(id) => ajouter(livretId, fiche.id, id, undefined, lieu)}
            competencesPresentes={
              fiche.suiviEntreprise.map((l) => l.competenceId).filter(Boolean) as string[]
            }
          />
        )}
      </header>

      {/* Bandeau « sélection non validée » — entreprise uniquement. */}
      {!estCentre && !selectionValidee && (
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
              <th className="px-3 py-2 text-left w-1/3">Activité (compétence)</th>
              <th className="px-3 py-2 text-left">{libelleEval}</th>
              <th className="px-3 py-2 text-left w-1/3">Retour apprenti·e</th>
              {peutAjouterLigne && <th className="w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {fiche.suiviEntreprise.length === 0 && (
              <tr>
                <td
                  colSpan={peutAjouterLigne ? 4 : 3}
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
                champEval={champEval}
                libelleEval={libelleEval}
                bordureEval={bordureEval}
                peutEditerEval={peutEditerEval}
                peutEditerRetour={peutEditerRetour}
                peutSupprimer={peutAjouterLigne}
                onChangeEval={(v) => setEval(livretId, fiche.id, l.id, { type: champEval, valeur: v }, lieu)}
                onChangeRetour={(v) =>
                  setEval(livretId, fiche.id, l.id, { type: 'retourApprenti', valeur: v }, lieu)
                }
                onSupprimer={() => supprimer(livretId, fiche.id, l.id, lieu)}
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
            champEval={champEval}
            emojiEval={emojiEval}
            classeTexteEval={classeTexteEval}
            bordureEvalCarte={bordureEvalCarte}
            peutEditerEval={peutEditerEval}
            peutEditerRetour={peutEditerRetour}
            peutSupprimer={peutAjouterLigne}
            onChangeEval={(v) => setEval(livretId, fiche.id, l.id, { type: champEval, valeur: v }, lieu)}
            onChangeRetour={(v) =>
              setEval(livretId, fiche.id, l.id, { type: 'retourApprenti', valeur: v }, lieu)
            }
            onSupprimer={() => supprimer(livretId, fiche.id, l.id, lieu)}
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
  champEval: 'evaluationEntreprise' | 'evaluationGreta';
  peutEditerEval: boolean;
  peutEditerRetour: boolean;
  peutSupprimer: boolean;
  onChangeEval: (v: LigneSuiviEntreprise['evaluationEntreprise']) => void;
  onChangeRetour: (v: string) => void;
  onSupprimer: () => void;
}

interface LigneTableauProps extends CelluleProps {
  libelleEval: string;
  bordureEval: string;
}

interface CarteCompetenceProps extends CelluleProps {
  emojiEval: string;
  classeTexteEval: string;
  bordureEvalCarte: string;
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

function LigneTableau(props: LigneTableauProps) {
  const { ligne, competencesParId, champEval, libelleEval, bordureEval } = props;
  const { code, libelle } = libelleCompetence(ligne, competencesParId);

  return (
    <tr className="align-top hover:bg-secondary/30">
      <td className="px-3 py-3">
        <div className="font-medium text-sm">{code}</div>
        <div className="text-xs text-muted-foreground">{libelle}</div>
      </td>
      <td className={cn('px-3 py-3 border-l-2', bordureEval)}>
        <SelecteurNiveau
          editable={props.peutEditerEval}
          mode="entreprise"
          valeur={ligne[champEval]}
          onChange={(v) => props.onChangeEval(v as LigneSuiviEntreprise['evaluationEntreprise'])}
          ariaLabel={`${libelleEval} pour ${code}`}
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

function CarteCompetence(props: CarteCompetenceProps) {
  const { ligne, competencesParId, champEval, emojiEval, classeTexteEval, bordureEvalCarte } = props;
  const { code, libelle } = libelleCompetence(ligne, competencesParId);

  return (
    <article className="rounded-lg border border-border bg-card p-4 space-y-3">
      <header className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium text-sm">{code}</div>
          <div className="text-xs text-muted-foreground">{libelle}</div>
        </div>
        <div className="flex items-center gap-1">
          <Pastille valeur={ligne[champEval]} title={emojiEval} />
          <Pastille
            valeur={ligne.retourApprenti ? 'rempli' : 'vide'}
            title="Retour apprenti·e"
            mode="binaire"
          />
        </div>
      </header>

      <div className={cn('space-y-2 border-l-2 pl-3', bordureEvalCarte)}>
        <span className={cn('text-xs font-medium', classeTexteEval)}>{emojiEval}</span>
        <SelecteurNiveau
          editable={props.peutEditerEval}
          mode="entreprise"
          valeur={ligne[champEval]}
          onChange={(v) => props.onChangeEval(v as LigneSuiviEntreprise['evaluationEntreprise'])}
          ariaLabel={`${emojiEval} pour ${code}`}
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
  /**
   * Sélection validée des compétences abordées en entreprise. `undefined` au
   * centre : tout le référentiel est proposé.
   */
  selection?: SelectionCompetencesEntreprise;
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
        // Filtrage : à l'entreprise, seules les compétences de la sélection
        // validée apparaissent (CDC v1.5 addendum). Au centre (`selection`
        // absente), tout le bloc est proposé.
        const competencesAbordees = selection
          ? bloc.competences.filter((c) => estSelectionnee(selection, c.id))
          : bloc.competences;
        if (competencesAbordees.length === 0) return [];

        // Si le référentiel est à 3 niveaux et que le bloc a des sous-familles,
        // on génère un optgroup par paire (bloc, sous-famille). HTML n'autorise
        // pas l'imbrication d'optgroups — on aplatit en libellé composite.
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
