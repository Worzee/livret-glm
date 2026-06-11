import type { FicheSuiviPeriode, Role } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { peutEditer, type Ressource } from '@/lib/droits';
import { peutEncoreEditerFiche } from '@/lib/transitions-fiche';
import { cn } from '@/lib/utils';

/**
 * Sous-fiche "Suivi de la formation au GRETA CFA".
 * Référence : cahier des charges v1.3 §5.3 + refonte mai 2026.
 *
 * Refonte : remplace l'ancien tableau co-édité (cours / formateur / contenu /
 * évaluations) par deux zones de texte libre, l'une pour l'apprenti·e (ce
 * qu'il/elle retient de la période en centre), l'autre pour le formateur
 * référent (contenus abordés, points d'attention pédagogiques).
 *
 * Chaque zone n'est éditable que par son propriétaire, et figée dès qu'il/elle
 * a signé la fiche (R21, via `peutEncoreEditerFiche`).
 */

interface SuiviGretaCfaProps {
  livretId: string;
  fiche: FicheSuiviPeriode;
}

export function SuiviGretaCfa({ livretId, fiche }: SuiviGretaCfaProps) {
  return (
    <section className="space-y-3">
      <header>
        <h3 className="text-lg font-medium">Suivi de la formation au GRETA CFA</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Chaque zone est renseignée par son propriétaire et figée dès sa signature.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <ZoneRole
          livretId={livretId}
          fiche={fiche}
          role="apprenti"
          ressource="fiche.suivi-greta-cfa-apprenti"
          titre="Apprenti·e"
          couleur="text-role-apprenti"
          valeur={fiche.suiviGretaCfa.apprenti ?? ''}
          placeholder="Ce que j'ai appris en centre cette période, mes points d'intérêt, mes questions…"
        />
        <ZoneRole
          livretId={livretId}
          fiche={fiche}
          role="formateur"
          ressource="fiche.suivi-greta-cfa-formateur"
          titre="Formateur référent"
          couleur="text-role-formateur"
          valeur={fiche.suiviGretaCfa.formateur ?? ''}
          placeholder="Contenus abordés au CFA, points d'attention pédagogiques, évaluations…"
        />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface ZoneRoleProps {
  livretId: string;
  fiche: FicheSuiviPeriode;
  role: Extract<Role, 'apprenti' | 'formateur'>;
  ressource: Ressource;
  titre: string;
  couleur: string;
  valeur: string;
  placeholder: string;
}

function ZoneRole({
  livretId,
  fiche,
  role,
  ressource,
  titre,
  couleur,
  valeur,
  placeholder,
}: ZoneRoleProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const setChamp = useLivretStore((s) => s.setSuiviGretaCfaChamp);

  // R21 : la zone appartient au rôle propriétaire — figée dès qu'il/elle signe.
  const editable = peutEditer(roleActif, ressource) && peutEncoreEditerFiche(fiche, role);

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <h4 className={cn('text-sm font-medium', couleur)}>{titre}</h4>
        {!editable && peutEditer(roleActif, ressource) && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Figée par signature
          </span>
        )}
      </div>
      {editable ? (
        <textarea
          rows={6}
          className="w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={valeur}
          placeholder={placeholder}
          onChange={(e) => setChamp(livretId, fiche.id, role, e.target.value)}
        />
      ) : (
        <p
          className={cn(
            'min-h-[6rem] whitespace-pre-wrap rounded-md border border-dashed border-border bg-secondary/30 px-2 py-1.5 text-sm',
            !valeur && 'text-muted-foreground italic',
          )}
        >
          {valeur || 'Aucune saisie.'}
        </p>
      )}
    </div>
  );
}
