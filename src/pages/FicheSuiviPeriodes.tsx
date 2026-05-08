import { Link } from 'react-router-dom';
import { CalendarRange, ChevronRight } from 'lucide-react';
import { useLivretStore } from '@/store/useLivretStore';
import { livretLeaMartin } from '@/fixtures/livret-demo';
import { BadgeEtatFiche } from '@/components/common/BadgeEtatFiche';

/**
 * Liste des fiches de suivi par période.
 * Référence : cahier des charges v1.3, section 5.3.
 *
 * Sprint 2 : montre la liste des périodes avec leur état, dates, et un raccourci
 * vers le détail. Affiche le livret de Léa en démonstration (l'aiguillage par
 * apprenti·e viendra en sprint suivant quand on aura la liste complète).
 */
export function FicheSuiviPeriodes() {
  const livret = useLivretStore((s) => s.getLivret(livretLeaMartin.id));

  if (!livret) {
    return (
      <p className="text-muted-foreground">
        Aucun livret chargé. Réinitialisez les données de démonstration.
      </p>
    );
  }

  const fiches = [...livret.fichesSuivi].sort((a, b) => a.numeroPeriode - b.numeroPeriode);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Fiches de suivi par période</h1>
        <p className="text-muted-foreground">
          Co-édition tripartite des activités et compétences travaillées sur chaque période
          d'alternance.
        </p>
      </header>

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
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary/50 hover:bg-secondary/30 transition-colors"
              >
                <CalendarRange className="h-6 w-6 text-primary shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">Période {f.numeroPeriode}</h2>
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
    </div>
  );
}
