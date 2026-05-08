import type { Apprenti, EntretienTripartite, Formation } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { peutEditer } from '@/lib/droits';
import {
  formatriceSophieDubois,
  maitreKarimBenali,
} from '@/fixtures/utilisateurs';

/**
 * En-tête pré-rempli de l'entretien tripartite (CDC §5.2).
 * Le formateur peut modifier la date de l'entretien ; le reste est dérivé
 * du profil apprenti·e (lecture seule pour tous les rôles).
 */

interface EntretienHeaderProps {
  livretId: string;
  apprenti: Apprenti;
  formation: Formation;
  entretien: EntretienTripartite;
  /** Modification interdite si verrouillé (3 signatures, R9). */
  ficheVerrouillee: boolean;
}

export function EntretienHeader({
  livretId,
  apprenti,
  formation,
  entretien,
  ficheVerrouillee,
}: EntretienHeaderProps) {
  const roleActif = useUserStore((s) => s.roleActif);
  const setEntretienDate = useLivretStore((s) => s.setEntretienDate);

  const editableDate =
    peutEditer(roleActif, 'organisation-suivi') && !ficheVerrouillee;
  // (la date relève du formateur, on réutilise sa ressource — droit cohérent)

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Identité
      </h2>
      <dl className="grid gap-3 sm:grid-cols-2 text-sm">
        <Champ libelle="Apprenti·e" valeur={`${apprenti.prenom} ${apprenti.nom}`} />
        <Champ
          libelle="Date de naissance"
          valeur={new Date(apprenti.dateNaissance).toLocaleDateString('fr-FR')}
        />
        <Champ libelle="Formation" valeur={`${formation.intitule} (${formation.annee})`} />
        <Champ
          libelle="Période contrat"
          valeur={`Du ${new Date(apprenti.contratDebut).toLocaleDateString('fr-FR')} au ${new Date(apprenti.contratFin).toLocaleDateString('fr-FR')}`}
        />
        <Champ
          libelle="Maître d'apprentissage"
          valeur={`${maitreKarimBenali.prenom} ${maitreKarimBenali.nom}`}
        />
        <Champ
          libelle="Formateur référent"
          valeur={`${formatriceSophieDubois.prenom} ${formatriceSophieDubois.nom}`}
        />
        <div className="sm:col-span-2 flex items-center gap-3">
          <dt className="text-xs uppercase tracking-wider text-muted-foreground shrink-0">
            Date de l'entretien
          </dt>
          <dd>
            {editableDate ? (
              <input
                type="date"
                value={entretien.dateEntretien ?? ''}
                onChange={(e) => setEntretienDate(livretId, e.target.value)}
                className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ) : (
              <span className={entretien.dateEntretien ? 'font-medium' : 'italic text-muted-foreground'}>
                {entretien.dateEntretien
                  ? new Date(entretien.dateEntretien).toLocaleDateString('fr-FR')
                  : 'Non renseignée'}
              </span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function Champ({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{libelle}</dt>
      <dd className="font-medium">{valeur}</dd>
    </div>
  );
}
