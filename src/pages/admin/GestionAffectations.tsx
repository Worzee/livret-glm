import { useMemo, useState } from 'react';
import { Building2, GraduationCap, HardHat, Link2, Lock, Search, UserCog } from 'lucide-react';
import type { Apprenti } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useUtilisateursStore } from '@/store/useUtilisateursStore';
import { libelleRole, peutEditer } from '@/lib/droits';
import {
  filtrerApprentis,
  trierApprentis,
} from '@/lib/apprentis-accessibles';
import { formationsDemo } from '@/fixtures/formations';
import { cn } from '@/lib/utils';

/**
 * Page d'administration — gestion des affectations.
 * Référence : cahier des charges v1.3, section 6 (matrice droits) et §10.4.
 *
 * Réservée aux rôles `coordo` et `admin` (matrice §6 — `admin.affectations.gerer`).
 *
 * Pour chaque apprenti·e, on peut modifier en place :
 *   - la formation (et donc le référentiel des évaluations finales)
 *   - le maître d'apprentissage (la liste `apprentiIds` est synchronisée
 *     automatiquement entre l'ancien et le nouveau maître)
 *   - le formateur référent
 *
 * Auto-save : chaque sélection est persistée immédiatement dans le store.
 * Indicateur visuel sur la cellule pendant 1,5 s pour confirmer la sauvegarde.
 */
export function GestionAffectations() {
  const roleActif = useUserStore((s) => s.roleActif);
  const apprentis = useUtilisateursStore((s) => s.apprentis);
  const maitres = useUtilisateursStore((s) => s.maitres);
  const formateurs = useUtilisateursStore((s) => s.formateurs);
  const modifierApprenti = useUtilisateursStore((s) => s.modifierApprenti);

  const [requete, setRequete] = useState('');
  const [filtreFormationId, setFiltreFormationId] = useState<string>('toutes');

  const liste = useMemo(() => {
    let r = Object.values(apprentis);
    if (filtreFormationId !== 'toutes') {
      r = r.filter((a) => a.formationId === filtreFormationId);
    }
    if (requete.trim()) r = filtrerApprentis(r, requete);
    return trierApprentis(r);
  }, [apprentis, requete, filtreFormationId]);

  const formationsList = useMemo(() => Object.values(formationsDemo), []);
  const maitresList = useMemo(() => Object.values(maitres), [maitres]);
  const formateursList = useMemo(() => Object.values(formateurs), [formateurs]);

  // Vérification d'accès — placée après les hooks pour respecter rules-of-hooks.
  if (!peutEditer(roleActif, 'admin.affectations.gerer')) {
    return <AccesRefuse roleActif={roleActif} />;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-semibold">Gestion des affectations</h1>
        </div>
        <p className="text-muted-foreground">
          Association apprenti·e ↔ formation ↔ maître d'apprentissage ↔ formateur référent.
          Les modifications sont enregistrées immédiatement.
        </p>
      </header>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[16rem] max-w-md">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={requete}
            onChange={(e) => setRequete(e.target.value)}
            placeholder="Filtrer par nom ou prénom"
            aria-label="Filtrer les apprenti·e·s"
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={filtreFormationId}
          onChange={(e) => setFiltreFormationId(e.target.value)}
          aria-label="Filtrer par formation"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="toutes">Toutes les formations</option>
          {formationsList.map((f) => (
            <option key={f.id} value={f.id}>
              {f.intitule} ({f.annee})
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {liste.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Aucun·e apprenti·e ne correspond à vos critères.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                    Apprenti·e
                  </span>
                </th>
                <th className="px-4 py-2 text-left">Formation</th>
                <th className="px-4 py-2 text-left">
                  <span className="inline-flex items-center gap-1.5">
                    <HardHat className="h-3.5 w-3.5 text-role-maitre" aria-hidden="true" />
                    Maître d'apprentissage
                  </span>
                </th>
                <th className="px-4 py-2 text-left">
                  <span className="inline-flex items-center gap-1.5">
                    <UserCog className="h-3.5 w-3.5 text-role-formateur" aria-hidden="true" />
                    Formateur référent
                  </span>
                </th>
                <th className="px-4 py-2 text-left">
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Entreprise
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {liste.map((a) => (
                <LigneAffectation
                  key={a.id}
                  apprenti={a}
                  formations={formationsList}
                  maitres={maitresList}
                  formateurs={formateursList}
                  onChange={(patch) => modifierApprenti(a.id, patch)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ligne d'affectation — selects auto-save par champ
// ─────────────────────────────────────────────────────────────────────────────

interface LigneAffectationProps {
  apprenti: Apprenti;
  formations: Array<{ id: string; intitule: string; annee: string }>;
  maitres: Array<{ id: string; prenom: string; nom: string; entrepriseId: string }>;
  formateurs: Array<{ id: string; prenom: string; nom: string }>;
  onChange: (patch: Partial<Apprenti>) => void;
}

function LigneAffectation({
  apprenti,
  formations,
  maitres,
  formateurs,
  onChange,
}: LigneAffectationProps) {
  // Indicateur visuel ponctuel "Enregistré" sur le champ qui vient d'être modifié.
  const [champFlash, setChampFlash] = useState<string | null>(null);

  function patcher(patch: Partial<Apprenti>, champ: string) {
    onChange(patch);
    setChampFlash(champ);
    setTimeout(() => setChampFlash((c) => (c === champ ? null : c)), 1500);
  }

  function changerMaitre(nouveauId: string) {
    const m = maitres.find((mm) => mm.id === nouveauId);
    // Le changement de maître propage l'entreprise par défaut.
    patcher(
      {
        maitreApprentissageId: nouveauId,
        entrepriseId: m?.entrepriseId ?? apprenti.entrepriseId,
      },
      'maitre',
    );
  }

  return (
    <tr>
      <td className="px-4 py-2 font-medium whitespace-nowrap">
        {apprenti.prenom} {apprenti.nom}
      </td>
      <td className="px-2 py-2">
        <SelectAutoSave
          valeur={apprenti.formationId}
          onChange={(v) => patcher({ formationId: v }, 'formation')}
          aDestinationDuFlash={champFlash === 'formation'}
          ariaLabel={`Formation de ${apprenti.prenom} ${apprenti.nom}`}
        >
          {formations.map((f) => (
            <option key={f.id} value={f.id}>
              {f.intitule}
            </option>
          ))}
        </SelectAutoSave>
      </td>
      <td className="px-2 py-2">
        <SelectAutoSave
          valeur={apprenti.maitreApprentissageId}
          onChange={changerMaitre}
          aDestinationDuFlash={champFlash === 'maitre'}
          ariaLabel={`Maître d'apprentissage de ${apprenti.prenom} ${apprenti.nom}`}
        >
          {maitres.map((m) => (
            <option key={m.id} value={m.id}>
              {m.prenom} {m.nom}
            </option>
          ))}
        </SelectAutoSave>
      </td>
      <td className="px-2 py-2">
        <SelectAutoSave
          valeur={apprenti.formateurReferentId}
          onChange={(v) => patcher({ formateurReferentId: v }, 'formateur')}
          aDestinationDuFlash={champFlash === 'formateur'}
          ariaLabel={`Formateur référent de ${apprenti.prenom} ${apprenti.nom}`}
        >
          {formateurs.map((f) => (
            <option key={f.id} value={f.id}>
              {f.prenom} {f.nom}
            </option>
          ))}
        </SelectAutoSave>
      </td>
      <td className="px-4 py-2 text-muted-foreground text-xs">
        {apprenti.entrepriseId}
      </td>
    </tr>
  );
}

interface SelectAutoSaveProps {
  valeur: string;
  onChange: (v: string) => void;
  aDestinationDuFlash: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}

function SelectAutoSave({
  valeur,
  onChange,
  aDestinationDuFlash,
  ariaLabel,
  children,
}: SelectAutoSaveProps) {
  return (
    <div className="relative">
      <select
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className={cn(
          'w-full rounded-md border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors',
          aDestinationDuFlash ? 'border-emerald-400 bg-emerald-50' : 'border-input',
        )}
      >
        {children}
      </select>
      {aDestinationDuFlash && (
        <span
          aria-live="polite"
          className="pointer-events-none absolute -top-2 right-1 rounded-full bg-emerald-600 px-1.5 text-[10px] font-medium text-white"
        >
          ✓
        </span>
      )}
    </div>
  );
}

function AccesRefuse({ roleActif }: { roleActif: ReturnType<typeof useUserStore.getState>['roleActif'] }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
      <div className="flex items-start gap-3">
        <Lock className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-medium text-amber-900">
            Accès réservé à l'administration
          </h1>
          <p className="mt-2 text-sm text-amber-900/80">
            Vous êtes actuellement connecté·e en tant que{' '}
            <strong>{libelleRole(roleActif)}</strong>. La gestion des affectations
            est réservée aux rôles <strong>Coordinateur·rice</strong> et{' '}
            <strong>Administrateur·rice</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
