import type { EntretienTripartite, ReponsesApprentiEntretien } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { peutEditer } from '@/lib/droits';
import { peutEncoreEditer } from '@/lib/regles-entretien';
import { cn } from '@/lib/utils';

/**
 * Sections de l'entretien réservées à l'apprenti·e (CDC §5.2).
 * Inclut les 7 questions textuelles + le commentaire libre.
 *
 * Verrouillage : ChampEditable côté droit + R8/R9 côté avancement signatures.
 */

interface SectionApprentiProps {
  livretId: string;
  entretien: EntretienTripartite;
}

const QUESTIONS: Array<{
  cle: keyof ReponsesApprentiEntretien;
  libelle: string;
  placeholder: string;
}> = [
  {
    cle: 'motivations',
    libelle: 'Quelles sont vos motivations pour cette formation ?',
    placeholder: 'Votre projet, vos objectifs…',
  },
  {
    cle: 'contactEntreprise',
    libelle: "Comment êtes-vous entré·e en contact avec cette entreprise ?",
    placeholder: 'Candidature spontanée, journée portes ouvertes, réseau…',
  },
  {
    cle: 'connaissanceEntreprise',
    libelle: 'Connaissiez-vous cette entreprise auparavant ?',
    placeholder: 'Stage antérieur, visite, recommandation…',
  },
  {
    cle: 'metierVsRepresentation',
    libelle: 'Le métier correspond-il à la représentation que vous en aviez ?',
    placeholder: 'Surprises, confirmations, ajustements…',
  },
  {
    cle: 'difficultesDisciplines',
    libelle: 'Rencontrez-vous des difficultés dans certaines disciplines au CFA ?',
    placeholder: 'Matières, contenus, méthodes…',
  },
  {
    cle: 'difficultesAutres',
    libelle: 'Rencontrez-vous d\'autres difficultés (matérielles, personnelles) ?',
    placeholder: 'Transport, logement, santé, etc.',
  },
  {
    cle: 'ressenti',
    libelle: 'Comment vous sentez-vous dans la brigade / l\'équipe ?',
    placeholder: 'Intégration, ambiance, soutien…',
  },
];

export function SectionApprenti({ livretId, entretien }: SectionApprentiProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const setReponses = useLivretStore((s) => s.setReponsesApprenti);
  const setCommentaire = useLivretStore((s) => s.setCommentaireEntretien);

  const editable =
    peutEditer(roleActif, 'entretien.questions-apprenti') &&
    peutEncoreEditer('apprenti', entretien);
  const editableCommentaire =
    peutEditer(roleActif, 'entretien.commentaires-apprenti') &&
    peutEncoreEditer('apprenti', entretien);

  return (
    <section className="rounded-lg border border-border border-l-4 border-l-role-apprenti bg-card p-4 space-y-4">
      <header>
        <h2 className="text-lg font-medium">Questions à l'apprenti·e</h2>
        <p className="text-xs text-muted-foreground">
          Réservé à l'apprenti·e. Verrouillé après votre signature.
        </p>
      </header>

      <div className="space-y-4">
        {QUESTIONS.map((q) => (
          <div key={q.cle} className="space-y-1">
            <label htmlFor={`apprenti-${q.cle}`} className="text-sm font-medium">
              {q.libelle}
            </label>
            {editable ? (
              <textarea
                id={`apprenti-${q.cle}`}
                rows={2}
                value={entretien.reponsesApprenti[q.cle] ?? ''}
                onChange={(e) => setReponses(livretId, { [q.cle]: e.target.value })}
                placeholder={q.placeholder}
                className="w-full resize-y rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ) : (
              <p
                className={cn(
                  'text-sm whitespace-pre-wrap',
                  !entretien.reponsesApprenti[q.cle] && 'text-muted-foreground italic',
                )}
              >
                {entretien.reponsesApprenti[q.cle] || 'Non renseigné'}
              </p>
            )}
          </div>
        ))}
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
            onChange={(e) => setCommentaire(livretId, 'apprenti', e.target.value)}
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
