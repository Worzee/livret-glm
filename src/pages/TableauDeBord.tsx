import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ChevronRight, GraduationCap, Search } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { useApprentiActifStore } from '@/store/useApprentiActifStore';
import { useUtilisateursStore } from '@/store/useUtilisateursStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { libelleRole } from '@/lib/droits';
import {
  apprentisAccessibles,
  filtrerApprentis,
  trierApprentis,
} from '@/lib/apprentis-accessibles';
import {
  calculerResumeLivret,
  classesBadgeCas,
  libelleCas,
} from '@/lib/etat-livret';
import { cn } from '@/lib/utils';

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
  const livrets = useLivretStore((s) => s.livrets);
  const setApprentiActif = useApprentiActifStore((s) => s.setApprentiActif);
  const apprentis = useUtilisateursStore((s) => s.apprentis);
  const maitres = useUtilisateursStore((s) => s.maitres);
  const formations = useFormationsStore((s) => s.formations);
  const navigate = useNavigate();
  const [requete, setRequete] = useState('');

  const apprentisVisibles = useMemo(
    () => trierApprentis(apprentisAccessibles(utilisateurActif, Object.values(apprentis))),
    [utilisateurActif, apprentis],
  );
  const maitresList = useMemo(() => Object.values(maitres), [maitres]);
  const apprentisFiltres = useMemo(
    () => filtrerApprentis(apprentisVisibles, requete),
    [apprentisVisibles, requete],
  );

  function ouvrirLivret(apprentiId: string) {
    setApprentiActif(apprentiId);
    navigate('/livret/organisation-suivi');
  }

  const ariaLabelChamp = 'Filtrer par nom ou prénom';

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d'accueil pour le rôle <strong>{libelleRole(roleActif)}</strong>.
          {' '}
          {apprentisVisibles.length === 0
            ? "Aucun·e apprenti·e accessible avec ce rôle."
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
                    className={cn(
                      'text-xs',
                      actif ? 'text-white/85' : 'text-muted-foreground',
                    )}
                  >
                    · {m.apprentiIds.length} apprenti·e·s
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {apprentisVisibles.length > 1 && (
        <div className="relative max-w-md">
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
      )}

      {apprentisFiltres.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
          {apprentisVisibles.length === 0
            ? "Aucun·e apprenti·e n'est rattaché·e à votre rôle dans cette démo."
            : 'Aucun·e apprenti·e ne correspond à votre recherche.'}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {apprentisFiltres.map((apprenti) => {
            const livret = Object.values(livrets).find(
              (l) => l.apprentiId === apprenti.id,
            );
            const formation = formations[apprenti.formationId];
            const resume = livret ? calculerResumeLivret(apprenti, livret) : null;
            return (
              <li key={apprenti.id}>
                <button
                  type="button"
                  onClick={() => ouvrirLivret(apprenti.id)}
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
      )}
    </div>
  );
}
