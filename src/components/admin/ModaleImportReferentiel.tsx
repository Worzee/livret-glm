import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  X,
} from 'lucide-react';
import {
  estXlsxBuffer,
  importerReferentielDepuisBuffer,
  importerReferentielDepuisTexte,
  importerReferentielDepuisXlsxBuffer,
  type RapportImport,
} from '@/lib/import-referentiel';
import {
  type SaisieImportReferentiel,
  genererNomReferentiel,
  validerSaisieImportReferentiel,
} from '@/lib/validation-import-referentiel';
import { useFormationsStore } from '@/store/useFormationsStore';
import { useReferentielsStore } from '@/store/useReferentielsStore';
import { cn } from '@/lib/utils';

/**
 * Modale d'import d'un référentiel de compétences.
 * Référence : cahier des charges v1.3, extension 3 phase C.
 *
 * Workflow finalisé avec le pilote (mai 2026) :
 *   1. L'utilisateur·rice choisit la **formation** à laquelle rattacher le
 *      référentiel (select sur les formations existantes).
 *   2. Il/elle fournit un fichier (CSV ou XLSX) **OU** colle le contenu
 *      CSV dans un textarea (utile pour des tests rapides).
 *   3. Clic « Aperçu » → analyse + stats + détection auto du format
 *      (signature ZIP pour XLSX, encodage UTF-8/CP1252 pour CSV).
 *   4. Clic « Importer » → le référentiel est créé avec le libellé
 *      `Referentiel_<intituléFormation>_<YYYY-MM-DD>`, et la formation
 *      est mise à jour pour pointer dessus (`formation.referentielId`).
 *
 * Esc / clic backdrop / Annuler ferment sans rien persister.
 */

interface ModaleImportReferentielProps {
  ouvert: boolean;
  /** Présélection optionnelle de la formation cible. */
  formationIdInitial?: string;
  onAnnuler: () => void;
  onValide?: (idReferentiel: string) => void;
}

const SAISIE_VIDE: SaisieImportReferentiel = {
  formationId: '',
  source: 'fichier',
  nomFichier: '',
  contenuCsv: '',
};

interface AperçuOk {
  type: 'ok';
  rapport: RapportImport;
  remplaceReferentielExistant?: { id: string; libelle: string };
}
interface AperçuErreur {
  type: 'erreur';
  message: string;
}
type Apercu = AperçuOk | AperçuErreur | null;

export function ModaleImportReferentiel({
  ouvert,
  formationIdInitial,
  onAnnuler,
  onValide,
}: ModaleImportReferentielProps) {
  const ajouter = useReferentielsStore((s) => s.ajouterReferentiel);
  const referentielsExistants = useReferentielsStore((s) => s.referentiels);
  const formations = useFormationsStore((s) => s.formations);
  const modifierFormation = useFormationsStore((s) => s.modifierFormation);

  const titreId = useId();
  const premierChampRef = useRef<HTMLSelectElement>(null);

  const formationsListe = useMemo(
    () =>
      Object.values(formations).sort((a, b) =>
        a.intitule.localeCompare(b.intitule, 'fr-FR'),
      ),
    [formations],
  );

  const [saisie, setSaisie] = useState<SaisieImportReferentiel>(() => ({
    ...SAISIE_VIDE,
    formationId: formationIdInitial ?? '',
  }));
  // Le buffer est conservé séparément du state validé : il porte l'encodage
  // d'origine (CP1252) que le parser CSV sait gérer, ou la signature ZIP
  // qui révèle un .xlsx.
  const [bufferFichier, setBufferFichier] = useState<ArrayBuffer | null>(null);
  const [tentativeSoumission, setTentativeSoumission] = useState(false);
  const [apercu, setApercu] = useState<Apercu>(null);

  useEffect(() => {
    // Pas de side-effect au mount : le focus auto est géré via `autoFocus`
    // sur le select. Évite la race entre setTimeout(focus) et les frappes E2E.
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

  const formationCible = formations[saisie.formationId];

  async function onChangerFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    setBufferFichier(buf);
    setSaisie((s) => ({
      ...s,
      source: 'fichier',
      nomFichier: file.name,
      contenuCsv: '', // exclusif avec le fichier
    }));
    setApercu(null);
  }

  function onChangerTextarea(value: string) {
    setSaisie((s) => ({
      ...s,
      source: 'texte',
      contenuCsv: value,
      nomFichier: '',
    }));
    if (bufferFichier) setBufferFichier(null);
    setApercu(null);
  }

  function genererApercu() {
    setTentativeSoumission(true);
    if (!validation.ok) {
      setApercu(null);
      return;
    }
    if (!formationCible) {
      // Sécurité : on ne devrait pas arriver ici grâce à la validation.
      setApercu({ type: 'erreur', message: 'Formation introuvable.' });
      return;
    }
    const nomReferentiel = genererNomReferentiel(formationCible);
    try {
      let rapport: RapportImport;
      if (saisie.source === 'fichier' && bufferFichier) {
        // Détection automatique XLSX vs CSV par signature de fichier.
        rapport = estXlsxBuffer(bufferFichier)
          ? importerReferentielDepuisXlsxBuffer(bufferFichier, {
              nomFormation: nomReferentiel,
            })
          : importerReferentielDepuisBuffer(bufferFichier, {
              nomFormation: nomReferentiel,
            });
      } else {
        rapport = importerReferentielDepuisTexte(saisie.contenuCsv ?? '', {
          nomFormation: nomReferentiel,
        });
      }
      const refExistant = formationCible.referentielId
        ? referentielsExistants[formationCible.referentielId]
        : undefined;
      setApercu({
        type: 'ok',
        rapport,
        remplaceReferentielExistant: refExistant
          ? { id: refExistant.id, libelle: refExistant.formation }
          : undefined,
      });
    } catch (err) {
      setApercu({
        type: 'erreur',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  function importer() {
    if (!apercu || apercu.type !== 'ok') return;
    if (!formationCible) return;
    const ref = ajouter(apercu.rapport.referentiel);
    // Rattache la formation au nouveau référentiel.
    modifierFormation(formationCible.id, { referentielId: ref.id });
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
                Format CSV (UTF-8 ou Windows-1252, séparateur <code>;</code>) ou XLSX. La
                première ligne est ignorée (en-têtes). 2 ou 3 colonnes selon la profondeur.
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
          {/* Formation cible */}
          <div className="space-y-1">
            <label htmlFor="import-ref-formation" className="text-xs font-medium">
              Formation à associer <span className="text-red-600">*</span>
            </label>
            <select
              id="import-ref-formation"
              ref={premierChampRef}
              data-testid="import-ref-formation"
              autoFocus
              value={saisie.formationId}
              onChange={(e) => {
                setSaisie((s) => ({ ...s, formationId: e.target.value }));
                setApercu(null);
              }}
              aria-invalid={!!erreurs.formationId}
              className={cn(
                'w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                erreurs.formationId ? 'border-red-400' : 'border-input',
              )}
            >
              <option value="">— Choisir une formation —</option>
              {formationsListe.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.intitule} ({f.annee})
                </option>
              ))}
            </select>
            {erreurs.formationId && (
              <p role="alert" className="text-xs text-red-700">
                {erreurs.formationId}
              </p>
            )}
            {formationsListe.length === 0 && !erreurs.formationId && (
              <p className="text-xs text-amber-700">
                ⚠ Aucune formation disponible. Créez d'abord la formation depuis la page{' '}
                <em>Formations</em>.
              </p>
            )}
            {formationCible && (
              <p className="text-xs text-muted-foreground">
                Le référentiel sera nommé{' '}
                <code className="rounded bg-secondary px-1 py-0.5">
                  {genererNomReferentiel(formationCible)}
                </code>
              </p>
            )}
          </div>

          {/* Source : fichier OU texte collé. La présence d'un fichier prend le pas. */}
          <div className="space-y-2">
            <label htmlFor="import-ref-fichier" className="text-xs font-medium">
              Fichier (.csv ou .xlsx)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="import-ref-fichier"
                type="file"
                accept=".csv,.xlsx,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={onChangerFichier}
                className="text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-secondary/80"
              />
              {saisie.nomFichier && (
                <span className="text-xs text-muted-foreground">{saisie.nomFichier}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Ou collez le contenu CSV ci-dessous (utile pour les tests rapides) :
            </p>
            <textarea
              rows={5}
              data-testid="import-ref-csv"
              value={saisie.contenuCsv ?? ''}
              onChange={(e) => onChangerTextarea(e.target.value)}
              placeholder={'BLOC;COMPETENCE;SOUS-COMPETENCE\nBLOC 1;COMPETENCE 1;SOUS-COMPETENCE 1'}
              className={cn(
                'w-full resize-y rounded-md border bg-background px-3 py-1.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring',
                erreurs.contenuCsv ? 'border-red-400' : 'border-input',
                bufferFichier && 'opacity-50',
              )}
              aria-invalid={!!erreurs.contenuCsv}
              readOnly={bufferFichier !== null}
            />
            {erreurs.contenuCsv && (
              <p role="alert" className="text-xs text-red-700">
                {erreurs.contenuCsv}
              </p>
            )}
          </div>

          {/* Aperçu — affiché uniquement après clic sur « Aperçu ». */}
          {apercu?.type === 'ok' && <AperçuStats apercu={apercu} />}
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
// Aperçu : statistiques + avertissements + remplacement éventuel
// ─────────────────────────────────────────────────────────────────────────────

function AperçuStats({ apercu }: { apercu: AperçuOk }) {
  const { rapport, remplaceReferentielExistant } = apercu;
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
              Format :{' '}
              <code className="rounded bg-emerald-100 px-1">
                {rapport.referentiel.source === 'import-xlsx' ? 'XLSX' : 'CSV'}
              </code>
            </li>
          </ul>
        </div>
      </div>
      {remplaceReferentielExistant && (
        <div className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-900">
          ⚠ La formation est actuellement rattachée à{' '}
          <strong>{remplaceReferentielExistant.libelle}</strong>. L'import remplacera ce
          rattachement. L'ancien référentiel reste disponible (suppression manuelle si nécessaire).
        </div>
      )}
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
