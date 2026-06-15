import { CheckCircle2, CircleDashed, Edit3, Lock } from 'lucide-react';
import type { EtatFiche } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Badge visuel d'un état de fiche.
 * Référence : cahier des charges v1.3, sections 5.3 et 14.4.
 */

const CONFIG: Record<EtatFiche, { libelle: string; classes: string; Icon: typeof CheckCircle2 }> = {
  brouillon: {
    libelle: 'Brouillon',
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
    Icon: CircleDashed,
  },
  'en-cours': {
    libelle: 'En cours',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    Icon: Edit3,
  },
  signee: {
    libelle: 'Signée',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Icon: CheckCircle2,
  },
  verrouillee: {
    libelle: 'Verrouillée',
    classes: 'bg-blue-50 text-blue-900 border-blue-200',
    Icon: Lock,
  },
};

interface BadgeEtatFicheProps {
  etat: EtatFiche;
  className?: string;
}

export function BadgeEtatFiche({ etat, className }: BadgeEtatFicheProps) {
  const c = CONFIG[etat];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        c.classes,
        className,
      )}
    >
      <c.Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {c.libelle}
    </span>
  );
}
