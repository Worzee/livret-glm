import type {
  Apprenti,
  AttitudeProfessionnelle,
  Entreprise,
  Etablissement,
  Formateur,
  Formation,
  Livret,
  Maitre,
  Referentiel,
} from '@/types';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { useReferentielsStore } from '@/store/useReferentielsStore';
import { useEtablissementsStore } from '@/store/useEtablissementsStore';
import { useEntreprisesStore } from '@/store/useEntreprisesStore';
import { useAttitudesStore } from '@/store/useAttitudesStore';
import { getMaitreByIdFromStore } from '@/store/useUtilisateursStore';
import { referentielCapCuisine } from '@/fixtures/referentiel-cap-cuisine';
import { formationCapCuisine } from '@/fixtures/formations';
import { formatriceSophieDubois, maitreKarimBenali } from '@/fixtures/utilisateurs';

export interface DonneesLivretPdf {
  apprenti: Apprenti;
  livret: Livret;
  maitre: Maitre;
  maitreSecond?: Maitre;
  formateur: Formateur;
  formation: Formation;
  referentiel: Referentiel;
  etablissement?: Etablissement;
  entreprise?: Entreprise;
  attitudes: AttitudeProfessionnelle[];
}

/**
 * Centralise la résolution des données nécessaires aux exports PDF du livret
 * actif (identité, formation, référentiel, établissement, catalogue
 * d'attitudes). Renvoie `null` si aucun·e apprenti·e n'est sélectionné·e.
 *
 * Mutualise la « plomberie » entre l'évaluation finale (export du livret
 * complet) et les exports partiels — période, entretien, fiches de suivi
 * (16 juin 2026). Les fallbacks (CAP Cuisine, maître Karim, formatrice Sophie)
 * reprennent le comportement historique de la page Évaluation finale.
 */
export function useDonneesLivretPdf(): DonneesLivretPdf | null {
  const formations = useFormationsStore((s) => s.formations);
  const referentiels = useReferentielsStore((s) => s.referentiels);
  const etablissements = useEtablissementsStore((s) => s.etablissements);
  const entreprises = useEntreprisesStore((s) => s.entreprises);
  const attitudesMap = useAttitudesStore((s) => s.attitudes);
  const ctx = useApprentiActif();

  if (!ctx) return null;
  const { apprenti, livret } = ctx;
  const formation = formations[apprenti.formationId] ?? formationCapCuisine;
  const referentiel = referentiels[formation.referentielId] ?? referentielCapCuisine;
  const etablissement = etablissements[formation.lieuId];
  const entreprise = entreprises[apprenti.entrepriseId];
  const maitre = getMaitreByIdFromStore(apprenti.maitreApprentissageId) ?? maitreKarimBenali;
  const maitreSecond = apprenti.maitreApprentissageSecondId
    ? getMaitreByIdFromStore(apprenti.maitreApprentissageSecondId)
    : undefined;

  return {
    apprenti,
    livret,
    maitre,
    maitreSecond,
    formateur: formatriceSophieDubois,
    formation,
    referentiel,
    etablissement,
    entreprise,
    attitudes: Object.values(attitudesMap),
  };
}
