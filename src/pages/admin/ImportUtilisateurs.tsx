import { useId, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  GraduationCap,
  HardHat,
  Upload,
  UserCog,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/useUserStore';
import { useUtilisateursStore } from '@/store/useUtilisateursStore';
import { peutEditer } from '@/lib/droits';
import {
  importerDepuisXlsx,
  MODELES,
  type LigneApprentiValide,
  type LigneFormateurValide,
  type LigneMaitreValide,
  type RapportImport,
  type TypeImport,
} from '@/lib/import-utilisateurs';
import { genererXlsx } from '@/lib/generer-xlsx-modele';
import { cn } from '@/lib/utils';

/**
 * Page d'import par lot d'utilisateur·rice·s depuis un fichier Excel.
 *
 * Workflow :
 *   1. L'admin choisit le type (apprenti·e / maître / formateur)
 *   2. Il/elle télécharge le modèle Excel pré-rempli avec en-têtes + 1 ligne
 *      d'exemple
 *   3. Il/elle remplit, sauvegarde, puis dépose le fichier sur cette page
 *   4. Aperçu : si tout est OK → bouton « Importer N comptes ». Sinon →
 *      liste détaillée des erreurs ; aucun import partiel possible
 *      (politique tout-ou-rien validée pilote)
 *   5. Après import : redirection vers `/admin/utilisateurs` pour voir les
 *      comptes créés et finaliser les affectations
 */

const TYPES: Array<{ id: TypeImport; label: string; Icon: typeof HardHat; couleur: string }> = [
  { id: 'apprenti', label: 'Apprenti·e·s', Icon: GraduationCap, couleur: 'text-role-apprenti' },
  { id: 'maitre', label: 'Maîtres / Tuteurs', Icon: HardHat, couleur: 'text-role-maitre' },
  { id: 'formateur', label: 'Formateurs référents', Icon: UserCog, couleur: 'text-role-formateur' },
];

export function ImportUtilisateurs() {
  const roleActif = useUserStore((s) => s.roleActif);
  const navigate = useNavigate();
  const titreId = useId();

  const utilisateursStore = useUtilisateursStore();

  const [type, setType] = useState<TypeImport>('apprenti');
  const [rapport, setRapport] = useState<RapportImport<TypeImport> | null>(null);
  const [nomFichier, setNomFichier] = useState<string | null>(null);
  const [resultatImport, setResultatImport] = useState<{ nb: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Emails déjà présents — collecte globale toutes catégories pour bloquer
  // les doublons croisés (un maître ne peut pas réutiliser l'email d'un
  // apprenti·e, etc.). useMemo placé AVANT le garde de droit pour respecter
  // l'ordre stable des hooks (rules-of-hooks).
  const emailsExistants = useMemo(() => {
    const s = new Set<string>();
    for (const a of Object.values(utilisateursStore.apprentis)) s.add(a.email.toLowerCase());
    for (const m of Object.values(utilisateursStore.maitres)) s.add(m.email.toLowerCase());
    for (const f of Object.values(utilisateursStore.formateurs)) s.add(f.email.toLowerCase());
    for (const c of Object.values(utilisateursStore.coordos)) s.add(c.email.toLowerCase());
    for (const a of Object.values(utilisateursStore.admins)) s.add(a.email.toLowerCase());
    return s;
  }, [utilisateursStore]);

  // Garde-fou : accès réservé coordo + admin. Early return placé APRÈS les
  // hooks pour respecter rules-of-hooks.
  if (!peutEditer(roleActif, 'admin.utilisateurs.import-xlsx')) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-semibold">Accès refusé</h1>
        <p className="mt-2 text-muted-foreground">
          L'import par lot d'utilisateur·rice·s est réservé aux coordinateurs·rice·s
          et administrateur·rice·s.
        </p>
      </div>
    );
  }

  function reinitialiser() {
    setRapport(null);
    setNomFichier(null);
    setResultatImport(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function changerType(nouveauType: TypeImport) {
    setType(nouveauType);
    reinitialiser();
  }

  async function chargerFichier(file: File) {
    setResultatImport(null);
    setNomFichier(file.name);
    const buffer = await file.arrayBuffer();
    const r = importerDepuisXlsx(buffer, type, emailsExistants);
    setRapport(r);
  }

  function telechargerModele() {
    const bytes = genererXlsx(MODELES[type]);
    const blob = new Blob([new Uint8Array(bytes)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modele-import-${type}s.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function declencherImport() {
    if (!rapport || !rapport.ok) return;

    if (type === 'apprenti') {
      // Aucune affectation auto : l'apprenti·e est créé·e orphelin·e
      // (formation, maître, formateur, entreprise tous vides). L'admin
      // finalise via /admin/affectations. C'est la demande explicite du
      // pilote pour ne pas créer de faux rattachements à corriger ensuite.
      const lignes = rapport.lignes as LigneApprentiValide[];
      for (const ligne of lignes) {
        utilisateursStore.ajouterApprenti(
          {
            ...ligne,
            telephone: '',
            formationId: '',
            entrepriseId: '',
            maitreApprentissageId: '',
            formateurReferentId: '',
          },
          'u-admin-guillaume',
        );
      }
      setResultatImport({ nb: lignes.length });
    } else if (type === 'maitre') {
      const lignes = rapport.lignes as LigneMaitreValide[];
      for (const ligne of lignes) {
        utilisateursStore.ajouterMaitre({ ...ligne, telephone: '' });
      }
      setResultatImport({ nb: lignes.length });
    } else if (type === 'formateur') {
      const lignes = rapport.lignes as LigneFormateurValide[];
      for (const ligne of lignes) {
        utilisateursStore.ajouterFormateur({ ...ligne, telephone: '' });
      }
      setResultatImport({ nb: lignes.length });
    }

    reinitialiser();
  }

  const typeCourant = TYPES.find((t) => t.id === type)!;

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <header>
        <h1 id={titreId} className="text-2xl font-semibold">
          Import par lot d'utilisateur·rice·s
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Importez plusieurs comptes en une seule opération depuis un fichier Excel.
          Téléchargez d'abord le modèle, remplissez-le, puis déposez-le ci-dessous.
        </p>
      </header>

      {/* Sélecteur de type ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-medium mb-2">1. Choisir le type de compte à importer</h2>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
          {TYPES.map((t) => {
            const actif = t.id === type;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={actif}
                onClick={() => changerType(t.id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors',
                  actif
                    ? 'actif-couleur-role'
                    : 'border-border hover:bg-secondary',
                )}
                data-testid={`type-${t.id}`}
              >
                <t.Icon className={cn('h-4 w-4', t.couleur)} aria-hidden="true" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Téléchargement du modèle ──────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-medium">2. Télécharger le modèle Excel</h2>
        <p className="text-sm text-muted-foreground">
          Colonnes obligatoires pour <strong>{typeCourant.label.toLowerCase()}</strong> :{' '}
          {MODELES[type].entetes.map((e, i) => (
            <span key={e}>
              {i > 0 && ', '}
              <code className="rounded bg-secondary px-1 text-xs">{e}</code>
            </span>
          ))}
          .
        </p>
        <button
          type="button"
          onClick={telechargerModele}
          className="inline-flex items-center gap-2 rounded-md bouton-plein-couleur-role px-3 py-1.5 text-sm font-medium"
          data-testid="bouton-telecharger-modele"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Télécharger « modele-import-{type}s.xlsx »
        </button>
      </section>

      {/* Info post-import apprenti·e (rappel affectation à faire) ─────── */}
      {type === 'apprenti' && (
        <div
          role="note"
          className="bandeau-info-couleur-role rounded-lg border p-3 text-xs"
        >
          Les apprenti·e·s importé·e·s seront créé·e·s <strong>sans affectation</strong>
          (formation, maître / tuteur, formateur référent et entreprise vides).
          Affectez-les ensuite individuellement depuis <em>Affectations</em>.
        </div>
      )}

      {/* Dépôt du fichier ──────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-medium">3. Déposer votre fichier rempli</h2>
        <label
          className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input p-4 hover:bg-secondary"
        >
          <Upload className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <span className="flex-1 text-sm">
            <span className="font-medium">Cliquez pour sélectionner un fichier .xlsx</span>
            <span className="block text-xs text-muted-foreground">
              ou glissez-déposez votre fichier rempli ici
            </span>
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            data-testid="input-fichier"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void chargerFichier(f);
            }}
          />
        </label>
        {nomFichier && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            Fichier sélectionné : <strong className="text-foreground">{nomFichier}</strong>
            <button
              type="button"
              onClick={reinitialiser}
              className="ml-2 text-xs underline hover:text-foreground"
            >
              Changer
            </button>
          </p>
        )}
      </section>

      {/* Rapport (erreurs ou validation OK) ─────────────────────────────── */}
      {rapport && (
        <section
          className={cn(
            'rounded-lg border p-4 space-y-3',
            rapport.ok ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50',
          )}
          aria-live="polite"
        >
          {rapport.ok ? (
            <>
              <header className="flex items-center gap-2 text-emerald-900">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                <h2 className="font-medium">
                  {rapport.lignes.length} ligne{rapport.lignes.length > 1 ? 's' : ''} valide
                  {rapport.lignes.length > 1 ? 's' : ''} — prêt à importer
                </h2>
              </header>
              <button
                type="button"
                onClick={declencherImport}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                data-testid="bouton-importer"
              >
                Importer {rapport.lignes.length} compte{rapport.lignes.length > 1 ? 's' : ''}
              </button>
            </>
          ) : (
            <>
              <header className="flex items-center gap-2 text-red-900">
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
                <h2 className="font-medium">
                  {rapport.erreurs.length} erreur{rapport.erreurs.length > 1 ? 's' : ''} détectée
                  {rapport.erreurs.length > 1 ? 's' : ''} — import refusé
                </h2>
              </header>
              <p className="text-xs text-red-900">
                La politique d'import est stricte : aucun compte n'est créé tant que toutes
                les erreurs ne sont pas corrigées. Modifiez votre fichier puis redéposez-le.
              </p>
              <ul className="space-y-1.5 text-sm">
                {rapport.erreurs.map((e, i) => (
                  <li
                    key={i}
                    className="rounded border border-red-200 bg-white px-2 py-1.5 text-xs"
                  >
                    <strong>
                      Ligne {e.ligne}
                      {e.colonne ? ` · « ${e.colonne} »` : ''} :
                    </strong>{' '}
                    {e.message}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {/* Résultat après import effectif ─────────────────────────────────── */}
      {resultatImport && (
        <section
          className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 space-y-2"
          role="status"
        >
          <header className="flex items-center gap-2 text-emerald-900">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-medium">
              Import terminé — {resultatImport.nb} compte{resultatImport.nb > 1 ? 's' : ''} créé
              {resultatImport.nb > 1 ? 's' : ''}
            </h2>
          </header>
          <button
            type="button"
            onClick={() => navigate('/admin/utilisateurs')}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Voir la liste des utilisateur·rice·s
          </button>
        </section>
      )}
    </div>
  );
}
