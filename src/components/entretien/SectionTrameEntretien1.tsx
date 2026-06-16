import { AlertTriangle, ClipboardCheck, ListChecks } from 'lucide-react';
import type { EntretienTripartite, NiveauAppreciation, NumeroEntretien } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { useAttitudesStore } from '@/store/useAttitudesStore';
import { peutEditer } from '@/lib/droits';
import { peutEncoreEditer } from '@/lib/regles-entretien';
import { attitudesRetenues } from '@/lib/selection-attitudes';
import {
  CRITERES_APPRECIATION_E1,
  TRAME_ENTRETIEN_1,
  pointsAlerteTrameE1,
  type QuestionTrameE1,
  type RubriqueTrameE1,
} from '@/lib/trame-entretien-1';
import { cn } from '@/lib/utils';
import { CaseOuiNon } from './CaseOuiNon';
import { SelecteurAppreciation } from '@/components/common/SelecteurAppreciation';

/**
 * Trame officielle de l'entretien tripartite n° 1 (« première visite »).
 * Référence : document GRETA (réunion juin 2026), cf. `lib/trame-entretien-1`.
 *
 * Spécifique à E1 : les rubriques thématiques (questions conjointes maître +
 * apprenti·e) remplacent les sections apprenti/maître et les blocs démarches /
 * conditions / aides. La grille d'appréciation est enrichie des descriptions
 * par niveau et un récapitulatif des « points d'alerte » (réponses « Non »)
 * liste les actions à mener par le GRETA CFA (DDF / coordonnateur).
 *
 * Co-saisie par le formateur référent et le maître / tuteur (`entretien.trame`)
 * tant que l'entretien n'est pas signé par les 3 parties (R9).
 */

interface SectionTrameEntretien1Props {
  livretId: string;
  numero: NumeroEntretien;
  entretien: EntretienTripartite;
  /** R9 : signé par les 3 parties → entretien figé, tout en lecture seule. */
  entretienVerrouille: boolean;
}

const NIVEAUX: ReadonlyArray<{ cle: NiveauAppreciation; symbole: string }> = [
  { cle: 'plusplus', symbole: '++' },
  { cle: 'plus', symbole: '+' },
  { cle: 'moins', symbole: '−' },
  { cle: 'moinsmoins', symbole: '−−' },
];

export function SectionTrameEntretien1({
  livretId,
  numero,
  entretien,
  entretienVerrouille,
}: SectionTrameEntretien1Props) {
  const roleActif = useUserStore((s) => s.roleActif);
  const setReponseTrame = useLivretStore((s) => s.setReponseTrameEntretien);
  const setAppreciation = useLivretStore((s) => s.setAppreciationMaitre);
  const setCommentaire = useLivretStore((s) => s.setCommentaireEntretien);
  const setEvaluationAttitude = useLivretStore((s) => s.setEvaluationAttitude);
  const attitudesSelectionnees = useLivretStore(
    (s) => s.livrets[livretId]?.attitudesSelectionnees,
  );
  const attitudesMap = useAttitudesStore((s) => s.attitudes);

  const editableTrame = peutEditer(roleActif, 'entretien.trame') && !entretienVerrouille;
  const editableGrille =
    peutEditer(roleActif, 'entretien.appreciation-maitre') && !entretienVerrouille;
  // Attitudes : choisies à l'E1 (conservées), évaluées par le maître / tuteur.
  const editableAttitudes =
    peutEditer(roleActif, 'entretien.attitudes') && peutEncoreEditer('maitre', entretien);
  const attitudes = attitudesRetenues(Object.values(attitudesMap), attitudesSelectionnees ?? []);

  const reponses = entretien.reponsesTrame ?? {};
  const alertes = pointsAlerteTrameE1(reponses);

  return (
    <div className="space-y-4">
      {/* Bandeau d'aide à la lecture : un « Non » = difficulté à traiter. */}
      <div
        role="note"
        className="bandeau-info-couleur-role flex items-start gap-2 rounded-lg border p-3 text-xs"
      >
        <ListChecks className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          Trame officielle de la première visite tripartite (questions communes au maître / tuteur
          et à l'apprenti·e). Une réponse <strong>« Non »</strong> signale une difficulté à traiter
          par le GRETA CFA (DDF / coordonnateur) — elle est reprise dans le récapitulatif en bas de
          page.
        </p>
      </div>

      {TRAME_ENTRETIEN_1.map((rubrique) => (
        <RubriqueTrame
          key={rubrique.id}
          rubrique={rubrique}
          reponses={reponses}
          editable={editableTrame}
          onChange={(questionId, valeur) => setReponseTrame(livretId, numero, questionId, valeur)}
        />
      ))}

      {/* Synthèse — grille d'appréciation enrichie (maître / tuteur). */}
      <section className="rounded-lg border border-border border-l-4 border-l-role-maitre bg-card p-4 space-y-3">
        <header className="flex items-start gap-2">
          <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-role-maitre" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-medium text-role-maitre">
              Synthèse de la période et bilan de l'intégration
            </h2>
            <p className="text-xs text-muted-foreground">
              Appréciation du maître / tuteur — sélectionnez le niveau correspondant pour chaque
              critère.
            </p>
          </div>
        </header>
        {CRITERES_APPRECIATION_E1.map((critere) => (
          <LigneAppreciation
            key={critere.cle}
            critere={critere}
            valeur={entretien.appreciationMaitre[critere.cle]}
            editable={editableGrille}
            onChange={(niveau) => setAppreciation(livretId, numero, { [critere.cle]: niveau })}
          />
        ))}
      </section>

      {/* Attitudes professionnelles (choisies à l'E1, conservées) — évaluées
          par le maître / tuteur ; au moins une requise pour sa signature. */}
      <section
        data-testid="attitudes-entretien"
        className="rounded-lg border border-border bg-card p-4 space-y-3"
      >
        <h2 className="text-base font-semibold">Attitudes professionnelles</h2>
        <p className="text-xs text-muted-foreground">
          Retenues à l'entretien 1, évaluées par le maître / tuteur (au moins une requise pour
          signer).
        </p>
        {attitudes.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">
            Aucune attitude retenue — voir la section « Choix des attitudes professionnelles ».
          </p>
        ) : (
          <div className="space-y-2">
            {attitudes.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
              >
                <span className="text-sm">
                  {a.libelle}
                  {a.description && (
                    <span className="block text-xs text-muted-foreground">{a.description}</span>
                  )}
                </span>
                <SelecteurAppreciation
                  editable={editableAttitudes}
                  valeur={entretien.evaluationsAttitudes[a.id] ?? null}
                  onChange={(v) => setEvaluationAttitude(livretId, numero, a.id, v)}
                  ariaLabel={`Attitude — ${a.libelle}`}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Récapitulatif des points d'alerte (réponses « Non »). */}
      <RecapAlertes alertes={alertes} />

      {/* Commentaires libres de l'entretien (zone commune). */}
      <section className="rounded-lg border border-border bg-card p-4 space-y-2">
        <label htmlFor="trame-commentaires" className="text-sm font-medium">
          Commentaires
        </label>
        {editableTrame ? (
          <textarea
            id="trame-commentaires"
            rows={3}
            value={entretien.commentaires.formateur ?? ''}
            onChange={(e) => setCommentaire(livretId, numero, 'formateur', e.target.value)}
            placeholder="Synthèse de l'entretien, points d'attention, décisions…"
            className="w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        ) : (
          <p
            className={cn(
              'text-sm whitespace-pre-wrap',
              !entretien.commentaires.formateur && 'text-muted-foreground italic',
            )}
          >
            {entretien.commentaires.formateur || 'Aucun commentaire.'}
          </p>
        )}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rubrique thématique
// ─────────────────────────────────────────────────────────────────────────────

function RubriqueTrame({
  rubrique,
  reponses,
  editable,
  onChange,
}: {
  rubrique: RubriqueTrameE1;
  reponses: Record<string, string | boolean | null>;
  editable: boolean;
  onChange: (questionId: string, valeur: string | boolean | null) => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 space-y-3">
      <h2 className="text-base font-semibold">{rubrique.titre}</h2>
      {rubrique.intro && <p className="text-xs text-muted-foreground">{rubrique.intro}</p>}
      <div className="space-y-3">
        {rubrique.questions.map((q) => (
          <ChampTrame
            key={q.id}
            question={q}
            valeur={reponses[q.id]}
            editable={editable}
            onChange={(valeur) => onChange(q.id, valeur)}
          />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Champ d'une question (texte ou oui/non, avec mise en évidence des « Non »)
// ─────────────────────────────────────────────────────────────────────────────

function ChampTrame({
  question,
  valeur,
  editable,
  onChange,
}: {
  question: QuestionTrameE1;
  valeur: string | boolean | null | undefined;
  editable: boolean;
  onChange: (valeur: string | boolean | null) => void;
}) {
  const id = `trame-q-${question.id}`;

  if (question.type === 'oui-non') {
    const estAlerte = question.alerteSiNon === true && valeur === false;
    return (
      <div
        data-testid={`trame-q-${question.id}`}
        className={cn(
          'flex flex-wrap items-center justify-between gap-2 rounded-md border px-2.5 py-1.5',
          estAlerte ? 'border-amber-300 bg-amber-50' : 'border-transparent',
        )}
      >
        <span className="flex items-center gap-1.5 text-sm">
          {estAlerte && (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
          )}
          <span>{question.libelle}</span>
        </span>
        <div className="flex flex-col items-end gap-0.5">
          <CaseOuiNon
            editable={editable}
            valeur={typeof valeur === 'boolean' ? valeur : null}
            onChange={(v) => onChange(v)}
            ariaLabel={question.libelle}
          />
          {estAlerte && question.aide && (
            <span className="text-xs text-amber-700">{question.aide}</span>
          )}
        </div>
      </div>
    );
  }

  const valeurTexte = typeof valeur === 'string' ? valeur : '';
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {question.libelle}
      </label>
      {question.aide && <p className="text-xs text-muted-foreground">{question.aide}</p>}
      {editable ? (
        <textarea
          id={id}
          rows={2}
          value={valeurTexte}
          onChange={(e) => onChange(e.target.value)}
          className="w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      ) : (
        <p
          className={cn(
            'text-sm whitespace-pre-wrap',
            !valeurTexte && 'text-muted-foreground italic',
          )}
        >
          {valeurTexte || 'Non renseigné'}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ligne de la grille d'appréciation (critère + 4 niveaux décrits)
// ─────────────────────────────────────────────────────────────────────────────

function LigneAppreciation({
  critere,
  valeur,
  editable,
  onChange,
}: {
  critere: (typeof CRITERES_APPRECIATION_E1)[number];
  valeur: NiveauAppreciation | undefined;
  editable: boolean;
  onChange: (niveau: NiveauAppreciation) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium">{critere.libelle}</span>
      <div className="grid gap-1.5 sm:grid-cols-4">
        {NIVEAUX.map(({ cle, symbole }) => {
          const actif = valeur === cle;
          return (
            <button
              key={cle}
              type="button"
              disabled={!editable}
              onClick={() => onChange(cle)}
              aria-pressed={actif}
              data-testid={`appreciation-${critere.cle}-${cle}`}
              className={cn(
                'rounded-md border p-2 text-left text-xs transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                actif
                  ? 'border-role-maitre bg-role-maitre/10 ring-1 ring-role-maitre'
                  : 'border-input bg-background hover:bg-secondary',
                !editable && 'cursor-not-allowed opacity-70',
              )}
            >
              <span className="block font-semibold">{symbole}</span>
              <span className="block text-muted-foreground">{critere.descriptions[cle]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Récapitulatif des points d'alerte (réponses « Non »)
// ─────────────────────────────────────────────────────────────────────────────

function RecapAlertes({ alertes }: { alertes: QuestionTrameE1[] }) {
  if (alertes.length === 0) {
    return (
      <section
        data-testid="trame-recap-alertes"
        className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
      >
        <ClipboardCheck className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
        <p>Aucun point d'alerte : aucune réponse « Non » à ce stade de l'entretien.</p>
      </section>
    );
  }
  return (
    <section
      data-testid="trame-recap-alertes"
      className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3"
    >
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        Points d'alerte ({alertes.length}) — action à mener par le GRETA CFA
      </h2>
      <ul className="list-disc space-y-1 pl-6 text-sm text-amber-900">
        {alertes.map((q) => (
          <li key={q.id}>
            {q.libelle}
            {q.aide ? ` — ${q.aide}` : ''}
          </li>
        ))}
      </ul>
      <p className="text-xs text-amber-700">
        Le formateur communique ces points au DDF ou au coordonnateur de la formation.
      </p>
    </section>
  );
}
