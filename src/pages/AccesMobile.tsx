import { useMemo, useState } from 'react';
import { Check, Copy, Lock, QrCode, Smartphone } from 'lucide-react';
import qrcode from 'qrcode-generator';
import { useUserStore } from '@/store/useUserStore';
import { peutEditer, libelleRole } from '@/lib/droits';
import type { Role } from '@/types';

/**
 * Accès mobile (3 juillet 2026) — QR code d'accès à l'application.
 *
 * Cas d'usage terrain : en visite d'entreprise, le formateur référent affiche
 * cette page ; le maître / tuteur scanne le QR code avec son téléphone et
 * arrive directement sur l'application, sans saisir d'URL. Sert aussi en
 * présentation (la salle teste sur ses propres téléphones).
 *
 * Réservé à l'encadrement (formateur / coordo / admin — ressource
 * `acces-mobile`). Les identifiants d'accès ne sont volontairement PAS
 * affichés : ils se communiquent oralement.
 *
 * Étape 2 (auth réelle) : cette page évoluera vers un lien d'invitation à
 * jeton (cf. TODO-etape-2.md).
 */

export function AccesMobile() {
  const roleActif = useUserStore((s) => s.roleActif);

  if (!peutEditer(roleActif, 'acces-mobile')) {
    return <AccesRefuse roleActif={roleActif} />;
  }

  const url = window.location.origin;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <QrCode className="texte-couleur-role h-6 w-6" aria-hidden="true" />
          <h1 className="text-2xl font-semibold">Accès mobile</h1>
        </div>
        <p className="text-muted-foreground">
          Faites scanner ce QR code pour ouvrir le livret d'apprentissage sur un téléphone — par
          exemple par le maître / tuteur lors d'une visite en entreprise.
        </p>
      </header>

      <section
        aria-label="QR code d'accès à l'application"
        className="bordure-gauche-couleur-role rounded-lg border border-border bg-card p-6"
      >
        <div className="flex flex-col items-center gap-4">
          {/* Fond blanc + marge : zone de silence nécessaire au scan. */}
          <div className="rounded-lg border border-border bg-white p-4">
            <QrCodeSvg valeur={url} taille={264} />
          </div>
          <LienAvecCopie url={url} />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 text-sm">
        <h2 className="mb-2 flex items-center gap-2 font-medium">
          <Smartphone className="texte-couleur-role h-4 w-4" aria-hidden="true" />
          Comment faire scanner ce code
        </h2>
        <ol className="ml-4 list-decimal space-y-1 text-muted-foreground">
          <li>Ouvrez l'appareil photo du téléphone (pas besoin d'application dédiée).</li>
          <li>Visez le QR code ci-dessus, puis touchez le lien qui apparaît.</li>
          <li>
            Saisissez les <strong>identifiants d'accès</strong> — ils ne sont pas affichés ici et se
            communiquent oralement par le GRETA.
          </li>
        </ol>
      </section>
    </div>
  );
}

/**
 * QR code rendu en SVG (net à toutes les tailles, imprimable).
 * `qrcode-generator` (~6 Ko gzippé, zéro dépendance) — type auto,
 * correction d'erreur M (15 %), largement suffisant pour une URL courte.
 */
function QrCodeSvg({ valeur, taille }: { valeur: string; taille: number }) {
  const { chemin, modules } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(valeur);
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (qr.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`;
      }
    }
    return { chemin: d, modules: n };
  }, [valeur]);

  return (
    <svg
      viewBox={`0 0 ${modules} ${modules}`}
      width={taille}
      height={taille}
      role="img"
      aria-label={`QR code vers ${valeur}`}
      shapeRendering="crispEdges"
      data-testid="acces-mobile-qr"
    >
      <rect width={modules} height={modules} fill="#ffffff" />
      <path d={chemin} fill="#0f172a" />
    </svg>
  );
}

/** URL en clair + bouton « Copier le lien » (repli si le scan échoue). */
function LienAvecCopie({ url }: { url: string }) {
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papiers indisponible (permissions) : l'URL reste lisible.
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <code className="rounded bg-secondary px-2 py-1 text-sm" data-testid="acces-mobile-url">
        {url}
      </code>
      <button
        type="button"
        onClick={copier}
        className="bouton-leger-couleur-role inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {copie ? (
          <>
            <Check className="h-3.5 w-3.5" aria-hidden="true" /> Copié
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copier le lien
          </>
        )}
      </button>
    </div>
  );
}

function AccesRefuse({ roleActif }: { roleActif: Role }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
      <div className="flex items-start gap-3">
        <Lock className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-medium text-amber-900">Accès réservé à l'encadrement</h1>
          <p className="mt-1 text-sm text-amber-800">
            La page « Accès mobile » est réservée au formateur référent, au coordinateur·rice et à
            l'administration. Votre rôle actuel ({libelleRole(roleActif)}) n'y a pas accès.
          </p>
        </div>
      </div>
    </div>
  );
}
