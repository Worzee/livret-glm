import type { FicheSuiviPeriode, Role } from '@/types';
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
}

const ROLES_AVEC_OBSERVATION: Array<{
  role: Exclude<Role, 'coordo' | 'admin'>;
  ressource: Ressource;
  bordure: string;
}> = [
  {
    role: 'apprenti',
    ressource: 'fiche.observation-apprenti',
    bordure: 'border-l-role-apprenti',
  },
  { role: 'maitre', ressource: 'fiche.observation-maitre', bordure: 'border-l-role-maitre' },
  {
    role: 'formateur',
    ressource: 'fiche.observation-formateur',
    bordure: 'border-l-role-formateur',
  },
];

export function ZoneObservation({ livretId, fiche }: ZoneObservationProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const setObservation = useLivretStore((s) => s.setObservation);

  return (
    <section className="space-y-3">
      <h3 className="text-lg font-medium">Observations de fin de période</h3>
      <div className="grid gap-3 md:grid-cols-3">
        {ROLES_AVEC_OBSERVATION.map(({ role, ressource, bordure }) => {
          // R21 : une observation devient en lecture seule dès que le rôle a signé,
          // pour ne pas modifier ce qui a été signé. Réactivable uniquement via R10.
          const editable =
            peutEditer(roleActif, ressource) && peutEncoreEditerFiche(fiche, role);
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
                <span className="text-sm font-medium">{libelleRole(role)}</span>
                {!editable && (
                  <span
                    className="text-xs italic text-muted-foreground"
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
                  onChange={(e) => setObservation(livretId, fiche.id, role, e.target.value)}
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
                  {valeur || '—'}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
