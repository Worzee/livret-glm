import { useEffect, useId, useRef, useState } from 'react';
import { GraduationCap, X } from 'lucide-react';
import type { Formation, Lieu } from '@/types';
import { useFormationsStore } from '@/store/useFormationsStore';
import {
  type SaisieFormation,
  normaliserSaisieFormation,
  validerSaisieFormation,
} from '@/lib/validation-formation';
import { referentielCapCuisine } from '@/fixtures/referentiel-cap-cuisine';
import { cn } from '@/lib/utils';

/**
 * Modale de création / édition d'une formation.
 *
 * - Mode `creation` : `formation` est `undefined`. Ajoute une nouvelle formation.
 * - Mode `edition`  : `formation` est fourni. Met à jour les champs existants.
 *
 * Validation : `lib/validation-formation.ts`. Esc / clic arrière-plan / Annuler
 * ferment sans sauvegarder.
 *
 * Référentiels : tant que l'UI d'import (Extension 3 phase C) n'est pas livrée,
 * on liste statiquement les référentiels connus. Quand `useReferentielsStore`
 * existera, on s'y branchera ici.
 */

interface ModaleFormationProps {
  ouvert: boolean;
  formation?: Formation;
  onAnnuler: () => void;
  onValide?: (formation: Formation) => void;
}

const LIEU_VIDE: Lieu = { nom: '', adresse: '', codePostal: '', ville: '' };

const SAISIE_VIDE: SaisieFormation = {
  intitule: '',
  niveau: '',
  annee: '',
  referentielId: '',
  dateDebut: '',
  dateFin: '',
  lieu: LIEU_VIDE,
};

// Liste statique des référentiels connus. À remplacer par
// `useReferentielsStore` quand l'extension 3 sera livrée.
const REFERENTIELS_DISPONIBLES = [
  { id: referentielCapCuisine.id, libelle: referentielCapCuisine.formation },
];

// Suggestions de niveaux courants pour le datalist (saisie libre conservée).
const NIVEAUX_SUGGERES = ['CAP', 'BAC PRO', 'BTS', 'BP', 'MC', 'TP'];

export function ModaleFormation({
  ouvert,
  formation,
  onAnnuler,
  onValide,
}: ModaleFormationProps) {
  const ajouter = useFormationsStore((s) => s.ajouterFormation);
  const modifier = useFormationsStore((s) => s.modifierFormation);

  const titreId = useId();
  const premierChampRef = useRef<HTMLInputElement>(null);

  function valeurInitiale(): SaisieFormation {
    if (formation) {
      const { id: _id, lieu, ...rest } = formation;
      void _id;
      return {
        ...rest,
        lieu: {
          nom: lieu.nom,
          adresse: lieu.adresse ?? '',
          codePostal: lieu.codePostal ?? '',
          ville: lieu.ville ?? '',
        },
      };
    }
    return {
      ...SAISIE_VIDE,
      // Pré-sélectionne le seul référentiel disponible si pertinent.
      referentielId: REFERENTIELS_DISPONIBLES[0]?.id ?? '',
    };
  }

  const [saisie, setSaisie] = useState<SaisieFormation>(valeurInitiale);
  const [tentativeSoumission, setTentativeSoumission] = useState(false);

  // Le state est initialisé via `useState(valeurInitiale)` au mount. Pas de
  // re-set ici : il causait une race avec les inputs sous Playwright (le
  // setSaisie pouvait écraser un fill en cours après que la modale soit
  // « ouverte »). Pour forcer un état frais à chaque ouverture, le parent
  // passe une `key` distincte (cf. GestionFormations).
  useEffect(() => {
    if (ouvert) {
      const t = setTimeout(() => premierChampRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
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

  const validation = validerSaisieFormation(saisie);
  const erreurs = tentativeSoumission ? validation.erreurs : {};
  const avertissements = validation.avertissements;

  function setLieu(patch: Partial<Lieu>) {
    setSaisie((s) => ({ ...s, lieu: { ...s.lieu, ...patch } }));
  }

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setTentativeSoumission(true);
    if (!validation.ok) return;
    const nettoyee = normaliserSaisieFormation(saisie);
    let resultat: Formation;
    if (formation) {
      modifier(formation.id, nettoyee);
      resultat = { ...formation, ...nettoyee };
    } else {
      resultat = ajouter(nettoyee);
    }
    onValide?.(resultat);
    onAnnuler();
  }

  const titre = formation ? `Modifier ${formation.intitule}` : 'Nouvelle formation';

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
            <GraduationCap
              className="h-5 w-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div>
              <h2 id={titreId} className="text-lg font-semibold">
                {titre}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Intitulé, dates, lieu et référentiel de la formation.
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
          <Section titre="Identité de la formation">
            <Champ
              label="Intitulé"
              valeur={saisie.intitule}
              onChange={(v) => setSaisie((s) => ({ ...s, intitule: v }))}
              erreur={erreurs.intitule}
              obligatoire
              inputRef={premierChampRef}
              hint="Ex : CAP Cuisine, BAC PRO Commerce…"
            />
            <Champ
              label="Niveau"
              valeur={saisie.niveau}
              onChange={(v) => setSaisie((s) => ({ ...s, niveau: v }))}
              erreur={erreurs.niveau}
              obligatoire
              listId="liste-niveaux"
              datalist={NIVEAUX_SUGGERES}
            />
            <Champ
              label="Année académique"
              valeur={saisie.annee}
              onChange={(v) => setSaisie((s) => ({ ...s, annee: v }))}
              erreur={erreurs.annee}
              avertissement={avertissements.annee}
              obligatoire
              hint="Format : 2025-2026"
            />
            <ChampSelect
              label="Référentiel"
              valeur={saisie.referentielId}
              onChange={(v) => setSaisie((s) => ({ ...s, referentielId: v }))}
              options={REFERENTIELS_DISPONIBLES.map((r) => ({
                value: r.id,
                libelle: r.libelle,
              }))}
              erreur={erreurs.referentielId}
              obligatoire
            />
          </Section>

          <Section titre="Période">
            <Champ
              label="Date de début"
              type="date"
              valeur={saisie.dateDebut}
              onChange={(v) => setSaisie((s) => ({ ...s, dateDebut: v }))}
              erreur={erreurs.dateDebut}
              obligatoire
            />
            <Champ
              label="Date de fin"
              type="date"
              valeur={saisie.dateFin}
              onChange={(v) => setSaisie((s) => ({ ...s, dateFin: v }))}
              erreur={erreurs.dateFin}
              obligatoire
            />
          </Section>

          <Section titre="Lieu de formation">
            <Champ
              label="Nom du lieu"
              valeur={saisie.lieu.nom}
              onChange={(v) => setLieu({ nom: v })}
              erreur={erreurs.lieuNom}
              obligatoire
              hint="Ex : GRETA Lyon Métropole — Site Diderot"
            />
            <Champ
              label="Adresse"
              valeur={saisie.lieu.adresse ?? ''}
              onChange={(v) => setLieu({ adresse: v })}
            />
            <Champ
              label="Code postal"
              valeur={saisie.lieu.codePostal ?? ''}
              onChange={(v) => setLieu({ codePostal: v })}
            />
            <Champ
              label="Ville"
              valeur={saisie.lieu.ville ?? ''}
              onChange={(v) => setLieu({ ville: v })}
            />
          </Section>
        </div>

        <div className="sticky bottom-0 flex flex-row-reverse items-center gap-2 border-t border-border bg-secondary/30 p-3">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {formation ? 'Enregistrer les modifications' : 'Créer la formation'}
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
  type?: 'text' | 'date';
  erreur?: string;
  avertissement?: string;
  hint?: string;
  obligatoire?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  /** Si fourni, attache un <datalist> avec ces suggestions (saisie libre conservée). */
  listId?: string;
  datalist?: string[];
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
  listId,
  datalist,
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
        list={listId}
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
      {listId && datalist && (
        <datalist id={listId}>
          {datalist.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
      )}
      {hint && !erreur && !avertissement && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
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
}

function ChampSelect({ label, valeur, onChange, options, erreur, obligatoire }: ChampSelectProps) {
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
        <option value="" disabled>
          — Choisir —
        </option>
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
