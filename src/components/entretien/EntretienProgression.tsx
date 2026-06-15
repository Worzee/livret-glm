import type { EntretienTripartite } from '@/types';
import { calculerProgression } from '@/lib/regles-entretien';
import { BarreProgression } from '@/components/common/BarreProgression';

/**
 * Affichage de la complétude de l'entretien — barre globale + 3 barres par rôle.
 * Référence : cahier des charges v1.3, section 5.2 (état de complétude visible).
 */

interface EntretienProgressionProps {
  entretien: EntretienTripartite;
}

export function EntretienProgression({ entretien }: EntretienProgressionProps) {
  const p = calculerProgression(entretien);
  return (
    <section className="rounded-lg border border-border bg-card p-4 space-y-3">
      <header>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Complétude
        </h2>
      </header>
      <BarreProgression valeur={p.global} label="Progression globale" />
      <div className="grid gap-2 sm:grid-cols-3 pt-2 border-t border-border">
        <BarreProgression
          valeur={p.parRole.apprenti}
          label="Apprenti·e"
          classeBarre="bg-role-apprenti"
        />
        <BarreProgression valeur={p.parRole.maitre} label="Maître" classeBarre="bg-role-maitre" />
        <BarreProgression
          valeur={p.parRole.formateur}
          label="Formateur"
          classeBarre="bg-role-formateur"
        />
      </div>
    </section>
  );
}
