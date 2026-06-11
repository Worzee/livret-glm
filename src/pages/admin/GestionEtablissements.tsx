import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  ExternalLink,
  Lock,
  MapPin,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import type { Etablissement, Role } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useEtablissementsStore } from '@/store/useEtablissementsStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { libelleRole, peutEditer } from '@/lib/droits';
import { evaluerVerrouEtablissement } from '@/lib/etablissement-verrou';
import { cn } from '@/lib/utils';

/**
 * Page d'administration — établissements (lieux de formation).
 * Référence : refonte mai 2026.
 *
 * Réservée au rôle `admin` uniquement (matrice §6 — `admin.etablissements.gerer`).
 * Permet de créer, modifier et supprimer les établissements ainsi que de
 * renseigner l'URL Pronote de chaque lieu. Les formations référencent un
 * établissement par id (`Formation.lieuId`).
 */

export function GestionEtablissements() {
  const roleActif = useUserStore((s) => s.roleActif);
  const etablissementsMap = useEtablissementsStore((s) => s.etablissements);
  const ajouter = useEtablissementsStore((s) => s.ajouterEtablissement);
  const modifier = useEtablissementsStore((s) => s.modifierEtablissement);
  const supprimer = useEtablissementsStore((s) => s.supprimerEtablissement);
  const formationsMap = useFormationsStore((s) => s.formations);

  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [enEdition, setEnEdition] = useState<Etablissement | undefined>(undefined);
  const [confirmationSuppression, setConfirmationSuppression] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!confirmationSuppression) return;
    const t = setTimeout(() => setConfirmationSuppression(null), 10_000);
    return () => clearTimeout(t);
  }, [confirmationSuppression]);

  const peutGerer = peutEditer(roleActif, 'admin.etablissements.gerer');

  const etablissements = useMemo(
    () =>
      Object.values(etablissementsMap).sort((a, b) =>
        a.nom.localeCompare(b.nom, 'fr-FR'),
      ),
    [etablissementsMap],
  );

  const formations = useMemo(() => Object.values(formationsMap), [formationsMap]);

  if (!peutGerer) {
    return <AccesRefuse roleActif={roleActif} />;
  }

  function ouvrirCreation() {
    setEnEdition(undefined);
    setModaleOuverte(true);
  }

  function ouvrirEdition(e: Etablissement) {
    setEnEdition(e);
    setModaleOuverte(true);
  }

  function declencherSuppression(e: Etablissement) {
    if (confirmationSuppression !== e.id) {
      setConfirmationSuppression(e.id);
      return;
    }
    supprimer(e.id);
    setConfirmationSuppression(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 texte-couleur-role" aria-hidden="true" />
            <h1 className="text-2xl font-semibold">Gestion des établissements</h1>
          </div>
          <p className="text-muted-foreground">
            Lieux de formation du GRETA. Chaque établissement peut porter une URL Pronote
            qui sera proposée aux utilisateur·rice·s rattaché·e·s via une formation.
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>{etablissements.length}</strong> établissement
            {etablissements.length > 1 ? 's' : ''} configuré
            {etablissements.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={ouvrirCreation}
          data-testid="etablissement-nouveau"
          className="inline-flex items-center gap-1.5 rounded-md bouton-plein-couleur-role px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouvel établissement
        </button>
      </header>

      {etablissements.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Aucun établissement configuré. Cliquez sur « Nouvel établissement » pour démarrer.
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {etablissements.map((e) => {
            const enConfirmation = confirmationSuppression === e.id;
            const verrou = evaluerVerrouEtablissement(e.id, formations);
            const supprimable = !verrou.verrouille;
            return (
              <li
                key={e.id}
                data-testid={`etablissement-row-${e.id}`}
                className={cn(
                  'rounded-lg border bg-card p-5 space-y-3 transition-colors',
                  enConfirmation ? 'border-red-300 bg-red-50/50' : 'border-border',
                )}
              >
                <header className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold">{e.nom}</h3>
                    {(e.adresse || e.ville) && (
                      <p className="mt-0.5 text-xs text-muted-foreground inline-flex items-start gap-1">
                        <MapPin
                          className="h-3 w-3 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>
                          {[e.adresse, [e.codePostal, e.ville].filter(Boolean).join(' ')]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => ouvrirEdition(e)}
                      aria-label={`Modifier ${e.nom}`}
                      className="rounded-md border border-input bg-background p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={!supprimable}
                      onClick={() => declencherSuppression(e)}
                      aria-label={
                        enConfirmation
                          ? `Confirmer la suppression de ${e.nom}`
                          : `Supprimer ${e.nom}`
                      }
                      title={verrou.raison}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md p-1.5 transition-colors',
                        enConfirmation
                          ? 'border border-red-300 bg-red-600 text-white hover:bg-red-700'
                          : 'border border-input bg-background text-muted-foreground hover:bg-secondary hover:text-foreground',
                        !supprimable && 'opacity-40 cursor-not-allowed hover:bg-background',
                      )}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {enConfirmation && (
                        <span className="text-xs font-medium">Confirmer</span>
                      )}
                    </button>
                  </div>
                </header>

                <div className="flex items-start gap-2 rounded-md bg-secondary/30 p-2.5 text-xs">
                  <ExternalLink
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 mt-0.5',
                      e.urlPronote ? 'texte-couleur-role' : 'text-muted-foreground',
                    )}
                    aria-hidden="true"
                  />
                  {e.urlPronote ? (
                    <span className="break-all">
                      <span className="font-medium">URL Pronote : </span>
                      <code className="text-foreground">{e.urlPronote}</code>
                    </span>
                  ) : (
                    <span className="italic text-muted-foreground">
                      URL Pronote non configurée — cliquez sur le crayon pour l'ajouter.
                    </span>
                  )}
                </div>

                {verrou.verrouille && (
                  <p className="text-xs italic text-amber-700">{verrou.raison}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ModaleEtablissement
        ouvert={modaleOuverte}
        etablissement={enEdition}
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

interface ModaleEtablissementProps {
  ouvert: boolean;
  etablissement?: Etablissement;
  onAnnuler: () => void;
  onValider: (
    valeurs: Omit<Etablissement, 'id'>,
    existant?: Etablissement,
  ) => void;
}

function ModaleEtablissement({
  ouvert,
  etablissement,
  onAnnuler,
  onValider,
}: ModaleEtablissementProps) {
  const enEdition = !!etablissement;
  const [nom, setNom] = useState('');
  const [adresse, setAdresse] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [ville, setVille] = useState('');
  const [urlPronote, setUrlPronote] = useState('');
  const [tentative, setTentative] = useState(false);

  useEffect(() => {
    if (!ouvert) return;
    setNom(etablissement?.nom ?? '');
    setAdresse(etablissement?.adresse ?? '');
    setCodePostal(etablissement?.codePostal ?? '');
    setVille(etablissement?.ville ?? '');
    setUrlPronote(etablissement?.urlPronote ?? '');
    setTentative(false);
  }, [ouvert, etablissement]);

  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onAnnuler();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ouvert, onAnnuler]);

  if (!ouvert) return null;

  const nomClean = nom.trim();
  const urlClean = urlPronote.trim();
  const urlOk = urlClean === '' || /^https?:\/\/.+\..+/i.test(urlClean);

  const erreurNom =
    tentative && nomClean.length < 3
      ? "Le nom de l'établissement doit faire au moins 3 caractères."
      : '';
  const erreurUrl =
    tentative && !urlOk ? "L'URL doit commencer par http:// ou https://." : '';

  function valider() {
    setTentative(true);
    if (nomClean.length < 3 || !urlOk) return;
    onValider(
      {
        nom: nomClean,
        adresse: adresse.trim() || undefined,
        codePostal: codePostal.trim() || undefined,
        ville: ville.trim() || undefined,
        urlPronote: urlClean || undefined,
      },
      etablissement,
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={enEdition ? 'Modifier l\'établissement' : 'Nouvel établissement'}
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
            {enEdition ? `Modifier ${etablissement.nom}` : 'Nouvel établissement'}
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
            <label htmlFor="eta-nom" className="text-xs font-medium">
              Nom de l'établissement <span className="text-red-600">*</span>
            </label>
            <input
              id="eta-nom"
              data-testid="eta-nom"
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex : GRETA Lyon Métropole — Site Diderot"
              className={cn(
                'w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                erreurNom ? 'border-red-400' : 'border-input',
              )}
            />
            {erreurNom && (
              <p role="alert" className="text-xs text-red-700">
                {erreurNom}
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="eta-adresse" className="text-xs font-medium">
                Adresse
              </label>
              <input
                id="eta-adresse"
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Ex : 41 rue Antoine Lumière"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="eta-cp" className="text-xs font-medium">
                Code postal
              </label>
              <input
                id="eta-cp"
                type="text"
                value={codePostal}
                onChange={(e) => setCodePostal(e.target.value)}
                placeholder="69008"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="eta-ville" className="text-xs font-medium">
                Ville
              </label>
              <input
                id="eta-ville"
                type="text"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                placeholder="Lyon"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1 border-t border-border pt-4">
            <label htmlFor="eta-url-pronote" className="text-xs font-medium">
              URL Pronote (portail de l'établissement)
            </label>
            <input
              id="eta-url-pronote"
              data-testid="eta-url-pronote"
              type="url"
              value={urlPronote}
              onChange={(e) => setUrlPronote(e.target.value)}
              placeholder="https://pronote.greta-lyon-metropole.fr/"
              className={cn(
                'w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                erreurUrl ? 'border-red-400' : 'border-input',
              )}
            />
            {erreurUrl ? (
              <p role="alert" className="text-xs text-red-700">
                {erreurUrl}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Optionnel. Renseignez l'URL du portail Pronote du lieu — elle sera
                proposée aux utilisateur·rice·s rattaché·e·s à une formation de cet
                établissement.
              </p>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-row-reverse items-center gap-2 border-t border-border bg-secondary/30 p-3">
          <button
            type="button"
            onClick={valider}
            data-testid="eta-valider"
            className="inline-flex items-center gap-1.5 rounded-md bouton-plein-couleur-role px-4 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <strong>{libelleRole(roleActif)}</strong>. La gestion des établissements
            est réservée au rôle <strong>Administrateur·rice</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
