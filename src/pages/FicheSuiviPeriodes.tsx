import { Link } from 'react-router-dom';
import { CalendarRange, ChevronRight, FolderOpen, Info, Lock } from 'lucide-react';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { libelleFichePeriode } from '@/lib/validation-fiche-periode';
import { nbPeriodesMasquees, periodesVisibles } from '@/lib/regles-periode';
import { BadgeEtatFiche } from '@/components/common/BadgeEtatFiche';
import { AucunApprentiSelectionne } from '@/components/common/AucunApprentiSelectionne';

/**
 * Liste des fiches de suivi par période — lecture seule sur l'identité.
 * Référence : cahier des charges v1.3 §5.3 + refonte mai 2026 (chantier #1).
 *
 * Le planning des périodes (nombre, titre, dates) est désormais défini au
 * niveau de la **formation** par le coordo / admin. Chaque apprenti·e de
 * la promo hérite automatiquement de ces périodes ; il n'y a plus de
 * création / modification / suppression individuelle par livret.
 *
 * Cette page reste le point d'entrée pour consulter une période donnée
 * (clic → page détail avec édition des contenus pédagogiques).
 */

export function FicheSuiviPeriodes() {
  const ctx = useApprentiActif();
  if (!ctx) return <AucunApprentiSelectionne />;
  const { apprenti, livret } = ctx;

  // Séquencement (16 juin 2026) : une période n'est visible que tant que la
  // précédente a été signée par les 3 parties — les suivantes restent masquées.
  const fiches = periodesVisibles(livret.fichesSuivi);
  const nbMasquees = nbPeriodesMasquees(livret.fichesSuivi);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Période en Entreprise</h1>
        <p className="text-muted-foreground">
          Co-édition tripartite des activités et compétences travaillées sur chaque période
          d'alternance en entreprise.
        </p>
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
            La formation de cet·te apprenti·e n'a pas encore de planning de périodes. Le
            coordinateur·rice peut le définir depuis <em>Administration → Formations</em>.
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

            return (
              <li key={f.id}>
                <Link
                  to={`/livret/fiches-suivi/${f.id}`}
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
                      {nbCompetences} compétence{nbCompetences > 1 ? 's' : ''} · {nbSignatures}/3
                      signatures
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
            : elles s'afficheront au fur et à mesure, dès que la période en cours aura été signée
            par les 3 parties.
          </p>
        </div>
      )}
    </div>
  );
}
