import { Plus } from 'lucide-react';
import type { FicheSuiviPeriode } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { peutEditer } from '@/lib/droits';
import { peutEncoreEditerFiche } from '@/lib/transitions-fiche';
import { BoutonSupprimer } from '@/components/common/BoutonSupprimer';
import { cn } from '@/lib/utils';

/**
 * Sous-fiche "Suivi de la formation au GRETA CFA".
 * Référence : cahier des charges v1.3, section 5.3.
 *
 * Tableau éditable par le formateur référent uniquement (lecture seule pour les autres).
 * Colonnes : nom du cours, formateur, contenu, évaluations.
 */

interface SuiviGretaCfaProps {
  livretId: string;
  fiche: FicheSuiviPeriode;
}

export function SuiviGretaCfa({ livretId, fiche }: SuiviGretaCfaProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const setLigne = useLivretStore((s) => s.setLigneSuiviGreta);
  const ajouter = useLivretStore((s) => s.ajouterLigneSuiviGreta);
  const supprimer = useLivretStore((s) => s.supprimerLigneSuiviGreta);

  // R21 : la zone GRETA CFA appartient au formateur référent, donc bloquée
  // dès qu'il a signé (pas seulement quand la fiche est verrouillée).
  const editable =
    peutEditer(roleActif, 'fiche.suivi-greta-cfa') && peutEncoreEditerFiche(fiche, 'formateur');

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Suivi de la formation au GRETA CFA</h3>
        {editable && (
          <button
            type="button"
            onClick={() => ajouter(livretId, fiche.id)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Ajouter une ligne
          </button>
        )}
      </header>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Cours</th>
              <th className="px-3 py-2 text-left">Formateur·rice</th>
              <th className="px-3 py-2 text-left">Contenu travaillé</th>
              <th className="px-3 py-2 text-left">Évaluations</th>
              {editable && <th className="px-3 py-2 w-10" aria-label="Actions"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {fiche.suiviGretaCfa.length === 0 && (
              <tr>
                <td
                  colSpan={editable ? 5 : 4}
                  className="px-3 py-6 text-center text-sm text-muted-foreground italic"
                >
                  Aucun cours renseigné.
                  {editable && ' Cliquez sur « Ajouter une ligne » pour commencer.'}
                </td>
              </tr>
            )}
            {fiche.suiviGretaCfa.map((l) => (
              <tr key={l.id} className="align-top">
                <td className="px-3 py-2">
                  <ChampTexte
                    valeur={l.nomCours}
                    editable={editable}
                    placeholder="Ex : Technologie culinaire"
                    onChange={(v) => setLigne(livretId, fiche.id, l.id, { nomCours: v })}
                  />
                </td>
                <td className="px-3 py-2">
                  <ChampTexte
                    valeur={l.nomFormateur}
                    editable={editable}
                    placeholder="Ex : Sophie DUBOIS"
                    onChange={(v) => setLigne(livretId, fiche.id, l.id, { nomFormateur: v })}
                  />
                </td>
                <td className="px-3 py-2 min-w-[200px]">
                  <ChampTexte
                    valeur={l.contenu}
                    editable={editable}
                    multiline
                    placeholder="Contenu travaillé pendant la période…"
                    onChange={(v) => setLigne(livretId, fiche.id, l.id, { contenu: v })}
                  />
                </td>
                <td className="px-3 py-2 min-w-[140px]">
                  <ChampTexte
                    valeur={l.evaluations ?? ''}
                    editable={editable}
                    placeholder="Note ou appréciation"
                    onChange={(v) => setLigne(livretId, fiche.id, l.id, { evaluations: v })}
                  />
                </td>
                {editable && (
                  <td className="px-3 py-2">
                    <BoutonSupprimer
                      ariaLabel={`Supprimer la ligne ${l.nomCours || 'sans titre'}`}
                      question={`Supprimer ${l.nomCours || 'cette ligne'} ?`}
                      onConfirmer={() => supprimer(livretId, fiche.id, l.id)}
                      variant="icon"
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Sous-composant interne : champ texte simple/multilignes ──────────────────
interface ChampTexteProps {
  valeur: string;
  editable: boolean;
  multiline?: boolean;
  placeholder?: string;
  onChange: (v: string) => void;
}

function ChampTexte({ valeur, editable, multiline, placeholder, onChange }: ChampTexteProps) {
  if (!editable) {
    return (
      <span className={cn('text-sm', !valeur && 'text-muted-foreground italic')}>
        {valeur || '—'}
      </span>
    );
  }
  if (multiline) {
    return (
      <textarea
        rows={2}
        className="w-full resize-y rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        value={valeur}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      type="text"
      className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      value={valeur}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
