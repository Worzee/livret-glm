import { Construction } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { libelleRole, peutEditer, type Ressource } from '@/lib/droits';
import { ChampEditable } from '@/components/common/ChampEditable';

interface PagePlaceholderProps {
  titre: string;
  description: string;
  /** Référence à la section du CDC (ex: "5.1"). */
  refCdc: string;
  /** Ressource principale de la page — pour démontrer le wrapper de droits. */
  ressourceDemo?: Ressource;
}

/**
 * Page placeholder utilisée pendant le sprint 1 pour les modules à venir.
 * Affiche un démonstrateur du wrapper ChampEditable avec la ressource cible,
 * de sorte que le pilote voie déjà la matrice des droits en action.
 */
export function PagePlaceholder({ titre, description, refCdc, ressourceDemo }: PagePlaceholderProps) {
  const roleActif = useUserStore((s) => s.roleActif);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{titre}</h1>
        <p className="text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">
          Cahier des charges — section {refCdc}
        </p>
      </header>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <Construction className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm">
            Sprint 1 — module non implémenté. Sera développé dans un sprint dédié.
          </p>
        </div>
      </div>

      {ressourceDemo && (
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Démonstration de la matrice des droits</h2>
          <p className="text-sm text-muted-foreground">
            La zone ci-dessous est rattachée à la ressource{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">{ressourceDemo}</code>. En basculant
            de rôle via le sélecteur en haut à droite, vous voyez le wrapper passer entre l'état
            éditable (bordure bleue) et lecture seule (badge verrouillé).
          </p>
          <ChampEditable ressource={ressourceDemo}>
            <div className="bg-background p-4">
              <label className="block text-sm font-medium mb-1" htmlFor="demo-textarea">
                Zone de saisie de démonstration
              </label>
              <textarea
                id="demo-textarea"
                className="w-full rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                placeholder={
                  peutEditer(roleActif, ressourceDemo)
                    ? 'Vous pouvez écrire ici…'
                    : 'Lecture seule pour ce rôle.'
                }
                disabled={!peutEditer(roleActif, ressourceDemo)}
              />
            </div>
          </ChampEditable>
          <p className="text-xs text-muted-foreground">
            Rôle actif : <strong>{libelleRole(roleActif)}</strong> →{' '}
            {peutEditer(roleActif, ressourceDemo) ? 'édition autorisée' : 'lecture seule'}
          </p>
        </section>
      )}
    </div>
  );
}
