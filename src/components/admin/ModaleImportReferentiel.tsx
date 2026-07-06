import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Undo2,
  Upload,
  X,
} from 'lucide-react';
import type { Referentiel } from '@/types';
import {
  estXlsxBuffer,
  importerReferentielDepuisBuffer,
  importerReferentielDepuisTexte,
  importerReferentielDepuisXlsxBuffer,
  type RapportImport,
} from '@/lib/import-referentiel';
import {
  agregerAuNiveauSuperieur,
  appliquerExclusions,
  compterCompetencesEvaluables,
  peutAgregerAuNiveauSuperieur,
} from '@/lib/limite-referentiel';
import { grouperParSousFamille } from '@/lib/grouper-competences';
import {
  type SaisieImportReferentiel,
  genererNomReferentiel,
  validerSaisieImportReferentiel,
} from '@/lib/validation-import-referentiel';
import { useFormationsStore } from '@/store/useFormationsStore';
import { useReferentielsStore } from '@/store/useReferentielsStore';
import { useParametresStore } from '@/store/useParametresStore';
import { cn } from '@/lib/utils';

/**
 * Modale d'import d'un référentiel de compétences.
 * Référence : cahier des charges v1.3, extension 3 phase C.
 *
 * Workflow étendu (mai 2026) :
 *   1. L'utilisateur·rice **peut** choisir une formation à rattacher (select
 *      sur les formations existantes). C'est désormais **optionnel** : un
 *      référentiel peut être importé seul puis rattaché plus tard à une ou
 *      plusieurs formations depuis la page Formations.
 *      - Si une formation est choisie → le libellé est auto-généré
 *        `Referentiel_<intituléFormation>_<YYYY-MM-DD>` et la formation est
 *        mise à jour pour pointer sur le nouveau référentiel.
 *      - Si aucune formation n'est choisie → un champ « Nom du référentiel »
 *        apparaît et devient obligatoire (≥ 3 caractères).
 *   2. Il/elle fournit un fichier (CSV ou XLSX) **OU** colle le contenu
 *      CSV dans un textarea (utile pour des tests rapides).
 *   3. Clic « Aperçu » → analyse + stats + détection auto du format
 *      (signature ZIP pour XLSX, encodage UTF-8/CP1252 pour CSV).
 *   4. Clic « Importer » → le référentiel est créé avec le libellé déterminé
 *      en (1).
 *
 * Limite des lignes évaluables (juillet 2026 — chantier référentiels #2) :
 * au-delà du seuil global (40 par défaut, `useParametresStore`), l'import est
 * bloqué et deux issues sont proposées :
 *   - **agréger au niveau supérieur** (référentiels 3 niveaux) : chaque
 *     sous-famille devient la ligne évaluable, libellés fins en description ;
 *   - **cocher / décocher** des compétences jusqu'à passer sous le seuil —
 *     les décochées sont importées avec `exclue: true` (réactivables depuis
 *     la page Référentiels).
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
  nomReferentielLibre: '',
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
  const seuil = useParametresStore((s) => s.seuilCompetencesEvaluables);

  const titreId = useId();
  const premierChampRef = useRef<HTMLSelectElement>(null);

  const formationsListe = useMemo(
    () => Object.values(formations).sort((a, b) => a.intitule.localeCompare(b.intitule, 'fr-FR')),
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
  // Résolution du dépassement de seuil (juillet 2026) : agrégation au niveau
  // supérieur et/ou exclusions cochées manuellement. Réinitialisées à chaque
  // nouvel aperçu.
  const [agrege, setAgrege] = useState(false);
  const [exclusions, setExclusions] = useState<ReadonlySet<string>>(new Set());

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

  function reinitialiserResolution() {
    setAgrege(false);
    setExclusions(new Set());
  }

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
    reinitialiserResolution();
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
    reinitialiserResolution();
  }

  function genererApercu() {
    setTentativeSoumission(true);
    reinitialiserResolution();
    if (!validation.ok) {
      setApercu(null);
      return;
    }
    // Le libellé final dépend du chemin : si une formation est rattachée, on
    // utilise la convention canonique (auto-générée). Sinon, on respecte le
    // nom libre saisi tel quel.
    const nomReferentiel = formationCible
      ? genererNomReferentiel(formationCible)
      : (saisie.nomReferentielLibre ?? '').trim();
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
      const refExistant = formationCible?.referentielId
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

  // ── Résolution du dépassement de seuil (juillet 2026) ────────────────────
  // Référentiel candidat après agrégation éventuelle puis exclusions cochées.
  // Calculs directs (pas de useMemo : on est après le return conditionnel
  // `!ouvert`, et les volumes restent négligeables).
  const referentielBase = apercu?.type === 'ok' ? apercu.rapport.referentiel : null;
  const referentielIntermediaire: Referentiel | null = referentielBase
    ? agrege
      ? agregerAuNiveauSuperieur(referentielBase)
      : referentielBase
    : null;
  const referentielFinal: Referentiel | null = referentielIntermediaire
    ? exclusions.size > 0
      ? appliquerExclusions(referentielIntermediaire, exclusions)
      : referentielIntermediaire
    : null;

  const nbEvaluables = referentielFinal ? compterCompetencesEvaluables(referentielFinal) : 0;
  // La résolution est nécessaire dès que le fichier BRUT dépasse le seuil —
  // elle reste affichée ensuite pour suivre le compteur.
  const resolutionNecessaire = referentielBase
    ? compterCompetencesEvaluables(referentielBase) > seuil
    : false;
  const importBloque = nbEvaluables > seuil || nbEvaluables < 1;

  function basculerExclusion(competenceId: string) {
    setExclusions((prec) => {
      const suiv = new Set(prec);
      if (suiv.has(competenceId)) suiv.delete(competenceId);
      else suiv.add(competenceId);
      return suiv;
    });
  }

  function importer() {
    if (!referentielFinal || importBloque) return;
    const ref = ajouter(referentielFinal);
    // Rattache la formation au nouveau référentiel — uniquement si une
    // formation a été choisie. Sinon le référentiel reste « orphelin » et
    // sera rattaché plus tard depuis la page Formations.
    if (formationCible) {
      modifierFormation(formationCible.id, { referentielId: ref.id });
    }
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
            <FileSpreadsheet className="h-5 w-5 shrink-0 texte-couleur-role" aria-hidden="true" />
            <div>
              <h2 id={titreId} className="text-lg font-semibold">
                Importer un référentiel
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Format CSV (UTF-8 ou Windows-1252, séparateur <code>;</code>) ou XLSX. La première
                ligne est ignorée (en-têtes). 2 ou 3 colonnes selon la profondeur.
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
          {/* Formation cible — optionnelle */}
          <div className="space-y-1">
            <label htmlFor="import-ref-formation" className="text-xs font-medium">
              Formation à associer{' '}
              <span className="font-normal text-muted-foreground">(optionnel)</span>
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
              <option value="">— Aucune (rattacher plus tard) —</option>
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
            {formationCible ? (
              <p className="text-xs text-muted-foreground">
                Le référentiel sera nommé{' '}
                <code className="rounded bg-secondary px-1 py-0.5">
                  {genererNomReferentiel(formationCible)}
                </code>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Le référentiel pourra être rattaché à une ou plusieurs formations plus tard depuis
                la page <em>Formations</em>.
              </p>
            )}
          </div>

          {/* Nom libre — visible uniquement quand aucune formation n'est choisie */}
          {!formationCible && (
            <div className="space-y-1">
              <label htmlFor="import-ref-nom-libre" className="text-xs font-medium">
                Nom du référentiel <span className="text-red-600">*</span>
              </label>
              <input
                id="import-ref-nom-libre"
                type="text"
                data-testid="import-ref-nom-libre"
                value={saisie.nomReferentielLibre ?? ''}
                onChange={(e) => {
                  setSaisie((s) => ({ ...s, nomReferentielLibre: e.target.value }));
                  setApercu(null);
                }}
                placeholder="ex : Référentiel CAP Boulanger 2026"
                aria-invalid={!!erreurs.nomReferentielLibre}
                className={cn(
                  'w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                  erreurs.nomReferentielLibre ? 'border-red-400' : 'border-input',
                )}
              />
              {erreurs.nomReferentielLibre && (
                <p role="alert" className="text-xs text-red-700">
                  {erreurs.nomReferentielLibre}
                </p>
              )}
            </div>
          )}

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

          {/* Dépassement du seuil de lignes évaluables (juillet 2026) :
              agrégation au niveau supérieur et/ou cochage manuel. */}
          {apercu?.type === 'ok' && resolutionNecessaire && referentielIntermediaire && (
            <ResolutionDepassement
              referentielBase={apercu.rapport.referentiel}
              referentielIntermediaire={referentielIntermediaire}
              nbEvaluables={nbEvaluables}
              seuil={seuil}
              agrege={agrege}
              exclusions={exclusions}
              onAgreger={() => {
                setAgrege(true);
                setExclusions(new Set());
              }}
              onAnnulerAgregation={() => {
                setAgrege(false);
                setExclusions(new Set());
              }}
              onBasculerExclusion={basculerExclusion}
            />
          )}

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
              disabled={importBloque}
              data-testid="import-ref-importer"
              title={
                importBloque
                  ? `Réduisez à ${seuil} lignes évaluables maximum avant d'importer.`
                  : undefined
              }
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                importBloque
                  ? 'cursor-not-allowed bg-muted text-muted-foreground'
                  : 'bouton-plein-couleur-role',
              )}
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Importer ({nbEvaluables} compétence{nbEvaluables > 1 ? 's' : ''} évaluable
              {nbEvaluables > 1 ? 's' : ''})
            </button>
          ) : (
            <button
              type="button"
              onClick={genererApercu}
              className="inline-flex items-center gap-1.5 rounded-md bouton-plein-couleur-role px-4 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
// Résolution du dépassement de seuil (juillet 2026 — chantier référentiels #2)
// ─────────────────────────────────────────────────────────────────────────────

interface ResolutionDepassementProps {
  /** Référentiel brut issu du fichier (avant agrégation/exclusions). */
  referentielBase: Referentiel;
  /** Référentiel après agrégation éventuelle — support du cochage. */
  referentielIntermediaire: Referentiel;
  nbEvaluables: number;
  seuil: number;
  agrege: boolean;
  exclusions: ReadonlySet<string>;
  onAgreger: () => void;
  onAnnulerAgregation: () => void;
  onBasculerExclusion: (competenceId: string) => void;
}

function ResolutionDepassement({
  referentielBase,
  referentielIntermediaire,
  nbEvaluables,
  seuil,
  agrege,
  exclusions,
  onAgreger,
  onAnnulerAgregation,
  onBasculerExclusion,
}: ResolutionDepassementProps) {
  const agregationPossible = peutAgregerAuNiveauSuperieur(referentielBase);
  const nbApresAgregation = agregationPossible
    ? compterCompetencesEvaluables(agregerAuNiveauSuperieur(referentielBase))
    : 0;
  const sousSeuil = nbEvaluables <= seuil;

  return (
    <div
      data-testid="import-ref-depassement"
      className="space-y-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          Ce référentiel compte{' '}
          <strong>{compterCompetencesEvaluables(referentielBase)} compétences évaluables</strong> —
          la limite est de <strong>{seuil}</strong> (au-delà, la saisie devient trop longue pour le
          tuteur lors des périodes en entreprise). Réduisez le nombre de lignes avec l'une des deux
          options ci-dessous.
        </p>
      </div>

      {/* Option A — agrégation au niveau supérieur (3 niveaux uniquement). */}
      {agregationPossible && !agrege && (
        <button
          type="button"
          onClick={onAgreger}
          data-testid="import-ref-agreger"
          className="inline-flex items-center gap-1.5 rounded-md border border-amber-400 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100"
        >
          <Layers className="h-4 w-4" aria-hidden="true" />
          Garder le niveau supérieur ({nbApresAgregation} ligne
          {nbApresAgregation > 1 ? 's' : ''} évaluable{nbApresAgregation > 1 ? 's' : ''})
        </button>
      )}
      {!agregationPossible && (
        <p className="text-xs">
          Référentiel à 2 niveaux : pas de niveau intermédiaire à conserver — décochez des
          compétences ci-dessous.
        </p>
      )}
      {agrege && (
        <div
          data-testid="import-ref-agregation-active"
          className="flex flex-wrap items-center gap-2 rounded border border-amber-400 bg-white px-2 py-1.5 text-xs"
        >
          <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Niveau supérieur conservé : chaque sous-famille devient la ligne évaluable, les
            compétences détaillées restent lisibles dans sa description.
          </span>
          <button
            type="button"
            onClick={onAnnulerAgregation}
            data-testid="import-ref-annuler-agregation"
            className="inline-flex items-center gap-1 rounded border border-amber-400 px-2 py-0.5 font-medium hover:bg-amber-100"
          >
            <Undo2 className="h-3 w-3" aria-hidden="true" />
            Annuler
          </button>
        </div>
      )}

      {/* Option B — cochage manuel jusqu'à atteindre le seuil. */}
      <div className="space-y-2">
        <p
          data-testid="import-ref-compteur"
          className={cn('text-xs font-semibold', sousSeuil ? 'text-emerald-800' : 'text-red-700')}
        >
          {nbEvaluables} / {seuil} ligne{nbEvaluables > 1 ? 's' : ''} évaluable
          {nbEvaluables > 1 ? 's' : ''}
          {sousSeuil ? ' — prêt à importer' : ' — décochez encore pour atteindre la limite'}
        </p>
        <div className="max-h-56 space-y-2 overflow-y-auto rounded border border-amber-200 bg-white p-2">
          {referentielIntermediaire.blocs.map((bloc) => (
            <div key={bloc.id} className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {bloc.libelle}
              </p>
              {grouperParSousFamille(bloc).map((g, i) => (
                <div key={g.sousFamille ?? `__plat-${i}`}>
                  {g.sousFamille && (
                    <p className="text-xs font-medium text-foreground/70">{g.sousFamille}</p>
                  )}
                  <ul
                    className={cn(
                      'space-y-0.5',
                      g.sousFamille && 'ml-3 border-l border-border pl-2',
                    )}
                  >
                    {g.competences.map((c) => {
                      const cochee = !exclusions.has(c.id);
                      return (
                        <li key={c.id}>
                          <label className="flex cursor-pointer items-start gap-2 text-xs text-foreground">
                            <input
                              type="checkbox"
                              checked={cochee}
                              onChange={() => onBasculerExclusion(c.id)}
                              data-testid={`import-ref-coche-${c.id}`}
                              className="mt-0.5"
                            />
                            <span className={cn(!cochee && 'text-muted-foreground line-through')}>
                              {c.libelle}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="text-xs">
          Les compétences décochées sont conservées dans le référentiel (trace du fichier officiel)
          et réactivables plus tard depuis la page Référentiels, tant que la limite est respectée.
        </p>
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
            ⚠ {avertissements.length} avertissement{avertissements.length > 1 ? 's' : ''} non
            bloquant
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
