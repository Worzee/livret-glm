import { useEffect, useState } from 'react';
import { Check, CloudOff } from 'lucide-react';
import { useLivretStore } from '@/store/useLivretStore';
import { cn } from '@/lib/utils';

/**
 * Petit indicateur "Enregistré" visible en bas à droite (CDC §C8).
 * Apparaît brièvement chaque fois que le store écrit dans le localStorage.
 */
export function IndicateurEnregistrement() {
  const derniereModification = useLivretStore((s) => s.derniereModification);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!derniereModification) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 1500);
    return () => clearTimeout(timer);
  }, [derniereModification]);

  // Détecter localStorage indisponible (CDC §C3)
  const [storageOk, setStorageOk] = useState(true);
  useEffect(() => {
    try {
      const k = '__livret_check__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      setStorageOk(true);
    } catch {
      setStorageOk(false);
    }
  }, []);

  if (!storageOk) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-900 shadow-sm"
      >
        <CloudOff className="h-4 w-4" aria-hidden="true" />
        Sauvegarde indisponible
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white shadow-md transition-all',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none',
      )}
    >
      <Check className="h-4 w-4" aria-hidden="true" />
      Enregistré
    </div>
  );
}
