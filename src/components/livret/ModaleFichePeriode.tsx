import { useEffect, useId, useState } from 'react';
import { CalendarRange, X } from 'lucide-react';
import type { FicheSuiviPeriode } from '@/types';
import { useLivretStore } from '@/store/useLivretStore';
import { type SaisieFichePeriode, validerSaisieFichePeriode } from '@/lib/validation-fiche-periode';
import { cn } from '@/lib/utils';

/**
 * Modale de création / édition d'une fiche de suivi par période.
 * Référence : cahier des charges v1.3, sections 5.3 et 8.3 (R11/R12/R13/R14).
 *
 * - Création : `fiche` undefined → ajoute une nouvelle fiche (numéro auto).
 * - Édition  : `fiche` fourni → met à jour titre / dates de la fiche existante.
 *
 * La validation des règles métier (chevauchement, dernière fiche signée…)
 * est faite via `lib/validation-fiche-periode`.
 */

interface ModaleFichePeriodeProps {
  ouvert: boolean;
  livretId: string;
  /** Fiche à éditer ; absent en mode création. */
  fiche?: FicheSuiviPeriode;
  /** Toutes les fiches existantes du livret (pour valider chevauchements). */
  fichesExistantes: FicheSuiviPeriode[];
  /** Indique si l'entretien tripartite est initialisé (R13). */
  entretienExiste: boolean;
  onAnnuler: () => void;
  onValide?: (ficheId: string) => void;
}

export function ModaleFichePeriode({
  ouvert,
  livretId,
  fiche,
  fichesExistantes,
  entretienExiste,
  onAnnuler,
  onValide,
}: ModaleFichePeriodeProps) {
  const ajouter = useLivretStore((s) => s.ajouterFichePeriode);
  const modifier = useLivretStore((s) => s.modifierFichePeriode);
  const titreId = useId();

  function valeurInitiale(): SaisieFichePeriode {
    if (fiche) {
      return {
        titre: fiche.titre ?? '',
        dateDebut: fiche.dateDebut.slice(0, 10),
        dateFin: fiche.dateFin.slice(0, 10),
      };
    }
    return { titre: '', dateDebut: '', dateFin: '' };
  }

  const [saisie, setSaisie] = useState<SaisieFichePeriode>(valeurInitiale);
  const [tentativeSoumission, setTentativeSoumission] = useState(false);

  useEffect(() => {
    // Pas de side-effect au mount (pattern « key » côté parent).
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

  const validation = validerSaisieFichePeriode(
    saisie,
    fichesExistantes,
    entretienExiste,
    fiche?.id,
  );
  const erreurs = tentativeSoumission ? validation.erreurs : {};
  const avertissements = validation.avertissements;

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setTentativeSoumission(true);
    if (!validation.ok) return;
    let id: string;
    if (fiche) {
      modifier(livretId, fiche.id, {
        titre: saisie.titre,
        dateDebut: saisie.dateDebut,
        dateFin: saisie.dateFin,
      });
      id = fiche.id;
    } else {
      id = ajouter(livretId, {
        titre: saisie.titre,
        dateDebut: saisie.dateDebut,
        dateFin: saisie.dateFin,
      });
    }
    onValide?.(id);
    onAnnuler();
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

      <form
        onSubmit={soumettre}
        className="relative w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-border bg-card shadow-lg"
      >
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <CalendarRange className="h-5 w-5 shrink-0 texte-couleur-role" aria-hidden="true" />
            <div>
              <h2 id={titreId} className="text-lg font-semibold">
                {fiche ? `Modifier la période ${fiche.numeroPeriode}` : 'Nouvelle période'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {fiche
                  ? "Titre et dates : les autres champs s'éditent depuis la fiche."
                  : 'Le numéro est attribué automatiquement.'}
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
          <Champ
            label="Titre (optionnel)"
            valeur={saisie.titre ?? ''}
            onChange={(v) => setSaisie((s) => ({ ...s, titre: v }))}
            avertissement={avertissements.titre}
            hint="Ex : « Stage automne », « Découverte cuisine froide », …"
            testId="periode-titre"
            autoFocus
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Champ
              label="Date de début"
              type="date"
              valeur={saisie.dateDebut}
              onChange={(v) => setSaisie((s) => ({ ...s, dateDebut: v }))}
              erreur={erreurs.dateDebut}
              avertissement={avertissements.dateDebut}
              obligatoire
              testId="periode-date-debut"
            />
            <Champ
              label="Date de fin"
              type="date"
              valeur={saisie.dateFin}
              onChange={(v) => setSaisie((s) => ({ ...s, dateFin: v }))}
              erreur={erreurs.dateFin}
              obligatoire
              testId="periode-date-fin"
            />
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-row-reverse items-center gap-2 border-t border-border bg-secondary/30 p-3">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md bouton-plein-couleur-role px-4 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {fiche ? 'Enregistrer les modifications' : 'Créer la période'}
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

interface ChampProps {
  label: string;
  valeur: string;
  onChange: (v: string) => void;
  type?: 'text' | 'date';
  erreur?: string;
  avertissement?: string;
  hint?: string;
  obligatoire?: boolean;
  testId?: string;
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
