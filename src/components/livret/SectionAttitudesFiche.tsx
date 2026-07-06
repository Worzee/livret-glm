import type { FicheSuiviPeriode } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { useAttitudesStore } from '@/store/useAttitudesStore';
import { peutEditer } from '@/lib/droits';
import { peutEncoreEditerFiche } from '@/lib/transitions-fiche';
import { attitudesRetenues } from '@/lib/selection-attitudes';
import { attitudesNonEvaluees } from '@/lib/attitudes';
import { SelecteurAppreciation } from '@/components/common/SelecteurAppreciation';

/**
 * Attitudes professionnelles d'une fiche de période ENTREPRISE (juillet 2026
 * — chantier référentiels/compétences #3). Les attitudes retenues à
 * l'entretien tripartite sont évaluées par le maître / tuteur à CHAQUE
 * période en entreprise (échelle ++/+/-/--). R20 : TOUTES doivent être
 * évaluées pour que le maître signe la fiche — un rappel affiche le reste à
 * faire. L'onglet « Attitudes » de la Synthèse agrège ces évaluations en
 * last-write-wins.
 */
interface SectionAttitudesFicheProps {
  livretId: string;
  fiche: FicheSuiviPeriode;
}

export function SectionAttitudesFiche({ livretId, fiche }: SectionAttitudesFicheProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const evaluer = useLivretStore((s) => s.setEvaluationAttitudeFiche);
  const attitudesSelectionnees = useLivretStore((s) => s.livrets[livretId]?.attitudesSelectionnees);
  const attitudesMap = useAttitudesStore((s) => s.attitudes);

  const selection = attitudesSelectionnees ?? [];
  const attitudes = attitudesRetenues(Object.values(attitudesMap), selection);
  // R21 : la section se ferme dès que le maître / tuteur a signé la fiche.
  const editable =
    peutEditer(roleActif, 'fiche.attitudes') && peutEncoreEditerFiche(fiche, 'maitre');
  const manquantes = attitudesNonEvaluees(selection, fiche.evaluationsAttitudes);

  return (
    <section
      data-testid="attitudes-fiche"
      className="rounded-lg border border-border border-l-4 border-l-role-maitre bg-card p-4 space-y-3"
    >
      <header>
        <h3 className="text-lg font-medium">Attitudes professionnelles</h3>
        <p className="text-xs text-muted-foreground">
          Retenues à l'entretien tripartite, évaluées par le maître / tuteur à chaque période en
          entreprise — toutes sont requises pour sa signature.
        </p>
      </header>
      {attitudes.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">
          Aucune attitude retenue pour ce livret — le choix se fait à l'entretien tripartite.
        </p>
      ) : (
        <>
          {editable && manquantes.length > 0 && (
            <p role="status" className="text-xs font-medium text-amber-700">
              {manquantes.length === 1
                ? 'Il reste 1 attitude à évaluer avant votre signature.'
                : `Il reste ${manquantes.length} attitudes à évaluer avant votre signature.`}
            </p>
          )}
          <div className="space-y-2">
            {attitudes.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
              >
                <span className="text-sm">
                  {a.libelle}
                  {a.description && (
                    <span className="block text-xs text-muted-foreground">{a.description}</span>
                  )}
                </span>
                <SelecteurAppreciation
                  editable={editable}
                  valeur={fiche.evaluationsAttitudes?.[a.id] ?? null}
                  onChange={(v) => evaluer(livretId, fiche.id, a.id, v)}
                  ariaLabel={`Attitude — ${a.libelle}`}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
