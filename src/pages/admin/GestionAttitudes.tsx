import { useEffect, useId, useState } from 'react';
import { Activity, Lock, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { AttitudeProfessionnelle, Role } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useAttitudesStore } from '@/store/useAttitudesStore';
import { useLivretStore } from '@/store/useLivretStore';
import { libelleRole, peutEditer } from '@/lib/droits';
import { attitudeEstSelectionnee, attitudeEstUtilisee } from '@/lib/attitudes';
import { cn } from '@/lib/utils';

/**
 * Page d'administration du catalogue global des attitudes professionnelles
 * (retours coordos juin 2026) — **admin uniquement** (matrice
 * `admin.attitudes.gerer`, comme les établissements).
 *
 * Les attitudes sont évaluées par le maître / tuteur à chaque entretien
 * tripartite ; l'onglet « Attitudes » de l'évaluation finale en présente la
 * synthèse. La suppression est bloquée si l'attitude est évaluée dans au
 * moins un entretien (cohérence référentielle).
 */

export function GestionAttitudes() {
  const roleActif = useUserStore((s) => s.roleActif);
  const attitudesMap = useAttitudesStore((s) => s.attitudes);
  const ajouterAttitude = useAttitudesStore((s) => s.ajouterAttitude);
  const modifierAttitude = useAttitudesStore((s) => s.modifierAttitude);
  const supprimerAttitude = useAttitudesStore((s) => s.supprimerAttitude);
  const livrets = useLivretStore((s) => s.livrets);

  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [enEdition, setEnEdition] = useState<AttitudeProfessionnelle | undefined>(undefined);
  const [confirmationSuppression, setConfirmationSuppression] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmationSuppression) return;
    const t = setTimeout(() => setConfirmationSuppression(null), 10_000);
    return () => clearTimeout(t);
  }, [confirmationSuppression]);

  if (!peutEditer(roleActif, 'admin.attitudes.gerer')) {
    return <AccesRefuse roleActif={roleActif} />;
  }

  const attitudes = Object.values(attitudesMap);
  // Juillet 2026 : les évaluations d'attitudes sont portées par les fiches
  // de période entreprise (plus par l'entretien).
  const fichesEntreprise = Object.values(livrets).flatMap((l) => l.fichesSuivi);
  // 13 juin 2026 : une attitude RETENUE dans un livret (choix fait à
  // l'entretien) est également protégée, même si elle n'est pas encore évaluée.
  const selections = Object.values(livrets).map((l) => l.attitudesSelectionnees ?? []);

  function declencherSuppression(a: AttitudeProfessionnelle) {
    if (confirmationSuppression !== a.id) {
      setConfirmationSuppression(a.id);
      return;
    }
    supprimerAttitude(a.id);
    setConfirmationSuppression(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 texte-couleur-role" aria-hidden="true" />
            <h1 className="text-2xl font-semibold">Attitudes professionnelles</h1>
          </div>
          <p className="text-muted-foreground">
            Catalogue des attitudes évaluées par le maître / tuteur lors de l'entretien tripartite.
            L'évaluation finale en présente la synthèse (lecture seule).
          </p>
          <p className="text-xs text-muted-foreground">
            {attitudes.length} attitude{attitudes.length > 1 ? 's' : ''} au catalogue
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEnEdition(undefined);
            setModaleOuverte(true);
          }}
          data-testid="attitude-nouvelle"
          className="inline-flex items-center gap-1.5 rounded-md bouton-plein-couleur-role px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouvelle attitude
        </button>
      </header>

      {attitudes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-secondary/30 p-6 text-center text-sm text-muted-foreground">
          Aucune attitude au catalogue. Créez la première via « Nouvelle attitude ».
        </p>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-2 md:px-4 py-2 text-left">Attitude</th>
                <th className="px-2 md:px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {attitudes.map((a) => {
                const enConfirmation = confirmationSuppression === a.id;
                const utilisee =
                  attitudeEstUtilisee(a.id, fichesEntreprise) ||
                  attitudeEstSelectionnee(a.id, selections);
                return (
                  <tr
                    key={a.id}
                    data-testid={`attitude-row-${a.id}`}
                    className={cn(enConfirmation && 'bg-red-50')}
                  >
                    <td className="px-2 md:px-4 py-2 align-top">
                      <p className="font-medium text-foreground">{a.libelle}</p>
                      {a.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                      )}
                    </td>
                    <td className="px-2 md:px-4 py-2 text-right align-top">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEnEdition(a);
                            setModaleOuverte(true);
                          }}
                          aria-label={`Modifier l'attitude : ${a.libelle}`}
                          className="rounded-md border border-input bg-background p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={utilisee}
                          onClick={() => declencherSuppression(a)}
                          aria-label={
                            enConfirmation
                              ? `Confirmer la suppression de : ${a.libelle}`
                              : `Supprimer l'attitude : ${a.libelle}`
                          }
                          title={
                            utilisee
                              ? 'Attitude évaluée ou retenue dans au moins un livret — suppression impossible.'
                              : undefined
                          }
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md p-1.5 transition-colors',
                            enConfirmation
                              ? 'border border-red-300 bg-red-600 text-white hover:bg-red-700'
                              : 'border border-input bg-background text-muted-foreground hover:bg-secondary hover:text-foreground',
                            utilisee && 'opacity-40 cursor-not-allowed hover:bg-background',
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          {enConfirmation && <span className="text-xs font-medium">Confirmer</span>}
                        </button>
                      </div>
                      {utilisee && (
                        <p className="mt-0.5 text-[10px] text-amber-700 italic">
                          Évaluée ou retenue dans au moins un livret.
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ModaleAttitude
        ouvert={modaleOuverte}
        attitude={enEdition}
        onAnnuler={() => {
          setModaleOuverte(false);
          setEnEdition(undefined);
        }}
        onValider={(valeurs, existante) => {
          if (existante) {
            modifierAttitude(existante.id, valeurs);
          } else {
            ajouterAttitude(valeurs);
          }
          setModaleOuverte(false);
          setEnEdition(undefined);
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modale création / édition
// ─────────────────────────────────────────────────────────────────────────────

interface ModaleAttitudeProps {
  ouvert: boolean;
  /** Attitude existante en édition (sinon création). */
  attitude?: AttitudeProfessionnelle;
  onAnnuler: () => void;
  onValider: (
    valeurs: Omit<AttitudeProfessionnelle, 'id'>,
    attitudeExistante?: AttitudeProfessionnelle,
  ) => void;
}

function ModaleAttitude({ ouvert, attitude, onAnnuler, onValider }: ModaleAttitudeProps) {
  const titreId = useId();
  const enEdition = !!attitude;

  const [libelle, setLibelle] = useState('');
  const [description, setDescription] = useState('');
  const [tentative, setTentative] = useState(false);

  useEffect(() => {
    if (!ouvert) return;
    setLibelle(attitude?.libelle ?? '');
    setDescription(attitude?.description ?? '');
    setTentative(false);
  }, [ouvert, attitude]);

  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onAnnuler();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ouvert, onAnnuler]);

  if (!ouvert) return null;

  const libelleClean = libelle.trim();
  const erreurLibelle =
    tentative && libelleClean.length < 3 ? 'Le libellé doit faire au moins 3 caractères.' : '';

  function valider() {
    setTentative(true);
    if (libelleClean.length < 3) return;
    onValider({ libelle: libelleClean, description: description.trim() || undefined }, attitude);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titreId}
    >
      <button
        type="button"
        aria-label="Fermer la modale"
        onClick={onAnnuler}
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
      />
      <div className="relative w-full max-w-md rounded-lg border border-border bg-card shadow-lg">
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <h2 id={titreId} className="text-lg font-semibold">
            {enEdition ? "Modifier l'attitude" : 'Nouvelle attitude professionnelle'}
          </h2>
          <button
            type="button"
            onClick={onAnnuler}
            aria-label="Fermer"
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="space-y-1">
            <label htmlFor="attitude-libelle" className="text-sm font-medium">
              Libellé <span className="text-red-600">*</span>
            </label>
            <input
              id="attitude-libelle"
              data-testid="attitude-libelle"
              type="text"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="Ex : Respect des règles de sécurité"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {erreurLibelle && (
              <p role="alert" className="text-xs text-red-600">
                {erreurLibelle}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="attitude-description" className="text-sm font-medium">
              Description <span className="text-xs text-muted-foreground">(optionnelle)</span>
            </label>
            <textarea
              id="attitude-description"
              data-testid="attitude-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Précision affichée sous le libellé dans l'entretien."
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex flex-row-reverse items-center gap-2 border-t border-border bg-secondary/30 p-3">
          <button
            type="button"
            onClick={valider}
            data-testid="attitude-valider"
            className="rounded-md bouton-plein-couleur-role px-4 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {enEdition ? 'Enregistrer' : "Créer l'attitude"}
          </button>
          <button
            type="button"
            onClick={onAnnuler}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-secondary"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function AccesRefuse({ roleActif }: { roleActif: Role }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
      <div className="flex items-start gap-3">
        <Lock className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-medium text-amber-900">Accès réservé à l'administration</h1>
          <p className="mt-2 text-sm text-amber-900/80">
            Vous êtes actuellement connecté·e en tant que <strong>{libelleRole(roleActif)}</strong>.
            La gestion des attitudes professionnelles est réservée au rôle{' '}
            <strong>Administrateur·rice</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
