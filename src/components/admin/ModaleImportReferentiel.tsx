import { useEffect, useId, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  X,
} from 'lucide-react';
import {
  importerReferentielDepuisBuffer,
  importerReferentielDepuisTexte,
  type RapportImport,
} from '@/lib/import-referentiel';
import {
  type SaisieImportReferentiel,
  validerSaisieImportReferentiel,
} from '@/lib/validation-import-referentiel';
import { useReferentielsStore } from '@/store/useReferentielsStore';
import { cn } from '@/lib/utils';

/**
 * Modale d'import d'un référentiel de compétences.
 * Référence : cahier des charges v1.3, extension 3 phase C.
 *
 * Deux modes d'entrée :
 *   - sélection d'un fichier CSV (UTF-8 ou Windows-1252 — auto-détecté)
 *   - copier-coller du contenu dans un textarea (utile pour démo/test)
 *
 * Workflow en 2 temps :
 *   1. L'utilisateur·rice saisit le nom + fournit le contenu → bouton « Aperçu »
 *   2. Un rapport (stats + avertissements) s'affiche → bouton « Importer »
 *      crée effectivement le référentiel dans le store.
 *
 * Le 2-temps évite d'écrire un référentiel mal formé sans confirmation.
 * Esc / clic backdrop / Annuler ferment sans rien persister.
 */

interface ModaleImportReferentielProps {
  ouvert: boolean;
  onAnnuler: () => void;
  onValide?: (idReferentiel: string) => void;
}

const SAISIE_VIDE: SaisieImportReferentiel = {
  nomFormation: '',
  contenuCsv: '',
};

interface AperçuOk {
  type: 'ok';
  rapport: RapportImport;
}
interface AperçuErreur {
  type: 'erreur';
  message: string;
}
type Apercu = AperçuOk | AperçuErreur | null;

export function ModaleImportReferentiel({
  ouvert,
  onAnnuler,
  onValide,
}: ModaleImportReferentielProps) {
  const ajouter = useReferentielsStore((s) => s.ajouterReferentiel);

  const titreId = useId();
  const premierChampRef = useRef<HTMLInputElement>(null);

  // En entrée le buffer prend le pas sur le contenuCsv si fourni : il porte
  // l'encodage d'origine (CP1252) que le parser sait gérer. Le textarea sert
  // surtout aux démos rapides (UTF-8 implicite).
  const [saisie, setSaisie] = useState<SaisieImportReferentiel>(SAISIE_VIDE);
  const [bufferFichier, setBufferFichier] = useState<ArrayBuffer | null>(null);
  const [nomFichier, setNomFichier] = useState<string>('');
  const [tentativeSoumission, setTentativeSoumission] = useState(false);
  const [apercu, setApercu] = useState<Apercu>(null);

  useEffect(() => {
    // Pas de side-effect au mount : le focus auto est géré via `autoFocus`
    // sur l'input. Évite la race entre setTimeout(focus) et les frappes E2E.
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

  const validation = validerSaisieImportReferentiel(saisie);
  const erreurs = tentativeSoumission ? validation.erreurs : {};
  const avertissements = validation.avertissements;

  async function onChangerFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    setBufferFichier(buf);
    setNomFichier(file.name);
    // On vide le textarea pour signifier qu'il est inactif quand un fichier
    // est chargé — évite la confusion sur la source utilisée.
    setSaisie((s) => ({ ...s, contenuCsv: '' }));
    // Reset l'aperçu : il faudra cliquer à nouveau sur « Aperçu ».
    setApercu(null);
  }

  function genererApercu() {
    setTentativeSoumission(true);
    // Si on a un fichier, le contenu CSV peut être vide — le parser lit le
    // buffer directement. Sinon on exige du texte dans le textarea.
    const aDuFichier = bufferFichier !== null;
    const validePourFichier =
      saisie.nomFormation.trim().length > 0 && (aDuFichier || saisie.contenuCsv.trim().length > 0);
    if (!validePourFichier) {
      setApercu(null);
      return;
    }
    try {
      const rapport = aDuFichier
        ? importerReferentielDepuisBuffer(bufferFichier!, {
            nomFormation: saisie.nomFormation.trim(),
          })
        : importerReferentielDepuisTexte(saisie.contenuCsv, {
            nomFormation: saisie.nomFormation.trim(),
          });
      setApercu({ type: 'ok', rapport });
    } catch (err) {
      setApercu({
        type: 'erreur',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  function importer() {
    if (!apercu || apercu.type !== 'ok') return;
    const ref = ajouter(apercu.rapport.referentiel);
    onValide?.(ref.id);
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

      <div className="relative w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <h2 id={titreId} className="text-lg font-semibold">
                Importer un référentiel
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                CSV à 2 ou 3 colonnes. Encodage UTF-8 ou Windows-1252 — détecté automatiquement.
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
          <div className="space-y-1">
            <label htmlFor="nom-formation" className="text-xs font-medium">
              Nom de la formation <span className="text-red-600">*</span>
            </label>
            <input
              id="nom-formation"
              ref={premierChampRef}
              type="text"
              data-testid="import-ref-nom"
              autoFocus
              value={saisie.nomFormation}
              onChange={(e) => {
                setSaisie((s) => ({ ...s, nomFormation: e.target.value }));
                setApercu(null);
              }}
              placeholder="Ex : CECRL Anglais B2"
              aria-invalid={!!erreurs.nomFormation}
              className={cn(
                'w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                erreurs.nomFormation && 'border-red-400',
                !erreurs.nomFormation && avertissements.nomFormation && 'border-amber-400',
                !erreurs.nomFormation && !avertissements.nomFormation && 'border-input',
              )}
            />
            {erreurs.nomFormation && (
              <p role="alert" className="text-xs text-red-700">
                {erreurs.nomFormation}
              </p>
            )}
            {!erreurs.nomFormation && avertissements.nomFormation && (
              <p className="text-xs text-amber-700">⚠ {avertissements.nomFormation}</p>
            )}
          </div>

          {/* Source : fichier OU texte collé. La présence d'un fichier prend le pas. */}
          <div className="space-y-2">
            <label htmlFor="fichier-csv" className="text-xs font-medium">
              Fichier CSV
            </label>
            <div className="flex items-center gap-2">
              <input
                id="fichier-csv"
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={onChangerFichier}
                className="text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-secondary/80"
              />
              {nomFichier && (
                <span className="text-xs text-muted-foreground">{nomFichier}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Ou collez le contenu du référentiel ci-dessous (utile pour les tests rapides) :
            </p>
            <textarea
              rows={6}
              data-testid="import-ref-csv"
              value={saisie.contenuCsv}
              onChange={(e) => {
                setSaisie((s) => ({ ...s, contenuCsv: e.target.value }));
                if (bufferFichier) {
                  setBufferFichier(null);
                  setNomFichier('');
                }
                setApercu(null);
              }}
              placeholder={'Bloc;Sous-famille;Compétence\nA1.1;Compréhension orale;Reconnaître des mots…'}
              className={cn(
                'w-full resize-y rounded-md border bg-background px-3 py-1.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring',
                erreurs.contenuCsv ? 'border-red-400' : 'border-input',
                bufferFichier && 'opacity-50',
              )}
              aria-invalid={!!erreurs.contenuCsv}
              readOnly={bufferFichier !== null}
            />
            {erreurs.contenuCsv && !bufferFichier && (
              <p role="alert" className="text-xs text-red-700">
                {erreurs.contenuCsv}
              </p>
            )}
          </div>

          {/* Aperçu — affiché uniquement après clic sur « Aperçu ». */}
          {apercu?.type === 'ok' && <AperçuStats rapport={apercu.rapport} />}
          {apercu?.type === 'erreur' && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong>Échec de l'analyse :</strong> {apercu.message}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex flex-row-reverse items-center gap-2 border-t border-border bg-secondary/30 p-3">
          {apercu?.type === 'ok' ? (
            <button
              type="button"
              onClick={importer}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Importer ({apercu.rapport.stats.nbCompetences} compétences)
            </button>
          ) : (
            <button
              type="button"
              onClick={genererApercu}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Aperçu
            </button>
          )}
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

// ─────────────────────────────────────────────────────────────────────────────
// Aperçu : statistiques + avertissements
// ─────────────────────────────────────────────────────────────────────────────

function AperçuStats({ rapport }: { rapport: RapportImport }) {
  const { stats, avertissements } = rapport;
  return (
    <div className="space-y-2 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
      <div className="flex items-start gap-2">
        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <strong>Aperçu prêt — {rapport.referentiel.formation}</strong>
          <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
            <li>
              <strong>{stats.nbBlocs}</strong> bloc{stats.nbBlocs > 1 ? 's' : ''}
            </li>
            <li>
              <strong>{stats.nbCompetences}</strong> compétence{stats.nbCompetences > 1 ? 's' : ''}
            </li>
            {stats.niveauxColonnes === 3 && (
              <li>
                <strong>{stats.nbSousFamilles}</strong> sous-famille
                {stats.nbSousFamilles > 1 ? 's' : ''}
              </li>
            )}
            <li>Niveau : {stats.niveauxColonnes} colonnes</li>
            <li>Encodage : {stats.encodageUtilise}</li>
            <li>
              Séparateur :{' '}
              <code className="rounded bg-emerald-100 px-1">{stats.separateurUtilise === '\t' ? '\\t' : stats.separateurUtilise}</code>
            </li>
          </ul>
        </div>
      </div>
      {avertissements.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-amber-800">
            ⚠ {avertissements.length} avertissement{avertissements.length > 1 ? 's' : ''} non bloquant
            {avertissements.length > 1 ? 's' : ''}
          </summary>
          <ul className="mt-1 space-y-0.5 pl-4 text-amber-800">
            {avertissements.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
