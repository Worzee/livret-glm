import { CalendarDays, Lock } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { libelleRole, peutEditer } from '@/lib/droits';
import { livretLeaMartin } from '@/fixtures/livret-demo';
import type { OrganisationSuivi as OrgSuiviType } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Module — Organisation du suivi (CDC §5.1).
 *
 * Formulaire éditable uniquement par le formateur référent. Lecture seule pour
 * l'apprenti·e et le maître. Les rôles admin et coordo n'ont pas accès en
 * édition (ils peuvent consulter, comme tout livret).
 *
 * Auto-save : chaque modification est persistée immédiatement dans le store.
 */

interface ChampSuivi {
  cle: keyof Omit<OrgSuiviType, 'modifieLe' | 'modifiePar'>;
  libelle: string;
  description: string;
  placeholder: string;
}

const CHAMPS: ChampSuivi[] = [
  {
    cle: 'reunionRentree',
    libelle: 'Réunion de rentrée',
    description: 'Présentation de la promo, des intervenant·e·s, des modalités générales.',
    placeholder: 'Ex : 04/09/2025 — Salle Diderot, 9h-12h',
  },
  {
    cle: 'entretienIndividuel',
    libelle: 'Entretien individuel',
    description: 'Premier entretien individuel avec chaque apprenti·e.',
    placeholder: 'Ex : Sur RDV, semaine du 15/09',
  },
  {
    cle: 'accueilTuteurs',
    libelle: 'Accueil des tuteurs (journée tuteur)',
    description: "Journée d'information dédiée aux maîtres d'apprentissage.",
    placeholder: 'Ex : 15/09/2025 — Site Diderot, 14h-17h',
  },
  {
    cle: 'visitesEntreprise',
    libelle: 'Visites en entreprise',
    description: "Calendrier prévisionnel des visites du formateur référent en entreprise.",
    placeholder: 'Ex : Novembre, février, mai',
  },
  {
    cle: 'restitutionActivites',
    libelle: 'Restitution des activités',
    description: "Modalités de restitution périodique en classe.",
    placeholder: 'Ex : Tous les 6 semaines, présentations orales',
  },
  {
    cle: 'bilansFormation',
    libelle: 'Bilans de formation',
    description: 'Périodes des bilans intermédiaires et finaux.',
    placeholder: 'Ex : Janvier (mi-parcours) et juin (final)',
  },
];

export function OrganisationSuivi() {
  const livret = useLivretStore((s) => s.getLivret(livretLeaMartin.id));
  const setOrganisation = useLivretStore((s) => s.setOrganisationSuivi);
  const roleActif = useUserStore((s) => s.roleActif);
  const utilisateurActif = useUserStore((s) => s.utilisateurActif);

  if (!livret) return null;

  const editable = peutEditer(roleActif, 'organisation-suivi');
  const org = livret.organisationSuivi;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Organisation du suivi</h1>
        <p className="text-muted-foreground">
          Cadre de suivi de la promo, défini par le formateur référent. Consultable par
          l'apprenti·e et le maître d'apprentissage.
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
        {CHAMPS.map((champ) => (
          <article
            key={champ.cle}
            className={cn(
              'rounded-lg border border-border bg-card p-4 space-y-2',
              editable && 'border-l-4 border-l-role-formateur',
            )}
          >
            <header className="flex items-start gap-2">
              <CalendarDays
                className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground"
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-sm">{champ.libelle}</h2>
                <p className="text-xs text-muted-foreground">{champ.description}</p>
              </div>
            </header>
            {editable ? (
              <textarea
                rows={2}
                value={org[champ.cle] ?? ''}
                onChange={(e) =>
                  setOrganisation(livret.id, utilisateurActif.id, { [champ.cle]: e.target.value })
                }
                placeholder={champ.placeholder}
                className="w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ) : (
              <p
                className={cn(
                  'text-sm whitespace-pre-wrap',
                  !org[champ.cle] && 'text-muted-foreground italic',
                )}
              >
                {org[champ.cle] || 'Non renseigné'}
              </p>
            )}
          </article>
        ))}
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
