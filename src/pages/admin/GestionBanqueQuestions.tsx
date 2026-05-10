import { useEffect, useMemo, useState } from 'react';
import {
  GraduationCap,
  HardHat,
  ListChecks,
  Lock,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import type { CibleQuestion, QuestionBanque, Role } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useBanqueQuestionsStore } from '@/store/useBanqueQuestionsStore';
import { useLivretStore } from '@/store/useLivretStore';
import { libelleRole, peutEditer } from '@/lib/droits';
import { questionEstUtilisee } from '@/lib/questions-entretien';
import { ModaleQuestion } from '@/components/admin/ModaleQuestion';
import { cn } from '@/lib/utils';

/**
 * Page d'administration — banque de questions de l'entretien tripartite.
 * Référence : refonte mai 2026.
 *
 * Réservée aux rôles `coordo` et `admin` (matrice §6 — `admin.banque-questions.gerer`).
 * Permet d'ajouter, modifier et supprimer des questions. La suppression est
 * bloquée si la question est encore référencée par au moins un entretien.
 */

export function GestionBanqueQuestions() {
  const roleActif = useUserStore((s) => s.roleActif);
  const questionsMap = useBanqueQuestionsStore((s) => s.questions);
  const ajouterQuestion = useBanqueQuestionsStore((s) => s.ajouterQuestion);
  const modifierQuestion = useBanqueQuestionsStore((s) => s.modifierQuestion);
  const supprimerQuestion = useBanqueQuestionsStore((s) => s.supprimerQuestion);
  const livrets = useLivretStore((s) => s.livrets);

  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [enEdition, setEnEdition] = useState<QuestionBanque | undefined>(undefined);
  const [confirmationSuppression, setConfirmationSuppression] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!confirmationSuppression) return;
    const t = setTimeout(() => setConfirmationSuppression(null), 10_000);
    return () => clearTimeout(t);
  }, [confirmationSuppression]);

  const peutGerer = peutEditer(roleActif, 'admin.banque-questions.gerer');

  const questionsTriees = useMemo(
    () =>
      Object.values(questionsMap).sort((a, b) => {
        // Apprenti·e d'abord, puis maître ; ordre alphabétique au sein de
        // chaque cible (cohérent avec le sélecteur côté entretien).
        if (a.cible !== b.cible) return a.cible === 'apprenti' ? -1 : 1;
        return a.libelle.localeCompare(b.libelle, 'fr-FR');
      }),
    [questionsMap],
  );

  const entretiens = useMemo(
    () => Object.values(livrets).map((l) => l.entretienTripartite),
    [livrets],
  );

  if (!peutGerer) {
    return <AccesRefuse roleActif={roleActif} />;
  }

  function ouvrirCreation() {
    setEnEdition(undefined);
    setModaleOuverte(true);
  }

  function ouvrirEdition(q: QuestionBanque) {
    setEnEdition(q);
    setModaleOuverte(true);
  }

  function declencherSuppression(q: QuestionBanque) {
    if (confirmationSuppression !== q.id) {
      setConfirmationSuppression(q.id);
      return;
    }
    supprimerQuestion(q.id);
    setConfirmationSuppression(null);
  }

  function nbQuestionsCible(cible: CibleQuestion): number {
    return questionsTriees.filter((q) => q.cible === cible).length;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" aria-hidden="true" />
            <h1 className="text-2xl font-semibold">Banque de questions</h1>
          </div>
          <p className="text-muted-foreground">
            Catalogue des questions disponibles pour l'entretien tripartite. Le formateur
            référent en sélectionnera certaines pour chaque livret.
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>{nbQuestionsCible('apprenti')}</strong> questions apprenti·e ·{' '}
            <strong>{nbQuestionsCible('maitre')}</strong> questions maître
          </p>
        </div>
        <button
          type="button"
          onClick={ouvrirCreation}
          data-testid="banque-q-nouveau"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouvelle question
        </button>
      </header>

      {questionsTriees.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Aucune question dans la banque. Cliquez sur « Nouvelle question » pour démarrer.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-2 md:px-4 py-2 text-left">Question</th>
                <th className="px-2 md:px-4 py-2 text-left">Type</th>
                <th className="px-2 md:px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {questionsTriees.map((q) => {
                const enConfirmation = confirmationSuppression === q.id;
                const utilisee = questionEstUtilisee(q.id, entretiens);
                const supprimable = !utilisee;
                return (
                  <tr
                    key={q.id}
                    data-testid={`banque-q-row-${q.id}`}
                    className={cn(enConfirmation && 'bg-red-50')}
                  >
                    <td className="px-2 md:px-4 py-2 align-top">
                      <div className="flex items-start gap-2">
                        <IconeCible cible={q.cible} />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{q.libelle}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {q.cible === 'apprenti' ? "Apprenti·e" : "Maître d'apprentissage"}
                            {q.placeholder && (
                              <>
                                {' · '}
                                <span className="italic">{q.placeholder}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 md:px-4 py-2 text-muted-foreground align-top whitespace-nowrap">
                      {libelleType(q.type)}
                    </td>
                    <td className="px-2 md:px-4 py-2 text-right align-top">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => ouvrirEdition(q)}
                          aria-label={`Modifier la question : ${q.libelle}`}
                          className="rounded-md border border-input bg-background p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={!supprimable}
                          onClick={() => declencherSuppression(q)}
                          aria-label={
                            enConfirmation
                              ? `Confirmer la suppression de : ${q.libelle}`
                              : `Supprimer la question : ${q.libelle}`
                          }
                          title={
                            utilisee
                              ? 'Question utilisée dans au moins un entretien — désélectionnez-la avant suppression.'
                              : undefined
                          }
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md p-1.5 transition-colors',
                            enConfirmation
                              ? 'border border-red-300 bg-red-600 text-white hover:bg-red-700'
                              : 'border border-input bg-background text-muted-foreground hover:bg-secondary hover:text-foreground',
                            !supprimable &&
                              'opacity-40 cursor-not-allowed hover:bg-background',
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          {enConfirmation && (
                            <span className="text-xs font-medium">Confirmer</span>
                          )}
                        </button>
                      </div>
                      {utilisee && (
                        <p className="mt-0.5 text-[10px] text-amber-700 italic">
                          Utilisée dans au moins un entretien.
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ModaleQuestion
        ouvert={modaleOuverte}
        question={enEdition}
        onAnnuler={() => {
          setModaleOuverte(false);
          setEnEdition(undefined);
        }}
        onValider={(valeurs, existante) => {
          if (existante) {
            modifierQuestion(existante.id, valeurs);
          } else {
            ajouterQuestion(valeurs);
          }
          setModaleOuverte(false);
          setEnEdition(undefined);
        }}
      />
    </div>
  );
}

function IconeCible({ cible }: { cible: CibleQuestion }) {
  if (cible === 'apprenti') {
    return (
      <GraduationCap
        className="h-4 w-4 shrink-0 mt-0.5 text-role-apprenti"
        aria-label="Question apprenti·e"
      />
    );
  }
  return (
    <HardHat
      className="h-4 w-4 shrink-0 mt-0.5 text-role-maitre"
      aria-label="Question maître"
    />
  );
}

function libelleType(t: QuestionBanque['type']): string {
  switch (t) {
    case 'texte-court':
      return 'Texte court';
    case 'texte-long':
      return 'Texte long';
    case 'oui-non':
      return 'Oui / Non';
  }
}

function AccesRefuse({ roleActif }: { roleActif: Role }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
      <div className="flex items-start gap-3">
        <Lock className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-medium text-amber-900">
            Accès réservé à l'administration
          </h1>
          <p className="mt-2 text-sm text-amber-900/80">
            Vous êtes actuellement connecté·e en tant que <strong>{libelleRole(roleActif)}</strong>.
            La gestion de la banque de questions est réservée aux rôles{' '}
            <strong>Coordinateur·rice</strong> et <strong>Administrateur·rice</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
