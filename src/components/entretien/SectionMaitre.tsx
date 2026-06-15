import { HardHat } from 'lucide-react';
import type {
  AppreciationMaitre,
  EntretienTripartite,
  NumeroEntretien,
  QuestionBanque,
} from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { useBanqueQuestionsStore } from '@/store/useBanqueQuestionsStore';
import { useAttitudesStore } from '@/store/useAttitudesStore';
import { peutEditer } from '@/lib/droits';
import { peutEncoreEditer } from '@/lib/regles-entretien';
import { attitudesRetenues } from '@/lib/selection-attitudes';
import { CaseOuiNon } from './CaseOuiNon';
import { SelecteurAppreciation } from '@/components/common/SelecteurAppreciation';
import { cn } from '@/lib/utils';

/**
 * Sections de l'entretien réservées au maître / tuteur (CDC §5.2).
 *
 *   - Questions issues de la banque, composées par formation (13 juin 2026 :
 *     toutes présentes sauf celles retirées par le coordo, toutes
 *     obligatoires). Le maître y répond ici, sans pouvoir les modifier.
 *   - Grille d'appréciation 4×4 (en dur — élément standardisé du livret).
 *   - Attitudes professionnelles retenues à l'E1 (évaluées à chaque entretien).
 *   - Commentaire libre du maître.
 */

interface SectionMaitreProps {
  livretId: string;
  numero: NumeroEntretien;
  entretien: EntretienTripartite;
}

const CRITERES_APPRECIATION: Array<{
  cle: keyof Omit<AppreciationMaitre, 'commentaires'>;
  libelle: string;
}> = [
  { cle: 'ponctualite', libelle: 'Ponctualité et assiduité' },
  { cle: 'comprehensionConsignes', libelle: 'Compréhension des consignes' },
  { cle: 'qualiteTravail', libelle: 'Qualité du travail fourni' },
  { cle: 'integration', libelle: "Intégration dans l'équipe" },
];

export function SectionMaitre({ livretId, numero, entretien }: SectionMaitreProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const setReponse = useLivretStore((s) => s.setReponseEntretien);
  const setAppreciation = useLivretStore((s) => s.setAppreciationMaitre);
  const setCommentaire = useLivretStore((s) => s.setCommentaireEntretien);
  const setEvaluationAttitude = useLivretStore((s) => s.setEvaluationAttitude);
  const livret = useLivretStore((s) => s.livrets[livretId]);
  const banque = useBanqueQuestionsStore((s) => s.questions);
  const attitudesMap = useAttitudesStore((s) => s.attitudes);

  const editableQuestions =
    peutEditer(roleActif, 'entretien.questions-maitre') && peutEncoreEditer('maitre', entretien);
  const editableAppreciation =
    peutEditer(roleActif, 'entretien.appreciation-maitre') && peutEncoreEditer('maitre', entretien);
  const editableCommentaire =
    peutEditer(roleActif, 'entretien.commentaires-maitre') && peutEncoreEditer('maitre', entretien);
  // Attitudes professionnelles (juin 2026) : réservées au maître, figées
  // par sa signature comme le reste de sa section.
  const editableAttitudes =
    peutEditer(roleActif, 'entretien.attitudes') && peutEncoreEditer('maitre', entretien);

  const questions: QuestionBanque[] = entretien.questionsMaitreSelectionnees
    .map((id) => banque[id])
    .filter((q): q is QuestionBanque => !!q && q.cible === 'maitre');
  // 13 juin 2026 : seules les attitudes RETENUES pour le livret (choix fait
  // à l'E1 par maître + formateur) sont évaluées — à chaque entretien.
  const attitudes = attitudesRetenues(
    Object.values(attitudesMap),
    livret?.attitudesSelectionnees ?? [],
  );

  return (
    <section className="rounded-lg border border-border border-l-4 border-l-role-maitre bg-card p-4 space-y-5">
      <header className="flex items-start gap-2">
        <HardHat className="mt-1 h-5 w-5 shrink-0 text-role-maitre" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-medium text-role-maitre">Maître / Tuteur</h2>
          <p className="text-xs text-muted-foreground">
            Réservé au maître / tuteur. Toutes les questions sont à renseigner pour signer.
            Verrouillé après votre signature.
          </p>
        </div>
      </header>

      {/* ── Questions (composées par formation — toutes obligatoires) ────────── */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Questions</h3>
        {questions.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">
            Aucune question pour cet entretien — le coordo a retiré toutes les questions destinées
            au maître / tuteur pour cette formation.
          </p>
        ) : (
          questions.map((q) => (
            <ChampQuestion
              key={q.id}
              question={q}
              valeur={entretien.reponsesMaitre[q.id]}
              editable={editableQuestions}
              onChange={(valeur) => setReponse(livretId, numero, 'maitre', q.id, valeur)}
            />
          ))
        )}
      </div>

      {/* ── Grille d'appréciation 4×4 (en dur — standardisée CDC §5.2) ──────── */}
      <div className="space-y-3 border-t border-border pt-4">
        <h3 className="text-sm font-medium">
          Appréciation générale{' '}
          <span className="text-xs text-muted-foreground font-normal">
            (++ très bien · + bien · – à améliorer · – – insuffisant)
          </span>
        </h3>
        <div className="space-y-2">
          {CRITERES_APPRECIATION.map((c) => (
            <div
              key={c.cle}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
            >
              <span className="text-sm">{c.libelle}</span>
              <SelecteurAppreciation
                editable={editableAppreciation}
                valeur={entretien.appreciationMaitre[c.cle]}
                onChange={(v) => setAppreciation(livretId, numero, { [c.cle]: v ?? undefined })}
                ariaLabel={c.libelle}
              />
            </div>
          ))}
        </div>
        <ChampTexte
          label="Commentaires d'appréciation"
          valeur={entretien.appreciationMaitre.commentaires ?? ''}
          editable={editableAppreciation}
          onChange={(v) => setAppreciation(livretId, numero, { commentaires: v })}
          placeholder="Précisions sur l'appréciation portée."
        />
      </div>

      {/* ── Attitudes professionnelles (juin 2026 — évaluées à CHAQUE
            entretien, catalogue global géré par l'admin). Au moins une
            évaluation est exigée pour signer (extension R20). ──────────── */}
      <div className="space-y-3 border-t border-border pt-4" data-testid="attitudes-entretien">
        <h3 className="text-sm font-medium">
          Attitudes professionnelles{' '}
          <span className="text-xs text-muted-foreground font-normal">
            (choisies à l'entretien 1, évaluées à chaque entretien — au moins une requise pour
            signer)
          </span>
        </h3>
        {attitudes.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">
            Aucune attitude retenue pour ce livret — le choix se fait dans la section « Choix des
            attitudes professionnelles » de l'entretien tripartite 1 (maître / tuteur et formateur
            référent).
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
      </div>

      {/* ── Commentaire libre ───────────────────────────────────────────────── */}
      <div className="space-y-1 border-t border-border pt-3">
        <ChampTexte
          label="Commentaire libre du maître / tuteur"
          valeur={entretien.commentaires.maitre ?? ''}
          editable={editableCommentaire}
          onChange={(v) => setCommentaire(livretId, numero, 'maitre', v)}
          placeholder="Tout ce que vous souhaitez ajouter…"
          rows={3}
        />
      </div>
    </section>
  );
}

interface ChampQuestionProps {
  question: QuestionBanque;
  valeur: string | boolean | null | undefined;
  editable: boolean;
  onChange: (valeur: string | boolean | null) => void;
}

function ChampQuestion({ question, valeur, editable, onChange }: ChampQuestionProps) {
  const id = `entretien-q-${question.id}`;

  if (question.type === 'oui-non') {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm">{question.libelle}</span>
        <CaseOuiNon
          editable={editable}
          valeur={typeof valeur === 'boolean' ? valeur : null}
          onChange={(v) => onChange(v)}
          ariaLabel={question.libelle}
        />
      </div>
    );
  }

  const valeurTexte = typeof valeur === 'string' ? valeur : '';
  const rows = question.type === 'texte-long' ? 2 : 1;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium block">
        {question.libelle}
      </label>
      {editable ? (
        question.type === 'texte-long' ? (
          <textarea
            id={id}
            rows={rows}
            value={valeurTexte}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            className="w-full resize-y rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        ) : (
          <input
            id={id}
            type="text"
            value={valeurTexte}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        )
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

interface ChampTexteProps {
  label: string;
  valeur: string;
  editable: boolean;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

function ChampTexte({ label, valeur, editable, onChange, placeholder, rows = 2 }: ChampTexteProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium block">{label}</label>
      {editable ? (
        <textarea
          rows={rows}
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full resize-y rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      ) : (
        <p className={cn('text-sm whitespace-pre-wrap', !valeur && 'text-muted-foreground italic')}>
          {valeur || 'Non renseigné'}
        </p>
      )}
    </div>
  );
}
