import type { StatsBloc, StatsNiveau } from '@/lib/stats-bloc';
import { pourcent } from '@/lib/stats-bloc';
import { cn } from '@/lib/utils';

/**
 * Synthèse visuelle d'un bloc de compétences — barres empilées (CDC §5.4).
 *
 * Une barre par colonne (entreprise / centre), 4 segments empilés :
 *   - Maîtrisé (vert)
 *   - Partiel (ambre)
 *   - Non maîtrisé (rouge)
 *   - Non évalué (gris)
 *
 * Implémentation en CSS pur (flexbox + width %) — aucune dépendance externe.
 */

interface SyntheseBlocProps {
  stats: StatsBloc;
}

export function SyntheseBloc({ stats }: SyntheseBlocProps) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 space-y-3">
      <header>
        <h3 className="font-medium">{stats.bloc.libelle}</h3>
        <p className="text-xs text-muted-foreground">
          {stats.bloc.competences.length} compétence
          {stats.bloc.competences.length > 1 ? 's' : ''}
        </p>
      </header>

      <BarreEmpilee titre="Acquis en entreprise" stats={stats.entreprise} />
      <BarreEmpilee titre="Acquis en centre" stats={stats.centre} />

      <Legende />
    </article>
  );
}

interface BarreEmpileeProps {
  titre: string;
  stats: StatsNiveau;
}

function BarreEmpilee({ titre, stats }: BarreEmpileeProps) {
  const segments: Array<{ valeur: number; classe: string; label: string }> = [
    { valeur: stats.maitrise, classe: 'bg-niveau-maitrise', label: 'Maîtrisé' },
    { valeur: stats.partiel, classe: 'bg-niveau-partiel', label: 'Partiellement maîtrisé' },
    { valeur: stats.nonMaitrise, classe: 'bg-niveau-non-maitrise', label: 'Non maîtrisé' },
    { valeur: stats.nonEvalue, classe: 'bg-niveau-non-fait', label: 'Non évalué' },
  ];
  const total = stats.total || 1; // évite division par zéro

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-foreground">{titre}</span>
        <span className="tabular-nums text-muted-foreground">
          {stats.maitrise + stats.partiel}/{stats.total} acquis ou en cours
          {' · '}
          {pourcent(stats.maitrise, stats.total)}% maîtrisé
        </span>
      </div>
      <div
        role="img"
        aria-label={`${titre} : ${stats.maitrise} maîtrisé, ${stats.partiel} partiel, ${stats.nonMaitrise} non maîtrisé, ${stats.nonEvalue} non évalué`}
        className="flex h-3 w-full overflow-hidden rounded-full border border-border bg-secondary"
      >
        {segments.map((seg) =>
          seg.valeur > 0 ? (
            <div
              key={seg.label}
              className={cn('h-full transition-all', seg.classe)}
              style={{ width: `${(seg.valeur / total) * 100}%` }}
              title={`${seg.label} : ${seg.valeur}`}
            />
          ) : null,
        )}
      </div>
    </div>
  );
}

function Legende() {
  return (
    <div className="flex flex-wrap gap-3 pt-2 border-t border-border text-xs">
      <Pastille couleur="bg-niveau-maitrise" libelle="Maîtrisé" />
      <Pastille couleur="bg-niveau-partiel" libelle="Partiel" />
      <Pastille couleur="bg-niveau-non-maitrise" libelle="Non maîtrisé" />
      <Pastille couleur="bg-niveau-non-fait" libelle="Non évalué" />
    </div>
  );
}

function Pastille({ couleur, libelle }: { couleur: string; libelle: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span aria-hidden="true" className={cn('inline-block h-2.5 w-2.5 rounded-full', couleur)} />
      {libelle}
    </span>
  );
}
