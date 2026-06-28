import { useEffect, useMemo, useState } from 'react';
import { Building2, Hash, Lock, MapPin, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import type { Entreprise, Role } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useEntreprisesStore } from '@/store/useEntreprisesStore';
import { useUtilisateursStore } from '@/store/useUtilisateursStore';
import { libelleRole, peutEditer } from '@/lib/droits';
import { evaluerVerrouEntreprise } from '@/lib/entreprise-verrou';
import { cn } from '@/lib/utils';

/**
 * Page d'administration — entreprises d'accueil des apprenti·e·s (juin 2026).
 *
 * Réservée aux rôles `coordo` et `admin` (matrice §6 — `admin.entreprises.gerer`).
 * Permet de créer, modifier et supprimer les entreprises. Les apprenti·e·s
 * référencent une entreprise par id (`Apprenti.entrepriseId`), choisie dans une
 * liste déroulante à la création / l'édition.
 */

export function GestionEntreprises() {
  const roleActif = useUserStore((s) => s.roleActif);
  const entreprisesMap = useEntreprisesStore((s) => s.entreprises);
  const ajouter = useEntreprisesStore((s) => s.ajouterEntreprise);
  const modifier = useEntreprisesStore((s) => s.modifierEntreprise);
  const supprimer = useEntreprisesStore((s) => s.supprimerEntreprise);
  const apprentisMap = useUtilisateursStore((s) => s.apprentis);

  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [enEdition, setEnEdition] = useState<Entreprise | undefined>(undefined);
  const [confirmationSuppression, setConfirmationSuppression] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmationSuppression) return;
    const t = setTimeout(() => setConfirmationSuppression(null), 10_000);
    return () => clearTimeout(t);
  }, [confirmationSuppression]);

  const peutGerer = peutEditer(roleActif, 'admin.entreprises.gerer');

  const entreprises = useMemo(
    () =>
      Object.values(entreprisesMap).sort((a, b) =>
        a.raisonSociale.localeCompare(b.raisonSociale, 'fr-FR'),
      ),
    [entreprisesMap],
  );
  const apprentis = useMemo(() => Object.values(apprentisMap), [apprentisMap]);

  if (!peutGerer) {
    return <AccesRefuse roleActif={roleActif} />;
  }

  function ouvrirCreation() {
    setEnEdition(undefined);
    setModaleOuverte(true);
  }

  function ouvrirEdition(e: Entreprise) {
    setEnEdition(e);
    setModaleOuverte(true);
  }

  function declencherSuppression(e: Entreprise) {
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
            <h1 className="text-2xl font-semibold">Gestion des entreprises</h1>
          </div>
          <p className="text-muted-foreground">
            Entreprises d'accueil des apprenti·e·s. Chaque apprenti·e est rattaché·e à une entreprise
            de cette liste ; un changement en cours de contrat est tracé dans son livret.
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>{entreprises.length}</strong> entreprise
            {entreprises.length > 1 ? 's' : ''} enregistrée{entreprises.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={ouvrirCreation}
          data-testid="entreprise-nouvelle"
          className="inline-flex items-center gap-1.5 rounded-md bouton-plein-couleur-role px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouvelle entreprise
        </button>
      </header>

      {entreprises.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Aucune entreprise enregistrée. Cliquez sur « Nouvelle entreprise » pour démarrer.
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {entreprises.map((e) => {
            const enConfirmation = confirmationSuppression === e.id;
            const verrou = evaluerVerrouEntreprise(e.id, apprentis);
            const supprimable = !verrou.verrouille;
            const localisation = [e.codePostal, e.ville].filter(Boolean).join(' ');
            return (
              <li
                key={e.id}
                data-testid={`entreprise-row-${e.id}`}
                className={cn(
                  'rounded-lg border bg-card p-5 space-y-3 transition-colors',
                  enConfirmation ? 'border-red-300 bg-red-50/50' : 'border-border',
                )}
              >
                <header className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold">{e.raisonSociale}</h3>
                    {(e.adresse || localisation) && (
                      <p className="mt-0.5 text-xs text-muted-foreground inline-flex items-start gap-1">
                        <MapPin className="h-3 w-3 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{[e.adresse, localisation].filter(Boolean).join(', ')}</span>
                      </p>
                    )}
                    {e.siret && (
                      <p className="mt-0.5 text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Hash className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span>SIRET {e.siret}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => ouvrirEdition(e)}
                      aria-label={`Modifier ${e.raisonSociale}`}
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
                          ? `Confirmer la suppression de ${e.raisonSociale}`
                          : `Supprimer ${e.raisonSociale}`
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
                      {enConfirmation && <span className="text-xs font-medium">Confirmer</span>}
                    </button>
                  </div>
                </header>

                {verrou.verrouille && (
                  <p className="text-xs italic text-amber-700">{verrou.raison}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ModaleEntreprise
        ouvert={modaleOuverte}
        entreprise={enEdition}
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

interface ModaleEntrepriseProps {
  ouvert: boolean;
  entreprise?: Entreprise;
  onAnnuler: () => void;
  onValider: (valeurs: Omit<Entreprise, 'id'>, existant?: Entreprise) => void;
}

function ModaleEntreprise({ ouvert, entreprise, onAnnuler, onValider }: ModaleEntrepriseProps) {
  const enEdition = !!entreprise;
  const [raisonSociale, setRaisonSociale] = useState('');
  const [siret, setSiret] = useState('');
  const [adresse, setAdresse] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [ville, setVille] = useState('');
  const [tentative, setTentative] = useState(false);

  useEffect(() => {
    if (!ouvert) return;
    setRaisonSociale(entreprise?.raisonSociale ?? '');
    setSiret(entreprise?.siret ?? '');
    setAdresse(entreprise?.adresse ?? '');
    setCodePostal(entreprise?.codePostal ?? '');
    setVille(entreprise?.ville ?? '');
    setTentative(false);
  }, [ouvert, entreprise]);

  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onAnnuler();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ouvert, onAnnuler]);

  if (!ouvert) return null;

  const raisonClean = raisonSociale.trim();
  const erreurRaison =
    tentative && raisonClean.length < 2 ? 'La raison sociale est obligatoire.' : '';

  function valider() {
    setTentative(true);
    if (raisonClean.length < 2) return;
    onValider(
      {
        raisonSociale: raisonClean,
        siret: siret.trim() || undefined,
        adresse: adresse.trim() || undefined,
        codePostal: codePostal.trim() || undefined,
        ville: ville.trim() || undefined,
      },
      entreprise,
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={enEdition ? "Modifier l'entreprise" : 'Nouvelle entreprise'}
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
            {enEdition ? `Modifier ${entreprise.raisonSociale}` : 'Nouvelle entreprise'}
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
            <label htmlFor="ent-raison" className="text-xs font-medium">
              Raison sociale <span className="text-red-600">*</span>
            </label>
            <input
              id="ent-raison"
              data-testid="ent-raison"
              type="text"
              value={raisonSociale}
              onChange={(e) => setRaisonSociale(e.target.value)}
              placeholder="Ex : Restaurant Le Gourmet"
              className={cn(
                'w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                erreurRaison ? 'border-red-400' : 'border-input',
              )}
            />
            {erreurRaison && (
              <p role="alert" className="text-xs text-red-700">
                {erreurRaison}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="ent-siret" className="text-xs font-medium">
              SIRET
            </label>
            <input
              id="ent-siret"
              type="text"
              value={siret}
              onChange={(e) => setSiret(e.target.value)}
              placeholder="491 234 567 00018"
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="ent-adresse" className="text-xs font-medium">
                Adresse
              </label>
              <input
                id="ent-adresse"
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Ex : 12 rue Mercière"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="ent-cp" className="text-xs font-medium">
                Code postal
              </label>
              <input
                id="ent-cp"
                type="text"
                value={codePostal}
                onChange={(e) => setCodePostal(e.target.value)}
                placeholder="69002"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="ent-ville" className="text-xs font-medium">
                Ville
              </label>
              <input
                id="ent-ville"
                type="text"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                placeholder="Lyon"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-row-reverse items-center gap-2 border-t border-border bg-secondary/30 p-3">
          <button
            type="button"
            onClick={valider}
            data-testid="ent-valider"
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
          <h1 className="text-lg font-medium text-amber-900">Accès réservé à l'administration</h1>
          <p className="mt-2 text-sm text-amber-900/80">
            Vous êtes actuellement connecté·e en tant que <strong>{libelleRole(roleActif)}</strong>.
            La gestion des entreprises est réservée aux rôles <strong>Coordinateur·rice</strong> et{' '}
            <strong>Administrateur·rice</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
