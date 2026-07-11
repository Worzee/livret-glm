import { useMemo, useState } from 'react';
import { CheckCircle2, Eye, FileText, FileUp, Info, Lock, Trash2 } from 'lucide-react';
import type { DocumentAdministratif } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { useDocumentsStore } from '@/store/useDocumentsStore';
import { peutEditer } from '@/lib/droits';
import {
  documentsApprentiVisibles,
  documentsNonAttestes,
  peutSupprimerDocument,
} from '@/lib/documents-administratifs';
import { AucunApprentiSelectionne } from '@/components/common/AucunApprentiSelectionne';
import { BoutonSigner } from '@/components/common/BoutonSigner';
import { BoutonSupprimer } from '@/components/common/BoutonSupprimer';
import { ModaleDepotDocument } from '@/components/admin/ModaleDepotDocument';
import { cn } from '@/lib/utils';

/**
 * Documents administratifs nominatifs du livret (10 juillet 2026 — demande
 * direction) : la « partie 1 » du livret papier (engagements, convention,
 * règlement…), déposée par la coordination pour chaque apprenti·e.
 *
 *   - Dépôt / suppression : coordo + admin (`documents.gerer`).
 *   - Consultation : tous les rôles du livret, sauf documents « réservés à
 *     l'apprenti·e » (apprenti·e + coordo + admin).
 *   - Attestation de prise de connaissance : SIGNATURE MANUSCRITE TACTILE de
 *     l'apprenti·e, obligatoire, document par document (`documents.attester`) —
 *     suivie par le centre d'alertes et rappelée dans le PDF de synthèse.
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
            (partie 1 du livret papier : engagements, convention, règlement…). L'apprenti·e atteste
            de leur prise de connaissance par une signature manuscrite, obligatoire pour chaque
            document.
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

      {/* Bandeau apprenti·e : documents en attente de sa signature. */}
      {peutAttester && enAttente.length > 0 && (
        <div
          role="status"
          data-testid="bandeau-documents-a-signer"
          className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            <strong>
              {enAttente.length} document{enAttente.length > 1 ? 's' : ''} à signer
            </strong>{' '}
            : votre signature atteste que vous en avez pris connaissance (obligatoire).
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
              prenomApprenti={apprenti.prenom}
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
  prenomApprenti,
  nomApprenti,
}: {
  document: DocumentAdministratif;
  peutGerer: boolean;
  peutAttester: boolean;
  prenomApprenti: string;
  nomApprenti: string;
}) {
  const attester = useDocumentsStore((s) => s.attesterDocument);
  const supprimer = useDocumentsStore((s) => s.supprimerDocument);
  const suppression = peutSupprimerDocument(doc);

  return (
    <li
      data-testid={`document-${doc.id}`}
      className="space-y-3 rounded-lg border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="flex flex-wrap items-center gap-2 font-medium">
            <FileText className="h-4 w-4 shrink-0 texte-couleur-role" aria-hidden="true" />
            <span>{doc.titre}</span>
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
            onClick={() => ouvrirDocument(doc)}
            data-testid={`consulter-${doc.id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Consulter
          </button>
          {peutGerer &&
            (suppression.ok ? (
              <BoutonSupprimer
                ariaLabel={`Supprimer le document ${doc.titre}`}
                question="Supprimer ?"
                onConfirmer={() => supprimer(doc.id)}
                variant="icon"
              />
            ) : (
              <button
                type="button"
                disabled
                aria-label={`Supprimer le document ${doc.titre}`}
                title={suppression.raison}
                className="cursor-not-allowed rounded-md p-1 text-muted-foreground opacity-40"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            ))}
        </div>
      </div>

      {/* Attestation de prise de connaissance. */}
      {doc.attestation.signe ? (
        <div
          data-testid={`attestation-${doc.id}`}
          className="flex flex-wrap items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Prise de connaissance attestée par l'apprenti·e le{' '}
            {doc.attestation.dateSignature
              ? new Date(doc.attestation.dateSignature).toLocaleString('fr-FR')
              : '-'}
          </span>
          {doc.attestation.trace && (
            <img
              src={doc.attestation.trace}
              alt="Signature manuscrite de l'apprenti·e"
              className="h-12 rounded border border-emerald-200 bg-white"
            />
          )}
        </div>
      ) : peutAttester ? (
        <BoutonSigner
          nomCourt={prenomApprenti}
          libelleEngagement={`Apprenti·e — ${nomApprenti} — prise de connaissance du document « ${doc.titre} »`}
          disabled={false}
          onConfirmer={(trace) => attester(doc.id, trace)}
          role="apprenti"
          libelleBouton="J'atteste en avoir pris connaissance — signer"
          mentionRetrait="Elle sera horodatée à l’instant de la confirmation et atteste que vous avez pris connaissance de ce document (sans retrait possible)."
        />
      ) : (
        <p
          className={cn(
            'rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900',
          )}
        >
          En attente de la signature de l'apprenti·e (attestation obligatoire).
        </p>
      )}
    </li>
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
