import { useEffect, useId, useState } from 'react';
import { Save, X } from 'lucide-react';
import type { CibleQuestion, QuestionBanque, TypeQuestion } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Modale création / édition d'une question de la banque (CDC §5.2 — refonte
 * mai 2026). Réservée aux rôles `coordo` et `admin` (page d'admin dédiée).
 *
 * En édition, la `cible` n'est pas modifiable : elle conditionne la section
 * dans laquelle la question apparaît, et changer la cible casserait la
 * cohérence des entretiens déjà saisis.
 */

/**
 * Champs éditables depuis la modale. L'affectation E1/E2 et le caractère
 * obligatoire se règlent directement dans le tableau de la banque (cases à
 * cocher) — la modale ne les touche pas pour ne pas écraser la configuration
 * du coordo lors d'une simple correction de libellé.
 */
export type SaisieQuestion = Pick<
  QuestionBanque,
  'libelle' | 'cible' | 'type' | 'placeholder'
>;

interface ModaleQuestionProps {
  ouvert: boolean;
  /** Question existante en édition (sinon création). */
  question?: QuestionBanque;
  onAnnuler: () => void;
  onValider: (valeurs: SaisieQuestion, questionExistante?: QuestionBanque) => void;
}

const TYPES: Array<{ valeur: TypeQuestion; libelle: string; description: string }> = [
  { valeur: 'texte-court', libelle: 'Texte court', description: 'Une ligne (input).' },
  {
    valeur: 'texte-long',
    libelle: 'Texte long',
    description: 'Plusieurs lignes (textarea).',
  },
  { valeur: 'oui-non', libelle: 'Oui / Non', description: '2 boutons exclusifs.' },
];

const CIBLES: Array<{ valeur: CibleQuestion; libelle: string }> = [
  { valeur: 'apprenti', libelle: "Apprenti·e" },
  { valeur: 'maitre', libelle: 'Maître / Tuteur' },
];

export function ModaleQuestion({
  ouvert,
  question,
  onAnnuler,
  onValider,
}: ModaleQuestionProps) {
  const titreId = useId();
  const enEdition = !!question;

  const [libelle, setLibelle] = useState('');
  const [cible, setCible] = useState<CibleQuestion>('apprenti');
  const [type, setType] = useState<TypeQuestion>('texte-long');
  const [placeholder, setPlaceholder] = useState('');
  const [tentative, setTentative] = useState(false);

  // Reset à chaque ouverture pour éviter les états zombies entre ouvertures.
  useEffect(() => {
    if (!ouvert) return;
    setLibelle(question?.libelle ?? '');
    setCible(question?.cible ?? 'apprenti');
    setType(question?.type ?? 'texte-long');
    setPlaceholder(question?.placeholder ?? '');
    setTentative(false);
  }, [ouvert, question]);

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
    tentative && libelleClean.length < 5
      ? 'Le libellé doit faire au moins 5 caractères.'
      : '';

  function valider() {
    setTentative(true);
    if (libelleClean.length < 5) return;
    onValider(
      {
        libelle: libelleClean,
        cible,
        type,
        placeholder: type === 'oui-non' ? undefined : placeholder.trim() || undefined,
      },
      question,
    );
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

      <div className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-border bg-card p-4">
          <h2 id={titreId} className="text-lg font-semibold">
            {enEdition ? 'Modifier la question' : 'Nouvelle question'}
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
          {/* Cible — non modifiable en édition */}
          <div className="space-y-1">
            <label className="text-xs font-medium">
              Destinataire <span className="text-red-600">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CIBLES.map((c) => (
                <button
                  key={c.valeur}
                  type="button"
                  disabled={enEdition}
                  onClick={() => setCible(c.valeur)}
                  data-testid={`q-cible-${c.valeur}`}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                    cible === c.valeur
                      ? 'border-[hsl(var(--ring))] bg-[hsl(var(--ring))] text-white'
                      : 'border-input bg-background text-muted-foreground hover:bg-secondary',
                    enEdition && cible !== c.valeur && 'opacity-30 cursor-not-allowed',
                  )}
                >
                  {c.libelle}
                </button>
              ))}
            </div>
            {enEdition && (
              <p className="text-xs italic text-muted-foreground">
                Le destinataire n'est pas modifiable après création.
              </p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-1">
            <label htmlFor="q-type" className="text-xs font-medium">
              Type de réponse <span className="text-red-600">*</span>
            </label>
            <select
              id="q-type"
              data-testid="q-type"
              value={type}
              onChange={(e) => setType(e.target.value as TypeQuestion)}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {TYPES.map((t) => (
                <option key={t.valeur} value={t.valeur}>
                  {t.libelle} — {t.description}
                </option>
              ))}
            </select>
          </div>

          {/* Libellé */}
          <div className="space-y-1">
            <label htmlFor="q-libelle" className="text-xs font-medium">
              Libellé de la question <span className="text-red-600">*</span>
            </label>
            <textarea
              id="q-libelle"
              data-testid="q-libelle"
              rows={2}
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="Ex : Quelles sont vos motivations pour cette formation ?"
              aria-invalid={!!erreurLibelle}
              className={cn(
                'w-full resize-y rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                erreurLibelle ? 'border-red-400' : 'border-input',
              )}
            />
            {erreurLibelle && (
              <p role="alert" className="text-xs text-red-700">
                {erreurLibelle}
              </p>
            )}
          </div>

          {/* Placeholder — caché pour les questions oui/non */}
          {type !== 'oui-non' && (
            <div className="space-y-1">
              <label htmlFor="q-placeholder" className="text-xs font-medium">
                Aide de saisie (placeholder, optionnel)
              </label>
              <input
                id="q-placeholder"
                data-testid="q-placeholder"
                type="text"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="Ex : Votre projet, vos objectifs…"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex flex-row-reverse items-center gap-2 border-t border-border bg-secondary/30 p-3">
          <button
            type="button"
            onClick={valider}
            data-testid="q-valider"
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
