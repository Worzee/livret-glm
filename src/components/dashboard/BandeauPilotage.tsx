import { useMemo } from 'react';
import { AlertTriangle, Building2, MessagesSquare, School, Users } from 'lucide-react';
import type { Apprenti, Livret } from '@/types';
import { pourcentageSignees, statsPilotage } from '@/lib/pilotage';
import { cn } from '@/lib/utils';

/**
 * Bandeau de pilotage du tableau de bord coordo / admin (3 juillet 2026).
 *
 * KPI agrégés sur le périmètre du rôle actif (les apprenti·e·s accessibles) :
 * fiches signées entreprise / centre, entretiens réalisés, alertes R7.
 * Lecture seule — le pilotage n'ouvre aucun droit pédagogique.
 */

interface BandeauPilotageProps {
  apprentis: Apprenti[];
  livrets: Record<string, Livret>;
}

export function BandeauPilotage({ apprentis, livrets }: BandeauPilotageProps) {
  const stats = useMemo(() => statsPilotage(apprentis, livrets), [apprentis, livrets]);

  if (apprentis.length === 0) return null;

  return (
    <section aria-label="Pilotage du périmètre" data-testid="bandeau-pilotage">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <CartePilotage
          testid="pilotage-apprentis"
          icone={<Users className="texte-couleur-role h-4 w-4" aria-hidden="true" />}
          libelle="Apprenti·e·s suivis"
          valeur={String(stats.nbApprentis)}
          detail={
            stats.livretsClotures > 0
              ? `dont ${stats.livretsClotures} livret${stats.livretsClotures > 1 ? 's' : ''} clôturé${stats.livretsClotures > 1 ? 's' : ''}`
              : undefined
          }
        />
        <CartePilotage
          testid="pilotage-fiches-entreprise"
          icone={<Building2 className="texte-couleur-role h-4 w-4" aria-hidden="true" />}
          libelle="Fiches entreprise signées"
          valeur={`${stats.fichesEntreprise.signees} / ${stats.fichesEntreprise.total}`}
          detail={`${pourcentageSignees(stats.fichesEntreprise)} %`}
        />
        <CartePilotage
          testid="pilotage-fiches-centre"
          icone={<School className="texte-couleur-role h-4 w-4" aria-hidden="true" />}
          libelle="Fiches centre signées"
          valeur={`${stats.fichesCentre.signees} / ${stats.fichesCentre.total}`}
          detail={`${pourcentageSignees(stats.fichesCentre)} %`}
        />
        <CartePilotage
          testid="pilotage-entretiens"
          icone={<MessagesSquare className="texte-couleur-role h-4 w-4" aria-hidden="true" />}
          libelle="Entretiens réalisés"
          valeur={`${stats.entretiens.realises} / ${stats.entretiens.attendus}`}
        />
        <CartePilotage
          testid="pilotage-alertes-r7"
          icone={
            <AlertTriangle
              className={cn('h-4 w-4', stats.alertesR7 > 0 ? 'text-amber-600' : 'text-emerald-600')}
              aria-hidden="true"
            />
          }
          libelle="Alertes R7"
          valeur={String(stats.alertesR7)}
          accent={stats.alertesR7 > 0 ? 'alerte' : 'ok'}
          detail={stats.alertesR7 > 0 ? 'entretien 1 en retard' : 'aucun retard'}
        />
      </ul>
    </section>
  );
}

function CartePilotage({
  icone,
  libelle,
  valeur,
  detail,
  accent,
  testid,
}: {
  icone: React.ReactNode;
  libelle: string;
  valeur: string;
  detail?: string;
  accent?: 'alerte' | 'ok';
  testid: string;
}) {
  return (
    <li data-testid={testid} className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icone}
        <span>{libelle}</span>
      </div>
      <p
        className={cn(
          'mt-1 text-2xl font-semibold tabular-nums',
          accent === 'alerte' && 'text-amber-700',
          accent === 'ok' && 'text-emerald-700',
        )}
      >
        {valeur}
      </p>
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
    </li>
  );
}
