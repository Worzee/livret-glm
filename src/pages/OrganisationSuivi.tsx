import { CalendarDays, Lock, LockOpen, MessageSquare } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { libelleRole, peutEditer } from '@/lib/droits';
import type {
  ChampOrganisationSuivi,
  OrganisationSuivi as OrgSuiviType,
} from '@/types';
import { cn } from '@/lib/utils';
import { AucunApprentiSelectionne } from '@/components/common/AucunApprentiSelectionne';

/**
 * Module — Organisation du suivi (CDC §5.1).
 *
 * Formulaire éditable uniquement par le formateur référent. Lecture seule pour
 * l'apprenti·e et le maître. Les rôles admin et coordo n'ont pas accès en
 * édition (ils peuvent consulter, comme tout livret).
 *
 * Chaque carte est désormais structurée en deux zones :
 *   - un sélecteur de date (input type="date" — calendrier natif du navigateur)
 *   - un commentaire libre (textarea)
 *
 * Auto-save : chaque modification est persistée immédiatement dans le store.
 */

type CleChamp = keyof Omit<OrgSuiviType, 'modifieLe' | 'modifiePar'>;

interface ChampSuivi {
  cle: CleChamp;
  libelle: string;
  description: string;
  /** Indique à l'utilisateur quoi écrire dans le commentaire (lieu, fréquence…). */
  placeholderCommentaire: string;
  /** True si la date principale est généralement attendue (pour aide visuelle). */
  dateAttendue: boolean;
}

const CHAMPS: ChampSuivi[] = [
  {
    cle: 'reunionRentree',
    libelle: 'Réunion de rentrée',
    description: 'Présentation de la promo, des intervenant·e·s, des modalités générales.',
    placeholderCommentaire: 'Lieu, horaires, intervenants…',
    dateAttendue: true,
  },
  {
    cle: 'entretienIndividuel',
    libelle: 'Entretien individuel',
    description: 'Premier entretien individuel avec chaque apprenti·e.',
    placeholderCommentaire: 'Modalités (RDV individuel, semaine type…)',
    dateAttendue: false,
  },
  {
    cle: 'accueilTuteurs',
    libelle: 'Accueil des tuteurs (journée tuteur)',
    description: "Journée d'information dédiée aux maîtres d'apprentissage.",
    placeholderCommentaire: 'Lieu, horaires, programme abrégé…',
    dateAttendue: true,
  },
  {
    cle: 'visitesEntreprise',
    libelle: 'Visites en entreprise',
    description: 'Calendrier prévisionnel des visites du formateur référent en entreprise.',
    placeholderCommentaire: 'Première visite ci-contre. Détailler les autres ici.',
    dateAttendue: true,
  },
  {
    cle: 'restitutionActivites',
    libelle: 'Restitution des activités',
    description: 'Modalités de restitution périodique en classe.',
    placeholderCommentaire: 'Fréquence et format (ex : oral toutes les 6 semaines).',
    dateAttendue: false,
  },
  {
    cle: 'bilansFormation',
    libelle: 'Bilans de formation',
    description: 'Périodes des bilans intermédiaires et finaux.',
    placeholderCommentaire: 'Périodes (ex : bilan mi-parcours en janvier, final en juin).',
    dateAttendue: false,
  },
];

export function OrganisationSuivi() {
  const ctx = useApprentiActif();
  const setOrganisation = useLivretStore((s) => s.setOrganisationSuivi);
  const roleActif = useUserStore((s) => s.roleActif);
  const utilisateurActif = useUserStore((s) => s.utilisateurActif);

  if (!ctx) return <AucunApprentiSelectionne />;
  const { apprenti, livret } = ctx;

  const editable = peutEditer(roleActif, 'organisation-suivi');
  const org = livret.organisationSuivi;

  /** Met à jour un seul sous-champ (date OU commentaire) en préservant l'autre. */
  function patcherChamp(cle: CleChamp, patch: Partial<ChampOrganisationSuivi>) {
    const valeurCourante = livret.organisationSuivi[cle];
    setOrganisation(livret.id, utilisateurActif.id, {
      [cle]: { ...valeurCourante, ...patch },
    });
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Organisation du suivi</h1>
        <p className="text-muted-foreground">
          Cadre de suivi de la promo, défini par le formateur référent. Consultable par
          l'apprenti·e et le maître d'apprentissage.
        </p>
        <p className="text-xs text-muted-foreground">
          Apprenti·e : <strong>{apprenti.prenom} {apprenti.nom}</strong>
        </p>
      </header>

      {!editable && (
        <div className="inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Vous consultez en mode <strong className="text-foreground">{libelleRole(roleActif)}</strong>{' '}
          — modification réservée au formateur référent.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {CHAMPS.map((champ) => {
          const valeur = org[champ.cle];
          return (
            <CarteOrganisation
              key={champ.cle}
              champ={champ}
              valeur={valeur}
              editable={editable}
              onChangeDate={(date) => patcherChamp(champ.cle, { date })}
              onChangeCommentaire={(commentaire) =>
                patcherChamp(champ.cle, { commentaire })
              }
              onToggleVerrouille={() =>
                patcherChamp(champ.cle, { verrouille: !valeur.verrouille })
              }
            />
          );
        })}
      </div>

      {org.modifieLe && (
        <p className="text-xs text-muted-foreground">
          Dernière modification :{' '}
          <time dateTime={org.modifieLe}>
            {new Date(org.modifieLe).toLocaleString('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </time>
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Carte d'un champ — date à gauche, commentaire à droite (sm+) / empilé (mobile)
// ─────────────────────────────────────────────────────────────────────────────

interface CarteOrganisationProps {
  champ: ChampSuivi;
  valeur: ChampOrganisationSuivi;
  editable: boolean;
  onChangeDate: (date: string) => void;
  onChangeCommentaire: (commentaire: string) => void;
  onToggleVerrouille: () => void;
}

function CarteOrganisation({
  champ,
  valeur,
  editable,
  onChangeDate,
  onChangeCommentaire,
  onToggleVerrouille,
}: CarteOrganisationProps) {
  const idDate = `org-date-${champ.cle}`;
  const idCommentaire = `org-com-${champ.cle}`;
  const verrouille = valeur.verrouille === true;
  // Édition possible si le rôle a le droit ET que le champ n'est pas verrouillé.
  const peutEditerChamp = editable && !verrouille;

  return (
    <article
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-border bg-card p-4',
        editable && 'border-l-4 border-l-role-formateur',
        verrouille && 'bg-muted/30',
      )}
    >
      <header className="flex items-start gap-2">
        <CalendarDays
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-medium">{champ.libelle}</h2>
          <p className="text-xs text-muted-foreground">{champ.description}</p>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Colonne date + bouton verrou */}
        <div className="sm:w-44 sm:shrink-0 space-y-2">
          <div className="space-y-1">
            <label
              htmlFor={idDate}
              className="text-xs font-medium text-muted-foreground"
            >
              Date{champ.dateAttendue ? '' : ' (optionnelle)'}
            </label>
            {peutEditerChamp ? (
              <input
                id={idDate}
                type="date"
                value={valeur.date ?? ''}
                onChange={(e) => onChangeDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ) : editable ? (
              // Champ verrouillé pour le formateur : on garde l'apparence input,
              // mais désactivé visuellement.
              <input
                id={idDate}
                type="date"
                value={valeur.date ?? ''}
                disabled
                className="w-full cursor-not-allowed rounded-md border border-input bg-muted px-2 py-1.5 text-sm text-muted-foreground"
              />
            ) : (
              // Lecture seule pour les autres rôles (apprenti·e, maître…).
              <p
                className={cn(
                  'rounded-md border border-transparent px-2 py-1.5 text-sm',
                  !valeur.date && 'italic text-muted-foreground',
                )}
              >
                {valeur.date
                  ? new Date(valeur.date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  : 'Non renseigné'}
              </p>
            )}
          </div>

          {/* Bouton verrouiller / déverrouiller — formateur uniquement */}
          {editable && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onToggleVerrouille}
                aria-pressed={verrouille}
                aria-label={
                  verrouille
                    ? `Déverrouiller le champ ${champ.libelle}`
                    : `Verrouiller le champ ${champ.libelle}`
                }
                className={cn(
                  'inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  verrouille
                    ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                    : 'border-input bg-background text-muted-foreground hover:bg-secondary',
                )}
              >
                {verrouille ? (
                  <>
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    Verrouillé
                  </>
                ) : (
                  <>
                    <LockOpen className="h-3.5 w-3.5" aria-hidden="true" />
                    Verrouiller
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Colonne commentaire */}
        <div className="flex-1 space-y-1">
          <label
            htmlFor={idCommentaire}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
          >
            <MessageSquare className="h-3 w-3" aria-hidden="true" />
            Commentaire
          </label>
          {peutEditerChamp ? (
            <textarea
              id={idCommentaire}
              rows={3}
              value={valeur.commentaire ?? ''}
              onChange={(e) => onChangeCommentaire(e.target.value)}
              placeholder={champ.placeholderCommentaire}
              className="w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          ) : editable ? (
            // Champ verrouillé pour le formateur.
            <textarea
              id={idCommentaire}
              rows={3}
              value={valeur.commentaire ?? ''}
              readOnly
              className="w-full cursor-not-allowed resize-y rounded-md border border-input bg-muted px-2 py-1.5 text-sm text-muted-foreground"
            />
          ) : (
            <p
              className={cn(
                'min-h-[3.25rem] whitespace-pre-wrap rounded-md border border-transparent px-2 py-1.5 text-sm',
                !valeur.commentaire && 'italic text-muted-foreground',
              )}
            >
              {valeur.commentaire || 'Non renseigné'}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
