import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, CalendarRange, ChevronRight, GraduationCap, Search } from 'lucide-react';
import type { Apprenti, Formation, Livret } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { useApprentiActifStore } from '@/store/useApprentiActifStore';
import { useUtilisateursStore } from '@/store/useUtilisateursStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { libelleRole } from '@/lib/droits';
import {
  anneesFormationsDisponibles,
  apprentisAccessibles,
  filtrerApprentis,
  filtrerParAnneeFormation,
  grouperParFormation,
  trierApprentisParAnneePuisNom,
} from '@/lib/apprentis-accessibles';
import { calculerResumeLivret, classesBadgeCas, libelleCas } from '@/lib/etat-livret';
import { statsPilotage } from '@/lib/pilotage';
import type { AlerteTableauBord } from '@/lib/alertes';
import { cn } from '@/lib/utils';
import { SelecteurCoordoActif } from '@/components/common/SelecteurCoordoActif';
import { TableauBordApprenti } from '@/components/dashboard/TableauBordApprenti';
import { BandeauPilotage } from '@/components/dashboard/BandeauPilotage';
import { CentreAlertes } from '@/components/dashboard/CentreAlertes';

/**
 * Tableau de bord — point d'entrée par rôle.
 * Référence : cahier des charges v1.3, sections 10.1 et 10.3.
 *
 * Liste les apprenti·e·s accessibles selon le rôle actif (matrice §6) :
 *   - apprenti  : 1 carte (lui/elle-même)
 *   - maitre    : ses apprenti·e·s
 *   - formateur : sa promo
 *   - coordo    : les formations qu'il/elle gère
 *   - admin     : tous
 *
 * Un clic sur une carte sélectionne l'apprenti·e actif·ve et navigue vers le
 * livret. La recherche filtre par nom/prénom (insensible à la casse/accents).
 */
export function TableauDeBord() {
  const roleActif = useUserStore((s) => s.roleActif);
  const utilisateurActif = useUserStore((s) => s.utilisateurActif);
  const maitreActifId = useUserStore((s) => s.maitreActifId);
  const setMaitreActif = useUserStore((s) => s.setMaitreActif);
  const formateurActifId = useUserStore((s) => s.formateurActifId);
  const setFormateurActif = useUserStore((s) => s.setFormateurActif);
  const livrets = useLivretStore((s) => s.livrets);
  const setApprentiActif = useApprentiActifStore((s) => s.setApprentiActif);
  const apprentis = useUtilisateursStore((s) => s.apprentis);
  const maitres = useUtilisateursStore((s) => s.maitres);
  const formateurs = useUtilisateursStore((s) => s.formateurs);
  const formations = useFormationsStore((s) => s.formations);
  const navigate = useNavigate();
  const [requete, setRequete] = useState('');
  // Filtre par année académique de la formation (retours coordos juin 2026) —
  // utile dès que plusieurs promos coexistent (maître, formateur, coordo, admin).
  const [anneeFiltre, setAnneeFiltre] = useState<string>('toutes');

  const apprentisVisibles = useMemo(
    () =>
      trierApprentisParAnneePuisNom(
        apprentisAccessibles(utilisateurActif, Object.values(apprentis)),
        formations,
      ),
    [utilisateurActif, apprentis, formations],
  );
  const maitresList = useMemo(() => Object.values(maitres), [maitres]);
  const formateursList = useMemo(() => Object.values(formateurs), [formateurs]);
  const apprentisList = useMemo(() => Object.values(apprentis), [apprentis]);
  const annees = useMemo(
    () => anneesFormationsDisponibles(apprentisVisibles, formations),
    [apprentisVisibles, formations],
  );
  const apprentisFiltres = useMemo(
    () =>
      filtrerApprentis(
        filtrerParAnneeFormation(apprentisVisibles, formations, anneeFiltre),
        requete,
      ),
    [apprentisVisibles, formations, anneeFiltre, requete],
  );

  function ouvrirLivret(apprentiId: string) {
    setApprentiActif(apprentiId);
    navigate('/livret/organisation-suivi');
  }

  // Centre d'alertes (3 juillet 2026) : le clic active l'apprenti·e concerné·e
  // puis navigue directement vers la page où l'action est attendue.
  function ouvrirAlerte(alerte: AlerteTableauBord) {
    setApprentiActif(alerte.apprentiId);
    navigate(alerte.lien);
  }

  // Rôle apprenti·e : un seul livret (le sien) → récapitulatif personnel
  // détaillé (formation, échéances, progression) au lieu de la liste de
  // sélection, qui n'a pas de sens pour un·e apprenti·e seul·e sur son espace.
  if (roleActif === 'apprenti' && apprentisVisibles.length === 1) {
    const apprentiSeul = apprentisVisibles[0];
    const livretSeul = Object.values(livrets).find((l) => l.apprentiId === apprentiSeul.id);
    if (livretSeul) {
      return <TableauBordApprenti apprenti={apprentiSeul} livret={livretSeul} />;
    }
  }

  const ariaLabelChamp = 'Filtrer par nom ou prénom';

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d'accueil pour le rôle <strong>{libelleRole(roleActif)}</strong>.{' '}
          {apprentisVisibles.length === 0
            ? 'Aucun·e apprenti·e accessible avec ce rôle.'
            : apprentisVisibles.length === 1
              ? '1 apprenti·e accessible.'
              : `${apprentisVisibles.length} apprenti·e·s accessibles.`}
        </p>
      </header>

      {/* Sélecteur de maître d'apprentissage — visible uniquement en rôle maître.
          Permet de basculer entre les 2 maîtres (Karim BENALI / Hélène ROCHE)
          pour démontrer la valeur côté chaque entreprise. */}
      {roleActif === 'maitre' && (
        <fieldset className="rounded-lg border border-role-maitre/40 bg-role-maitre/5 p-3">
          <legend className="flex items-center gap-1.5 px-1.5 text-xs font-medium text-role-maitre">
            <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
            Maître / Tuteur actif
          </legend>
          <div className="flex flex-wrap gap-2">
            {maitresList.map((m) => {
              const actif = m.id === maitreActifId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMaitreActif(m.id)}
                  aria-pressed={actif}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    actif
                      ? 'border-role-maitre bg-role-maitre text-white'
                      : 'border-input bg-background hover:bg-secondary',
                  )}
                >
                  <span className="font-medium">
                    {m.prenom} {m.nom}
                  </span>
                  <span
                    className={cn('text-xs', actif ? 'text-white/85' : 'text-muted-foreground')}
                  >
                    · {m.apprentiIds.length} apprenti·e·s
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Sélecteur de formateur (3 juillet 2026) — même mécanique que le
          sélecteur de maître : chaque formateur ne voit que sa promo
          (Sophie DUBOIS ↔ Marc TISSIER). */}
      {roleActif === 'formateur' && formateursList.length > 1 && (
        <fieldset className="rounded-lg border border-role-formateur/40 bg-role-formateur/5 p-3">
          <legend className="flex items-center gap-1.5 px-1.5 text-xs font-medium text-role-formateur">
            <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
            Formateur·rice référent·e actif·ve
          </legend>
          <div className="flex flex-wrap gap-2">
            {formateursList.map((f) => {
              const actif = f.id === formateurActifId;
              const nbApprentis = apprentisAccessibles(f, apprentisList).length;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormateurActif(f.id)}
                  aria-pressed={actif}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    actif
                      ? 'border-role-formateur bg-role-formateur text-white'
                      : 'border-input bg-background hover:bg-secondary',
                  )}
                >
                  <span className="font-medium">
                    {f.prenom} {f.nom}
                  </span>
                  <span
                    className={cn('text-xs', actif ? 'text-white/85' : 'text-muted-foreground')}
                  >
                    · {nbApprentis} apprenti·e{nbApprentis > 1 ? 's' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Sélecteur de coordo — composant partagé (tableau de bord + pages
          d'administration filtrées par périmètre). Visible uniquement en rôle
          coordo, il démontre que chaque coordo ne voit que ses apprenti·e·s. */}
      <SelecteurCoordoActif />

      {/* Pilotage du périmètre (3 juillet 2026) — coordo / admin uniquement :
          KPI agrégés (fiches signées, entretiens, alertes R7). */}
      {(roleActif === 'coordo' || roleActif === 'admin') && (
        <BandeauPilotage apprentis={apprentisVisibles} livrets={livrets} formations={formations} />
      )}

      {/* Centre d'alertes (3 juillet 2026) — « qu'est-ce qui attend mon
          action ? », par rôle. L'apprenti·e a son récapitulatif dédié. */}
      {roleActif !== 'apprenti' && (
        <CentreAlertes
          role={roleActif}
          apprentis={apprentisVisibles}
          livrets={livrets}
          formations={formations}
          onOuvrir={ouvrirAlerte}
        />
      )}

      {apprentisVisibles.length > 1 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[14rem] max-w-md">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={requete}
              onChange={(e) => setRequete(e.target.value)}
              placeholder="Filtrer par nom ou prénom"
              aria-label={ariaLabelChamp}
              className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {/* Filtre par année de formation — les cartes sont par ailleurs
              triées promo la plus récente d'abord. */}
          <div className="relative">
            <CalendarRange
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <select
              value={anneeFiltre}
              onChange={(e) => setAnneeFiltre(e.target.value)}
              aria-label="Filtrer par année de formation"
              className="rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="toutes">Toutes les années</option>
              {annees.map((annee) => (
                <option key={annee} value={annee}>
                  {annee}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {apprentisFiltres.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
          {apprentisVisibles.length === 0
            ? "Aucun·e apprenti·e n'est rattaché·e à votre rôle dans cette démo."
            : 'Aucun·e apprenti·e ne correspond à votre recherche.'}
        </div>
      ) : roleActif === 'formateur' || roleActif === 'coordo' || roleActif === 'admin' ? (
        /* Regroupement par formation (1ᵉʳ juillet 2026 — réunion direction) :
           chaque formation est une section dépliable / repliable, ouverte par
           défaut. Le maître garde la grille plate (2-4 apprenti·e·s). */
        <div className="space-y-4">
          {grouperParFormation(apprentisFiltres, formations).map((groupe) => (
            <details
              key={groupe.formationId || 'sans-formation'}
              open
              data-testid={`groupe-formation-${groupe.formationId || 'aucune'}`}
              className="rounded-lg border border-border bg-card"
            >
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg p-4 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform [details[open]_&]:rotate-90"
                  aria-hidden="true"
                />
                <GraduationCap className="texte-couleur-role h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="font-medium">{groupe.libelle}</span>
                <span className="text-xs text-muted-foreground">
                  · {groupe.apprentis.length} apprenti·e{groupe.apprentis.length > 1 ? 's' : ''}
                </span>
                {/* Mini-pilotage par promo (3 juillet 2026) — coordo / admin. */}
                {(roleActif === 'coordo' || roleActif === 'admin') && (
                  <StatsGroupe
                    apprentis={groupe.apprentis}
                    livrets={livrets}
                    formations={formations}
                  />
                )}
              </summary>
              <div className="border-t border-border p-4">
                <GrilleApprentis
                  apprentis={groupe.apprentis}
                  livrets={livrets}
                  formations={formations}
                  onOuvrir={ouvrirLivret}
                />
              </div>
            </details>
          ))}
        </div>
      ) : (
        <GrilleApprentis
          apprentis={apprentisFiltres}
          livrets={livrets}
          formations={formations}
          onOuvrir={ouvrirLivret}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini-pilotage d'un groupe de formation (résumé dans l'en-tête de section).
// ─────────────────────────────────────────────────────────────────────────────

function StatsGroupe({
  apprentis,
  livrets,
  formations,
}: {
  apprentis: Apprenti[];
  livrets: Record<string, Livret>;
  formations: Record<string, Formation>;
}) {
  const stats = useMemo(
    () => statsPilotage(apprentis, livrets, formations),
    [apprentis, livrets, formations],
  );
  return (
    <span className="ml-auto flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
      <span className="hidden sm:inline">
        {stats.fichesEntreprise.signees}/{stats.fichesEntreprise.total} fiches ·{' '}
        {stats.entretiens.realises}/{stats.entretiens.attendus} entretiens
      </span>
      {stats.alertesR7 > 0 && (
        <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-medium text-amber-800">
          {stats.alertesR7} alerte{stats.alertesR7 > 1 ? 's' : ''} R7
        </span>
      )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Grille de cartes apprenti·e·s — partagée entre le rendu groupé par formation
// (formateur / coordo / admin) et la grille plate (maître).
// ─────────────────────────────────────────────────────────────────────────────

interface GrilleApprentisProps {
  apprentis: Apprenti[];
  livrets: Record<string, Livret>;
  formations: Record<string, Formation>;
  onOuvrir: (apprentiId: string) => void;
}

function GrilleApprentis({ apprentis, livrets, formations, onOuvrir }: GrilleApprentisProps) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {apprentis.map((apprenti) => {
        const livret = Object.values(livrets).find((l) => l.apprentiId === apprenti.id);
        const formation = formations[apprenti.formationId];
        const resume = livret ? calculerResumeLivret(apprenti, livret) : null;
        return (
          // min-w-0 : autorise la carte (item de grille, min-width:auto) à
          // rétrécir sous la largeur intrinsèque de sa ligne « formation
          // (année) · contrat » en nowrap — le truncate fait le reste.
          <li key={apprenti.id} className="min-w-0">
            <button
              type="button"
              onClick={() => onOuvrir(apprenti.id)}
              aria-label={`Ouvrir le livret de ${apprenti.prenom} ${apprenti.nom}`}
              className="carte-survol-role group flex h-full w-full flex-col gap-3 rounded-lg border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <GraduationCap
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="truncate font-medium">
                      {apprenti.prenom} {apprenti.nom}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {formation?.intitule ?? apprenti.formationId}
                    {formation?.annee ? ` (${formation.annee})` : ''}
                    {' · '}
                    contrat {apprenti.contratDebut} → {apprenti.contratFin}
                  </p>
                </div>
                <ChevronRight
                  className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </div>

              {resume && (
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                      classesBadgeCas(resume.cas),
                    )}
                  >
                    {libelleCas(resume.cas)}
                  </span>
                  {resume.nbFiches > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {resume.nbFichesSignees} / {resume.nbFiches} fiche
                      {resume.nbFiches > 1 ? 's' : ''} signée
                      {resume.nbFichesSignees > 1 ? 's' : ''}
                    </span>
                  )}
                  {resume.entretienComplet && (
                    <span className="text-xs text-muted-foreground">· entretien signé</span>
                  )}
                </div>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
