import { useEffect, useId, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import {
  importerModeleDepuisBuffer,
  importerModeleDepuisTexte,
  importerModeleDepuisXlsxBuffer,
  type RapportImportModele,
} from '@/lib/import-modele-activites';
import { estXlsxBuffer } from '@/lib/import-referentiel';
import { modeEffectif } from '@/lib/mode-evaluation';
import {
  genererXlsxGabaritActivites,
  NOM_FICHIER_GABARIT_ACTIVITES,
} from '@/lib/modele-xlsx-activites';
import {
  genererNomModeleActivites,
  type SaisieImportModele,
  validerSaisieImportModele,
} from '@/lib/validation-import-modele-activites';
import { useActivitesStore } from '@/store/useActivitesStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { cn } from '@/lib/utils';

/**
 * Modale d'import d'un modèle d'activités (juillet 2026 — chantier
 * référentiels/compétences #4, arbitrage pilote Q1).
 *
 * Workflow :
 *   1. Choix de la **formation cible** (obligatoire — le mapping portera sur
 *      son référentiel, le modèle lui est rattaché à l'import).
 *   2. Fichier CSV / XLSX **OU** texte collé — activités seules (code,
 *      libellé, description) ; le mapping se fait ensuite dans l'éditeur.
 *   3. Aperçu (nombre d'activités + avertissements) puis import.
 *
 * Une formation déjà en mode activités a son modèle figé : l'import est
 * bloqué avec un message explicite (repasser en mode compétences d'abord).
 */

interface ModaleImportModeleActivitesProps {
  ouvert: boolean;
  formationIdInitial?: string;
  onAnnuler: () => void;
  onValide?: (modeleId: string) => void;
}

interface ApercuOk {
  type: 'ok';
  rapport: RapportImportModele;
  /** Nom du modèle actuellement rattaché à la formation (sera remplacé). */
  modeleRemplace?: string;
}
interface ApercuErreur {
  type: 'erreur';
  message: string;
}
type Apercu = ApercuOk | ApercuErreur | null;

const SAISIE_VIDE: SaisieImportModele = {
  formationId: '',
  source: 'texte',
  nomFichier: '',
  contenuCsv: '',
};

export function ModaleImportModeleActivites({
  ouvert,
  formationIdInitial,
  onAnnuler,
  onValide,
}: ModaleImportModeleActivitesProps) {
  const ajouterModele = useActivitesStore((s) => s.ajouterModele);
  const modeles = useActivitesStore((s) => s.modeles);
  const formations = useFormationsStore((s) => s.formations);
  const attacherModele = useFormationsStore((s) => s.attacherModeleActivites);

  const titreId = useId();

  const formationsListe = useMemo(
    () => Object.values(formations).sort((a, b) => a.intitule.localeCompare(b.intitule, 'fr-FR')),
    [formations],
  );

  const [saisie, setSaisie] = useState<SaisieImportModele>(() => ({
    ...SAISIE_VIDE,
    formationId: formationIdInitial ?? '',
  }));
  const [bufferFichier, setBufferFichier] = useState<ArrayBuffer | null>(null);
  const [tentativeSoumission, setTentativeSoumission] = useState(false);
  const [apercu, setApercu] = useState<Apercu>(null);

  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onAnnuler();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ouvert, onAnnuler]);

  if (!ouvert) return null;

  const validation = validerSaisieImportModele(saisie);
  const erreurs = tentativeSoumission ? validation.erreurs : {};
  const formationCible = formations[saisie.formationId];
  // Formation en mode activités : modèle figé (arbitrage Q6).
  const bloqueParModeActivites = !!formationCible && modeEffectif(formationCible) === 'activites';

  async function onChangerFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    setBufferFichier(buf);
    setSaisie((s) => ({ ...s, source: 'fichier', nomFichier: file.name, contenuCsv: '' }));
    setApercu(null);
  }

  function onChangerTextarea(value: string) {
    setSaisie((s) => ({ ...s, source: 'texte', contenuCsv: value, nomFichier: '' }));
    if (bufferFichier) setBufferFichier(null);
    setApercu(null);
  }

  // Gabarit Excel à remplir puis réimporter (pattern ImportUtilisateurs).
  function telechargerGabarit() {
    const bytes = genererXlsxGabaritActivites();
    const blob = new Blob([new Uint8Array(bytes)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = NOM_FICHIER_GABARIT_ACTIVITES;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function genererApercu() {
    setTentativeSoumission(true);
    if (!validation.ok || !formationCible) {
      setApercu(null);
      return;
    }
    const options = {
      nomModele: genererNomModeleActivites(formationCible),
      referentielId: formationCible.referentielId,
    };
    try {
      let rapport: RapportImportModele;
      if (saisie.source === 'fichier' && bufferFichier) {
        rapport = estXlsxBuffer(bufferFichier)
          ? importerModeleDepuisXlsxBuffer(bufferFichier, options)
          : importerModeleDepuisBuffer(bufferFichier, options);
      } else {
        rapport = importerModeleDepuisTexte(saisie.contenuCsv ?? '', options);
      }
      const modeleActuel = formationCible.modeleActivitesId
        ? modeles[formationCible.modeleActivitesId]
        : undefined;
      setApercu({ type: 'ok', rapport, modeleRemplace: modeleActuel?.nom });
    } catch (err) {
      setApercu({ type: 'erreur', message: err instanceof Error ? err.message : String(err) });
    }
  }

  function importer() {
    if (apercu?.type !== 'ok' || bloqueParModeActivites || !formationCible) return;
    const resultat = ajouterModele(apercu.rapport.modele);
    if (!resultat.ok) {
      setApercu({ type: 'erreur', message: resultat.raison ?? 'Import refusé.' });
      return;
    }
    const rattachement = attacherModele(formationCible.id, apercu.rapport.modele.id);
    if (!rattachement.ok) {
      setApercu({ type: 'erreur', message: rattachement.raison ?? 'Rattachement refusé.' });
      return;
    }
    onValide?.(apercu.rapport.modele.id);
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
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-card shadow-lg">
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="h-5 w-5 shrink-0 texte-couleur-role" aria-hidden="true" />
            <div>
              <h2 id={titreId} className="text-lg font-semibold">
                Importer un modèle d'activités
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Fichier CSV ou XLSX : activités seules (colonnes : code, libellé, description ; la
                première ligne est ignorée). Le mapping vers les compétences se fait ensuite dans
                l'éditeur.
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

        <div className="space-y-4 overflow-y-auto p-4">
          {/* Formation cible — obligatoire */}
          <div className="space-y-1">
            <label htmlFor="import-act-formation" className="text-xs font-medium">
              Formation cible <span className="text-red-600">*</span>
            </label>
            <select
              id="import-act-formation"
              data-testid="import-act-formation"
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
              <option value="">Choisir une formation…</option>
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
            {bloqueParModeActivites && (
              <p
                role="alert"
                data-testid="import-act-bloque-mode-activites"
                className="rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-800"
              >
                Cette formation est déjà en <strong>mode activités</strong> : son modèle est figé.
                Repassez d'abord en mode compétences (possible tant que rien n'est signé).
              </p>
            )}
            {formationCible && (
              <p className="text-xs text-muted-foreground">
                Le modèle sera nommé{' '}
                <code className="rounded bg-secondary px-1 py-0.5">
                  {genererNomModeleActivites(formationCible)}
                </code>{' '}
                et mappé sur le référentiel de la formation.
              </p>
            )}
          </div>

          {/* Fichier */}
          <div className="space-y-1">
            <label htmlFor="import-act-fichier" className="text-xs font-medium">
              Fichier (CSV ou XLSX)
            </label>
            <input
              id="import-act-fichier"
              type="file"
              accept=".csv,.txt,.xlsx"
              data-testid="import-act-fichier"
              onChange={onChangerFichier}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-secondary/80"
            />
            <p className="text-xs text-muted-foreground">
              Partez du{' '}
              <button
                type="button"
                onClick={telechargerGabarit}
                data-testid="import-act-telecharger-gabarit"
                className="inline-flex items-center gap-1 underline hover:no-underline"
              >
                <Download className="h-3 w-3" aria-hidden="true" />
                gabarit Excel à remplir
              </button>{' '}
              : une activité par ligne, seule la colonne Libellé est obligatoire.
            </p>
          </div>

          {/* Texte collé */}
          <div className="space-y-1">
            <label htmlFor="import-act-texte" className="text-xs font-medium">
              … ou contenu CSV collé
            </label>
            <textarea
              id="import-act-texte"
              rows={5}
              data-testid="import-act-texte"
              value={saisie.contenuCsv ?? ''}
              onChange={(e) => onChangerTextarea(e.target.value)}
              placeholder={'Libellé;Description\nRéception des marchandises;Contrôles et stockage'}
              aria-invalid={!!erreurs.contenuCsv}
              className={cn(
                'w-full resize-y rounded-md border bg-background px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring',
                erreurs.contenuCsv ? 'border-red-400' : 'border-input',
              )}
            />
            {erreurs.contenuCsv && (
              <p role="alert" className="text-xs text-red-700">
                {erreurs.contenuCsv}
              </p>
            )}
          </div>

          {/* Aperçu */}
          {apercu?.type === 'ok' && (
            <div className="space-y-2 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
              <p className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                {apercu.rapport.stats.nbActivites} activité
                {apercu.rapport.stats.nbActivites > 1 ? 's' : ''} détectée
                {apercu.rapport.stats.nbActivites > 1 ? 's' : ''}
              </p>
              <ul className="ml-6 list-disc text-xs">
                {apercu.rapport.modele.activites.slice(0, 8).map((a) => (
                  <li key={a.id}>{a.libelle}</li>
                ))}
                {apercu.rapport.modele.activites.length > 8 && (
                  <li>… et {apercu.rapport.modele.activites.length - 8} autres</li>
                )}
              </ul>
              {apercu.modeleRemplace && (
                <p className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-900">
                  ⚠ La formation est actuellement rattachée au modèle{' '}
                  <strong>{apercu.modeleRemplace}</strong>. L'import remplacera ce rattachement
                  (l'ancien modèle reste disponible, mapping compris).
                </p>
              )}
              {apercu.rapport.avertissements.length > 0 && (
                <ul className="ml-6 list-disc text-xs text-amber-800">
                  {apercu.rapport.avertissements.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {apercu?.type === 'erreur' && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              {apercu.message}
            </p>
          )}
        </div>

        <div className="flex flex-row-reverse items-center gap-2 border-t border-border bg-secondary/30 p-3">
          {apercu?.type === 'ok' ? (
            <button
              type="button"
              onClick={importer}
              disabled={bloqueParModeActivites}
              data-testid="import-act-importer"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                bloqueParModeActivites
                  ? 'cursor-not-allowed bg-muted text-muted-foreground'
                  : 'bouton-plein-couleur-role',
              )}
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Importer ({apercu.rapport.stats.nbActivites} activité
              {apercu.rapport.stats.nbActivites > 1 ? 's' : ''})
            </button>
          ) : (
            <button
              type="button"
              onClick={genererApercu}
              data-testid="import-act-apercu"
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
