import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import type { PointTrace, TraitsSignature } from '@/lib/signature-tactile';
import { traceEstSignificative } from '@/lib/signature-tactile';
import { cn } from '@/lib/utils';

/**
 * Zone de signature manuscrite (CDC v1.5 §14.C — juin 2026).
 *
 * Canvas piloté aux *pointer events* : un même code couvre le doigt, le
 * stylet et la souris. `touch-action: none` empêche le scroll de la page
 * pendant le tracé (usage terrain : smartphone en visite d'entreprise).
 *
 * Le composant est volontairement non-contrôlé (le tracé vit dans des refs,
 * pas dans l'état React — un re-render par point tuerait la fluidité). Le
 * parent est notifié des changements de validité via `onChangeSignificative`
 * et pilote l'export / l'effacement via la ref impérative.
 */

export interface ZoneSignatureHandle {
  /** Efface tout le tracé. */
  effacer: () => void;
  /** PNG (data-URL, fond transparent) du tracé courant. */
  exporterPng: () => string;
}

interface ZoneSignatureProps {
  /** Notifié à chaque fin de trait / effacement : le tracé est-il exploitable ? */
  onChangeSignificative?: (significative: boolean) => void;
  className?: string;
}

const HAUTEUR_CSS = 140; // px
const COULEUR_ENCRE = '#1e293b'; // slate-800 — encre neutre, lisible sur PDF
const EPAISSEUR = 2.5;

export const ZoneSignature = forwardRef<ZoneSignatureHandle, ZoneSignatureProps>(
  function ZoneSignature({ onChangeSignificative, className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const traitsRef = useRef<TraitsSignature>([]);
    const traitCourantRef = useRef<PointTrace[] | null>(null);

    // Dimensionnement à la densité de l'écran (tracé net sur mobile).
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const largeur = canvas.clientWidth;
      canvas.width = Math.max(1, Math.round(largeur * dpr));
      canvas.height = Math.round(HAUTEUR_CSS * dpr);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineWidth = EPAISSEUR;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = COULEUR_ENCRE;
      }
    }, []);

    const pointDepuisEvenement = useCallback((e: React.PointerEvent): PointTrace => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }, []);

    function commencerTrait(e: React.PointerEvent) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);
      traitCourantRef.current = [pointDepuisEvenement(e)];
    }

    function poursuivreTrait(e: React.PointerEvent) {
      const trait = traitCourantRef.current;
      const ctx = canvasRef.current?.getContext('2d');
      if (!trait || !ctx) return;
      const point = pointDepuisEvenement(e);
      const precedent = trait[trait.length - 1];
      trait.push(point);
      // Segment lissé : courbe quadratique vers le point médian — suffisant
      // pour gommer les angles du tracé au doigt sans buffer de rendu.
      const median = { x: (precedent.x + point.x) / 2, y: (precedent.y + point.y) / 2 };
      ctx.beginPath();
      ctx.moveTo(precedent.x, precedent.y);
      ctx.quadraticCurveTo(precedent.x, precedent.y, median.x, median.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }

    function terminerTrait() {
      const trait = traitCourantRef.current;
      if (!trait) return;
      traitCourantRef.current = null;
      traitsRef.current = [...traitsRef.current, trait];
      onChangeSignificative?.(traceEstSignificative(traitsRef.current));
    }

    useImperativeHandle(ref, () => ({
      effacer: () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
          // clearRect en coordonnées CSS (le contexte est déjà scalé au dpr).
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        traitsRef.current = [];
        traitCourantRef.current = null;
        onChangeSignificative?.(false);
      },
      exporterPng: () => canvasRef.current?.toDataURL('image/png') ?? '',
    }));

    return (
      <canvas
        ref={canvasRef}
        data-testid="zone-signature"
        role="img"
        aria-label="Zone de signature manuscrite : dessinez votre signature au doigt, au stylet ou à la souris"
        onPointerDown={commencerTrait}
        onPointerMove={poursuivreTrait}
        onPointerUp={terminerTrait}
        onPointerCancel={terminerTrait}
        className={cn(
          'w-full touch-none rounded-md border border-dashed border-input bg-white cursor-crosshair',
          className,
        )}
        style={{ height: HAUTEUR_CSS }}
      />
    );
  },
);
