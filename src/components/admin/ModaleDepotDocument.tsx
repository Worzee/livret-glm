import { useEffect, useId, useState } from 'react';
import { FileUp, X } from 'lucide-react';
import type { Apprenti } from '@/types';
import { TAILLE_MAX_DOCUMENT_OCTETS, validerDepotDocument } from '@/lib/documents-administratifs';
import { useDocumentsStore } from '@/store/useDocumentsStore';
import { useUserStore } from '@/store/useUserStore';
import { cn } from '@/lib/utils';

/**
 * Modale de dépôt d'un document administratif nominatif (10 juillet 2026 —
 * demande direction). Réservée au coordo / admin (`documents.gerer`) : fichier
 * PDF ou image (≤ 2 Mo — maquette localStorage, Nuage en étape 2), titre
 * lisible, et flag « réservé à l'apprenti·e » (consultation restreinte à
 * l'apprenti·e + coordo + admin).
 */

interface ModaleDepotDocumentProps {
  ouvert: boolean;
  /** Apprenti·e cible — le document est nominatif. */
  apprenti: Apprenti;
  onFermer: () => void;
}

interface FichierChoisi {
  nomFichier: string;
  mimeType: string;
  taille: number;
  dataUrl: string;
}

export function ModaleDepotDocument({ ouvert, apprenti, onFermer }: ModaleDepotDocumentProps) {
  const deposer = useDocumentsStore((s) => s.deposerDocument);
  const utilisateurActif = useUserStore((s) => s.utilisateurActif);
  const roleActif = useUserStore((s) => s.roleActif);
  const titreId = useId();

  const [titre, setTitre] = useState('');
  const [reserve, setReserve] = useState(false);
  const [fichier, setFichier] = useState<FichierChoisi | null>(null);
  const [tentative, setTentative] = useState(false);

  useEffect(() => {
    if (!ouvert) return;
    // Formulaire vierge à chaque ouverture.
    setTitre('');
    setReserve(false);
    setFichier(null);
    setTentative(false);
  }, [ouvert]);

  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ouvert, onFermer]);

  if (!ouvert) return null;

  const erreurs: string[] = [];
  if (!fichier) erreurs.push('Choisissez un fichier à déposer.');
  const validation = fichier ? validerDepotDocument({ titre, ...fichier }) : null;
  if (validation && !validation.ok) erreurs.push(...validation.erreurs);
  else if (fichier && titre.trim().length === 0)
    erreurs.push('Le titre du document est obligatoire.');

  function onChangerFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const lecteur = new FileReader();
    lecteur.onload = () => {
      setFichier({
        nomFichier: f.name,
        mimeType: f.type,
        taille: f.size,
        dataUrl: String(lecteur.result ?? ''),
      });
      // Pré-remplit le titre depuis le nom du fichier (sans extension).
      setTitre((t) => (t.trim() ? t : f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')));
    };
    lecteur.readAsDataURL(f);
  }

  function valider() {
    setTentative(true);
    if (!fichier || erreurs.length > 0) return;
    deposer({
      apprentiId: apprenti.id,
      titre,
      ...fichier,
      reserveApprenti: reserve,
      deposeParId: utilisateurActif.id,
      deposeParNom: `${utilisateurActif.prenom} ${utilisateurActif.nom}`,
      deposeParRole: roleActif,
    });
    onFermer();
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
        onClick={onFermer}
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg border border-border bg-card shadow-lg">
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="flex items-start gap-3">
            <FileUp className="h-5 w-5 shrink-0 texte-couleur-role" aria-hidden="true" />
            <div>
              <h2 id={titreId} className="text-lg font-semibold">
                Déposer un document
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Document nominatif pour{' '}
                <strong>
                  {apprenti.prenom} {apprenti.nom}
                </strong>{' '}
                : PDF ou image (JPEG, PNG), {Math.round(TAILLE_MAX_DOCUMENT_OCTETS / 1024 / 1024)}{' '}
                Mo maximum. L'apprenti·e devra attester en avoir pris connaissance (signature).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4">
          <div className="space-y-1">
            <label htmlFor="depot-doc-fichier" className="text-xs font-medium">
              Fichier (PDF, JPEG ou PNG)
            </label>
            <input
              id="depot-doc-fichier"
              data-testid="depot-doc-fichier"
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={onChangerFichier}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-secondary/70"
            />
            {fichier && (
              <p className="text-xs text-muted-foreground">
                {fichier.nomFichier} · {Math.max(1, Math.round(fichier.taille / 1024))} Ko
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="depot-doc-titre" className="text-xs font-medium">
              Titre du document
            </label>
            <input
              id="depot-doc-titre"
              data-testid="depot-doc-titre"
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex. : Partie 1 - Engagements du livret"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              data-testid="depot-doc-reserve"
              checked={reserve}
              onChange={(e) => setReserve(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--ring))]"
            />
            <span>
              <span className="font-medium">Document réservé à l'apprenti·e</span>
              <span className="block text-xs text-muted-foreground">
                Consultation restreinte à l'apprenti·e, au coordo et à l'admin (invisible du maître
                / tuteur et du formateur référent).
              </span>
            </span>
          </label>

          {tentative && erreurs.length > 0 && (
            <ul
              data-testid="depot-doc-erreurs"
              role="alert"
              className="list-disc space-y-1 rounded-md border border-red-200 bg-red-50 p-3 pl-7 text-xs text-red-800"
            >
              {erreurs.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border p-4">
          <button
            type="button"
            onClick={onFermer}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Annuler
          </button>
          <button
            type="button"
            data-testid="depot-doc-valider"
            onClick={valider}
            className={cn(
              'bouton-plein-couleur-role rounded-md px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            Déposer le document
          </button>
        </div>
      </div>
    </div>
  );
}
