import { useEffect, useId, useRef, useState } from 'react';
import { HardHat, ShieldCheck, UserCog, X } from 'lucide-react';
import type { Coordo, Formateur, Maitre } from '@/types';
import { useUtilisateursStore } from '@/store/useUtilisateursStore';
import {
  type SaisieStaff,
  validerSaisieStaff,
} from '@/lib/validation-utilisateur-staff';
import { libelleRole } from '@/lib/droits';
import { cn } from '@/lib/utils';

/**
 * Modale unique de création / édition pour les 3 rôles « staff » :
 * maître d'apprentissage, formateur référent, coordo.
 *
 * Différences entre rôles :
 *   - le maître a un champ supplémentaire `entrepriseId` (obligatoire)
 *   - les autres champs sont identiques (identité)
 *
 * L'affectation (apprenti·e·s pour le maître, promo pour le formateur,
 * formations pour le coordo) n'est pas dans cette modale — elle relève
 * de `/admin/affectations` (étape 3).
 */

export type RoleStaff = 'maitre' | 'formateur' | 'coordo';

interface ModaleUtilisateurStaffProps {
  ouvert: boolean;
  /** Type de staff à créer / éditer. */
  role: RoleStaff;
  /**
   * Si fourni : mode édition. Sinon : mode création.
   * Le type est élargi pour accepter n'importe lequel des 3 rôles.
   */
  utilisateur?: Maitre | Formateur | Coordo;
  onAnnuler: () => void;
  onValide?: (utilisateur: Maitre | Formateur | Coordo) => void;
}

const SAISIE_VIDE: SaisieStaff = {
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  entrepriseId: '',
};

const ICONES: Record<RoleStaff, { Icon: typeof HardHat; couleur: string }> = {
  maitre: { Icon: HardHat, couleur: 'text-role-maitre' },
  formateur: { Icon: UserCog, couleur: 'text-role-formateur' },
  coordo: { Icon: ShieldCheck, couleur: 'text-role-coordo' },
};

export function ModaleUtilisateurStaff({
  ouvert,
  role,
  utilisateur,
  onAnnuler,
  onValide,
}: ModaleUtilisateurStaffProps) {
  const ajouterMaitre = useUtilisateursStore((s) => s.ajouterMaitre);
  const ajouterFormateur = useUtilisateursStore((s) => s.ajouterFormateur);
  const ajouterCoordo = useUtilisateursStore((s) => s.ajouterCoordo);
  const modifierMaitre = useUtilisateursStore((s) => s.modifierMaitre);
  const modifierFormateur = useUtilisateursStore((s) => s.modifierFormateur);
  const modifierCoordo = useUtilisateursStore((s) => s.modifierCoordo);

  const titreId = useId();
  const premierChampRef = useRef<HTMLInputElement>(null);

  const exigeEntreprise = role === 'maitre';

  function valeurInitiale(): SaisieStaff {
    if (utilisateur) {
      return {
        prenom: utilisateur.prenom,
        nom: utilisateur.nom,
        email: utilisateur.email,
        telephone: utilisateur.telephone ?? '',
        entrepriseId: 'entrepriseId' in utilisateur ? utilisateur.entrepriseId : '',
      };
    }
    return SAISIE_VIDE;
  }

  const [saisie, setSaisie] = useState<SaisieStaff>(valeurInitiale);
  const [tentativeSoumission, setTentativeSoumission] = useState(false);

  // Le state est initialisé via `useState(valeurInitiale)` au mount. Pas de
  // re-set ici : il causait une race avec les inputs sous Playwright (le
  // setSaisie pouvait écraser un fill en cours après que la modale soit
  // « ouverte »). Idem pour le `setTimeout(focus, 30ms)` retiré : il
  // déclenchait des sauts de focus pendant les frappes E2E. Le focus auto
  // initial est désormais géré via `autoFocus` directement sur l'input.
  // Pour forcer un état frais à chaque ouverture, le parent passe une
  // `key` distincte (cf. GestionUtilisateurs).
  useEffect(() => {
    // Hook conservé pour rester explicite sur l'absence de side-effect.
  }, [ouvert]);

  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onAnnuler();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ouvert, onAnnuler]);

  if (!ouvert) return null;

  const validation = validerSaisieStaff(saisie, exigeEntreprise);
  const erreurs = tentativeSoumission ? validation.erreurs : {};

  const { Icon, couleur } = ICONES[role];

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setTentativeSoumission(true);
    if (!validation.ok) return;

    const champsCommuns = {
      prenom: saisie.prenom.trim(),
      nom: saisie.nom.trim().toUpperCase(),
      email: saisie.email.trim(),
      telephone: saisie.telephone?.trim(),
    };

    let resultat: Maitre | Formateur | Coordo;
    if (utilisateur) {
      // Édition
      switch (role) {
        case 'maitre':
          modifierMaitre(utilisateur.id, {
            ...champsCommuns,
            entrepriseId: saisie.entrepriseId?.trim() ?? '',
          });
          resultat = {
            ...(utilisateur as Maitre),
            ...champsCommuns,
            entrepriseId: saisie.entrepriseId?.trim() ?? '',
          };
          break;
        case 'formateur':
          modifierFormateur(utilisateur.id, champsCommuns);
          resultat = { ...(utilisateur as Formateur), ...champsCommuns };
          break;
        case 'coordo':
          modifierCoordo(utilisateur.id, champsCommuns);
          resultat = { ...(utilisateur as Coordo), ...champsCommuns };
          break;
      }
    } else {
      // Création
      switch (role) {
        case 'maitre':
          resultat = ajouterMaitre({
            ...champsCommuns,
            entrepriseId: saisie.entrepriseId?.trim() ?? '',
          });
          break;
        case 'formateur':
          resultat = ajouterFormateur(champsCommuns);
          break;
        case 'coordo':
          resultat = ajouterCoordo(champsCommuns);
          break;
      }
    }

    onValide?.(resultat);
    onAnnuler();
  }

  const titre = utilisateur
    ? `Modifier ${utilisateur.prenom} ${utilisateur.nom}`
    : `Nouveau · ${libelleRole(role)}`;

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

      <form
        onSubmit={soumettre}
        className="relative w-full max-w-xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-border bg-card shadow-lg"
      >
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <Icon className={cn('h-5 w-5 shrink-0', couleur)} aria-hidden="true" />
            <div>
              <h2 id={titreId} className="text-lg font-semibold">
                {titre}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Identité du compte. L'affectation (apprenti·e·s, promo, formations)
                se gère dans la page <em>Affectations</em>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onAnnuler}
            aria-label="Fermer"
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Champ
              label="Prénom"
              valeur={saisie.prenom}
              onChange={(v) => setSaisie((s) => ({ ...s, prenom: v }))}
              erreur={erreurs.prenom}
              obligatoire
              inputRef={premierChampRef}
              testId="staff-prenom"
              autoFocus
            />
            <Champ
              label="Nom"
              valeur={saisie.nom}
              onChange={(v) => setSaisie((s) => ({ ...s, nom: v }))}
              erreur={erreurs.nom}
              obligatoire
              hint="En MAJUSCULES (normalisation auto)"
              testId="staff-nom"
            />
            <Champ
              label="Email"
              type="email"
              valeur={saisie.email}
              onChange={(v) => setSaisie((s) => ({ ...s, email: v }))}
              erreur={erreurs.email}
              obligatoire
              testId="staff-email"
            />
            <Champ
              label="Téléphone"
              type="tel"
              valeur={saisie.telephone ?? ''}
              onChange={(v) => setSaisie((s) => ({ ...s, telephone: v }))}
              testId="staff-telephone"
            />
            {role === 'maitre' && (
              <Champ
                label="Identifiant entreprise"
                valeur={saisie.entrepriseId ?? ''}
                onChange={(v) => setSaisie((s) => ({ ...s, entrepriseId: v }))}
                erreur={erreurs.entrepriseId}
                obligatoire
                hint="Code court, ex : e-le-gourmet"
                testId="staff-entreprise"
              />
            )}
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-row-reverse items-center gap-2 border-t border-border bg-secondary/30 p-3">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {utilisateur ? 'Enregistrer les modifications' : `Créer ${libelleRole(role).toLowerCase()}`}
          </button>
          <button
            type="button"
            onClick={onAnnuler}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Annuler
          </button>
          {tentativeSoumission && !validation.ok && (
            <p role="alert" className="mr-auto text-sm text-red-700">
              Veuillez corriger les erreurs ci-dessus.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant — champ texte avec erreur + hint
// ─────────────────────────────────────────────────────────────────────────────

interface ChampProps {
  label: string;
  valeur: string;
  onChange: (v: string) => void;
  type?: 'text' | 'email' | 'tel';
  erreur?: string;
  hint?: string;
  obligatoire?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  /** Identifiant stable pour les tests E2E (data-testid). */
  testId?: string;
  /** Focus auto au mount (1er champ d'un formulaire). */
  autoFocus?: boolean;
}

function Champ({
  label,
  valeur,
  onChange,
  type = 'text',
  erreur,
  hint,
  obligatoire,
  inputRef,
  testId,
  autoFocus,
}: ChampProps) {
  const id = useId();
  const erreurId = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium">
        {label}
        {obligatoire && <span className="text-red-600"> *</span>}
      </label>
      <input
        id={id}
        ref={inputRef}
        type={type}
        value={valeur}
        data-testid={testId}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!erreur}
        aria-describedby={erreur ? erreurId : undefined}
        className={cn(
          'w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
          erreur ? 'border-red-400' : 'border-input',
        )}
      />
      {hint && !erreur && <p className="text-xs text-muted-foreground">{hint}</p>}
      {erreur && (
        <p id={erreurId} role="alert" className="text-xs text-red-700">
          {erreur}
        </p>
      )}
    </div>
  );
}
