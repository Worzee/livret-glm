import { useState } from 'react';
import { GraduationCap, ListChecks } from 'lucide-react';
import type { EntretienTripartite, NumeroEntretien, QuestionBanque } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { useBanqueQuestionsStore } from '@/store/useBanqueQuestionsStore';
import { peutEditer } from '@/lib/droits';
import { peutEncoreEditer } from '@/lib/regles-entretien';
import { cn } from '@/lib/utils';
import { CaseOuiNon } from './CaseOuiNon';
import { SelecteurQuestions } from './SelecteurQuestions';

/**
 * Section de l'entretien réservée à l'apprenti·e (CDC §5.2, refonte mai 2026).
 *
 * Les questions ne sont plus codées en dur : elles viennent de la banque
 * (`useBanqueQuestionsStore`) et sont **sélectionnées par le formateur
 * référent** pour ce livret précis (bouton « Choisir les questions »).
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
  const setQuestions = useLivretStore((s) => s.setQuestionsSelectionnees);
  const setCommentaire = useLivretStore((s) => s.setCommentaireEntretien);
  const banque = useBanqueQuestionsStore((s) => s.questions);

  const [selecteurOuvert, setSelecteurOuvert] = useState(false);

  const editable =
    peutEditer(roleActif, 'entretien.questions-apprenti') &&
    peutEncoreEditer('apprenti', entretien);
  const editableCommentaire =
    peutEditer(roleActif, 'entretien.commentaires-apprenti') &&
    peutEncoreEditer('apprenti', entretien);
  // Le formateur référent (et lui seul) peut configurer la sélection.
  const peutChoisirQuestions = roleActif === 'formateur';

  const questions: QuestionBanque[] = entretien.questionsApprentiSelectionnees
    .map((id) => banque[id])
    .filter((q): q is QuestionBanque => !!q && q.cible === 'apprenti');

  // Retours coordos juin 2026 : les questions affectées par le coordo
  // (snapshot) ne sont pas retirables ; les obligatoires portent un badge.
  const idsNonRetirables = [
    ...entretien.questionsImposees,
    ...entretien.questionsObligatoires,
  ];
  const idsObligatoires = new Set(entretien.questionsObligatoires);

  return (
    <section className="rounded-lg border border-border border-l-4 border-l-role-apprenti bg-card p-4 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <GraduationCap
            className="mt-1 h-5 w-5 shrink-0 text-role-apprenti"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-lg font-medium text-role-apprenti">
              Questions à l'apprenti·e
            </h2>
            <p className="text-xs text-muted-foreground">
              Réservé à l'apprenti·e. Verrouillé après votre signature.
            </p>
          </div>
        </div>
        {peutChoisirQuestions && (
          <button
            type="button"
            onClick={() => setSelecteurOuvert(true)}
            data-testid="apprenti-choisir-questions"
            className="inline-flex items-center gap-1.5 rounded-md border border-role-formateur/30 bg-role-formateur/10 px-2.5 py-1 text-xs font-medium text-role-formateur hover:bg-role-formateur/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
            Choisir les questions ({questions.length})
          </button>
        )}
      </header>

      <div className="space-y-4">
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
              valeur={entretien.reponsesApprenti[q.id]}
              editable={editable}
              obligatoire={idsObligatoires.has(q.id)}
              onChange={(valeur) =>
                setReponse(livretId, numero, 'apprenti', q.id, valeur)
              }
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

      {/* Modale de sélection des questions — visible uniquement pour le formateur. */}
      <SelecteurQuestions
        ouvert={selecteurOuvert}
        cible="apprenti"
        selectionInitiale={entretien.questionsApprentiSelectionnees}
        idsNonRetirables={idsNonRetirables}
        onAnnuler={() => setSelecteurOuvert(false)}
        onValider={(ids) => {
          setQuestions(livretId, numero, 'apprenti', ids);
          setSelecteurOuvert(false);
        }}
      />
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
  /** Réponse exigée pour signer (extension R20) — affiche un badge. */
  obligatoire?: boolean;
  onChange: (valeur: string | boolean | null) => void;
}

function BadgeObligatoire() {
  return (
    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 align-middle">
      Obligatoire
    </span>
  );
}

function ChampQuestion({ question, valeur, editable, obligatoire, onChange }: ChampQuestionProps) {
  const id = `entretien-q-${question.id}`;

  if (question.type === 'oui-non') {
    return (
      <div className="space-y-1">
        <span className="text-sm font-medium block">
          {question.libelle}
          {obligatoire && <BadgeObligatoire />}
        </span>
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
        {obligatoire && <BadgeObligatoire />}
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
