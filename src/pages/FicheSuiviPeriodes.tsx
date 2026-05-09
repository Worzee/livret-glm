import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarRange,
  ChevronRight,
  FolderOpen,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import type { FicheSuiviPeriode } from '@/types';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { peutEditer } from '@/lib/droits';
import {
  libelleFichePeriode,
  peutSupprimerFichePeriode,
} from '@/lib/validation-fiche-periode';
import { BadgeEtatFiche } from '@/components/common/BadgeEtatFiche';
import { AucunApprentiSelectionne } from '@/components/common/AucunApprentiSelectionne';
import { ModaleFichePeriode } from '@/components/livret/ModaleFichePeriode';
import { cn } from '@/lib/utils';

/**
 * Liste des fiches de suivi par période.
 * Référence : cahier des charges v1.3, section 5.3.
 *
 * Le formateur référent et le coordo peuvent **créer**, **renommer**
 * (titre custom) et **supprimer** des périodes (matrice §6 : ressources
 * `fiche.creer-periode`, `fiche.modifier-periode`, `fiche.supprimer-periode`).
 */

export function FicheSuiviPeriodes() {
  const ctx = useApprentiActif();
  const roleActif = useUserStore((s) => s.roleActif);
  const supprimerFiche = useLivretStore((s) => s.supprimerFichePeriode);

  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [ficheEnEdition, setFicheEnEdition] = useState<FicheSuiviPeriode | undefined>();
  const [confirmationSuppression, setConfirmationSuppression] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmationSuppression) return;
    const t = setTimeout(() => setConfirmationSuppression(null), 10_000);
    return () => clearTimeout(t);
  }, [confirmationSuppression]);

  if (!ctx) return <AucunApprentiSelectionne />;
  const { apprenti, livret } = ctx;

  const peutCreer = peutEditer(roleActif, 'fiche.creer-periode');
  const peutModifier = peutEditer(roleActif, 'fiche.modifier-periode');
  const peutSupprimer = peutEditer(roleActif, 'fiche.supprimer-periode');

  const fiches = [...livret.fichesSuivi].sort((a, b) => a.numeroPeriode - b.numeroPeriode);

  function ouvrirCreation() {
    setFicheEnEdition(undefined);
    setModaleOuverte(true);
  }
  function ouvrirEdition(f: FicheSuiviPeriode) {
    setFicheEnEdition(f);
    setModaleOuverte(true);
  }
  function declencherSuppression(f: FicheSuiviPeriode) {
    if (confirmationSuppression !== f.id) {
      setConfirmationSuppression(f.id);
      return;
    }
    supprimerFiche(livret.id, f.id);
    setConfirmationSuppression(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Fiches de suivi par période</h1>
          <p className="text-muted-foreground">
            Co-édition tripartite des activités et compétences travaillées sur chaque période
            d'alternance.
          </p>
          <p className="text-xs text-muted-foreground">
            Apprenti·e : <strong>{apprenti.prenom} {apprenti.nom}</strong>
          </p>
        </div>
        {peutCreer && (
          <button
            type="button"
            onClick={ouvrirCreation}
            data-testid="btn-nouvelle-periode"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouvelle période
          </button>
        )}
      </header>

      {fiches.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <FolderOpen
            className="mx-auto mb-3 h-8 w-8 text-muted-foreground"
            aria-hidden="true"
          />
          <h2 className="text-base font-medium">Aucune période créée</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {peutCreer
              ? 'Cliquez sur « Nouvelle période » pour créer la première fiche de suivi.'
              : "Aucune fiche de suivi n'a encore été créée pour cet·te apprenti·e."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {fiches.map((f) => {
            const debut = new Date(f.dateDebut).toLocaleDateString('fr-FR');
            const fin = new Date(f.dateFin).toLocaleDateString('fr-FR');
            const nbCompetences = f.suiviEntreprise.length;
            const nbSignatures =
              (f.signatures.apprenti.signe ? 1 : 0) +
              (f.signatures.maitre.signe ? 1 : 0) +
              (f.signatures.formateur.signe ? 1 : 0);
            const enConfirmation = confirmationSuppression === f.id;
            const blocageSuppression = peutSupprimerFichePeriode(f);

            return (
              <li key={f.id}>
                <div
                  className={cn(
                    'flex items-stretch gap-2 rounded-lg border bg-card transition-colors',
                    enConfirmation ? 'border-red-300 bg-red-50/40' : 'border-border',
                  )}
                >
                  <Link
                    to={`/livret/fiches-suivi/${f.id}`}
                    className="flex flex-1 items-center gap-4 rounded-lg p-4 hover:border-primary/50 hover:bg-secondary/30 transition-colors"
                  >
                    <CalendarRange className="h-6 w-6 text-primary shrink-0" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">{libelleFichePeriode(f)}</h2>
                        <BadgeEtatFiche etat={f.etat} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Du {debut} au {fin}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {nbCompetences} compétence{nbCompetences > 1 ? 's' : ''} · {nbSignatures}/3
                        signatures
                      </p>
                    </div>
                    <ChevronRight
                      className="h-5 w-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </Link>

                  {(peutModifier || peutSupprimer) && (
                    <div className="flex flex-col items-center justify-center gap-1 px-2 py-2">
                      {peutModifier && (
                        <button
                          type="button"
                          onClick={() => ouvrirEdition(f)}
                          aria-label={`Modifier ${libelleFichePeriode(f)}`}
                          className="rounded-md border border-input bg-background p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      )}
                      {peutSupprimer && (
                        <button
                          type="button"
                          disabled={!blocageSuppression.peut}
                          onClick={() => declencherSuppression(f)}
                          aria-label={
                            enConfirmation
                              ? `Confirmer la suppression de ${libelleFichePeriode(f)}`
                              : `Supprimer ${libelleFichePeriode(f)}`
                          }
                          title={blocageSuppression.raison}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md p-1.5 transition-colors',
                            enConfirmation
                              ? 'border border-red-300 bg-red-600 text-white hover:bg-red-700'
                              : 'border border-input bg-background text-muted-foreground hover:bg-secondary hover:text-foreground',
                            !blocageSuppression.peut &&
                              'opacity-40 cursor-not-allowed hover:bg-background',
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          {enConfirmation && (
                            <span className="text-xs font-medium">Confirmer</span>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {!blocageSuppression.peut && peutSupprimer && (
                  <p className="ml-2 mt-1 text-[10px] italic text-amber-700">
                    {blocageSuppression.raison}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ModaleFichePeriode
        // `key` distincte → remount frais à chaque ouverture (cohérent
        // avec ModaleFormation / ModaleApprenti, évite la persistance
        // du state local entre deux ouvertures consécutives).
        key={modaleOuverte ? ficheEnEdition?.id ?? 'creation' : 'fermee'}
        ouvert={modaleOuverte}
        livretId={livret.id}
        fiche={ficheEnEdition}
        fichesExistantes={livret.fichesSuivi}
        entretienExiste={livret.entretienTripartite !== null}
        onAnnuler={() => {
          setModaleOuverte(false);
          setFicheEnEdition(undefined);
        }}
      />
    </div>
  );
}
