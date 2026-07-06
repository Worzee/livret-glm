import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useLivretStore } from '@/store/useLivretStore';
import { useUserStore } from '@/store/useUserStore';
import { useApprentiActifStore } from '@/store/useApprentiActifStore';
import { useUtilisateursStore } from '@/store/useUtilisateursStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { useReferentielsStore } from '@/store/useReferentielsStore';
import { useEtablissementsStore } from '@/store/useEtablissementsStore';
import { useEntreprisesStore } from '@/store/useEntreprisesStore';
import { useAttitudesStore } from '@/store/useAttitudesStore';
import { apprentiLeaMartin, maitreKarimBenali } from '@/fixtures/utilisateurs';

/**
 * Bouton "Réinitialiser les données de démonstration".
 * Référence : cahier des charges v1.3, §24.8.
 *
 * Confirmation à deux clics inline (pas de modale, pas de window.confirm) :
 *   - 1er clic : le bouton se transforme en "Confirmer / Annuler".
 *   - 2ᵉ clic : reset effectif des deux stores (livret + rôle actif).
 *   - Auto-annulation après 10 s sans confirmation pour ne pas piéger l'utilisateur.
 *
 * Le rôle actif est aussi remis à "formateur" pour que la prochaine démo
 * démarre dans l'état canonique attendu par DEMO.md.
 */
export function BoutonReinitialiserDemo() {
  const reinitialiser = useLivretStore((s) => s.reinitialiserDemo);
  const reinitUtilisateurs = useUtilisateursStore((s) => s.reinitialiser);
  const reinitFormations = useFormationsStore((s) => s.reinitialiser);
  const reinitReferentiels = useReferentielsStore((s) => s.reinitialiser);
  const reinitEtablissements = useEtablissementsStore((s) => s.reinitialiser);
  const reinitEntreprises = useEntreprisesStore((s) => s.reinitialiser);
  const reinitAttitudes = useAttitudesStore((s) => s.reinitialiser);
  const changerRole = useUserStore((s) => s.changerRole);
  const setMaitreActif = useUserStore((s) => s.setMaitreActif);
  const setApprentiActif = useApprentiActifStore((s) => s.setApprentiActif);
  const [confirmation, setConfirmation] = useState(false);

  useEffect(() => {
    if (!confirmation) return;
    const t = setTimeout(() => setConfirmation(false), 10_000);
    return () => clearTimeout(t);
  }, [confirmation]);

  if (!confirmation) {
    return (
      <button
        type="button"
        onClick={() => setConfirmation(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Réinitialiser les données de démonstration"
      >
        <RefreshCw className="h-3 w-3" aria-hidden="true" />
        Réinitialiser la démo
      </button>
    );
  }

  return (
    <span
      role="group"
      aria-label="Confirmer la réinitialisation"
      className="inline-flex items-center gap-1.5"
    >
      <span className="text-xs text-muted-foreground">Effacer toutes les saisies&nbsp;?</span>
      <button
        type="button"
        onClick={() => {
          // Reset du store des utilisateurs en premier (apprenti·e·s/maîtres
          // ajouté·e·s par l'admin disparaissent → leurs livrets aussi).
          reinitUtilisateurs();
          reinitFormations();
          reinitReferentiels();
          reinitEtablissements();
          reinitEntreprises();
          reinitAttitudes();
          reinitialiser();
          // Note : setMaitreActif réinit aussi l'apprenti·e actif·ve sur le 1er
          // apprenti·e du maître. On le fait avant setApprentiActif pour ne pas
          // se faire écraser, puis on force Léa explicitement.
          setMaitreActif(maitreKarimBenali.id);
          setApprentiActif(apprentiLeaMartin.id);
          changerRole('formateur');
          setConfirmation(false);
        }}
        className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Oui, réinitialiser
      </button>
      <button
        type="button"
        onClick={() => setConfirmation(false)}
        className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Annuler
      </button>
    </span>
  );
}
