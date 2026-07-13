import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  CircleDashed,
  Eye,
  FileText,
  FileUp,
  Info,
  Lock,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import type { DocumentAdministratif } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { useDocumentsStore } from '@/store/useDocumentsStore';
import { peutEditer } from '@/lib/droits';
import {
  documentsApprentiVisibles,
  documentsNonAttestes,
  etatDocumentsObligatoires,
  libelleDocument,
  peutAttesterDocument,
  peutSupprimerDocument,
} from '@/lib/documents-administratifs';
import { AucunApprentiSelectionne } from '@/components/common/AucunApprentiSelectionne';
import { BoutonSupprimer } from '@/components/common/BoutonSupprimer';
import { ModaleDepotDocument } from '@/components/admin/ModaleDepotDocument';
import { cn } from '@/lib/utils';

/**
 * Documents administratifs nominatifs du livret (10 juillet 2026 — demande
 * direction ; v2 le 13 juillet 2026 — réunion DG) : typologie de 4 documents
 * OBLIGATOIRES (contrat pédagogique, protection des données, droit à l'image,
 * règlement intérieur) + « Autre document » (titre libre).
 *
 *   - Dépôt / suppression : coordo + admin (`documents.gerer`) — redéposer un
 *     type existant le REMPLACE (attestation remise à zéro).
 *   - Consultation : tous les rôles du livret, sauf documents « réservés à
 *     l'apprenti·e » (type « autre » uniquement).
 *   - Attestation de prise de connaissance : confirmation horodatée SANS
 *     signature manuscrite (`documents.attester`), possible uniquement APRÈS
 *     lecture du document — suivie par le centre d'alertes (attestations
 *     attendues + types obligatoires manquants côté coordo/admin) et rappelée
 *     dans le PDF de synthèse.
 */

export function DocumentsAdministratifs() {
  const roleActif = useUserStore((s) => s.roleActif);
  const ctx = useApprentiActif();
  const documents = useDocumentsStore((s) => s.documents);
  const [modaleOuverte, setModaleOuverte] = useState(false);

  const visibles = useMemo(
    () =>
      ctx ? documentsApprentiVisibles(Object.values(documents), ctx.apprenti.id, roleActif) : [],
    [documents, ctx, roleActif],
  );
  // Les 4 obligatoires ne sont jamais « réservés » : l'état est identique
  // quel que soit le rôle (calculé hors filtre de visibilité).
  const etatsObligatoires = useMemo(
    () =>
      ctx
        ? etatDocumentsObligatoires(
            Object.values(documents).filter((d) => d.apprentiId === ctx.apprenti.id),
          )
        : [],
    [documents, ctx],
  );

  if (!ctx) return <AucunApprentiSelectionne />;
  const { apprenti } = ctx;
  const peutGerer = peutEditer(roleActif, 'documents.gerer');
  const peutAttester = peutEditer(roleActif, 'documents.attester');
  const enAttente = documentsNonAttestes(visibles);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 texte-couleur-role" aria-hidden="true" />
            <h1 className="text-2xl font-semibold">Documents administratifs</h1>
          </div>
          <p className="text-muted-foreground">
            Documents nominatifs de{' '}
            <strong>
              {apprenti.prenom} {apprenti.nom}
            </strong>{' '}
            : 4 documents obligatoires (contrat pédagogique, protection des données, droit à
            l'image, règlement intérieur) et documents complémentaires. L'apprenti·e atteste avoir
            pris connaissance de chaque document, après lecture (obligatoire).
          </p>
        </div>
        {peutGerer && (
          <button
            type="button"
            data-testid="ouvrir-depot-document"
            onClick={() => setModaleOuverte(true)}
            className="bouton-plein-couleur-role inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <FileUp className="h-4 w-4" aria-hidden="true" />
            Déposer un document
          </button>
        )}
      </header>

      {/* État des 4 documents obligatoires (13 juillet 2026 — réunion DG). */}
      <section
        aria-label="État des documents obligatoires"
        data-testid="etat-documents-obligatoires"
        className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
      >
        {etatsObligatoires.map((e) => (
          <div
            key={e.type}
            data-testid={`etat-doc-${e.type}`}
            className={cn(
              'flex items-start gap-2 rounded-md border p-2.5 text-xs',
              e.etat === 'atteste' && 'border-emerald-200 bg-emerald-50 text-emerald-900',
              e.etat === 'a-attester' && 'border-amber-200 bg-amber-50 text-amber-900',
              e.etat === 'manquant' && 'border-red-200 bg-red-50 text-red-900',
            )}
          >
            {e.etat === 'atteste' ? (
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : e.etat === 'a-attester' ? (
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <CircleDashed className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span className="min-w-0">
              <span className="block font-medium">{e.libelle}</span>
              <span className="block">
                {e.etat === 'atteste'
                  ? 'Attesté'
                  : e.etat === 'a-attester'
                    ? "Attestation de l'apprenti·e attendue"
                    : 'Non déposé (obligatoire)'}
              </span>
            </span>
          </div>
        ))}
      </section>

      {/* Bandeau apprenti·e : documents en attente de son attestation. */}
      {peutAttester && enAttente.length > 0 && (
        <div
          role="status"
          data-testid="bandeau-documents-a-attester"
          className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            <strong>
              {enAttente.length} document{enAttente.length > 1 ? 's' : ''} à attester
            </strong>{' '}
            : consultez chaque document puis attestez en avoir pris connaissance (obligatoire).
          </p>
        </div>
      )}

      {visibles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Aucun document administratif déposé pour cet·te apprenti·e.
        </div>
      ) : (
        <ul className="space-y-4">
          {visibles.map((d) => (
            <CarteDocument
              key={d.id}
              document={d}
              peutGerer={peutGerer}
              peutAttester={peutAttester}
              roleApprenti={roleActif === 'apprenti'}
              nomApprenti={`${apprenti.prenom} ${apprenti.nom}`}
            />
          ))}
        </ul>
      )}

      <ModaleDepotDocument
        ouvert={modaleOuverte}
        apprenti={apprenti}
        onFermer={() => setModaleOuverte(false)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Carte d'un document
// ─────────────────────────────────────────────────────────────────────────────

function CarteDocument({
  document: doc,
  peutGerer,
  peutAttester,
  roleApprenti,
  nomApprenti,
}: {
  document: DocumentAdministratif;
  peutGerer: boolean;
  peutAttester: boolean;
  /** Le rôle actif est l'apprenti·e : sa consultation est tracée (« lu »). */
  roleApprenti: boolean;
  nomApprenti: string;
}) {
  const attester = useDocumentsStore((s) => s.attesterDocument);
  const marquerConsultation = useDocumentsStore((s) => s.marquerConsultationApprenti);
  const supprimer = useDocumentsStore((s) => s.supprimerDocument);
  const suppression = peutSupprimerDocument(doc);
  const libelle = libelleDocument(doc);

  function consulter() {
    ouvrirDocument(doc);
    // « Lu et attesté » : seule la consultation PAR L'APPRENTI·E déverrouille
    // l'attestation (13 juillet 2026).
    if (roleApprenti) marquerConsultation(doc.id);
  }

  return (
    <li
      data-testid={`document-${doc.id}`}
      className="space-y-3 rounded-lg border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="flex flex-wrap items-center gap-2 font-medium">
            <FileText className="h-4 w-4 shrink-0 texte-couleur-role" aria-hidden="true" />
            <span>{libelle}</span>
            {doc.reserveApprenti && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                <Lock className="h-3 w-3" aria-hidden="true" />
                Réservé à l'apprenti·e
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground">
            {doc.nomFichier} · {Math.max(1, Math.round(doc.taille / 1024))} Ko · déposé le{' '}
            {new Date(doc.deposeLe).toLocaleDateString('fr-FR')} par {doc.deposeParNom}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={consulter}
            data-testid={`consulter-${doc.id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Consulter
          </button>
          {peutGerer &&
            (suppression.ok ? (
              <BoutonSupprimer
                ariaLabel={`Supprimer le document ${libelle}`}
                question="Supprimer ?"
                onConfirmer={() => supprimer(doc.id)}
                variant="icon"
              />
            ) : (
              <button
                type="button"
                disabled
                aria-label={`Supprimer le document ${libelle}`}
                title={suppression.raison}
                className="cursor-not-allowed rounded-md p-1 text-muted-foreground opacity-40"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            ))}
        </div>
      </div>

      {/* Attestation de prise de connaissance (sans signature — 13 juillet 2026). */}
      {doc.attestation.attestee ? (
        <div
          data-testid={`attestation-${doc.id}`}
          className="flex flex-wrap items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Prise de connaissance attestée par l'apprenti·e le{' '}
            {doc.attestation.dateAttestation
              ? new Date(doc.attestation.dateAttestation).toLocaleString('fr-FR')
              : '-'}
          </span>
        </div>
      ) : peutAttester ? (
        <BoutonAttester
          document={doc}
          nomApprenti={nomApprenti}
          onConfirmer={() => attester(doc.id)}
        />
      ) : (
        <p
          className={cn(
            'rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900',
          )}
        >
          En attente de l'attestation de l'apprenti·e (obligatoire, après lecture).
        </p>
      )}
    </li>
  );
}

/**
 * Bouton d'attestation à confirmation explicite (13 juillet 2026 — réunion
 * DG) : plus de signature manuscrite, mais la friction anti-réflexe est
 * conservée (2 clics, mention d'irréversibilité, Esc / 30 s pour annuler).
 * Grisé tant que l'apprenti·e n'a pas CONSULTÉ le document (« lu et attesté »).
 */
function BoutonAttester({
  document: doc,
  nomApprenti,
  onConfirmer,
}: {
  document: DocumentAdministratif;
  nomApprenti: string;
  onConfirmer: () => void;
}) {
  const [confirmation, setConfirmation] = useState(false);
  const verdict = peutAttesterDocument(doc);

  useEffect(() => {
    if (!confirmation) return;
    const t = setTimeout(() => setConfirmation(false), 30_000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmation(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [confirmation]);

  if (!confirmation) {
    return (
      <div className="space-y-1.5">
        <button
          type="button"
          data-testid={`attester-${doc.id}`}
          disabled={!verdict.ok}
          title={verdict.ok ? undefined : verdict.raison}
          onClick={() => setConfirmation(true)}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            verdict.ok
              ? 'bg-role-apprenti text-white hover:opacity-90'
              : 'bg-muted text-muted-foreground cursor-not-allowed',
          )}
        >
          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
          J'atteste avoir pris connaissance
        </button>
        {!verdict.ok && <p className="text-xs text-muted-foreground">{verdict.raison}</p>}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Confirmer l'attestation"
      className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3"
    >
      <div className="flex items-start gap-2 text-xs text-amber-900">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          Vous allez attester, en tant que <strong>{nomApprenti}</strong>, avoir pris connaissance
          du document <strong>« {libelleDocument(doc)} »</strong>. Votre attestation sera horodatée
          à l'instant de la confirmation, sans retrait possible.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setConfirmation(false)}
          className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Annuler
        </button>
        <button
          type="button"
          data-testid={`confirmer-attester-${doc.id}`}
          onClick={() => {
            onConfirmer();
            setConfirmation(false);
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-role-apprenti px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
          Confirmer
        </button>
      </div>
    </div>
  );
}

/**
 * Ouvre le document dans un nouvel onglet. Chrome bloque la navigation
 * top-frame vers les data-URL : on passe par un Blob éphémère.
 */
function ouvrirDocument(doc: DocumentAdministratif) {
  const [entete, base64] = doc.dataUrl.split(',');
  if (!base64) return;
  void entete;
  const octets = atob(base64);
  const buffer = new Uint8Array(octets.length);
  for (let i = 0; i < octets.length; i++) buffer[i] = octets.charCodeAt(i);
  const blob = new Blob([buffer], { type: doc.mimeType });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener');
  // Laisse le temps à l'onglet de charger avant de libérer l'URL.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
