import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, History, Lock, Unlock } from 'lucide-react';
import type { LieuFiche } from '@/types';
import { useLivretStore } from '@/store/useLivretStore';
import { useUserStore } from '@/store/useUserStore';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { peutEditer, libelleRole, peutContournerSequencement } from '@/lib/droits';
import { libelleFichePeriode } from '@/lib/validation-fiche-periode';
import { estPeriodeVisible } from '@/lib/regles-periode';
import { AucunApprentiSelectionne } from '@/components/common/AucunApprentiSelectionne';
import { BadgeEtatFiche } from '@/components/common/BadgeEtatFiche';
import { SuiviGretaCfa } from '@/components/livret/SuiviGretaCfa';
import { TableauTriColonnes } from '@/components/livret/TableauTriColonnes';
import { ZoneObservation } from '@/components/livret/ZoneObservation';
import { BlocSignatures } from '@/components/livret/BlocSignatures';
import { DialogDeverrouillage } from '@/components/livret/DialogDeverrouillage';
import { BoutonExportPdf } from '@/components/pdf/BoutonExportPdf';
import { useDonneesLivretPdf } from '@/components/pdf/useDonneesLivretPdf';
import { NotFound } from '@/pages/NotFound';

/**
 * Page de détail d'une fiche de suivi par période.
 * Référence : cahier des charges v1.3, section 5.3.
 *
 * Paramétrée par `lieu` (17 juin 2026) : entreprise (`fichesSuivi`, signatures
 * 3 parties) ou centre de formation (`fichesSuiviCentre`, signatures
 * apprenti·e + formateur). Les composants enfants reçoivent le lieu pour cibler
 * la bonne collection et la bonne colonne d'évaluation.
 */
interface FicheSuiviPeriodeDetailProps {
  lieu?: LieuFiche;
}

export function FicheSuiviPeriodeDetail({ lieu = 'entreprise' }: FicheSuiviPeriodeDetailProps) {
  const { ficheId } = useParams();
  const ctx = useApprentiActif();
  const setEtat = useLivretStore((s) => s.setEtatFiche);
  const deverrouiller = useLivretStore((s) => s.deverrouillerFiche);
  const roleActif = useUserStore((s) => s.roleActif);
  const utilisateurActif = useUserStore((s) => s.utilisateurActif);
  const donneesPdf = useDonneesLivretPdf();
  const [dialogOuvert, setDialogOuvert] = useState(false);

  if (!ctx) return <AucunApprentiSelectionne />;
  const { livret } = ctx;
  const estCentre = lieu === 'centre';
  const toutesFiches = estCentre ? livret.fichesSuiviCentre : livret.fichesSuivi;
  const basePath = estCentre ? '/livret/fiches-suivi-centre' : '/livret/fiches-suivi';
  const fiche = toutesFiches.find((f) => f.id === ficheId);
  if (!fiche) return <NotFound />;

  const partiesPhrase = estCentre
    ? "l'apprenti·e et le formateur·rice référent·e"
    : 'apprenti·e, maître / tuteur et formateur·rice référent·e';
  const partiesCourt = estCentre ? 'les deux parties' : 'les trois parties';

  // Séquencement (16 juin 2026) : la période n'est accessible que si la
  // précédente est signée par toutes les parties — garde l'accès par URL
  // directe. Le coordo / admin (supervision) y accèdent toujours (18 juin 2026).
  if (!estPeriodeVisible(toutesFiches, fiche.id, lieu, peutContournerSequencement(roleActif))) {
    return (
      <div className="space-y-6">
        <nav aria-label="Fil d'Ariane" className="text-xs text-muted-foreground">
          <Link to={basePath} className="hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            Toutes les fiches de suivi
          </Link>
        </nav>
        <div className="space-y-3 rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <Lock className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <h1 className="text-lg font-medium">Période non accessible</h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            La période {fiche.numeroPeriode} n'est pas encore accessible : la période précédente
            doit d'abord être signée par {partiesPhrase}.
          </p>
        </div>
      </div>
    );
  }

  const peutVerrouiller = peutEditer(roleActif, 'fiche.deverrouiller');
  const debut = new Date(fiche.dateDebut).toLocaleDateString('fr-FR');
  const fin = new Date(fiche.dateFin).toLocaleDateString('fr-FR');

  return (
    <div className="space-y-6">
      <nav aria-label="Fil d'Ariane" className="text-xs text-muted-foreground">
        <Link to={basePath} className="hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" aria-hidden="true" />
          Toutes les fiches de suivi
        </Link>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{libelleFichePeriode(fiche)}</h1>
            <BadgeEtatFiche etat={fiche.etat} />
          </div>
          <p className="text-muted-foreground">
            Du {debut} au {fin}
          </p>
        </div>
        {/* Export PDF de la période (variante selon le lieu). */}
        {donneesPdf && (
          <BoutonExportPdf
            {...donneesPdf}
            variante={{ type: estCentre ? 'periode-centre' : 'periode', ficheId: fiche.id }}
            label="Exporter cette période"
          />
        )}
      </header>

      {/* Bandeau de verrouillage / actions formateur */}
      {peutVerrouiller && fiche.etat === 'signee' && (
        <div className="bandeau-info-couleur-role flex items-center justify-between gap-4 rounded-md border p-3">
          <p className="text-sm">
            La fiche est <strong>signée</strong> par {partiesCourt}. Vous pouvez la verrouiller pour
            archiver la période.
          </p>
          <button
            type="button"
            onClick={() => setEtat(livret.id, fiche.id, 'verrouillee', lieu)}
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
            La fiche est <strong>verrouillée</strong>. Le déverrouillage invalide les signatures et
            requiert un motif tracé (R10).
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

      <SuiviGretaCfa livretId={livret.id} fiche={fiche} lieu={lieu} />
      <TableauTriColonnes livretId={livret.id} fiche={fiche} lieu={lieu} />
      <ZoneObservation livretId={livret.id} fiche={fiche} lieu={lieu} />
      <BlocSignatures livretId={livret.id} fiche={fiche} lieu={lieu} />

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
            <span className="ml-auto text-xs font-normal text-amber-800">R10 · traçabilité</span>
          </h2>
          <ul className="space-y-2 text-sm">
            {[...fiche.historiqueDeverrouillages].reverse().map((entree) => (
              <li key={entree.id} className="rounded-md border border-amber-200 bg-white p-3">
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
            lieu,
          );
          setDialogOuvert(false);
        }}
      />
    </div>
  );
}
