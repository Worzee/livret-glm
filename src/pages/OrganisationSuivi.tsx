import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Lock,
  LockOpen,
  MapPin,
  MessageSquare,
  Plus,
  Trash2,
  Video,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserStore } from '@/store/useUserStore';
import { useLivretStore } from '@/store/useLivretStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { libelleRole, peutEditer } from '@/lib/droits';
import {
  evenementFigeParSignature,
  libelleModalite,
  metadonneesMotif,
  modaliteEffective,
  modaliteImposee,
  motifAvecModalite,
  motifsProposablesPourRole,
  numeroEntretienPourMotif,
  peutSupprimerEvenement,
} from '@/lib/organisation-suivi';
import type {
  EvenementOrganisationSuivi,
  Livret,
  ModaliteEntretien,
  MotifOrganisationSuivi,
} from '@/types';
import { cn } from '@/lib/utils';
import { AucunApprentiSelectionne } from '@/components/common/AucunApprentiSelectionne';

/**
 * Module — Fiches de suivi (ex « Organisation du suivi », renommé mai 2026).
 * Référence CDC §5.1, refonte modulaire mai 2026.
 *
 * Le formateur référent, le coordo ou l'admin (retours coordos juin 2026)
 * ajoute à la demande chaque événement (réunion de rentrée, visites en
 * entreprise multiples, conseil de classe, etc.) en choisissant un motif
 * parmi le catalogue filtré par la formation (`motifsDisponibles`). Le
 * liseré des cartes suit la couleur du rôle actif.
 *
 * Lecture seule pour l'apprenti·e et le maître.
 *
 * Auto-save : chaque modification est persistée immédiatement dans le store.
 */

export function OrganisationSuivi() {
  const ctx = useApprentiActif();
  const ajouterEvt = useLivretStore((s) => s.ajouterEvenementOrganisation);
  const modifierEvt = useLivretStore((s) => s.modifierEvenementOrganisation);
  const supprimerEvt = useLivretStore((s) => s.supprimerEvenementOrganisation);
  const roleActif = useUserStore((s) => s.roleActif);
  const utilisateurActif = useUserStore((s) => s.utilisateurActif);
  const formations = useFormationsStore((s) => s.formations);

  // Le motif sélectionné dans le sélecteur d'ajout — réinitialisé après ajout.
  const [motifAAjouter, setMotifAAjouter] = useState<MotifOrganisationSuivi | ''>('');
  const [confirmationSuppression, setConfirmationSuppression] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmationSuppression) return;
    const t = setTimeout(() => setConfirmationSuppression(null), 10_000);
    return () => clearTimeout(t);
  }, [confirmationSuppression]);

  if (!ctx) return <AucunApprentiSelectionne />;
  const { apprenti, livret } = ctx;

  const editable = peutEditer(roleActif, 'organisation-suivi');
  // Suppression d'un événement : coordo + admin uniquement (15 juin 2026).
  // Le formateur référent crée / modifie mais ne supprime pas.
  const peutSupprimer = peutEditer(roleActif, 'organisation-suivi.supprimer');
  const org = livret.organisationSuivi;
  const evenements = org.evenements;

  // Juin 2026 : motifs filtrés par formation (entretiens 1..N) ET par rôle —
  // le formateur ne crée que les événements entretien tripartite, le coordo
  // et l'admin créent tous les motifs.
  const formation = formations[apprenti.formationId];
  const motifsProposables = motifsProposablesPourRole(formation?.nombreEntretiens ?? 2, roleActif);

  function ajouter() {
    if (!motifAAjouter) return;
    ajouterEvt(livret.id, utilisateurActif.id, motifAAjouter);
    setMotifAAjouter('');
  }

  function supprimer(evtId: string) {
    if (confirmationSuppression !== evtId) {
      setConfirmationSuppression(evtId);
      return;
    }
    supprimerEvt(livret.id, utilisateurActif.id, evtId);
    setConfirmationSuppression(null);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Fiches de suivi</h1>
        <p className="text-muted-foreground">
          Cadre de suivi de la promo, défini par le formateur référent ou le coordinateur·rice.
          Consultable par l'apprenti·e et le maître / tuteur.
        </p>
        <p className="text-xs text-muted-foreground">
          Apprenti·e :{' '}
          <strong>
            {apprenti.prenom} {apprenti.nom}
          </strong>
        </p>
      </header>

      {!editable && (
        <div className="inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Vous consultez en mode{' '}
          <strong className="text-foreground">{libelleRole(roleActif)}</strong> — modification
          réservée au formateur référent, au coordinateur·rice et à l'administrateur·rice.
        </div>
      )}

      {/* Sélecteur d'ajout — formateur référent uniquement */}
      {editable && (
        <div
          className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-secondary/30 p-3 sm:flex-row sm:items-end"
          data-testid="ajout-evenement"
        >
          <div className="flex-1 space-y-1">
            <label htmlFor="org-motif-ajout" className="text-xs font-medium text-muted-foreground">
              Ajouter un événement
            </label>
            <select
              id="org-motif-ajout"
              data-testid="org-motif-ajout"
              value={motifAAjouter}
              onChange={(e) => setMotifAAjouter(e.target.value as MotifOrganisationSuivi | '')}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Choisir un motif —</option>
              {motifsProposables.map((m) => (
                <option key={m.motif} value={m.motif}>
                  {m.libelle}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={ajouter}
            disabled={!motifAAjouter}
            data-testid="org-ajouter-evt"
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md bouton-plein-couleur-role px-4 py-1.5 text-sm font-medium transition-opacity',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              motifAAjouter ? 'hover:opacity-90' : 'cursor-not-allowed opacity-50',
            )}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Ajouter
          </button>
        </div>
      )}

      {evenements.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {editable
            ? 'Aucun événement pour le moment. Choisissez un motif ci-dessus pour ajouter votre premier événement.'
            : "Le formateur référent n'a pas encore ajouté d'événement à l'organisation du suivi."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {evenements.map((evt) => (
            <CarteEvenement
              key={evt.id}
              evenement={evt}
              entretiens={livret.entretiens}
              editable={editable}
              peutSupprimer={peutSupprimer}
              enConfirmationSuppression={confirmationSuppression === evt.id}
              onChangeTitre={(titre) =>
                modifierEvt(livret.id, utilisateurActif.id, evt.id, { titre })
              }
              onChangeDate={(date) => modifierEvt(livret.id, utilisateurActif.id, evt.id, { date })}
              onChangeCommentaire={(commentaire) =>
                modifierEvt(livret.id, utilisateurActif.id, evt.id, { commentaire })
              }
              onChangeModalite={(modalite) =>
                modifierEvt(livret.id, utilisateurActif.id, evt.id, { modalite })
              }
              onToggleVerrouille={() =>
                modifierEvt(livret.id, utilisateurActif.id, evt.id, {
                  verrouille: !evt.verrouille,
                })
              }
              onSupprimer={() => supprimer(evt.id)}
            />
          ))}
        </div>
      )}

      {org.modifieLe && (
        <p className="text-xs text-muted-foreground">
          Dernière modification :{' '}
          <time dateTime={org.modifieLe}>
            {new Date(org.modifieLe).toLocaleString('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </time>
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Carte d'un événement — titre + date à gauche, commentaire à droite
// ─────────────────────────────────────────────────────────────────────────────

interface CarteEvenementProps {
  evenement: EvenementOrganisationSuivi;
  /** Entretiens du livret — la règle « entretien signé = fiche insupprimable ». */
  entretiens: Livret['entretiens'];
  editable: boolean;
  /** Droit de supprimer l'événement — coordo / admin uniquement (15 juin 2026). */
  peutSupprimer: boolean;
  enConfirmationSuppression: boolean;
  onChangeTitre: (titre: string) => void;
  onChangeDate: (date: string) => void;
  onChangeCommentaire: (commentaire: string) => void;
  onChangeModalite: (modalite: ModaliteEntretien) => void;
  onToggleVerrouille: () => void;
  onSupprimer: () => void;
}

function CarteEvenement({
  evenement,
  entretiens,
  editable,
  peutSupprimer,
  enConfirmationSuppression,
  onChangeTitre,
  onChangeDate,
  onChangeCommentaire,
  onChangeModalite,
  onToggleVerrouille,
  onSupprimer,
}: CarteEvenementProps) {
  const meta = metadonneesMotif(evenement.motif);
  const idTitre = `org-titre-${evenement.id}`;
  const idDate = `org-date-${evenement.id}`;
  const idCommentaire = `org-com-${evenement.id}`;
  // Verrou « dur » par signature : dès que l'entretien tripartite correspondant
  // est signé par les 3 parties, toute la carte est figée (R9), sans
  // déverrouillage possible. Le verrou manuel (bouton) reste un verrou local
  // optionnel tant que l'entretien n'est pas signé.
  const figeParSignature = evenementFigeParSignature(evenement, entretiens);
  const verrouille = evenement.verrouille === true || figeParSignature;
  const peutEditerChamp = editable && !verrouille;
  const verrouSuppression = peutSupprimerEvenement(evenement, entretiens);
  const supprimable = verrouSuppression.supprimable;
  // Modalité (présentiel / distanciel) — uniquement pour les entretiens.
  const avecModalite = motifAvecModalite(evenement.motif);
  const modaliteFigee = modaliteImposee(evenement.motif); // 'presentiel' pour E1, sinon null
  const modaliteCourante = modaliteEffective(evenement);

  return (
    <article
      data-testid={`org-evt-${evenement.id}`}
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-border bg-card p-4',
        // Liseré coloré selon le rôle actif (formateur violet, coordo orange,
        // admin or) — la carte est éditable par ces 3 rôles depuis juin 2026.
        editable && 'border-l-4 bordure-gauche-couleur-role',
        verrouille && 'bg-muted/30',
        enConfirmationSuppression && 'border-red-300 bg-red-50/50',
      )}
    >
      <header className="flex items-start gap-2">
        <CalendarDays
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-medium">{meta.libelle}</h2>
          <p className="text-xs text-muted-foreground">{meta.description}</p>
        </div>
        {/* Suppression réservée au coordo / admin (15 juin 2026) — masquée
            pour le formateur référent, qui crée et modifie sans supprimer. */}
        {peutSupprimer && (
          <button
            type="button"
            onClick={onSupprimer}
            disabled={!supprimable}
            title={verrouSuppression.raison}
            aria-label={
              enConfirmationSuppression
                ? `Confirmer la suppression de ${meta.libelle}`
                : `Supprimer ${meta.libelle}`
            }
            data-testid={`org-supprimer-${evenement.id}`}
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-md p-1.5 transition-colors',
              enConfirmationSuppression
                ? 'border border-red-300 bg-red-600 text-white hover:bg-red-700'
                : 'border border-input bg-background text-muted-foreground hover:bg-secondary hover:text-foreground',
              !supprimable &&
                'cursor-not-allowed opacity-40 hover:bg-background hover:text-muted-foreground',
            )}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {enConfirmationSuppression && <span className="text-xs font-medium">Confirmer</span>}
          </button>
        )}
      </header>

      {/* Verrou « dur » : l'entretien est signé par les 3 parties (15 juin 2026)
          → toute la carte est figée, sans déverrouillage possible (R9). */}
      {figeParSignature && (
        <div
          data-testid={`org-evt-fige-${evenement.id}`}
          className="inline-flex w-fit items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900"
        >
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Entretien signé par les 3 parties — fiche verrouillée
        </div>
      )}

      {/* Lien direct vers l'entretien correspondant — si motif entretien-tripartite */}
      {(() => {
        const numero = numeroEntretienPourMotif(evenement.motif);
        if (numero === null) return null;
        return (
          <Link
            to={`/livret/entretien/${numero}`}
            data-testid={`ouvrir-entretien-${numero}`}
            className="bouton-leger-couleur-role inline-flex w-fit items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium"
          >
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            Ouvrir cet entretien
          </Link>
        );
      })()}

      {/* Modalité de l'entretien (présentiel / distanciel) — 15 juin 2026.
          E1 est imposé en présentiel ; E2..E4 sont au choix (sélecteur). */}
      {avecModalite && (
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Modalité</span>
          {modaliteFigee ? (
            // E1 — présentiel obligatoire, non modifiable.
            <p
              data-testid={`org-modalite-${evenement.id}`}
              className="inline-flex w-fit items-center gap-1.5 rounded-md border border-input bg-muted px-2.5 py-1 text-sm font-medium"
            >
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              Présentiel{' '}
              <span className="text-xs font-normal text-muted-foreground">(obligatoire)</span>
            </p>
          ) : peutEditerChamp ? (
            // E2..E4 — sélecteur présentiel / distanciel.
            <div
              role="group"
              aria-label="Modalité de l'entretien"
              data-testid={`org-modalite-${evenement.id}`}
              className="inline-flex overflow-hidden rounded-md border border-input"
            >
              {(['presentiel', 'distanciel'] as const).map((m) => {
                const actif = modaliteCourante === m;
                const Icone = m === 'presentiel' ? MapPin : Video;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onChangeModalite(m)}
                    aria-pressed={actif}
                    data-testid={`org-modalite-${m}-${evenement.id}`}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                      actif
                        ? 'bouton-plein-couleur-role font-medium'
                        : 'bg-background text-muted-foreground hover:bg-secondary',
                    )}
                  >
                    <Icone className="h-3.5 w-3.5" aria-hidden="true" />
                    {libelleModalite(m)}
                  </button>
                );
              })}
            </div>
          ) : (
            // Lecture seule (rôle non éditeur, carte verrouillée ou figée).
            <p
              data-testid={`org-modalite-${evenement.id}`}
              className="inline-flex w-fit items-center gap-1.5 text-sm font-medium"
            >
              {modaliteCourante === 'distanciel' ? (
                <Video className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              ) : (
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              )}
              {modaliteCourante ? libelleModalite(modaliteCourante) : '—'}
            </p>
          )}
        </div>
      )}

      {/* Titre custom — affiché en lecture seule pour les autres rôles si renseigné */}
      {peutEditerChamp ? (
        <div className="space-y-1">
          <label htmlFor={idTitre} className="text-xs font-medium text-muted-foreground">
            Titre (optionnel — utile pour distinguer plusieurs événements du même motif)
          </label>
          <input
            id={idTitre}
            type="text"
            value={evenement.titre ?? ''}
            onChange={(e) => onChangeTitre(e.target.value)}
            placeholder={'ex : Visite n°1 — novembre 2025'}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      ) : evenement.titre?.trim() ? (
        <p className="text-sm font-medium text-foreground">{evenement.titre}</p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Colonne date + bouton verrou */}
        <div className="sm:w-44 sm:shrink-0 space-y-2">
          <div className="space-y-1">
            <label htmlFor={idDate} className="text-xs font-medium text-muted-foreground">
              Date (optionnelle)
            </label>
            {peutEditerChamp ? (
              <input
                id={idDate}
                type="date"
                value={evenement.date ?? ''}
                onChange={(e) => onChangeDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ) : editable ? (
              <input
                id={idDate}
                type="date"
                value={evenement.date ?? ''}
                disabled
                className="w-full cursor-not-allowed rounded-md border border-input bg-muted px-2 py-1.5 text-sm text-muted-foreground"
              />
            ) : (
              <p
                className={cn(
                  'rounded-md border border-transparent px-2 py-1.5 text-sm',
                  !evenement.date && 'italic text-muted-foreground',
                )}
              >
                {evenement.date
                  ? new Date(evenement.date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  : 'Non renseigné'}
              </p>
            )}
          </div>

          {/* Verrou local optionnel — masqué quand la carte est déjà figée par
              la signature de l'entretien (verrou imposé, non basculable). */}
          {editable && !figeParSignature && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onToggleVerrouille}
                aria-pressed={verrouille}
                aria-label={
                  verrouille
                    ? `Déverrouiller le champ ${meta.libelle}`
                    : `Verrouiller le champ ${meta.libelle}`
                }
                className={cn(
                  'inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  verrouille
                    ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                    : 'border-input bg-background text-muted-foreground hover:bg-secondary',
                )}
              >
                {verrouille ? (
                  <>
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    Verrouillé
                  </>
                ) : (
                  <>
                    <LockOpen className="h-3.5 w-3.5" aria-hidden="true" />
                    Verrouiller
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Colonne commentaire */}
        <div className="flex-1 space-y-1">
          <label
            htmlFor={idCommentaire}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
          >
            <MessageSquare className="h-3 w-3" aria-hidden="true" />
            Commentaire
          </label>
          {peutEditerChamp ? (
            <textarea
              id={idCommentaire}
              rows={3}
              value={evenement.commentaire ?? ''}
              onChange={(e) => onChangeCommentaire(e.target.value)}
              placeholder={meta.placeholderCommentaire}
              className="w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          ) : editable ? (
            <textarea
              id={idCommentaire}
              rows={3}
              value={evenement.commentaire ?? ''}
              readOnly
              className="w-full cursor-not-allowed resize-y rounded-md border border-input bg-muted px-2 py-1.5 text-sm text-muted-foreground"
            />
          ) : (
            <p
              className={cn(
                'min-h-[3.25rem] whitespace-pre-wrap rounded-md border border-transparent px-2 py-1.5 text-sm',
                !evenement.commentaire && 'italic text-muted-foreground',
              )}
            >
              {evenement.commentaire || 'Non renseigné'}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
