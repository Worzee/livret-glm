import { CheckCircle2, GraduationCap, HardHat, Lock, UserCog } from 'lucide-react';
import type { EntretienTripartite, Role } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { libelleRole } from '@/lib/droits';
import { validerSignatureEntretien } from '@/lib/regles-entretien';
import { BoutonSigner } from '@/components/common/BoutonSigner';
import { cn } from '@/lib/utils';

/**
 * Bloc des 3 signatures de l'entretien tripartite.
 * Référence : cahier des charges v1.3, sections 5.2 et 8.2 (R8/R9).
 *
 * Différences avec BlocSignatures (fiche de période) :
 *   - critères R20 ≠ R8 (validation différente — voir validerSignatureEntretien)
 *   - une fois les 3 signatures apposées (R9), tout l'entretien passe en
 *     lecture seule pour TOUS les rôles, sans badge "verrouillée"
 */

interface BlocSignaturesEntretienProps {
  livretId: string;
  entretien: EntretienTripartite;
  /** Vrai si la fiche est figée (R9 : 3 signatures complètes). */
  ficheVerrouillee: boolean;
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

export function BlocSignaturesEntretien({
  livretId,
  entretien,
  ficheVerrouillee,
}: BlocSignaturesEntretienProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const utilisateurActif = useUserStore((s) => s.utilisateurActif);
  const signer = useLivretStore((s) => s.signerEntretien);

  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-lg font-medium">Signatures tripartites</h2>
        <p className="text-xs text-muted-foreground">
          Une fois les 3 signatures apposées, l'entretien passe en lecture seule pour tous (R9).
        </p>
      </header>

      {ficheVerrouillee && (
        <div className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-900">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Entretien validé — toutes les sections sont en lecture seule.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {SIGNATAIRES.map(({ role, Icon, cleSig, classeRole }) => {
          const sig = entretien.signatures[cleSig];
          const estSonRole = roleActif === role;
          const validation =
            estSonRole && !ficheVerrouillee ? validerSignatureEntretien(entretien, role) : null;

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
                  onConfirmer={() => signer(livretId, role)}
                />
              ) : (
                <p className="text-xs text-muted-foreground italic">En attente de signature.</p>
              )}

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
