import type { LigneEvaluationFinaleAttitude, NiveauAppreciation, Referentiel } from '@/types';
import { useLivretStore } from '@/store/useLivretStore';
import { useUserStore } from '@/store/useUserStore';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { peutEditer } from '@/lib/droits';
import { estCloture } from '@/lib/cloture-livret';
import { SelecteurAppreciation } from '@/components/common/SelecteurAppreciation';
import { cn } from '@/lib/utils';

/**
 * Grille d'évaluation finale des attitudes professionnelles (CDC §5.5).
 *
 * Liste des critères × 4 niveaux d'appréciation (++/+/-/--), évaluée par le
 * maître d'apprentissage ET le formateur référent (deux colonnes), avec un
 * champ commentaire par rôle pour chaque critère.
 */

interface GrilleAttitudesProps {
  referentiel: Referentiel;
}

export function GrilleAttitudes({ referentiel }: GrilleAttitudesProps) {
  const ctx = useApprentiActif();
  const setLigne = useLivretStore((s) => s.setLigneAttitudeFinale);
  const roleActif = useUserStore((s) => s.roleActif);

  if (!ctx) return null;
  const { livret } = ctx;

  // R22 — la clôture rend toutes les cellules en lecture seule.
  const livretFige = estCloture(livret);
  const peutEditerMaitre = !livretFige && peutEditer(roleActif, 'grille-attitudes.maitre');
  const peutEditerFormateur = !livretFige && peutEditer(roleActif, 'grille-attitudes.formateur');
  const lignes = livret.evaluationFinaleAttitudes.lignes;

  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-lg font-medium">Attitudes professionnelles</h2>
        <p className="text-xs text-muted-foreground">
          Évaluation conjointe par le maître / tuteur et le formateur référent.
        </p>
      </header>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left w-1/3">Critère</th>
              <th className="px-3 py-2 text-left">Maître / Tuteur</th>
              <th className="px-3 py-2 text-left">Formateur référent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {referentiel.attitudes.map((att) => {
              const ligne =
                lignes.find((l) => l.attitudeId === att.id) ??
                ({
                  attitudeId: att.id,
                  evaluationMaitre: null,
                  evaluationFormateur: null,
                } satisfies LigneEvaluationFinaleAttitude);

              return (
                <tr key={att.id} className="align-top">
                  <td className="px-3 py-3">
                    <div className="font-medium text-sm">{att.libelle}</div>
                    {att.description && (
                      <p className="text-xs text-muted-foreground">{att.description}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 border-l-2 border-l-role-maitre/20 space-y-2">
                    <SelecteurAppreciation
                      editable={peutEditerMaitre}
                      valeur={ligne.evaluationMaitre}
                      onChange={(v) =>
                        setLigne(livret.id, att.id, {
                          evaluationMaitre: v as NiveauAppreciation | null,
                        })
                      }
                      ariaLabel={`Appréciation maître pour ${att.libelle}`}
                    />
                    <CelluleCommentaire
                      valeur={ligne.commentaireMaitre ?? ''}
                      editable={peutEditerMaitre}
                      onChange={(v) => setLigne(livret.id, att.id, { commentaireMaitre: v })}
                    />
                  </td>
                  <td className="px-3 py-3 border-l-2 border-l-role-formateur/20 space-y-2">
                    <SelecteurAppreciation
                      editable={peutEditerFormateur}
                      valeur={ligne.evaluationFormateur}
                      onChange={(v) =>
                        setLigne(livret.id, att.id, {
                          evaluationFormateur: v as NiveauAppreciation | null,
                        })
                      }
                      ariaLabel={`Appréciation formateur pour ${att.libelle}`}
                    />
                    <CelluleCommentaire
                      valeur={ligne.commentaireFormateur ?? ''}
                      editable={peutEditerFormateur}
                      onChange={(v) => setLigne(livret.id, att.id, { commentaireFormateur: v })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CelluleCommentaire({
  valeur,
  editable,
  onChange,
}: {
  valeur: string;
  editable: boolean;
  onChange: (v: string) => void;
}) {
  if (!editable) {
    return (
      <span
        className={cn('text-xs block', !valeur && 'text-muted-foreground italic')}
      >
        {valeur || 'Aucun commentaire'}
      </span>
    );
  }
  return (
    <textarea
      rows={2}
      value={valeur}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Commentaire optionnel"
      className="w-full resize-y rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}
