import { useState } from 'react';
import { ListChecks } from 'lucide-react';
import type { AppreciationMaitre, EntretienTripartite, QuestionBanque } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { useBanqueQuestionsStore } from '@/store/useBanqueQuestionsStore';
import { peutEditer } from '@/lib/droits';
import { peutEncoreEditer } from '@/lib/regles-entretien';
import { CaseOuiNon } from './CaseOuiNon';
import { SelecteurAppreciation } from '@/components/common/SelecteurAppreciation';
import { SelecteurQuestions } from './SelecteurQuestions';
import { cn } from '@/lib/utils';

/**
 * Sections de l'entretien réservées au maître d'apprentissage (CDC §5.2,
 * refonte mai 2026).
 *
 *   - Questions sélectionnées par le formateur référent depuis la banque
 *     (cf. `useBanqueQuestionsStore`). Le maître y répond ici.
 *   - Grille d'appréciation 4×4 (en dur — élément standardisé du livret).
 *   - Commentaire libre du maître.
 */

interface SectionMaitreProps {
  livretId: string;
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

export function SectionMaitre({ livretId, entretien }: SectionMaitreProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const setReponse = useLivretStore((s) => s.setReponseEntretien);
  const setQuestions = useLivretStore((s) => s.setQuestionsSelectionnees);
  const setAppreciation = useLivretStore((s) => s.setAppreciationMaitre);
  const setCommentaire = useLivretStore((s) => s.setCommentaireEntretien);
  const banque = useBanqueQuestionsStore((s) => s.questions);

  const [selecteurOuvert, setSelecteurOuvert] = useState(false);

  const editableQuestions =
    peutEditer(roleActif, 'entretien.questions-maitre') &&
    peutEncoreEditer('maitre', entretien);
  const editableAppreciation =
    peutEditer(roleActif, 'entretien.appreciation-maitre') &&
    peutEncoreEditer('maitre', entretien);
  const editableCommentaire =
    peutEditer(roleActif, 'entretien.commentaires-maitre') &&
    peutEncoreEditer('maitre', entretien);
  const peutChoisirQuestions = roleActif === 'formateur';

  const questions: QuestionBanque[] = entretien.questionsMaitreSelectionnees
    .map((id) => banque[id])
    .filter((q): q is QuestionBanque => !!q && q.cible === 'maitre');

  return (
    <section className="rounded-lg border border-border border-l-4 border-l-role-maitre bg-card p-4 space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-medium">Maître d'apprentissage</h2>
          <p className="text-xs text-muted-foreground">
            Réservé au maître d'apprentissage. Verrouillé après votre signature.
          </p>
        </div>
        {peutChoisirQuestions && (
          <button
            type="button"
            onClick={() => setSelecteurOuvert(true)}
            data-testid="maitre-choisir-questions"
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
            Choisir les questions ({questions.length})
          </button>
        )}
      </header>

      {/* ── Questions sélectionnées ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Questions</h3>
        {questions.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">
            {peutChoisirQuestions
              ? "Aucune question sélectionnée. Cliquez sur « Choisir les questions » pour démarrer."
              : "Le formateur référent n'a pas encore sélectionné de questions."}
          </p>
        ) : (
          questions.map((q) => (
            <ChampQuestion
              key={q.id}
              question={q}
              valeur={entretien.reponsesMaitre[q.id]}
              editable={editableQuestions}
              onChange={(valeur) => setReponse(livretId, 'maitre', q.id, valeur)}
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
                onChange={(v) => setAppreciation(livretId, { [c.cle]: v ?? undefined })}
                ariaLabel={c.libelle}
              />
            </div>
          ))}
        </div>
        <ChampTexte
          label="Commentaires d'appréciation"
          valeur={entretien.appreciationMaitre.commentaires ?? ''}
          editable={editableAppreciation}
          onChange={(v) => setAppreciation(livretId, { commentaires: v })}
          placeholder="Précisions sur l'appréciation portée."
        />
      </div>

      {/* ── Commentaire libre ───────────────────────────────────────────────── */}
      <div className="space-y-1 border-t border-border pt-3">
        <ChampTexte
          label="Commentaire libre du maître d'apprentissage"
          valeur={entretien.commentaires.maitre ?? ''}
          editable={editableCommentaire}
          onChange={(v) => setCommentaire(livretId, 'maitre', v)}
          placeholder="Tout ce que vous souhaitez ajouter…"
          rows={3}
        />
      </div>

      {/* Modale de sélection des questions — visible uniquement pour le formateur. */}
      <SelecteurQuestions
        ouvert={selecteurOuvert}
        cible="maitre"
        selectionInitiale={entretien.questionsMaitreSelectionnees}
        onAnnuler={() => setSelecteurOuvert(false)}
        onValider={(ids) => {
          setQuestions(livretId, 'maitre', ids);
          setSelecteurOuvert(false);
        }}
      />
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
        <p className={cn('text-sm whitespace-pre-wrap', !valeurTexte && 'text-muted-foreground italic')}>
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
