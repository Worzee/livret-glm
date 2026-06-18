import { Link } from 'react-router-dom';
import { CalendarRange, ChevronRight, FolderOpen, Info, Lock } from 'lucide-react';
import type { LieuFiche } from '@/types';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { libelleFichePeriode } from '@/lib/validation-fiche-periode';
import { nbPeriodesMasquees, periodesVisibles } from '@/lib/regles-periode';
import { nombreSignatures, SIGNATAIRES_PAR_LIEU } from '@/lib/transitions-fiche';
import { BadgeEtatFiche } from '@/components/common/BadgeEtatFiche';
import { AucunApprentiSelectionne } from '@/components/common/AucunApprentiSelectionne';

/**
 * Liste des fiches de suivi par période — lecture seule sur l'identité.
 * Référence : cahier des charges v1.3 §5.3 + refonte mai 2026 (chantier #1).
 *
 * Paramétrée par `lieu` (17 juin 2026) : la même page sert les périodes en
 * entreprise (`fichesSuivi`, signées par 3 parties) et en centre de formation
 * (`fichesSuiviCentre`, signées par l'apprenti·e + le formateur).
 *
 * Le planning des périodes (nombre, titre, dates) est défini au niveau de la
 * **formation** par le coordo / admin. Chaque apprenti·e de la promo en hérite
 * automatiquement ; pas de création / modification individuelle par livret.
 */

interface FicheSuiviPeriodesProps {
  lieu?: LieuFiche;
}

export function FicheSuiviPeriodes({ lieu = 'entreprise' }: FicheSuiviPeriodesProps) {
  const ctx = useApprentiActif();
  if (!ctx) return <AucunApprentiSelectionne />;
  const { apprenti, livret } = ctx;

  const estCentre = lieu === 'centre';
  const toutesFiches = estCentre ? livret.fichesSuiviCentre : livret.fichesSuivi;
  const basePath = estCentre ? '/livret/fiches-suivi-centre' : '/livret/fiches-suivi';
  const totalSignatures = SIGNATAIRES_PAR_LIEU[lieu].length;

  // Séquencement (16 juin 2026) : une période n'est visible que tant que la
  // précédente a été signée par toutes les parties attendues du lieu.
  const fiches = periodesVisibles(toutesFiches, lieu);
  const nbMasquees = nbPeriodesMasquees(toutesFiches, lieu);

  const titre = estCentre ? 'Période en Centre' : 'Période en Entreprise';
  const description = estCentre
    ? 'Compétences travaillées sur chaque période de regroupement au centre de formation, évaluées par le formateur référent.'
    : "Co-édition tripartite des activités et compétences travaillées sur chaque période d'alternance en entreprise.";
  const texteParties = estCentre
    ? "l'apprenti·e et le formateur référent"
    : 'les 3 parties';

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{titre}</h1>
        <p className="text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">
          Apprenti·e :{' '}
          <strong>
            {apprenti.prenom} {apprenti.nom}
          </strong>
        </p>
      </header>

      <div
        role="note"
        className="bandeau-info-couleur-role flex items-start gap-2 rounded-lg border p-3 text-xs"
      >
        <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          Le calendrier des périodes (nombre, titre, dates) est défini au niveau de la formation par
          le coordinateur·rice ou l'administrateur·rice. Tous les apprenti·e·s de la promotion
          partagent ce même planning. Les contenus pédagogiques (compétences, observations,
          signatures) restent propres à chaque livret.
        </p>
      </div>

      {fiches.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <FolderOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-base font-medium">Aucune période planifiée</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            La formation de cet·te apprenti·e n'a pas encore de planning de périodes
            {estCentre ? ' en centre' : ''}. Le coordinateur·rice peut le définir depuis{' '}
            <em>Administration → Formations</em>.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {fiches.map((f) => {
            const debut = new Date(f.dateDebut).toLocaleDateString('fr-FR');
            const fin = new Date(f.dateFin).toLocaleDateString('fr-FR');
            const nbCompetences = f.suiviEntreprise.length;
            const nbSignatures = nombreSignatures(f.signatures, lieu);

            return (
              <li key={f.id}>
                <Link
                  to={`${basePath}/${f.id}`}
                  className="carte-survol-role flex items-center gap-4 rounded-lg border p-4"
                >
                  <CalendarRange
                    className="texte-couleur-role h-6 w-6 shrink-0"
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{libelleFichePeriode(f)}</h2>
                      <BadgeEtatFiche etat={f.etat} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Du {debut} au {fin}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {nbCompetences} compétence{nbCompetences > 1 ? 's' : ''} · {nbSignatures}/
                      {totalSignatures} signatures
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* Séquencement : on annonce les périodes encore masquées sans dévoiler
          leur contenu — elles apparaîtront une fois la période courante signée. */}
      {nbMasquees > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <Lock className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            {nbMasquees === 1
              ? '1 période ultérieure est planifiée mais reste masquée'
              : `${nbMasquees} périodes ultérieures sont planifiées mais restent masquées`}{' '}
            : elles s'afficheront au fur et à mesure, dès que la période en cours aura été signée par{' '}
            {texteParties}.
          </p>
        </div>
      )}
    </div>
  );
}
