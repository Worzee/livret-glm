import { GraduationCap, HardHat, UserCog } from 'lucide-react';
import type { FicheSuiviPeriode, LieuFiche, Role } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { libelleRole, peutEditer, type Ressource } from '@/lib/droits';
import { peutEncoreEditerFiche } from '@/lib/transitions-fiche';
import { cn } from '@/lib/utils';

/**
 * Trois zones d'observation en bas de la fiche, une par rôle.
 * Référence : cahier des charges v1.3, section 5.3.
 */

interface ZoneObservationProps {
  livretId: string;
  fiche: FicheSuiviPeriode;
  /** Lieu de la fiche : au centre, pas d'observation maître / tuteur. */
  lieu?: LieuFiche;
}

const ROLES_AVEC_OBSERVATION: Array<{
  role: Exclude<Role, 'coordo' | 'admin'>;
  ressource: Ressource;
  bordure: string;
  Icon: typeof GraduationCap;
  classeRole: string;
}> = [
  {
    role: 'apprenti',
    ressource: 'fiche.observation-apprenti',
    bordure: 'border-l-role-apprenti',
    Icon: GraduationCap,
    classeRole: 'text-role-apprenti',
  },
  {
    role: 'maitre',
    ressource: 'fiche.observation-maitre',
    bordure: 'border-l-role-maitre',
    Icon: HardHat,
    classeRole: 'text-role-maitre',
  },
  {
    role: 'formateur',
    ressource: 'fiche.observation-formateur',
    bordure: 'border-l-role-formateur',
    Icon: UserCog,
    classeRole: 'text-role-formateur',
  },
];

export function ZoneObservation({ livretId, fiche, lieu = 'entreprise' }: ZoneObservationProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const setObservation = useLivretStore((s) => s.setObservation);

  // Au centre, le maître / tuteur n'intervient pas : seules les zones
  // apprenti·e et formateur référent sont affichées.
  const roles =
    lieu === 'centre'
      ? ROLES_AVEC_OBSERVATION.filter((r) => r.role !== 'maitre')
      : ROLES_AVEC_OBSERVATION;

  return (
    <section className="space-y-3">
      <h3 className="text-lg font-medium">Observations de fin de période</h3>
      <div className={cn('grid gap-3', lieu === 'centre' ? 'md:grid-cols-2' : 'md:grid-cols-3')}>
        {roles.map(({ role, ressource, bordure, Icon, classeRole }) => {
          // R21 : une observation devient en lecture seule dès que le rôle a signé,
          // pour ne pas modifier ce qui a été signé. Réactivable uniquement via R10.
          const editable = peutEditer(roleActif, ressource) && peutEncoreEditerFiche(fiche, role);
          const dejaSigne = fiche.signatures[role].signe;
          const valeur = fiche.observations[role] ?? '';
          return (
            <article
              key={role}
              className={cn(
                'rounded-lg border border-border border-l-4 bg-card p-3 space-y-2',
                bordure,
              )}
            >
              <header className="flex items-center justify-between">
                <span
                  className={cn('inline-flex items-center gap-1.5 text-sm font-medium', classeRole)}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {libelleRole(role)}
                  {/* 1ᵉʳ juillet 2026 : en entreprise, le formateur ne signe
                      plus — sa zone devient un commentaire global optionnel,
                      éditable jusqu'au verrouillage. */}
                  {role === 'formateur' && lieu === 'entreprise' && (
                    <span className="text-xs font-normal text-muted-foreground">
                      · commentaire global (optionnel)
                    </span>
                  )}
                </span>
                {!editable && (
                  <span
                    className={cn(
                      'text-xs italic',
                      // « Figée par signature » prend la couleur du rôle propriétaire
                      // pour rester cohérent avec le ressort visuel de la zone.
                      // « Lecture » reste neutre (utilisateur autre que propriétaire).
                      dejaSigne ? cn(classeRole, 'opacity-80') : 'text-muted-foreground',
                    )}
                    title={
                      dejaSigne
                        ? 'Cette observation est figée : le rôle a déjà signé. Un déverrouillage R10 est nécessaire pour la rouvrir.'
                        : undefined
                    }
                  >
                    {dejaSigne ? 'Figée par signature' : 'Lecture'}
                  </span>
                )}
              </header>
              {editable ? (
                <textarea
                  rows={4}
                  value={valeur}
                  onChange={(e) => setObservation(livretId, fiche.id, role, e.target.value, lieu)}
                  placeholder={`Observation du ${libelleRole(role).toLowerCase()}…`}
                  className="w-full resize-y rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ) : (
                <p
                  className={cn(
                    'text-sm whitespace-pre-wrap min-h-[5rem]',
                    !valeur && 'text-muted-foreground italic',
                  )}
                >
                  {valeur || '-'}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
