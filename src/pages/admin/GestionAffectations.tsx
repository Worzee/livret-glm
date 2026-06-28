import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  ClipboardList,
  GraduationCap,
  HardHat,
  Link2,
  Lock,
  LockOpen,
  Search,
  UserCog,
} from 'lucide-react';
import type { Apprenti, Livret } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useUtilisateursStore } from '@/store/useUtilisateursStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { useEntreprisesStore } from '@/store/useEntreprisesStore';
import { useLivretStore } from '@/store/useLivretStore';
import { libelleRole, peutEditer } from '@/lib/droits';
import {
  apprentisAccessibles,
  filtrerApprentis,
  trierApprentis,
} from '@/lib/apprentis-accessibles';
import { evaluerVerrouAffectation } from '@/lib/affectation-verrou';
import { SelecteurCoordoActif } from '@/components/common/SelecteurCoordoActif';
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
  const utilisateurActif = useUserStore((s) => s.utilisateurActif);
  const apprentis = useUtilisateursStore((s) => s.apprentis);
  const maitres = useUtilisateursStore((s) => s.maitres);
  const formateurs = useUtilisateursStore((s) => s.formateurs);
  const coordos = useUtilisateursStore((s) => s.coordos);
  const modifierApprenti = useUtilisateursStore((s) => s.modifierApprenti);
  const formations = useFormationsStore((s) => s.formations);
  const entreprises = useEntreprisesStore((s) => s.entreprises);
  const livrets = useLivretStore((s) => s.livrets);
  // Auteur des changements (traçabilité de l'historique d'entreprise).
  const auteur = {
    id: utilisateurActif.id,
    nom: `${utilisateurActif.prenom} ${utilisateurActif.nom}`,
    role: roleActif,
  };

  const [requete, setRequete] = useState('');
  const [filtreFormationId, setFiltreFormationId] = useState<string>('toutes');
  // Set d'apprenti·e·s « déverrouillé·e·s temporairement » par l'utilisateur·rice
  // pour corriger une erreur de saisie. Non persisté — re-verrou à chaque
  // ouverture de la page.
  const [deverrouillesTemp, setDeverrouillesTemp] = useState<Set<string>>(new Set());

  const liste = useMemo(() => {
    // Périmètre par rôle (juin 2026) : un coordo ne voit que les apprenti·e·s
    // que l'admin lui a affecté·e·s ; l'admin voit tout.
    let r = apprentisAccessibles(utilisateurActif, Object.values(apprentis));
    if (filtreFormationId !== 'toutes') {
      r = r.filter((a) => a.formationId === filtreFormationId);
    }
    if (requete.trim()) r = filtrerApprentis(r, requete);
    return trierApprentis(r);
  }, [utilisateurActif, apprentis, requete, filtreFormationId]);

  const formationsList = useMemo(() => Object.values(formations), [formations]);
  const maitresList = useMemo(() => Object.values(maitres), [maitres]);
  const formateursList = useMemo(() => Object.values(formateurs), [formateurs]);
  const coordosList = useMemo(() => Object.values(coordos), [coordos]);
  const entreprisesList = useMemo(() => Object.values(entreprises), [entreprises]);

  function basculerDeverrouTemp(apprentiId: string) {
    setDeverrouillesTemp((s) => {
      const next = new Set(s);
      if (next.has(apprentiId)) next.delete(apprentiId);
      else next.add(apprentiId);
      return next;
    });
  }

  // Vérification d'accès — placée après les hooks pour respecter rules-of-hooks.
  if (!peutEditer(roleActif, 'admin.affectations.gerer')) {
    return <AccesRefuse roleActif={roleActif} />;
  }

  // Compteur des apprenti·e·s dont les affectations sont verrouillées (livret actif).
  const nbVerrouilles = liste.filter((a) => {
    const livret = Object.values(livrets).find((l) => l.apprentiId === a.id);
    return livret ? evaluerVerrouAffectation(a, livret).verrouille : true;
  }).length;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 texte-couleur-role" aria-hidden="true" />
          <h1 className="text-2xl font-semibold">Gestion des affectations</h1>
        </div>
        <p className="text-muted-foreground">
          Association apprenti·e ↔ formation ↔ maître / tuteur ↔ formateur référent. Les
          modifications sont enregistrées immédiatement.
        </p>
      </header>

      {/* Bascule de périmètre (démo) : en rôle coordo, change le coordo dont
          on voit les apprenti·e·s — sans devoir repasser par le tableau de bord. */}
      <SelecteurCoordoActif />

      {nbVerrouilles > 0 && (
        <div className="bandeau-info-couleur-role rounded-md border p-3 text-sm">
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong>
                {nbVerrouilles} apprenti·e{nbVerrouilles > 1 ? 's' : ''} verrouillé·e
                {nbVerrouilles > 1 ? 's' : ''} par défaut.
              </strong>{' '}
              Les affectations sont protégées dès que le contrat a démarré, qu'une fiche de période
              existe ou que l'entretien tripartite est initialisé — pour éviter d'effacer du travail
              en cours. Utilisez <em>Déverrouiller</em> sur une ligne pour corriger une erreur de
              saisie initiale (le verrou se réactive à la prochaine ouverture).
            </div>
          </div>
        </div>
      )}

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
        <>
          {/* Indicateur de scroll horizontal — affiché uniquement sur mobile,
              le tableau a 6 colonnes denses (selects, sticky first col). */}
          <p className="md:hidden text-xs italic text-muted-foreground">
            ← Faites défiler horizontalement pour voir toutes les colonnes →
          </p>
          <div className="rounded-lg border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm min-w-[42rem]">
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
                      Maître / Tuteur
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
                      <ClipboardList className="h-3.5 w-3.5 text-role-coordo" aria-hidden="true" />
                      Coordinateur·rice
                    </span>
                  </th>
                  <th className="px-4 py-2 text-left">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Entreprise
                    </span>
                  </th>
                  <th className="px-4 py-2 text-right">État</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {liste.map((a) => {
                  const livret = Object.values(livrets).find((l) => l.apprentiId === a.id);
                  return (
                    <LigneAffectation
                      key={a.id}
                      apprenti={a}
                      livret={livret}
                      formations={formationsList}
                      maitres={maitresList}
                      formateurs={formateursList}
                      coordos={coordosList}
                      coordoEditable={roleActif === 'admin'}
                      entreprises={entreprisesList}
                      deverrouilleTemp={deverrouillesTemp.has(a.id)}
                      onBasculerVerrou={() => basculerDeverrouTemp(a.id)}
                      onChange={(patch) => modifierApprenti(a.id, patch, auteur)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ligne d'affectation — selects auto-save par champ
// ─────────────────────────────────────────────────────────────────────────────

interface LigneAffectationProps {
  apprenti: Apprenti;
  livret: Livret | undefined;
  formations: Array<{ id: string; intitule: string; annee: string }>;
  maitres: Array<{ id: string; prenom: string; nom: string; entreprise: string }>;
  formateurs: Array<{ id: string; prenom: string; nom: string }>;
  coordos: Array<{ id: string; prenom: string; nom: string }>;
  entreprises: Array<{ id: string; raisonSociale: string }>;
  /**
   * L'affectation apprenti ↔ coordo est réservée à l'admin (juin 2026) :
   * le coordo voit la colonne en lecture seule.
   */
  coordoEditable: boolean;
  deverrouilleTemp: boolean;
  onBasculerVerrou: () => void;
  onChange: (patch: Partial<Apprenti>) => void;
}

function LigneAffectation({
  apprenti,
  livret,
  formations,
  maitres,
  formateurs,
  coordos,
  entreprises,
  coordoEditable,
  deverrouilleTemp,
  onBasculerVerrou,
  onChange,
}: LigneAffectationProps) {
  const [champFlash, setChampFlash] = useState<string | null>(null);
  // Confirmation 2 clics pour le bouton « Déverrouiller temporairement ».
  const [confirmationDeverrou, setConfirmationDeverrou] = useState(false);

  // Auto-annulation 10 s de la confirmation (cohérent avec les autres patterns).
  useEffect(() => {
    if (!confirmationDeverrou) return;
    const t = setTimeout(() => setConfirmationDeverrou(false), 10_000);
    return () => clearTimeout(t);
  }, [confirmationDeverrou]);

  // Évalue le verrou (livret manquant = traité comme verrouillé pour rester sûr).
  const verrou = livret
    ? evaluerVerrouAffectation(apprenti, livret)
    : { verrouille: true, raison: 'Livret indisponible.' };
  const editable = !verrou.verrouille || deverrouilleTemp;

  function patcher(patch: Partial<Apprenti>, champ: string) {
    onChange(patch);
    setChampFlash(champ);
    setTimeout(() => setChampFlash((c) => (c === champ ? null : c)), 1500);
  }

  // L'entreprise est un choix indépendant (colonne dédiée) — changer le maître
  // ne la modifie plus (juin 2026, cohérent avec la modale apprenti·e).
  function changerMaitre(nouveauId: string) {
    patcher({ maitreApprentissageId: nouveauId }, 'maitre');
  }

  // Second maître optionnel (juin 2026) — '' = aucun. L'entreprise de
  // référence reste celle du principal.
  function changerMaitreSecond(nouveauId: string) {
    patcher({ maitreApprentissageSecondId: nouveauId || undefined }, 'maitre-second');
  }

  function declencherDeverrou() {
    if (confirmationDeverrou) {
      onBasculerVerrou();
      setConfirmationDeverrou(false);
    } else {
      setConfirmationDeverrou(true);
    }
  }

  return (
    <tr className={cn(verrou.verrouille && !deverrouilleTemp && 'bg-blue-50/40')}>
      <td className="px-4 py-2 font-medium whitespace-nowrap">
        {apprenti.prenom} {apprenti.nom}
      </td>
      <td className="px-2 py-2">
        <SelectAutoSave
          valeur={apprenti.formationId}
          onChange={(v) => patcher({ formationId: v }, 'formation')}
          aDestinationDuFlash={champFlash === 'formation'}
          desactive={!editable}
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
        <div className="space-y-1.5">
          <SelectAutoSave
            valeur={apprenti.maitreApprentissageId}
            onChange={changerMaitre}
            aDestinationDuFlash={champFlash === 'maitre'}
            desactive={!editable}
            ariaLabel={`Maître / Tuteur de ${apprenti.prenom} ${apprenti.nom}`}
          >
            {maitres
              .filter((m) => m.id !== apprenti.maitreApprentissageSecondId)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.prenom} {m.nom}
                </option>
              ))}
          </SelectAutoSave>
          <SelectAutoSave
            valeur={apprenti.maitreApprentissageSecondId ?? ''}
            onChange={changerMaitreSecond}
            aDestinationDuFlash={champFlash === 'maitre-second'}
            desactive={!editable}
            ariaLabel={`Second maître / tuteur de ${apprenti.prenom} ${apprenti.nom}`}
          >
            <option value="">— Second (optionnel) —</option>
            {maitres
              .filter((m) => m.id !== apprenti.maitreApprentissageId)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.prenom} {m.nom}
                </option>
              ))}
          </SelectAutoSave>
        </div>
      </td>
      <td className="px-2 py-2">
        <SelectAutoSave
          valeur={apprenti.formateurReferentId}
          onChange={(v) => patcher({ formateurReferentId: v }, 'formateur')}
          aDestinationDuFlash={champFlash === 'formateur'}
          desactive={!editable}
          ariaLabel={`Formateur référent de ${apprenti.prenom} ${apprenti.nom}`}
        >
          {formateurs.map((f) => (
            <option key={f.id} value={f.id}>
              {f.prenom} {f.nom}
            </option>
          ))}
        </SelectAutoSave>
      </td>
      <td className="px-2 py-2">
        {coordoEditable ? (
          // Hors verrou volontairement : la répartition entre coordos est une
          // réorganisation administrative qui ne touche aucune donnée
          // pédagogique — l'admin doit pouvoir répartir sans déverrouiller.
          <SelectAutoSave
            valeur={apprenti.coordoId ?? ''}
            onChange={(v) => patcher({ coordoId: v || undefined }, 'coordo')}
            aDestinationDuFlash={champFlash === 'coordo'}
            ariaLabel={`Coordinateur·rice de ${apprenti.prenom} ${apprenti.nom}`}
          >
            <option value="">— Aucun·e —</option>
            {coordos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.prenom} {c.nom}
              </option>
            ))}
          </SelectAutoSave>
        ) : (
          <span className="text-xs text-muted-foreground">
            {(() => {
              const c = coordos.find((cc) => cc.id === apprenti.coordoId);
              return c ? `${c.prenom} ${c.nom}` : '—';
            })()}
          </span>
        )}
      </td>
      <td className="px-2 py-2">
        <SelectAutoSave
          valeur={apprenti.entrepriseId}
          onChange={(v) => patcher({ entrepriseId: v }, 'entreprise')}
          aDestinationDuFlash={champFlash === 'entreprise'}
          desactive={!editable}
          ariaLabel={`Entreprise d'accueil de ${apprenti.prenom} ${apprenti.nom}`}
        >
          {entreprises.map((e) => (
            <option key={e.id} value={e.id}>
              {e.raisonSociale}
            </option>
          ))}
        </SelectAutoSave>
      </td>
      <td className="px-2 py-2 text-right">
        {verrou.verrouille && !deverrouilleTemp && (
          <div className="inline-flex flex-col items-end gap-1">
            <span
              className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-900"
              title={verrou.raison}
            >
              <Lock className="h-3 w-3" aria-hidden="true" />
              Verrouillées
            </span>
            <button
              type="button"
              onClick={declencherDeverrou}
              aria-label={
                confirmationDeverrou
                  ? `Confirmer le déverrouillage temporaire de ${apprenti.prenom} ${apprenti.nom}`
                  : `Déverrouiller temporairement les affectations de ${apprenti.prenom} ${apprenti.nom}`
              }
              title={verrou.raison}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors',
                confirmationDeverrou
                  ? 'border-amber-400 bg-amber-500 text-white hover:bg-amber-600'
                  : 'border-input bg-background text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <LockOpen className="h-3 w-3" aria-hidden="true" />
              {confirmationDeverrou ? 'Confirmer' : 'Déverrouiller'}
            </button>
          </div>
        )}
        {deverrouilleTemp && (
          <div className="inline-flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400 bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900">
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              Déverrouillées
            </span>
            <button
              type="button"
              onClick={onBasculerVerrou}
              aria-label={`Re-verrouiller les affectations de ${apprenti.prenom} ${apprenti.nom}`}
              className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Lock className="h-3 w-3" aria-hidden="true" />
              Re-verrouiller
            </button>
          </div>
        )}
        {!verrou.verrouille && !deverrouilleTemp && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-900">
            <LockOpen className="h-3 w-3" aria-hidden="true" />
            Modifiables
          </span>
        )}
      </td>
    </tr>
  );
}

interface SelectAutoSaveProps {
  valeur: string;
  onChange: (v: string) => void;
  aDestinationDuFlash: boolean;
  desactive?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}

function SelectAutoSave({
  valeur,
  onChange,
  aDestinationDuFlash,
  desactive,
  ariaLabel,
  children,
}: SelectAutoSaveProps) {
  return (
    <div className="relative">
      <select
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        disabled={desactive}
        aria-label={ariaLabel}
        className={cn(
          'w-full rounded-md border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors',
          aDestinationDuFlash && 'border-emerald-400 bg-emerald-50',
          !aDestinationDuFlash &&
            desactive &&
            'border-input bg-muted/40 text-muted-foreground cursor-not-allowed',
          !aDestinationDuFlash && !desactive && 'border-input',
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

function AccesRefuse({
  roleActif,
}: {
  roleActif: ReturnType<typeof useUserStore.getState>['roleActif'];
}) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
      <div className="flex items-start gap-3">
        <Lock className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-medium text-amber-900">Accès réservé à l'administration</h1>
          <p className="mt-2 text-sm text-amber-900/80">
            Vous êtes actuellement connecté·e en tant que <strong>{libelleRole(roleActif)}</strong>.
            La gestion des affectations est réservée aux rôles <strong>Coordinateur·rice</strong> et{' '}
            <strong>Administrateur·rice</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
