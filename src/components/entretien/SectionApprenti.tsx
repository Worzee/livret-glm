import type { EntretienTripartite, NumeroEntretien, QuestionBanque } from '@/types';
import { GraduationCap } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { useBanqueQuestionsStore } from '@/store/useBanqueQuestionsStore';
import { peutEditer } from '@/lib/droits';
import { peutEncoreEditer } from '@/lib/regles-entretien';
import { cn } from '@/lib/utils';
import { CaseOuiNon } from './CaseOuiNon';

/**
 * Section de l'entretien réservée à l'apprenti·e (CDC §5.2).
 *
 * Les questions viennent de la banque (`useBanqueQuestionsStore`). Refonte
 * 13 juin 2026 : leur composition est **gérée par formation** (le coordo
 * retire les questions non pertinentes dans la modale Planning) — le
 * formateur n'a plus de bouton de sélection. Toutes les questions présentes
 * sont **obligatoires** (réponse exigée pour signer, extension R20).
 *
 * Verrouillage : peutEncoreEditer (R8/R9) côté avancement signatures + droit
 * `entretien.questions-apprenti` côté matrice.
 */

interface SectionApprentiProps {
  livretId: string;
  numero: NumeroEntretien;
  entretien: EntretienTripartite;
}

export function SectionApprenti({ livretId, numero, entretien }: SectionApprentiProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const setReponse = useLivretStore((s) => s.setReponseEntretien);
  const setCommentaire = useLivretStore((s) => s.setCommentaireEntretien);
  const banque = useBanqueQuestionsStore((s) => s.questions);

  const editable =
    peutEditer(roleActif, 'entretien.questions-apprenti') &&
    peutEncoreEditer('apprenti', entretien);
  const editableCommentaire =
    peutEditer(roleActif, 'entretien.commentaires-apprenti') &&
    peutEncoreEditer('apprenti', entretien);

  const questions: QuestionBanque[] = entretien.questionsApprentiSelectionnees
    .map((id) => banque[id])
    .filter((q): q is QuestionBanque => !!q && q.cible === 'apprenti');

  return (
    <section className="rounded-lg border border-border border-l-4 border-l-role-apprenti bg-card p-4 space-y-4">
      <header className="flex items-start gap-2">
        <GraduationCap className="mt-1 h-5 w-5 shrink-0 text-role-apprenti" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-medium text-role-apprenti">Questions à l'apprenti·e</h2>
          <p className="text-xs text-muted-foreground">
            Réservé à l'apprenti·e. Toutes les questions sont à renseigner pour signer. Verrouillé
            après votre signature.
          </p>
        </div>
      </header>

      <div className="space-y-4">
        {questions.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">
            Aucune question pour cet entretien — le coordo a retiré toutes les questions destinées à
            l'apprenti·e pour cette formation.
          </p>
        ) : (
          questions.map((q) => (
            <ChampQuestion
              key={q.id}
              question={q}
              valeur={entretien.reponsesApprenti[q.id]}
              editable={editable}
              onChange={(valeur) => setReponse(livretId, numero, 'apprenti', q.id, valeur)}
            />
          ))
        )}
      </div>

      <div className="space-y-1 border-t border-border pt-3">
        <label htmlFor="apprenti-commentaire" className="text-sm font-medium">
          Commentaire libre de l'apprenti·e
        </label>
        {editableCommentaire ? (
          <textarea
            id="apprenti-commentaire"
            rows={3}
            value={entretien.commentaires.apprenti ?? ''}
            onChange={(e) => setCommentaire(livretId, numero, 'apprenti', e.target.value)}
            placeholder="Tout ce que vous souhaitez ajouter…"
            className="w-full resize-y rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        ) : (
          <p
            className={cn(
              'text-sm whitespace-pre-wrap',
              !entretien.commentaires.apprenti && 'text-muted-foreground italic',
            )}
          >
            {entretien.commentaires.apprenti || 'Aucun commentaire.'}
          </p>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : un champ par type de question
// ─────────────────────────────────────────────────────────────────────────────

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
      <div className="space-y-1">
        <span className="text-sm font-medium block">{question.libelle}</span>
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
  const rows = question.type === 'texte-long' ? 3 : 1;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
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
