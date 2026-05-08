import { CheckCircle2, GraduationCap, HardHat, UserCog } from 'lucide-react';
import type { FicheSuiviPeriode, Role } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { libelleRole } from '@/lib/droits';
import { validerSignature } from '@/lib/validation-signature';
import { BoutonSigner } from '@/components/common/BoutonSigner';
import { cn } from '@/lib/utils';

/**
 * Bloc des 3 signatures de fin de période.
 * Référence : cahier des charges v1.3, sections 5.3 et 8.4.
 *
 * Comportement :
 *   - chaque rôle métier voit son propre bouton "Signer" ; les autres en lecture
 *   - les rôles coordo et admin n'ont pas de droit de signature pédagogique
 *   - bouton désactivé si validerSignature retourne peutSigner=false (R20)
 *   - tooltip listant les raisons de blocage
 *   - une fiche `verrouillee` n'autorise plus les signatures
 */

interface BlocSignaturesProps {
  livretId: string;
  fiche: FicheSuiviPeriode;
}

const SIGNATAIRES: Array<{
  role: Exclude<Role, 'coordo' | 'admin'>;
  Icon: typeof GraduationCap;
  cleSig: 'apprenti' | 'maitre' | 'formateur';
  classeRole: string;
}> = [
  { role: 'apprenti', Icon: GraduationCap, cleSig: 'apprenti', classeRole: 'border-l-role-apprenti' },
  { role: 'maitre', Icon: HardHat, cleSig: 'maitre', classeRole: 'border-l-role-maitre' },
  { role: 'formateur', Icon: UserCog, cleSig: 'formateur', classeRole: 'border-l-role-formateur' },
];

export function BlocSignatures({ livretId, fiche }: BlocSignaturesProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const utilisateurActif = useUserStore((s) => s.utilisateurActif);
  const signer = useLivretStore((s) => s.signer);

  const ficheVerrouillee = fiche.etat === 'verrouillee';

  return (
    <section className="space-y-3">
      <header>
        <h3 className="text-lg font-medium">Signatures de fin de période</h3>
        <p className="text-xs text-muted-foreground">
          Une fiche passe à l'état « signée » lorsque les trois parties ont apposé leur signature.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {SIGNATAIRES.map(({ role, Icon, cleSig, classeRole }) => {
          const sig = fiche.signatures[cleSig];
          const estSonRole = roleActif === role;
          const validation =
            estSonRole && !ficheVerrouillee ? validerSignature(fiche, role) : null;

          return (
            <article
              key={role}
              className={cn(
                'rounded-lg border-l-4 border border-border bg-card p-4 space-y-3',
                classeRole,
              )}
            >
              <header className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium">{libelleRole(role)}</span>
              </header>

              {sig.signe ? (
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-emerald-700 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Signé
                  </div>
                  {sig.dateSignature && (
                    <p className="text-xs text-muted-foreground">
                      le{' '}
                      <time dateTime={sig.dateSignature}>
                        {new Date(sig.dateSignature).toLocaleString('fr-FR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </time>
                    </p>
                  )}
                </div>
              ) : estSonRole && !ficheVerrouillee ? (
                <BoutonSigner
                  nomCourt={utilisateurActif.prenom}
                  libelleEngagement={`${libelleRole(role)} — ${utilisateurActif.prenom} ${utilisateurActif.nom}`}
                  disabled={!validation?.peutSigner}
                  raisonsBlocage={validation?.raisons}
                  onConfirmer={() => signer(livretId, fiche.id, role)}
                />
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  En attente de signature.
                </p>
              )}

              {/* Raisons de blocage R20 — visibles seulement pour le rôle concerné */}
              {estSonRole && !sig.signe && validation && !validation.peutSigner && (
                <ul className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2 space-y-1 list-disc pl-5">
                  {validation.raisons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
