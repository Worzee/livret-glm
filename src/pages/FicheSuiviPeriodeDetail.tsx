import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, History, Lock, Unlock } from 'lucide-react';
import { useLivretStore } from '@/store/useLivretStore';
import { useUserStore } from '@/store/useUserStore';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { peutEditer, libelleRole } from '@/lib/droits';
import { libelleFichePeriode } from '@/lib/validation-fiche-periode';
import { AucunApprentiSelectionne } from '@/components/common/AucunApprentiSelectionne';
import { BadgeEtatFiche } from '@/components/common/BadgeEtatFiche';
import { SuiviGretaCfa } from '@/components/livret/SuiviGretaCfa';
import { TableauTriColonnes } from '@/components/livret/TableauTriColonnes';
import { ZoneObservation } from '@/components/livret/ZoneObservation';
import { BlocSignatures } from '@/components/livret/BlocSignatures';
import { DialogDeverrouillage } from '@/components/livret/DialogDeverrouillage';
import { NotFound } from '@/pages/NotFound';

/**
 * Page de détail d'une fiche de suivi par période.
 * Référence : cahier des charges v1.3, section 5.3.
 *
 * Composition :
 *   - en-tête (numéro, dates, état, fil d'Ariane)
 *   - SuiviGretaCfa
 *   - TableauTriColonnes (cœur de la co-édition)
 *   - ZoneObservation (3 zones)
 *   - BlocSignatures (3 signatures)
 *   - actions de verrouillage / déverrouillage R10 (formateur seul)
 *   - historique des déverrouillages (R10 traçabilité)
 */
export function FicheSuiviPeriodeDetail() {
  const { ficheId } = useParams();
  const ctx = useApprentiActif();
  const setEtat = useLivretStore((s) => s.setEtatFiche);
  const deverrouiller = useLivretStore((s) => s.deverrouillerFiche);
  const roleActif = useUserStore((s) => s.roleActif);
  const utilisateurActif = useUserStore((s) => s.utilisateurActif);
  const [dialogOuvert, setDialogOuvert] = useState(false);

  if (!ctx) return <AucunApprentiSelectionne />;
  const { livret } = ctx;
  const fiche = livret.fichesSuivi.find((f) => f.id === ficheId);
  if (!fiche) return <NotFound />;

  const peutVerrouiller = peutEditer(roleActif, 'fiche.deverrouiller');
  const debut = new Date(fiche.dateDebut).toLocaleDateString('fr-FR');
  const fin = new Date(fiche.dateFin).toLocaleDateString('fr-FR');

  return (
    <div className="space-y-6">
      <nav aria-label="Fil d'Ariane" className="text-xs text-muted-foreground">
        <Link to="/livret/fiches-suivi" className="hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" aria-hidden="true" />
          Toutes les fiches de suivi
        </Link>
      </nav>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{libelleFichePeriode(fiche)}</h1>
          <BadgeEtatFiche etat={fiche.etat} />
        </div>
        <p className="text-muted-foreground">
          Du {debut} au {fin}
        </p>
      </header>

      {/* Bandeau de verrouillage / actions formateur */}
      {peutVerrouiller && fiche.etat === 'signee' && (
        <div className="bandeau-info-couleur-role flex items-center justify-between gap-4 rounded-md border p-3">
          <p className="text-sm">
            La fiche est <strong>signée</strong> par les trois parties. Vous pouvez la verrouiller
            pour archiver la période.
          </p>
          <button
            type="button"
            onClick={() => setEtat(livret.id, fiche.id, 'verrouillee')}
            className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--ring))] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            <Lock className="h-4 w-4" aria-hidden="true" />
            Verrouiller
          </button>
        </div>
      )}
      {peutVerrouiller && fiche.etat === 'verrouillee' && (
        <div className="flex items-center justify-between gap-4 rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm text-amber-900">
            La fiche est <strong>verrouillée</strong>. Le déverrouillage invalide les trois
            signatures et requiert un motif tracé (R10).
          </p>
          <button
            type="button"
            onClick={() => setDialogOuvert(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
          >
            <Unlock className="h-4 w-4" aria-hidden="true" />
            Déverrouiller…
          </button>
        </div>
      )}

      <SuiviGretaCfa livretId={livret.id} fiche={fiche} />
      <TableauTriColonnes livretId={livret.id} fiche={fiche} />
      <ZoneObservation livretId={livret.id} fiche={fiche} />
      <BlocSignatures livretId={livret.id} fiche={fiche} />

      {/* Historique des déverrouillages (R10 — traçabilité) */}
      {fiche.historiqueDeverrouillages.length > 0 && (
        <section
          aria-labelledby={`hist-deverr-${fiche.id}`}
          className="space-y-2 rounded-lg border-l-4 border-l-amber-500 border border-amber-300 bg-amber-50 p-4"
        >
          <h2
            id={`hist-deverr-${fiche.id}`}
            className="flex items-center gap-2 text-sm font-semibold text-amber-900"
          >
            <History className="h-4 w-4 text-amber-700" aria-hidden="true" />
            Historique des déverrouillages
            <span className="ml-auto text-xs font-normal text-amber-800">
              R10 · traçabilité
            </span>
          </h2>
          <ul className="space-y-2 text-sm">
            {[...fiche.historiqueDeverrouillages]
              .reverse()
              .map((entree) => (
                <li
                  key={entree.id}
                  className="rounded-md border border-amber-200 bg-white p-3"
                >
                  <p className="text-xs text-amber-900/80">
                    {new Date(entree.dateIso).toLocaleString('fr-FR', {
                      dateStyle: 'long',
                      timeStyle: 'short',
                    })}{' '}
                    — {entree.auteurNom} ({libelleRole(entree.auteurRole)})
                  </p>
                  <p className="mt-1 text-amber-950">{entree.motif}</p>
                </li>
              ))}
          </ul>
        </section>
      )}

      <DialogDeverrouillage
        ouvert={dialogOuvert}
        numeroPeriode={fiche.numeroPeriode}
        onAnnuler={() => setDialogOuvert(false)}
        onConfirmer={(motif) => {
          deverrouiller(
            livret.id,
            fiche.id,
            utilisateurActif.id,
            `${utilisateurActif.prenom} ${utilisateurActif.nom}`,
            roleActif,
            motif,
          );
          setDialogOuvert(false);
        }}
      />
    </div>
  );
}
