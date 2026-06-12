import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { GraduationCap, X } from 'lucide-react';
import type { Apprenti, Maitre } from '@/types';
import { useUtilisateursStore } from '@/store/useUtilisateursStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { useUserStore } from '@/store/useUserStore';
import { type SaisieApprenti, validerSaisieApprenti } from '@/lib/validation-apprenti';
import { cn } from '@/lib/utils';

/**
 * Modale de création / édition d'un·e apprenti·e.
 *
 * - Mode `creation` : `apprenti` est `undefined`. À la validation, ajoute un·e
 *   nouvel·le apprenti·e + crée son livret vierge.
 * - Mode `edition`  : `apprenti` est fourni. À la validation, met à jour les
 *   champs existants.
 *
 * L'affectation initiale (formation / maître / formateur / entreprise) est
 * incluse dans le formulaire — l'affectation post-création se fait dans
 * `/admin/affectations` (étape 3).
 *
 * Validation : `lib/validation-apprenti.ts`. Esc / clic arrière-plan / Annuler
 * ferment sans sauvegarder.
 */
interface ModaleApprentiProps {
  ouvert: boolean;
  apprenti?: Apprenti;
  onAnnuler: () => void;
  onValide?: (apprenti: Apprenti) => void;
}

const SAISIE_VIDE: SaisieApprenti = {
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  dateNaissance: '',
  contratDebut: '',
  contratFin: '',
  formationId: '',
  entrepriseId: '',
  maitreApprentissageId: '',
  maitreApprentissageSecondId: undefined,
  formateurReferentId: '',
};

export function ModaleApprenti({ ouvert, apprenti, onAnnuler, onValide }: ModaleApprentiProps) {
  const ajouter = useUtilisateursStore((s) => s.ajouterApprenti);
  const modifier = useUtilisateursStore((s) => s.modifierApprenti);
  const maitres = useUtilisateursStore((s) => s.maitres);
  const formateurs = useUtilisateursStore((s) => s.formateurs);
  const formations = useFormationsStore((s) => s.formations);
  const auteurId = useUserStore((s) => s.utilisateurActif.id);

  const titreId = useId();
  const premierChampRef = useRef<HTMLInputElement>(null);

  const formationsList = useMemo(() => Object.values(formations), [formations]);
  const maitresList = useMemo(() => Object.values(maitres), [maitres]);
  const formateursList = useMemo(() => Object.values(formateurs), [formateurs]);

  // Pré-remplir avec les valeurs de l'apprenti·e à éditer ou avec des défauts
  // sensés en création (premier·e formateur·rice + premier maître + 1ʳᵉ formation).
  function valeurInitiale(): SaisieApprenti {
    if (apprenti) {
      const { id: _id, role: _role, ...rest } = apprenti;
      void _id;
      void _role;
      return rest;
    }
    const formation = formationsList[0];
    const maitre: Maitre | undefined = maitresList[0];
    const formateur = formateursList[0];
    return {
      ...SAISIE_VIDE,
      formationId: formation?.id ?? '',
      maitreApprentissageId: maitre?.id ?? '',
      formateurReferentId: formateur?.id ?? '',
      entrepriseId: maitre?.entreprise ?? '',
    };
  }

  const [saisie, setSaisie] = useState<SaisieApprenti>(valeurInitiale);
  const [tentativeSoumission, setTentativeSoumission] = useState(false);

  // Le state est initialisé via `useState(valeurInitiale)` au mount. Pas de
  // re-set ici : il causait une race avec les inputs sous Playwright (le
  // setSaisie pouvait écraser un fill en cours après que la modale soit
  // « ouverte »). Pour forcer un état frais à chaque ouverture, le parent
  // passe une `key` distincte (cf. GestionUtilisateurs).
  // Focus auto initial via `autoFocus` directement sur l'input (cf. JSX) —
  // le setTimeout(focus, 30ms) précédent déclenchait des sauts de focus
  // pendant les frappes Playwright, pour le même problème de race.
  useEffect(() => {
    // Pas d'effet : conservé pour rester explicite sur le contrat de la
    // modale (pas de side-effects au mount au-delà du render initial).
  }, [ouvert]);

  // Esc pour fermer
  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onAnnuler();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ouvert, onAnnuler]);

  if (!ouvert) return null;

  const validation = validerSaisieApprenti(saisie);
  const erreurs = tentativeSoumission ? validation.erreurs : {};
  // Les avertissements sont visibles en permanence dès que l'utilisateur·rice
  // a saisi les champs concernés — pas besoin d'attendre la soumission.
  const avertissements = validation.avertissements;

  // Synchronisation entreprise ↔ maître : quand on change de maître, l'entreprise
  // par défaut suit (modifiable via le champ entreprise lui-même).
  function changerMaitre(id: string) {
    const maitre = maitresList.find((m) => m.id === id);
    setSaisie((s) => ({
      ...s,
      maitreApprentissageId: id,
      entrepriseId: maitre?.entreprise ?? s.entrepriseId,
    }));
  }

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setTentativeSoumission(true);
    if (!validation.ok) return;
    const nettoyee: SaisieApprenti = {
      ...saisie,
      prenom: saisie.prenom.trim(),
      nom: saisie.nom.trim().toUpperCase(),
      email: saisie.email.trim(),
      telephone: saisie.telephone?.trim(),
      maitreApprentissageSecondId: saisie.maitreApprentissageSecondId || undefined,
    };
    if (apprenti) {
      modifier(apprenti.id, nettoyee);
      onValide?.({ ...apprenti, ...nettoyee });
    } else {
      const cree = ajouter(nettoyee, auteurId);
      onValide?.(cree);
    }
    onAnnuler();
  }

  const titre = apprenti
    ? `Modifier l'apprenti·e ${apprenti.prenom} ${apprenti.nom}`
    : 'Nouvel·le apprenti·e';

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
        className="relative w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-border bg-card shadow-lg"
      >
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <GraduationCap className="h-5 w-5 shrink-0 text-role-apprenti" aria-hidden="true" />
            <div>
              <h2 id={titreId} className="text-lg font-semibold">
                {titre}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Identité, contrat et affectation initiale.
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

        <div className="space-y-4 p-4">
          {/* ── Identité ──────────────────────────────────────────────── */}
          <Section titre="Identité">
            <Champ
              label="Prénom"
              valeur={saisie.prenom}
              onChange={(v) => setSaisie((s) => ({ ...s, prenom: v }))}
              erreur={erreurs.prenom}
              obligatoire
              inputRef={premierChampRef}
              testId="apprenti-prenom"
              autoFocus
            />
            <Champ
              label="Nom"
              valeur={saisie.nom}
              onChange={(v) => setSaisie((s) => ({ ...s, nom: v }))}
              erreur={erreurs.nom}
              obligatoire
              hint="En MAJUSCULES (normalisation auto à la sauvegarde)"
              testId="apprenti-nom"
            />
            <Champ
              label="Email"
              type="email"
              valeur={saisie.email}
              onChange={(v) => setSaisie((s) => ({ ...s, email: v }))}
              erreur={erreurs.email}
              obligatoire
              testId="apprenti-email"
            />
            <Champ
              label="Téléphone"
              type="tel"
              valeur={saisie.telephone ?? ''}
              onChange={(v) => setSaisie((s) => ({ ...s, telephone: v }))}
              testId="apprenti-telephone"
            />
            <Champ
              label="Date de naissance"
              type="date"
              valeur={saisie.dateNaissance}
              onChange={(v) => setSaisie((s) => ({ ...s, dateNaissance: v }))}
              erreur={erreurs.dateNaissance}
              avertissement={avertissements.dateNaissance}
              obligatoire
              testId="apprenti-naissance"
            />
          </Section>

          {/* ── Contrat ──────────────────────────────────────────────── */}
          <Section titre="Contrat d'apprentissage">
            <Champ
              label="Début de contrat"
              type="date"
              valeur={saisie.contratDebut}
              onChange={(v) => setSaisie((s) => ({ ...s, contratDebut: v }))}
              erreur={erreurs.contratDebut}
              obligatoire
              testId="apprenti-contrat-debut"
            />
            <Champ
              label="Fin de contrat"
              type="date"
              valeur={saisie.contratFin}
              onChange={(v) => setSaisie((s) => ({ ...s, contratFin: v }))}
              erreur={erreurs.contratFin}
              obligatoire
              testId="apprenti-contrat-fin"
            />
          </Section>

          {/* ── Affectation initiale ─────────────────────────────────── */}
          <Section titre="Affectation initiale">
            <ChampSelect
              label="Formation"
              valeur={saisie.formationId}
              onChange={(v) => setSaisie((s) => ({ ...s, formationId: v }))}
              options={formationsList.map((f) => ({
                value: f.id,
                libelle: `${f.intitule} (${f.annee})`,
              }))}
              erreur={erreurs.formationId}
              obligatoire
            />
            <ChampSelect
              label="Maître / Tuteur"
              valeur={saisie.maitreApprentissageId}
              onChange={changerMaitre}
              options={maitresList
                .filter((m) => m.id !== saisie.maitreApprentissageSecondId)
                .map((m) => ({
                  value: m.id,
                  libelle: `${m.prenom} ${m.nom}`,
                }))}
              erreur={erreurs.maitreApprentissageId}
              obligatoire
            />
            <ChampSelect
              label="Second maître / tuteur"
              valeur={saisie.maitreApprentissageSecondId ?? ''}
              onChange={(v) =>
                setSaisie((s) => ({ ...s, maitreApprentissageSecondId: v || undefined }))
              }
              options={maitresList
                .filter((m) => m.id !== saisie.maitreApprentissageId)
                .map((m) => ({
                  value: m.id,
                  libelle: `${m.prenom} ${m.nom}`,
                }))}
              erreur={erreurs.maitreApprentissageSecondId}
              optionVide="— Aucun —"
            />
            <Champ
              label="Identifiant entreprise"
              valeur={saisie.entrepriseId}
              onChange={(v) => setSaisie((s) => ({ ...s, entrepriseId: v }))}
              erreur={erreurs.entrepriseId}
              hint="Pré-rempli depuis le maître sélectionné"
              obligatoire
            />
            <ChampSelect
              label="Formateur référent"
              valeur={saisie.formateurReferentId}
              onChange={(v) => setSaisie((s) => ({ ...s, formateurReferentId: v }))}
              options={formateursList.map((f) => ({
                value: f.id,
                libelle: `${f.prenom} ${f.nom}`,
              }))}
              erreur={erreurs.formateurReferentId}
              obligatoire
            />
          </Section>
        </div>

        <div className="sticky bottom-0 flex flex-row-reverse items-center gap-2 border-t border-border bg-secondary/30 p-3">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md bouton-plein-couleur-role px-4 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {apprenti ? 'Enregistrer les modifications' : "Créer l'apprenti·e"}
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
// Sous-composants — section, champ texte, champ select
// ─────────────────────────────────────────────────────────────────────────────

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">{titre}</legend>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

interface ChampProps {
  label: string;
  valeur: string;
  onChange: (v: string) => void;
  type?: 'text' | 'email' | 'tel' | 'date';
  erreur?: string;
  /** Avertissement non-bloquant (affiché en ambre, pas en rouge). */
  avertissement?: string;
  hint?: string;
  obligatoire?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  /** Identifiant stable pour les tests E2E (data-testid). */
  testId?: string;
  /** Focus automatique au mount (1er champ d'un formulaire). */
  autoFocus?: boolean;
}

function Champ({
  label,
  valeur,
  onChange,
  type = 'text',
  erreur,
  avertissement,
  hint,
  obligatoire,
  inputRef,
  testId,
  autoFocus,
}: ChampProps) {
  const id = useId();
  const messageId = useId();
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
        aria-describedby={erreur || avertissement ? messageId : undefined}
        className={cn(
          'w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
          erreur && 'border-red-400',
          !erreur && avertissement && 'border-amber-400',
          !erreur && !avertissement && 'border-input',
        )}
      />
      {hint && !erreur && !avertissement && <p className="text-xs text-muted-foreground">{hint}</p>}
      {erreur && (
        <p id={messageId} role="alert" className="text-xs text-red-700">
          {erreur}
        </p>
      )}
      {!erreur && avertissement && (
        <p id={messageId} className="text-xs text-amber-700">
          ⚠ {avertissement}
        </p>
      )}
    </div>
  );
}

interface ChampSelectProps {
  label: string;
  valeur: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; libelle: string }>;
  erreur?: string;
  obligatoire?: boolean;
  /**
   * Libellé d'une option vide SÉLECTIONNABLE (champ optionnel, ex. second
   * maître). Sans cette prop, l'option vide est « — Choisir — » désactivée.
   */
  optionVide?: string;
}

function ChampSelect({
  label,
  valeur,
  onChange,
  options,
  erreur,
  obligatoire,
  optionVide,
}: ChampSelectProps) {
  const id = useId();
  const erreurId = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium">
        {label}
        {obligatoire && <span className="text-red-600"> *</span>}
      </label>
      <select
        id={id}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!erreur}
        aria-describedby={erreur ? erreurId : undefined}
        className={cn(
          'w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
          erreur ? 'border-red-400' : 'border-input',
        )}
      >
        {optionVide ? (
          <option value="">{optionVide}</option>
        ) : (
          <option value="" disabled>
            — Choisir —
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.libelle}
          </option>
        ))}
      </select>
      {erreur && (
        <p id={erreurId} role="alert" className="text-xs text-red-700">
          {erreur}
        </p>
      )}
    </div>
  );
}
