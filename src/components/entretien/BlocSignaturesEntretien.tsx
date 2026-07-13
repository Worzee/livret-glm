import { CheckCircle2, GraduationCap, HardHat, Lock, UserCog, Users } from 'lucide-react';
import type { EntretienTripartite, Role } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { libelleRole, peutEditer } from '@/lib/droits';
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
  role: Extract<Role, 'apprenti' | 'maitre' | 'formateur'>;
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

export function BlocSignaturesEntretien({
  livretId,
  entretien,
  ficheVerrouillee,
}: BlocSignaturesEntretienProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const utilisateurActif = useUserStore((s) => s.utilisateurActif);
  const signer = useLivretStore((s) => s.signerEntretien);
  // 13 juin 2026 : la validation maître oriente vers le CHOIX des attitudes
  // (fait à l'entretien) tant que la sélection du livret est vide.
  const attitudesSelectionnees = useLivretStore((s) => s.livrets[livretId]?.attitudesSelectionnees);

  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-lg font-medium">Signatures tripartites</h2>
        <p className="text-xs text-muted-foreground">
          Une fois les 3 signatures apposées, l'entretien passe en lecture seule pour tous (R9).
        </p>
      </header>

      {ficheVerrouillee && (
        <div className="bandeau-info-couleur-role inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Entretien validé : toutes les sections sont en lecture seule.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {SIGNATAIRES.map(({ role, Icon, cleSig, classeBordure, classeIcone, classeTexte }) => {
          const sig = entretien.signatures[cleSig];
          const estSonRole = roleActif === role;
          const validation =
            estSonRole && !ficheVerrouillee
              ? validerSignatureEntretien(entretien, role, attitudesSelectionnees)
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
                  onConfirmer={(trace) => signer(livretId, role, trace)}
                />
              ) : (
                <p className={cn('text-xs italic opacity-70', classeTexte)}>
                  En attente de signature.
                </p>
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

      {/* Représentant légal — 4e signataire facultatif (apprenti·e mineur·e),
          hors décompte R9. Depuis le 13 juillet 2026 (demande 5), le
          RESPONSABLE LÉGAL signe lui-même avec l'identité de son compte ; le
          formateur référent conserve la capacité historique (fallback). */}
      {(() => {
        const sig = entretien.signatures.representantLegal;
        const peutSigner =
          peutEditer(roleActif, 'entretien.signature-representant-legal') && !ficheVerrouillee;
        const signeEnResponsable = roleActif === 'responsable';
        return (
          <article className="rounded-lg border border-l-4 border-border border-l-muted-foreground/40 bg-card p-4 space-y-3 sm:max-w-sm">
            <header className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm font-medium">Représentant légal</span>
              <span className="text-xs text-muted-foreground">
                (facultatif, apprenti·e mineur·e)
              </span>
            </header>
            {sig?.signe ? (
              <div className="space-y-1">
                {sig.trace && (
                  <img
                    src={sig.trace}
                    alt="Signature manuscrite : représentant légal"
                    className="h-14 max-w-full rounded border border-border bg-white object-contain"
                  />
                )}
                <div className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
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
            ) : peutSigner ? (
              <BoutonSigner
                role={signeEnResponsable ? 'responsable' : 'formateur'}
                nomCourt={signeEnResponsable ? utilisateurActif.prenom : 'le représentant légal'}
                libelleEngagement={
                  // Identité remplie depuis le compte du signataire (demande 5).
                  signeEnResponsable
                    ? `Représentant légal : ${utilisateurActif.prenom} ${utilisateurActif.nom}`
                    : "Représentant légal de l'apprenti·e"
                }
                disabled={false}
                onConfirmer={(trace) => signer(livretId, 'representantLegal', trace)}
              />
            ) : (
              <p className="text-xs italic text-muted-foreground">
                Signature facultative : apposée par le responsable légal depuis son compte, ou par
                le formateur référent si le représentant légal est présent en séance.
              </p>
            )}
          </article>
        );
      })()}
    </section>
  );
}
