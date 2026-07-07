import { CheckCircle2, GraduationCap, HardHat, UserCog } from 'lucide-react';
import type { FicheSuiviPeriode, LieuFiche, Role } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { libelleRole } from '@/lib/droits';
import { modeEffectif } from '@/lib/mode-evaluation';
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
  /** Lieu de la fiche : au centre, seules 2 signatures (apprenti·e + formateur). */
  lieu?: LieuFiche;
}

const SIGNATAIRES: Array<{
  role: Exclude<Role, 'coordo' | 'admin'>;
  Icon: typeof GraduationCap;
  cleSig: 'apprenti' | 'maitre' | 'formateur';
  classeBordure: string;
  classeIcone: string;
  classeTexte: string;
}> = [
  {
    role: 'apprenti',
    Icon: GraduationCap,
    cleSig: 'apprenti',
    classeBordure: 'border-l-role-apprenti',
    classeIcone: 'text-role-apprenti',
    classeTexte: 'text-role-apprenti',
  },
  {
    role: 'maitre',
    Icon: HardHat,
    cleSig: 'maitre',
    classeBordure: 'border-l-role-maitre',
    classeIcone: 'text-role-maitre',
    classeTexte: 'text-role-maitre',
  },
  {
    role: 'formateur',
    Icon: UserCog,
    cleSig: 'formateur',
    classeBordure: 'border-l-role-formateur',
    classeIcone: 'text-role-formateur',
    classeTexte: 'text-role-formateur',
  },
];

export function BlocSignatures({ livretId, fiche, lieu = 'entreprise' }: BlocSignaturesProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const utilisateurActif = useUserStore((s) => s.utilisateurActif);
  const signer = useLivretStore((s) => s.signer);
  // Juillet 2026 : R20 maître exige que TOUTES les attitudes retenues soient
  // évaluées sur la fiche entreprise — la sélection est passée à la validation.
  const attitudesSelectionnees = useLivretStore((s) => s.livrets[livretId]?.attitudesSelectionnees);
  // Chantier #4 : en mode activités, le message R20 du maître parle
  // d'activités (même prédicat sur les lignes de la fiche).
  const formationId = useLivretStore((s) => s.livrets[livretId]?.formationId);
  const formations = useFormationsStore((s) => s.formations);
  const modeEvaluation = modeEffectif(formationId ? formations[formationId] : undefined);

  const ficheVerrouillee = fiche.etat === 'verrouillee';

  // 2 signataires partout (1ᵉʳ juillet 2026) : en entreprise, apprenti·e +
  // maître / tuteur (le formateur référent commente puis verrouille) ; au
  // centre, apprenti·e + formateur référent (le maître n'intervient pas au CFA).
  const signataires = SIGNATAIRES.filter((s) =>
    lieu === 'centre' ? s.role !== 'maitre' : s.role !== 'formateur',
  );
  const detailParties =
    lieu === 'centre'
      ? "l'apprenti·e et le formateur référent"
      : "l'apprenti·e et le maître / tuteur";

  return (
    <section className="space-y-3">
      <header>
        <h3 className="text-lg font-medium">Signatures de fin de période</h3>
        <p className="text-xs text-muted-foreground">
          Une fiche passe à l'état « signée » lorsque les deux parties ont apposé leur signature :{' '}
          {detailParties}.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {signataires.map(({ role, Icon, cleSig, classeBordure, classeIcone, classeTexte }) => {
          const sig = fiche.signatures[cleSig];
          const estSonRole = roleActif === role;
          const validation =
            estSonRole && !ficheVerrouillee
              ? validerSignature(fiche, role, lieu, attitudesSelectionnees ?? [], modeEvaluation)
              : null;

          return (
            <article
              key={role}
              className={cn(
                'rounded-lg border-l-4 border border-border bg-card p-4 space-y-3',
                classeBordure,
              )}
            >
              <header className="flex items-center gap-2">
                <Icon className={cn('h-4 w-4 shrink-0', classeIcone)} aria-hidden="true" />
                <span className={cn('text-sm font-medium', classeTexte)}>{libelleRole(role)}</span>
              </header>

              {sig.signe ? (
                <div className="space-y-1">
                  {sig.trace && (
                    <img
                      src={sig.trace}
                      alt={`Signature manuscrite : ${libelleRole(role)}`}
                      className="h-14 max-w-full rounded border border-border bg-white object-contain"
                    />
                  )}
                  <div
                    className={cn(
                      'inline-flex items-center gap-1.5 text-sm font-medium',
                      classeTexte,
                    )}
                  >
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
                  role={role}
                  nomCourt={utilisateurActif.prenom}
                  libelleEngagement={`${libelleRole(role)} : ${utilisateurActif.prenom} ${utilisateurActif.nom}`}
                  disabled={!validation?.peutSigner}
                  raisonsBlocage={validation?.raisons}
                  onConfirmer={(trace) => signer(livretId, fiche.id, role, trace, lieu)}
                />
              ) : (
                <p className={cn('text-xs italic opacity-70', classeTexte)}>
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
