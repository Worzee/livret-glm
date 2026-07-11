import type {
  Apprenti,
  AttitudeProfessionnelle,
  DocumentAdministratif,
  Entreprise,
  Etablissement,
  Formateur,
  Formation,
  Livret,
  Maitre,
  ModeleActivites,
  Referentiel,
} from '@/types';
import { useApprentiActif } from '@/store/useApprentiActifStore';
import { useFormationsStore } from '@/store/useFormationsStore';
import { useReferentielsStore } from '@/store/useReferentielsStore';
import { useEtablissementsStore } from '@/store/useEtablissementsStore';
import { useEntreprisesStore } from '@/store/useEntreprisesStore';
import { useAttitudesStore } from '@/store/useAttitudesStore';
import { useActivitesStore } from '@/store/useActivitesStore';
import { useDocumentsStore } from '@/store/useDocumentsStore';
import { getMaitreByIdFromStore } from '@/store/useUtilisateursStore';
import { modeEffectif } from '@/lib/mode-evaluation';
import { referentielEvaluable } from '@/lib/limite-referentiel';
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
  /**
   * Modèle d'activités de la formation quand elle est en mode ACTIVITÉS
   * (juillet 2026 — chantier #4) : fiches par activités + Synthèse projetée.
   */
  modeleActivites?: ModeleActivites;
  /**
   * Documents administratifs nominatifs de l'apprenti·e (10 juillet 2026) —
   * rappel des attestations dans le PDF du livret complet.
   */
  documents: DocumentAdministratif[];
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
  const modeles = useActivitesStore((s) => s.modeles);
  const documentsMap = useDocumentsStore((s) => s.documents);
  const ctx = useApprentiActif();

  if (!ctx) return null;
  const { apprenti, livret } = ctx;
  const formation = formations[apprenti.formationId] ?? formationCapCuisine;
  // Filtré des compétences exclues (limite des lignes évaluables) — le PDF
  // ne présente que le contenu évaluable, comme les grilles.
  const referentiel = referentielEvaluable(
    referentiels[formation.referentielId] ?? referentielCapCuisine,
  );
  const etablissement = etablissements[formation.lieuId];
  const entreprise = entreprises[apprenti.entrepriseId];
  const maitre = getMaitreByIdFromStore(apprenti.maitreApprentissageId) ?? maitreKarimBenali;
  const maitreSecond = apprenti.maitreApprentissageSecondId
    ? getMaitreByIdFromStore(apprenti.maitreApprentissageSecondId)
    : undefined;
  const modeleActivites =
    modeEffectif(formation) === 'activites' && formation.modeleActivitesId
      ? modeles[formation.modeleActivitesId]
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
    modeleActivites,
    documents: Object.values(documentsMap).filter((d) => d.apprentiId === apprenti.id),
  };
}
