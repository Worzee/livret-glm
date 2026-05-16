import { useEffect, useMemo, useState } from 'react';
import {
  ExternalLink,
  GraduationCap,
  Link2,
  Lock,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import type { LienPronote, Role } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { usePronoteStore } from '@/store/usePronoteStore';
import { libelleRole, peutEditer } from '@/lib/droits';
import { cn } from '@/lib/utils';

/**
 * Page d'administration — liens externes Pronote WEB.
 * Référence : refonte mai 2026.
 *
 * Réservée aux rôles `coordo` et `admin` (matrice §6 — `admin.pronote.gerer`).
 * Permet de configurer une ou plusieurs URLs Pronote (espace élèves, espace
 * enseignants, etc.) que tous les utilisateur·rice·s retrouveront ensuite
 * sur la page `/livret/pronote`.
 */

export function GestionPronote() {
  const roleActif = useUserStore((s) => s.roleActif);
  const liensMap = usePronoteStore((s) => s.liens);
  const ajouter = usePronoteStore((s) => s.ajouterLien);
  const modifier = usePronoteStore((s) => s.modifierLien);
  const supprimer = usePronoteStore((s) => s.supprimerLien);

  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [enEdition, setEnEdition] = useState<LienPronote | undefined>(undefined);
  const [confirmationSuppression, setConfirmationSuppression] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!confirmationSuppression) return;
    const t = setTimeout(() => setConfirmationSuppression(null), 10_000);
    return () => clearTimeout(t);
  }, [confirmationSuppression]);

  const peutGerer = peutEditer(roleActif, 'admin.pronote.gerer');

  const liens = useMemo(
    () =>
      Object.values(liensMap).sort((a, b) =>
        a.libelle.localeCompare(b.libelle, 'fr-FR'),
      ),
    [liensMap],
  );

  if (!peutGerer) {
    return <AccesRefuse roleActif={roleActif} />;
  }

  function ouvrirCreation() {
    setEnEdition(undefined);
    setModaleOuverte(true);
  }

  function ouvrirEdition(l: LienPronote) {
    setEnEdition(l);
    setModaleOuverte(true);
  }

  function declencherSuppression(l: LienPronote) {
    if (confirmationSuppression !== l.id) {
      setConfirmationSuppression(l.id);
      return;
    }
    supprimer(l.id);
    setConfirmationSuppression(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" aria-hidden="true" />
            <h1 className="text-2xl font-semibold">Liens Pronote WEB</h1>
          </div>
          <p className="text-muted-foreground">
            Configurez les URLs vers les espaces Pronote du GRETA. Tous les rôles y
            accéderont depuis la page <em>Pronote WEB</em> du menu Livret. Chacun·e
            s'identifie ensuite avec ses propres credentials côté Pronote.
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>{liens.length}</strong> lien
            {liens.length > 1 ? 's' : ''} configuré{liens.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={ouvrirCreation}
          data-testid="pronote-nouveau"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouveau lien
        </button>
      </header>

      {liens.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Aucun lien Pronote configuré. Cliquez sur « Nouveau lien » pour démarrer.
        </div>
      ) : (
        <ul className="space-y-3">
          {liens.map((l) => {
            const enConfirmation = confirmationSuppression === l.id;
            return (
              <li
                key={l.id}
                data-testid={`pronote-row-${l.id}`}
                className={cn(
                  'rounded-lg border bg-card p-4 transition-colors',
                  enConfirmation ? 'border-red-300 bg-red-50/50' : 'border-border',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{l.libelle}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground break-all">
                      <ExternalLink
                        className="inline h-3 w-3 mr-1 align-text-bottom"
                        aria-hidden="true"
                      />
                      {l.url}
                    </p>
                    {l.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {l.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => ouvrirEdition(l)}
                      aria-label={`Modifier le lien : ${l.libelle}`}
                      className="rounded-md border border-input bg-background p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => declencherSuppression(l)}
                      aria-label={
                        enConfirmation
                          ? `Confirmer la suppression de : ${l.libelle}`
                          : `Supprimer le lien : ${l.libelle}`
                      }
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md p-1.5 transition-colors',
                        enConfirmation
                          ? 'border border-red-300 bg-red-600 text-white hover:bg-red-700'
                          : 'border border-input bg-background text-muted-foreground hover:bg-secondary hover:text-foreground',
                      )}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {enConfirmation && (
                        <span className="text-xs font-medium">Confirmer</span>
                      )}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ModaleLien
        ouvert={modaleOuverte}
        lien={enEdition}
        onAnnuler={() => {
          setModaleOuverte(false);
          setEnEdition(undefined);
        }}
        onValider={(valeurs, existant) => {
          if (existant) {
            modifier(existant.id, valeurs);
          } else {
            ajouter(valeurs);
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

interface ModaleLienProps {
  ouvert: boolean;
  lien?: LienPronote;
  onAnnuler: () => void;
  onValider: (valeurs: Omit<LienPronote, 'id'>, existant?: LienPronote) => void;
}

function ModaleLien({ ouvert, lien, onAnnuler, onValider }: ModaleLienProps) {
  const enEdition = !!lien;
  const [libelle, setLibelle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tentative, setTentative] = useState(false);

  useEffect(() => {
    if (!ouvert) return;
    setLibelle(lien?.libelle ?? '');
    setUrl(lien?.url ?? '');
    setDescription(lien?.description ?? '');
    setTentative(false);
  }, [ouvert, lien]);

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
  const urlClean = url.trim();
  // Validation simple — on accepte http(s)://… (le navigateur fera ses
  // propres contrôles à la frappe via <input type="url">).
  const urlValide = /^https?:\/\/.+\..+/i.test(urlClean);

  const erreurLibelle =
    tentative && libelleClean.length < 3
      ? 'Le libellé doit faire au moins 3 caractères.'
      : '';
  const erreurUrl = tentative && !urlValide
    ? 'L\'URL doit commencer par http:// ou https://.'
    : '';

  function valider() {
    setTentative(true);
    if (libelleClean.length < 3 || !urlValide) return;
    onValider(
      {
        libelle: libelleClean,
        url: urlClean,
        description: description.trim() || undefined,
      },
      lien,
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={enEdition ? 'Modifier le lien Pronote' : 'Nouveau lien Pronote'}
    >
      <button
        type="button"
        aria-label="Fermer la modale"
        onClick={onAnnuler}
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
      />
      <div className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-border bg-card p-4">
          <h2 className="text-lg font-semibold">
            {enEdition ? 'Modifier le lien Pronote' : 'Nouveau lien Pronote'}
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
            <label htmlFor="pronote-libelle" className="text-xs font-medium">
              Libellé <span className="text-red-600">*</span>
            </label>
            <input
              id="pronote-libelle"
              data-testid="pronote-libelle"
              type="text"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="Ex : Espace élèves"
              className={cn(
                'w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                erreurLibelle ? 'border-red-400' : 'border-input',
              )}
            />
            {erreurLibelle && (
              <p role="alert" className="text-xs text-red-700">
                {erreurLibelle}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="pronote-url" className="text-xs font-medium">
              URL Pronote <span className="text-red-600">*</span>
            </label>
            <input
              id="pronote-url"
              data-testid="pronote-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://pronote.greta-lyon-metropole.fr/"
              className={cn(
                'w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                erreurUrl ? 'border-red-400' : 'border-input',
              )}
            />
            {erreurUrl && (
              <p role="alert" className="text-xs text-red-700">
                {erreurUrl}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="pronote-description" className="text-xs font-medium">
              Description (optionnelle)
            </label>
            <textarea
              id="pronote-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex : Identifiez-vous avec vos credentials Pronote habituels."
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-row-reverse items-center gap-2 border-t border-border bg-secondary/30 p-3">
          <button
            type="button"
            onClick={valider}
            data-testid="pronote-valider"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {enEdition ? 'Enregistrer' : 'Créer'}
          </button>
          <button
            type="button"
            onClick={onAnnuler}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

function AccesRefuse({ roleActif }: { roleActif: Role }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
      <div className="flex items-start gap-3">
        <Lock className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-medium text-amber-900">
            Accès réservé à l'administration
          </h1>
          <p className="mt-2 text-sm text-amber-900/80">
            Vous êtes actuellement connecté·e en tant que{' '}
            <strong>{libelleRole(roleActif)}</strong>. La configuration des liens
            Pronote est réservée aux rôles <strong>Coordinateur·rice</strong> et{' '}
            <strong>Administrateur·rice</strong>.
          </p>
          <p className="mt-2 text-xs text-amber-900/80">
            <GraduationCap className="inline h-3.5 w-3.5 mr-1" aria-hidden="true" />
            Si vous cherchez à accéder à Pronote, rendez-vous sur la page{' '}
            <em>Pronote WEB</em> du menu Livret.
          </p>
        </div>
      </div>
    </div>
  );
}
