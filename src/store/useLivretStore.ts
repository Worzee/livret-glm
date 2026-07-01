import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppreciationMaitre,
  ConditionsPratiques,
  DemarchesAdministratives,
  AidesDemandees,
  EntreeDeverrouillage,
  EntretienTripartite,
  EtatFiche,
  EvenementOrganisationSuivi,
  FicheSuiviPeriode,
  LieuFiche,
  LigneEvaluationFinaleCompetence,
  LigneSuiviEntreprise,
  Livret,
  MotifOrganisationSuivi,
  NiveauAppreciation,
  NiveauMaitriseEntreprise,
  NumeroEntretien,
  ObservationsFiche,
  Referentiel,
  ValeurReponseEntretien,
  Role,
} from '@/types';
import { livretsDemo } from '@/fixtures/livret-demo';
import { deduireEtat } from '@/lib/transitions-fiche';
import { peutInitialiserEntretien } from '@/lib/regles-entretien';
import { creerCloture } from '@/lib/cloture-livret';
import { creerEvenementVierge, peutSupprimerEvenement } from '@/lib/organisation-suivi';
import { selectionAttitudesFigee, toggleIdSelection } from '@/lib/selection-attitudes';
import { idsQuestionsActives } from '@/lib/questions-entretien';
import { useBanqueQuestionsStore } from './useBanqueQuestionsStore';
import { useFormationsStore } from './useFormationsStore';
import {
  creerSelectionVierge,
  invaliderAvecMotif as invaliderSelection,
  marquerValidee,
  realignerSurReferentiel,
  toggleCompetence,
} from '@/lib/selection-competences-entreprise';
import { useUtilisateursStore } from './useUtilisateursStore';

/**
 * Store Zustand des livrets.
 * Référence : cahier des charges v1.3, sections 5.3, 8.3 et 9.1.
 *
 * Conception :
 *   - persistance localStorage via le middleware Zustand `persist`
 *   - chaque mutation recalcule l'état de la fiche (R15, R16)
 *   - chaque mutation enregistre `modifieLe` (pour R17 plus tard)
 *   - les mutations sont nommées de manière explicite et limitées (pas d'API
 *     générique "patch") pour respecter la règle métier au plus près.
 *
 * Le débounce 500 ms (CDC §C7) est géré côté composant via un useDebouncedCallback,
 * pas ici — le store accepte chaque appel et écrit immédiatement.
 */

// Bumpé post-sprint 5 :
//   v4 — refonte `OrganisationSuivi` (date + commentaire structurés)
//   v5 — passage à 6 apprenti·e·s + livrets scénarisés (CDC §24.5)
//   v6 — refonte modulaire de `OrganisationSuivi` (liste d'événements)
//   v7 — banque de questions d'entretien (questions sélectionnées + réponses
//        indexées par questionId au lieu de champs nommés rigides)
//   v8 — sélection des compétences abordées en entreprise (cf. CDC v1.5
//        addendum) ; nouveau sous-objet `Livret.selectionCompetencesEntreprise`
//        + auto-marquage à la 3ᵉ signature de l'entretien tripartite
//   v9 — refonte `FicheSuiviPeriode.suiviGretaCfa` : ancien tableau
//        `LigneSuiviGreta[]` (cours / formateur / contenu / évaluations)
//        remplacé par 2 zones de texte libre (apprenti + formateur référent).
//        R20 formateur exige désormais que la zone formateur soit non vide
//        (au lieu de « ≥ 1 ligne »).
//   v10 — chantier #2 mai 2026 : `Livret.entretienTripartite` remplacé par
//        `entretien1` + `entretien2`. Les 2 entretiens se génèrent via un
//        événement d'organisation du suivi de motif
//        `entretien-tripartite-{1|2}`. Auto-marquage de la sélection des
//        compétences abordées en entreprise à la 3ᵉ signature de E1
//        uniquement (E2 = bilan mi-parcours, sans effet sur la sélection).
//   v11 — retours coordos juin 2026 : affectation des questions par le coordo.
//        `EntretienTripartite.questionsImposees` + `questionsObligatoires`
//        (snapshots à l'initialisation depuis la banque `pourEntretienN` /
//        `obligatoire`). Le formateur ne peut plus retirer les questions
//        affectées ; les obligatoires exigent une réponse pour signer (R20).
//   v12 — retours coordos juin 2026 : jusqu'à 4 entretiens tripartites par
//        livret (formations de 2 ans). `Livret.entretien1`/`entretien2`
//        remplacés par `entretiens: Record<1|2|3|4, EntretienTripartite|null>`.
//        Le nombre autorisé est défini par `Formation.nombreEntretiens`.
//   v13 — retours coordos juin 2026 : les attitudes professionnelles sont
//        évaluées par le maître à CHAQUE entretien
//        (`EntretienTripartite.evaluationsAttitudes`, catalogue global
//        `useAttitudesStore`). `Livret.evaluationFinaleAttitudes` retiré —
//        l'onglet de l'évaluation finale devient une synthèse lecture seule.
//   v14 — 13 juin 2026 : les attitudes à évaluer se CHOISISSENT à l'E1
//        (`Livret.attitudesSelectionnees`, maître + formateur, figées à la
//        3ᵉ signature de l'E1) puis sont évaluées à chaque entretien.
//   v15 — 13 juin 2026 : les questions de l'entretien ne sont plus affectées
//        globalement (banque) mais par formation (`Formation.questionsRetirees`).
//        Le snapshot d'initialisation injecte toutes les questions actives
//        (non retirées), toutes obligatoires ; le formateur n'a plus la main.
//   v16 — 13 juin 2026 : la sélection des compétences abordées en entreprise
//        démarre avec TOUTES les compétences activées (au lieu de vierge) ;
//        le maître / tuteur seul décoche. Reset pour recharger les fixtures.
//   v17 — 15 juin 2026 : harmonisation du planning — tous les livrets de la
//        promo héritent des 3 périodes de la formation (Minh 0→3, Sofia 1→3,
//        Aya 2→3, en brouillon vierge). Reset pour recharger les fixtures.
//   v18 — 15 juin 2026 : modalité présentiel/distanciel des entretiens
//        tripartites sur les fiches de suivi (E1 présentiel imposé, E2..E4 au
//        choix) — `EvenementOrganisationSuivi.modalite`. Reset (fixtures).
//   v19 — 16 juin 2026 : refonte de l'entretien tripartite 1 (« première
//        visite ») sur la trame officielle GRETA — `reponsesTrame` +
//        `signatures.representantLegal`. Reset pour recharger les fixtures.
//   v20 — 17 juin 2026 : périodes en centre de formation —
//        `Livret.fichesSuiviCentre` (miroir de `fichesSuivi`, signées par
//        l'apprenti·e + le formateur). Reset pour recharger les fixtures.
//   v21 — 18 juin 2026 : attitudes a1..a4 retirées du catalogue (doublon avec
//        l'appréciation maître) — fixtures `attitudesSelectionnees` et
//        `evaluationsAttitudes` mises à jour. Reset pour recharger.
const VERSION_SCHEMA = 21;

interface LivretStore {
  livrets: Record<string, Livret>;
  /** Bumpé à chaque mutation, sert d'indicateur "Enregistré" dans l'UI. */
  derniereModification: string | null;

  // ── Lecture ──────────────────────────────────────────────────────────────
  getLivret: (livretId: string) => Livret | undefined;
  getFiche: (livretId: string, ficheId: string, lieu?: LieuFiche) => FicheSuiviPeriode | undefined;

  // ── Mutations sur les fiches de période ──────────────────────────────────
  // Convention `lieu` (17 juin 2026) : chaque mutation de fiche prend en
  // dernier paramètre un `lieu?: LieuFiche` (défaut `'entreprise'`). Il cible
  // la collection (`fichesSuivi` vs `fichesSuiviCentre`) et le critère
  // « signée » associé. Les appels historiques (entreprise) restent inchangés.
  /** Met à jour une cellule du tableau tri-colonnes pour une compétence donnée. */
  setEvaluationLigne: (
    livretId: string,
    ficheId: string,
    ligneId: string,
    champ:
      | { type: 'evaluationGreta'; valeur: NiveauMaitriseEntreprise | null }
      | { type: 'evaluationEntreprise'; valeur: NiveauMaitriseEntreprise | null }
      | { type: 'retourApprenti'; valeur: string },
    lieu?: LieuFiche,
  ) => void;

  /** Met à jour la zone d'observation d'un rôle pour la fiche. */
  setObservation: (
    livretId: string,
    ficheId: string,
    role: Role,
    valeur: string,
    lieu?: LieuFiche,
  ) => void;

  /**
   * Met à jour l'une des deux zones de texte du suivi GRETA CFA (apprenti·e ou
   * formateur référent). Auto-horodatage `modifieLe` côté store.
   */
  setSuiviGretaCfaChamp: (
    livretId: string,
    ficheId: string,
    champ: 'apprenti' | 'formateur',
    valeur: string,
    lieu?: LieuFiche,
  ) => void;

  /** Ajoute une ligne au suivi entreprise (compétence du référentiel ou ad hoc). */
  ajouterLigneSuiviEntreprise: (
    livretId: string,
    ficheId: string,
    competenceId: string | null,
    libelleLibre?: string,
    lieu?: LieuFiche,
  ) => string;

  /** Supprime une ligne du suivi entreprise. */
  supprimerLigneSuiviEntreprise: (
    livretId: string,
    ficheId: string,
    ligneId: string,
    lieu?: LieuFiche,
  ) => void;

  /** Appose ou retire la signature d'un rôle. La validation R18/R20 est faite côté UI. */
  /** `trace` : signature manuscrite (PNG data-URL — juin 2026, §14.C). */
  signer: (livretId: string, ficheId: string, role: Role, trace?: string, lieu?: LieuFiche) => void;

  /** Verrouille/déverrouille une fiche (formateur uniquement, validation côté UI). */
  setEtatFiche: (livretId: string, ficheId: string, etat: EtatFiche, lieu?: LieuFiche) => void;

  /**
   * Active/désactive le forçage de l'affichage des périodes d'un lieu pour ce
   * livret (18 juin 2026). Quand `true`, **toutes** les périodes du lieu sont
   * visibles par **tous les rôles** malgré le séquencement. Réservé au coordo /
   * admin (validation des droits côté UI — `peutContournerSequencement`).
   */
  setAffichagePeriodesForce: (livretId: string, lieu: LieuFiche, force: boolean) => void;

  /**
   * Crée une nouvelle fiche de suivi par période. Le numéro est auto-attribué
   * (max(numeroPeriode existants) + 1). La validation R11/R12/R13 est faite
   * côté UI via `validerSaisieFichePeriode`.
   * @returns l'id de la fiche créée.
   */
  ajouterFichePeriode: (
    livretId: string,
    input: { titre?: string; dateDebut: string; dateFin: string },
  ) => string;
  /** Met à jour le titre, la date de début et/ou la date de fin d'une fiche. */
  modifierFichePeriode: (
    livretId: string,
    ficheId: string,
    patch: { titre?: string; dateDebut?: string; dateFin?: string },
  ) => void;
  /**
   * Supprime une fiche. Validation `peutSupprimerFichePeriode` faite côté UI ;
   * le store applique le retrait sans contrôle pour rester déterministe.
   */
  supprimerFichePeriode: (livretId: string, ficheId: string) => void;

  // ── Mutations sur l'organisation du suivi (CDC §5.1, refonte modulaire) ──
  /**
   * Crée un nouvel événement vierge pour le motif donné. Le formateur
   * référent peut en ajouter autant que nécessaire (plusieurs visites en
   * entreprise distinctes, par exemple).
   * @returns l'id du nouvel événement (utile pour scroll/focus côté UI).
   */
  ajouterEvenementOrganisation: (
    livretId: string,
    auteurId: string,
    motif: MotifOrganisationSuivi,
  ) => string;
  /** Met à jour partiellement un événement (titre, date, commentaire, verrou). */
  modifierEvenementOrganisation: (
    livretId: string,
    auteurId: string,
    evenementId: string,
    patch: Partial<Omit<EvenementOrganisationSuivi, 'id' | 'motif'>>,
  ) => void;
  /** Supprime un événement de la liste. */
  supprimerEvenementOrganisation: (livretId: string, auteurId: string, evenementId: string) => void;

  // ── Mutations sur les entretiens tripartites (CDC §5.2, refonte mai 2026) ─
  // Refonte chantier #2 mai 2026 : 2 entretiens par livret. Toutes les
  // mutations prennent un paramètre `numero` (1 ou 2) pour cibler le bon
  // entretien. Seul l'entretien 1 déclenche l'auto-marquage de la sélection
  // des compétences abordées en entreprise à la 3ᵉ signature (CDC v1.5 §12).
  /** Initialise un entretien vierge (E1 ou E2) si pas encore présent (R6 par entretien). */
  initialiserEntretien: (livretId: string, numero: NumeroEntretien) => void;
  setEntretienDate: (livretId: string, numero: NumeroEntretien, dateEntretien: string) => void;
  // Note (13 juin 2026) : `setQuestionsSelectionnees` retiré. La composition
  // des questions n'est plus pilotée par le formateur — elle est figée par la
  // formation (questions retirées par le coordo) au moment de l'initialisation.
  /** Met à jour la réponse à une question. */
  setReponseEntretien: (
    livretId: string,
    numero: NumeroEntretien,
    cible: 'apprenti' | 'maitre',
    questionId: string,
    valeur: ValeurReponseEntretien,
  ) => void;
  /**
   * Met à jour une réponse à la **trame officielle de l'entretien 1** (juin
   * 2026), indexée par id de question de `TRAME_ENTRETIEN_1`.
   */
  setReponseTrameEntretien: (
    livretId: string,
    numero: NumeroEntretien,
    questionId: string,
    valeur: ValeurReponseEntretien,
  ) => void;
  setAppreciationMaitre: (
    livretId: string,
    numero: NumeroEntretien,
    patch: Partial<AppreciationMaitre>,
  ) => void;
  setDemarchesAdministratives: (
    livretId: string,
    numero: NumeroEntretien,
    patch: Partial<DemarchesAdministratives>,
  ) => void;
  setConditionsPratiques: (
    livretId: string,
    numero: NumeroEntretien,
    patch: Partial<ConditionsPratiques>,
  ) => void;
  setAidesDemandees: (
    livretId: string,
    numero: NumeroEntretien,
    patch: Partial<AidesDemandees>,
  ) => void;
  setCommentaireEntretien: (
    livretId: string,
    numero: NumeroEntretien,
    role: 'apprenti' | 'maitre' | 'formateur',
    valeur: string,
  ) => void;
  /**
   * `trace` : signature manuscrite (PNG data-URL — juin 2026, §14.C).
   * `representantLegal` (E1 uniquement) est un signataire optionnel hors
   * décompte des 3 signatures obligatoires.
   */
  signerEntretien: (
    livretId: string,
    numero: NumeroEntretien,
    role: 'apprenti' | 'maitre' | 'formateur' | 'representantLegal',
    trace?: string,
  ) => void;

  // ── Sélection des compétences abordées en entreprise (CDC v1.5 addendum) ─
  /**
   * Coche/décoche une compétence du référentiel pour le livret donné. Sans
   * effet si la sélection est déjà validée (R8/R9 — il faut alors passer par
   * `invaliderSelectionCompetencesEntreprise`).
   */
  toggleSelectionCompetenceEntreprise: (livretId: string, competenceId: string) => void;
  /**
   * Remplace la liste complète des compétences sélectionnées (utilisé par
   * l'UI pour appliquer un patch atomique). Sans effet si déjà validée.
   */
  setSelectionCompetencesEntreprise: (livretId: string, ids: string[]) => void;
  /**
   * Invalide une sélection précédemment validée (R10). Empile une trace dans
   * l'historique d'invalidations. Validation UI (formateur uniquement + motif
   * obligatoire) effectuée côté composant.
   */
  invaliderSelectionCompetencesEntreprise: (
    livretId: string,
    auteurId: string,
    auteurNom: string,
    auteurRole: Role,
    motif: string,
  ) => void;
  /**
   * Réaligne « tout coché » les sélections NON validées des livrets d'une
   * formation sur un (nouveau) référentiel (1ᵉʳ juillet 2026). Appelée quand
   * le référentiel effectif change : import (nouveau ou réimport du même id),
   * changement de référentiel de la formation. Les sélections validées sont
   * préservées (invalidation R10 pour y revenir).
   */
  realignerSelectionsFormation: (formationId: string, referentiel: Referentiel) => void;
  /** Variante ciblée sur un seul livret (changement de formation d'un·e apprenti·e). */
  realignerSelectionLivret: (livretId: string, referentiel: Referentiel) => void;

  // ── Mutations sur les grilles d'évaluation finales (CDC §5.4 / §5.5) ─────
  setLigneCompetenceFinale: (
    livretId: string,
    competenceId: string,
    patch: Partial<Omit<LigneEvaluationFinaleCompetence, 'competenceId'>>,
  ) => void;
  /**
   * Évalue une attitude professionnelle dans un entretien (retours coordos
   * juin 2026 — maître / tuteur, échelle ++/+/-/--, null = effacer).
   */
  setEvaluationAttitude: (
    livretId: string,
    numero: NumeroEntretien,
    attitudeId: string,
    niveau: NiveauAppreciation | null,
  ) => void;

  /**
   * Coche/décoche une attitude retenue pour le livret (13 juin 2026 — choix
   * fait à l'E1 par maître + formateur). No-op si la sélection est figée
   * (E1 signé 3/3, cf. `selectionAttitudesFigee`).
   */
  toggleAttitudeSelectionnee: (livretId: string, attitudeId: string) => void;

  // ── Clôture livret (R22) ─────────────────────────────────────────────────
  /**
   * Clôture le livret. Validation R22 (toutes fiches verrouillées) effectuée
   * côté UI avant l'appel. La date de clôture est l'horodatage du clic.
   */
  cloturerLivret: (livretId: string, auteurId: string, auteurNom: string, auteurRole: Role) => void;

  /** Réouverture d'un livret clôturé (réservé à l'admin / formateur en cas d'erreur). */
  rouvrirLivret: (livretId: string) => void;

  // ── Déverrouillage de fiche avec motif (R10) ─────────────────────────────
  /**
   * Déverrouille une fiche (passage `verrouillee` → `en-cours`) en consignant
   * un motif obligatoire et l'auteur de la décision dans l'historique de la
   * fiche. Validation des droits effectuée côté UI (formateur uniquement).
   */
  deverrouillerFiche: (
    livretId: string,
    ficheId: string,
    auteurId: string,
    auteurNom: string,
    auteurRole: Role,
    motif: string,
    lieu?: LieuFiche,
  ) => void;

  /** Réinitialise complètement les livrets aux fixtures (CDC §24.8). */
  reinitialiserDemo: () => void;
}

/**
 * Helper interne — applique un patch au livret (hors fiche de période).
 * Met à jour l'horodatage du livret et de derniereModification.
 */
function muterLivret(
  store: LivretStore,
  livretId: string,
  patch: (livret: Livret) => Livret,
): Pick<LivretStore, 'livrets' | 'derniereModification'> {
  const livret = store.livrets[livretId];
  if (!livret) return { livrets: store.livrets, derniereModification: store.derniereModification };
  const maintenant = new Date().toISOString();
  const nouveau = patch(livret);
  return {
    livrets: { ...store.livrets, [livretId]: { ...nouveau, modifieLe: maintenant } },
    derniereModification: maintenant,
  };
}

/** Lit l'entretien E1..E4 d'un livret selon le numéro. */
function lireEntretien(livret: Livret, numero: NumeroEntretien): EntretienTripartite | null {
  return livret.entretiens[numero];
}

/** Écrit un entretien (E1..E4) dans un livret, retourne le livret muté. */
function ecrireEntretien(
  livret: Livret,
  numero: NumeroEntretien,
  entretien: EntretienTripartite,
): Livret {
  return { ...livret, entretiens: { ...livret.entretiens, [numero]: entretien } };
}

/**
 * Entretien vierge initialisé avec le snapshot de la configuration coordo
 * (retours coordos juin 2026) : questions affectées à E{numero} dans la banque
 * vivante + ids obligatoires. Les changements ultérieurs de la banque ne
 * cascadent pas sur les entretiens déjà initialisés.
 *
 * Lecture cross-store `useBanqueQuestionsStore.getState()` au runtime — le
 * cycle d'import ESM avec useBanqueQuestionsStore est résolu car aucun des
 * deux modules ne déréférence l'autre à l'évaluation (pattern identique aux
 * autres stores croisés, cf. §11 PROJECT-STATUS).
 *
 * Exportée (1ᵉʳ juillet 2026) : la page Entretien s'en sert pour afficher un
 * **aperçu en lecture seule** (non persisté) tant que l'entretien n'est pas
 * initialisé mais que son événement de suivi existe.
 */
export function entretienVierge(
  numero: NumeroEntretien,
  questionsRetirees: ReadonlyArray<string> = [],
): EntretienTripartite {
  const banque = Object.values(useBanqueQuestionsStore.getState().questions);
  // 13 juin 2026 : snapshot des questions ACTIVES de la formation (toutes
  // sauf celles retirées). Toutes sont imposées ET obligatoires — le
  // formateur n'a plus la main sur la composition.
  // E1 (« première visite ») : trame officielle GRETA figée (réponses dédiées)
  // + 4e signataire optionnel (représentant légal). Les questions de la banque
  // ne s'appliquent plus à E1 (la trame les remplace) — listes vidées pour ne
  // pas bloquer la signature (R20). Les entretiens 2 à 4 conservent le modèle
  // questions apprenti/maître.
  const estE1 = numero === 1;
  const apprenti = estE1 ? [] : idsQuestionsActives(banque, questionsRetirees, 'apprenti');
  const maitre = estE1 ? [] : idsQuestionsActives(banque, questionsRetirees, 'maitre');
  return {
    questionsApprentiSelectionnees: apprenti,
    questionsMaitreSelectionnees: maitre,
    questionsImposees: [...apprenti, ...maitre],
    questionsObligatoires: [...apprenti, ...maitre],
    evaluationsAttitudes: {},
    reponsesApprenti: {},
    reponsesMaitre: {},
    ...(estE1 ? { reponsesTrame: {} } : {}),
    appreciationMaitre: {},
    demarchesAdministratives: {
      contratSigne: null,
      visiteMedicale: null,
      permisConduire: null,
      voiture: null,
    },
    conditionsPratiques: {},
    aidesDemandees: { logement: null, premierEquipement: null, permis: null },
    commentaires: {},
    signatures: {
      apprenti: { signe: false },
      maitre: { signe: false },
      formateur: { signe: false },
      ...(estE1 ? { representantLegal: { signe: false } } : {}),
    },
  };
}

/**
 * Helper interne — applique un patch à une fiche, recalcule son état (R15/R16),
 * met à jour l'horodatage du livret.
 */
function muterFiche(
  store: LivretStore,
  livretId: string,
  ficheId: string,
  lieu: LieuFiche,
  patch: (fiche: FicheSuiviPeriode) => FicheSuiviPeriode,
): Pick<LivretStore, 'livrets' | 'derniereModification'> {
  const livret = store.livrets[livretId];
  if (!livret) return { livrets: store.livrets, derniereModification: store.derniereModification };
  // Collection ciblée selon le lieu (entreprise → `fichesSuivi`, centre →
  // `fichesSuiviCentre`).
  const cle = lieu === 'centre' ? 'fichesSuiviCentre' : 'fichesSuivi';
  const fiches = livret[cle];
  const idx = fiches.findIndex((f) => f.id === ficheId);
  if (idx === -1)
    return { livrets: store.livrets, derniereModification: store.derniereModification };

  const nouvelleFiche = patch(fiches[idx]);
  // Recalcul de l'état (R15/R16) selon le lieu — sauf si la fiche est verrouillée.
  const ficheAvecEtat: FicheSuiviPeriode = {
    ...nouvelleFiche,
    etat: deduireEtat(nouvelleFiche, lieu),
  };
  const fichesMaj = [...fiches];
  fichesMaj[idx] = ficheAvecEtat;
  const maintenant = new Date().toISOString();
  return {
    livrets: {
      ...store.livrets,
      [livretId]: { ...livret, [cle]: fichesMaj, modifieLe: maintenant },
    },
    derniereModification: maintenant,
  };
}

export const useLivretStore = create<LivretStore>()(
  persist(
    (set, get) => ({
      livrets: livretsDemo,
      derniereModification: null,

      getLivret: (id) => get().livrets[id],
      getFiche: (livretId, ficheId, lieu = 'entreprise') =>
        get().livrets[livretId]?.[
          lieu === 'centre' ? 'fichesSuiviCentre' : 'fichesSuivi'
        ].find((f) => f.id === ficheId),

      setEvaluationLigne: (livretId, ficheId, ligneId, champ, lieu = 'entreprise') =>
        set((s) =>
          muterFiche(s, livretId, ficheId, lieu, (f) => {
            const ligneIdx = f.suiviEntreprise.findIndex((l) => l.id === ligneId);
            if (ligneIdx === -1) return f;
            const nouvelleLigne: LigneSuiviEntreprise = { ...f.suiviEntreprise[ligneIdx] };
            if (champ.type === 'evaluationGreta') nouvelleLigne.evaluationGreta = champ.valeur;
            if (champ.type === 'evaluationEntreprise')
              nouvelleLigne.evaluationEntreprise = champ.valeur;
            if (champ.type === 'retourApprenti') nouvelleLigne.retourApprenti = champ.valeur;
            const nouvellesLignes = [...f.suiviEntreprise];
            nouvellesLignes[ligneIdx] = nouvelleLigne;
            return { ...f, suiviEntreprise: nouvellesLignes };
          }),
        ),

      setObservation: (livretId, ficheId, role, valeur, lieu = 'entreprise') =>
        set((s) =>
          muterFiche(s, livretId, ficheId, lieu, (f) => {
            // Ni coordo ni admin n'ont de zone observation propre dans la fiche.
            // L'admin écrit dans une des 3 zones via le slot du rôle ciblé,
            // pas via son propre rôle.
            if (role === 'coordo' || role === 'admin') return f;
            const observations: ObservationsFiche = { ...f.observations, [role]: valeur };
            return { ...f, observations };
          }),
        ),

      setSuiviGretaCfaChamp: (livretId, ficheId, champ, valeur, lieu = 'entreprise') =>
        set((s) =>
          muterFiche(s, livretId, ficheId, lieu, (f) => ({
            ...f,
            suiviGretaCfa: {
              ...f.suiviGretaCfa,
              [champ]: valeur,
              modifieLe: new Date().toISOString(),
            },
          })),
        ),

      ajouterLigneSuiviEntreprise: (livretId, ficheId, competenceId, libelleLibre, lieu = 'entreprise') => {
        const nouvelId = `se-${crypto.randomUUID()}`;
        set((s) =>
          muterFiche(s, livretId, ficheId, lieu, (f) => ({
            ...f,
            suiviEntreprise: [
              ...f.suiviEntreprise,
              {
                id: nouvelId,
                competenceId,
                libelleLibre,
                evaluationGreta: null,
                evaluationEntreprise: null,
                retourApprenti: '',
              },
            ],
          })),
        );
        return nouvelId;
      },

      supprimerLigneSuiviEntreprise: (livretId, ficheId, ligneId, lieu = 'entreprise') =>
        set((s) =>
          muterFiche(s, livretId, ficheId, lieu, (f) => ({
            ...f,
            suiviEntreprise: f.suiviEntreprise.filter((l) => l.id !== ligneId),
          })),
        ),

      signer: (livretId, ficheId, role, trace, lieu = 'entreprise') =>
        set((s) =>
          muterFiche(s, livretId, ficheId, lieu, (f) => {
            // Ni coordo ni admin ne signent en leur nom propre.
            // Pour signer côté admin, l'UI appelle signer() avec le rôle
            // métier ciblé (apprenti/maitre/formateur), pas 'admin'.
            if (role === 'coordo' || role === 'admin') return f;
            const signatures = { ...f.signatures };
            signatures[role] = {
              signe: true,
              dateSignature: new Date().toISOString(),
              ...(trace ? { trace } : {}),
            };
            return { ...f, signatures };
          }),
        ),

      setEtatFiche: (livretId, ficheId, etat, lieu = 'entreprise') =>
        set((s) => muterFiche(s, livretId, ficheId, lieu, (f) => ({ ...f, etat }))),

      setAffichagePeriodesForce: (livretId, lieu, force) =>
        set((s) =>
          muterLivret(s, livretId, (l) => ({
            ...l,
            affichagePeriodesForce: { ...l.affichagePeriodesForce, [lieu]: force },
          })),
        ),

      ajouterFichePeriode: (livretId, input) => {
        const id = `fp-${crypto.randomUUID().slice(0, 8)}`;
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const numeroMax = l.fichesSuivi.reduce((m, f) => Math.max(m, f.numeroPeriode), 0);
            const nouvelle: FicheSuiviPeriode = {
              id,
              numeroPeriode: numeroMax + 1,
              titre: input.titre?.trim() || undefined,
              dateDebut: input.dateDebut,
              dateFin: input.dateFin,
              suiviGretaCfa: {},
              suiviEntreprise: [],
              observations: {},
              signatures: {
                apprenti: { signe: false },
                maitre: { signe: false },
                formateur: { signe: false },
              },
              etat: 'brouillon',
              historiqueDeverrouillages: [],
            };
            return { ...l, fichesSuivi: [...l.fichesSuivi, nouvelle] };
          }),
        );
        return id;
      },

      modifierFichePeriode: (livretId, ficheId, patch) =>
        set((s) =>
          muterFiche(s, livretId, ficheId, 'entreprise', (f) => ({
            ...f,
            // Trim+vide → undefined pour garder le champ propre.
            titre: patch.titre === undefined ? f.titre : patch.titre.trim() || undefined,
            dateDebut: patch.dateDebut ?? f.dateDebut,
            dateFin: patch.dateFin ?? f.dateFin,
          })),
        ),

      supprimerFichePeriode: (livretId, ficheId) =>
        set((s) =>
          muterLivret(s, livretId, (l) => ({
            ...l,
            fichesSuivi: l.fichesSuivi.filter((f) => f.id !== ficheId),
          })),
        ),

      // ── Organisation du suivi (refonte modulaire) ─────────────────────────
      ajouterEvenementOrganisation: (livretId, auteurId, motif) => {
        const evt = creerEvenementVierge(motif);
        set((s) =>
          muterLivret(s, livretId, (l) => ({
            ...l,
            organisationSuivi: {
              ...l.organisationSuivi,
              evenements: [...l.organisationSuivi.evenements, evt],
              modifieLe: new Date().toISOString(),
              modifiePar: auteurId,
            },
          })),
        );
        return evt.id;
      },

      modifierEvenementOrganisation: (livretId, auteurId, evenementId, patch) =>
        set((s) =>
          muterLivret(s, livretId, (l) => ({
            ...l,
            organisationSuivi: {
              ...l.organisationSuivi,
              evenements: l.organisationSuivi.evenements.map((e) =>
                e.id === evenementId ? { ...e, ...patch } : e,
              ),
              modifieLe: new Date().toISOString(),
              modifiePar: auteurId,
            },
          })),
        ),

      supprimerEvenementOrganisation: (livretId, auteurId, evenementId) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            // Garde (juin 2026) : un événement entretien signé par au moins
            // une partie est insupprimable — no-op, cohérent avec l'UI.
            const evt = l.organisationSuivi.evenements.find((e) => e.id === evenementId);
            if (evt && !peutSupprimerEvenement(evt, l.entretiens).supprimable) return l;
            return {
              ...l,
              organisationSuivi: {
                ...l.organisationSuivi,
                evenements: l.organisationSuivi.evenements.filter((e) => e.id !== evenementId),
                modifieLe: new Date().toISOString(),
                modifiePar: auteurId,
              },
            };
          }),
        ),

      // ── Entretiens tripartites (refonte chantier #2 mai 2026) ────────────
      initialiserEntretien: (livretId, numero) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            // R6 (pas d'écrasement) + séquencement juin 2026 : l'entretien
            // précédent doit être signé par les 3 parties. L'UI désactive le
            // bouton, le store reste la dernière ligne de défense (no-op).
            if (!peutInitialiserEntretien(numero, l.entretiens).ok) return l;
            // 13 juin 2026 : le snapshot des questions dépend de la formation
            // (questions retirées par le coordo). Cross-store résolu au runtime.
            const questionsRetirees =
              useFormationsStore.getState().formations[l.formationId]?.questionsRetirees ?? [];
            return ecrireEntretien(l, numero, entretienVierge(numero, questionsRetirees));
          }),
        ),

      setEntretienDate: (livretId, numero, dateEntretien) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const e = lireEntretien(l, numero) ?? entretienVierge(numero);
            return ecrireEntretien(l, numero, { ...e, dateEntretien });
          }),
        ),

      setReponseEntretien: (livretId, numero, cible, questionId, valeur) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const e = lireEntretien(l, numero) ?? entretienVierge(numero);
            const champ = cible === 'apprenti' ? 'reponsesApprenti' : 'reponsesMaitre';
            return ecrireEntretien(l, numero, {
              ...e,
              [champ]: { ...e[champ], [questionId]: valeur },
            });
          }),
        ),

      setReponseTrameEntretien: (livretId, numero, questionId, valeur) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const e = lireEntretien(l, numero) ?? entretienVierge(numero);
            return ecrireEntretien(l, numero, {
              ...e,
              reponsesTrame: { ...(e.reponsesTrame ?? {}), [questionId]: valeur },
            });
          }),
        ),

      setAppreciationMaitre: (livretId, numero, patch) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const e = lireEntretien(l, numero) ?? entretienVierge(numero);
            return ecrireEntretien(l, numero, {
              ...e,
              appreciationMaitre: { ...e.appreciationMaitre, ...patch },
            });
          }),
        ),

      setDemarchesAdministratives: (livretId, numero, patch) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const e = lireEntretien(l, numero) ?? entretienVierge(numero);
            return ecrireEntretien(l, numero, {
              ...e,
              demarchesAdministratives: { ...e.demarchesAdministratives, ...patch },
            });
          }),
        ),

      setConditionsPratiques: (livretId, numero, patch) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const e = lireEntretien(l, numero) ?? entretienVierge(numero);
            return ecrireEntretien(l, numero, {
              ...e,
              conditionsPratiques: { ...e.conditionsPratiques, ...patch },
            });
          }),
        ),

      setAidesDemandees: (livretId, numero, patch) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const e = lireEntretien(l, numero) ?? entretienVierge(numero);
            return ecrireEntretien(l, numero, {
              ...e,
              aidesDemandees: { ...e.aidesDemandees, ...patch },
            });
          }),
        ),

      setCommentaireEntretien: (livretId, numero, role, valeur) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const e = lireEntretien(l, numero) ?? entretienVierge(numero);
            return ecrireEntretien(l, numero, {
              ...e,
              commentaires: { ...e.commentaires, [role]: valeur },
            });
          }),
        ),

      signerEntretien: (livretId, numero, role, trace) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const e = lireEntretien(l, numero) ?? entretienVierge(numero);
            const maintenant = new Date();
            const signatures = {
              ...e.signatures,
              [role]: {
                signe: true,
                dateSignature: maintenant.toISOString(),
                ...(trace ? { trace } : {}),
              },
            };
            const entretienMaj: EntretienTripartite = { ...e, signatures };
            const livretAvecEntretien = ecrireEntretien(l, numero, entretienMaj);

            // Auto-marquage de la sélection des compétences abordées en
            // entreprise (CDC v1.5 §12) : seul l'entretien 1 fige la
            // sélection à la 3ᵉ signature. L'entretien 2 est un bilan
            // mi-parcours, sans effet sur la sélection.
            if (numero !== 1) return livretAvecEntretien;

            const toutesSignees =
              signatures.apprenti.signe && signatures.maitre.signe && signatures.formateur.signe;
            let selection =
              livretAvecEntretien.selectionCompetencesEntreprise ??
              creerSelectionVierge(maintenant);
            if (toutesSignees && selection.validePar === undefined) {
              const apprenti = useUtilisateursStore.getState().apprentis[l.apprentiId];
              if (apprenti) {
                selection = marquerValidee(
                  selection,
                  apprenti.formateurReferentId,
                  apprenti.maitreApprentissageId,
                  maintenant,
                );
              }
            }
            return {
              ...livretAvecEntretien,
              selectionCompetencesEntreprise: selection,
            };
          }),
        ),

      // ── Sélection des compétences abordées en entreprise ──────────────────
      toggleSelectionCompetenceEntreprise: (livretId, competenceId) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const sel = l.selectionCompetencesEntreprise ?? creerSelectionVierge();
            if (sel.validePar !== undefined) return l;
            return {
              ...l,
              selectionCompetencesEntreprise: toggleCompetence(sel, competenceId),
            };
          }),
        ),

      setSelectionCompetencesEntreprise: (livretId, ids) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const sel = l.selectionCompetencesEntreprise ?? creerSelectionVierge();
            if (sel.validePar !== undefined) return l;
            return {
              ...l,
              selectionCompetencesEntreprise: {
                ...sel,
                ids,
                modifieLe: new Date().toISOString(),
              },
            };
          }),
        ),

      invaliderSelectionCompetencesEntreprise: (livretId, auteurId, auteurNom, auteurRole, motif) =>
        set((s) =>
          muterLivret(s, livretId, (l) => ({
            ...l,
            selectionCompetencesEntreprise: invaliderSelection(
              l.selectionCompetencesEntreprise ?? creerSelectionVierge(),
              {
                id: `inv-${crypto.randomUUID()}`,
                auteurId,
                auteurNom,
                auteurRole,
                motif,
              },
            ),
          })),
        ),

      // Réalignement « tout coché » quand le référentiel effectif change
      // (1ᵉʳ juillet 2026). Les sélections validées sont préservées par
      // `realignerSurReferentiel` (même référence → livret non touché).
      realignerSelectionsFormation: (formationId, referentiel) =>
        set((s) => {
          const livrets = { ...s.livrets };
          let modifie = false;
          for (const [id, l] of Object.entries(livrets)) {
            if (l.formationId !== formationId) continue;
            const sel = l.selectionCompetencesEntreprise ?? creerSelectionVierge();
            const realignee = realignerSurReferentiel(sel, referentiel);
            if (realignee !== sel) {
              livrets[id] = {
                ...l,
                selectionCompetencesEntreprise: realignee,
                modifieLe: new Date().toISOString(),
              };
              modifie = true;
            }
          }
          if (!modifie) return s;
          return { livrets, derniereModification: new Date().toISOString() };
        }),

      realignerSelectionLivret: (livretId, referentiel) =>
        set((s) => {
          const l = s.livrets[livretId];
          if (!l) return s;
          const sel = l.selectionCompetencesEntreprise ?? creerSelectionVierge();
          const realignee = realignerSurReferentiel(sel, referentiel);
          if (realignee === sel) return s;
          return muterLivret(s, livretId, (liv) => ({
            ...liv,
            selectionCompetencesEntreprise: realignee,
          }));
        }),

      // ── Grilles d'évaluation finales ─────────────────────────────────────
      setLigneCompetenceFinale: (livretId, competenceId, patch) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const lignes = l.evaluationFinaleCompetences.lignes.map((ligne) =>
              ligne.competenceId === competenceId ? { ...ligne, ...patch } : ligne,
            );
            // Si la compétence n'existait pas (ad-hoc) on l'ajoute
            if (!lignes.some((ll) => ll.competenceId === competenceId)) {
              lignes.push({
                competenceId,
                acquisEntreprise: null,
                acquisCentre: null,
                ...patch,
              });
            }
            return {
              ...l,
              evaluationFinaleCompetences: {
                lignes,
                modifieLe: new Date().toISOString(),
              },
            };
          }),
        ),

      setEvaluationAttitude: (livretId, numero, attitudeId, niveau) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const e = lireEntretien(l, numero);
            if (!e) return l;
            // 13 juin 2026 : seules les attitudes RETENUES pour le livret
            // (choix fait à l'E1) sont évaluables — garde no-op.
            if (!l.attitudesSelectionnees.includes(attitudeId)) return l;
            return ecrireEntretien(l, numero, {
              ...e,
              evaluationsAttitudes: { ...e.evaluationsAttitudes, [attitudeId]: niveau },
            });
          }),
        ),

      toggleAttitudeSelectionnee: (livretId, attitudeId) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            // Figée dès que l'E1 est signé par les 3 parties.
            if (selectionAttitudesFigee(l)) return l;
            return {
              ...l,
              attitudesSelectionnees: toggleIdSelection(l.attitudesSelectionnees, attitudeId),
            };
          }),
        ),

      // ── Clôture livret (R22) ──────────────────────────────────────────────
      cloturerLivret: (livretId, auteurId, auteurNom, auteurRole) =>
        set((s) =>
          muterLivret(s, livretId, (l) => ({
            ...l,
            cloture: creerCloture(auteurId, auteurNom, auteurRole),
          })),
        ),

      rouvrirLivret: (livretId) =>
        set((s) =>
          muterLivret(s, livretId, (l) => ({
            ...l,
            cloture: null,
          })),
        ),

      // ── Déverrouillage de fiche avec motif (R10) ──────────────────────────
      deverrouillerFiche: (livretId, ficheId, auteurId, auteurNom, auteurRole, motif, lieu = 'entreprise') =>
        set((s) =>
          muterFiche(s, livretId, ficheId, lieu, (f) => {
            const trace: EntreeDeverrouillage = {
              id: `dv-${crypto.randomUUID()}`,
              dateIso: new Date().toISOString(),
              auteurId,
              auteurNom,
              auteurRole,
              motif,
            };
            // R10 + R21 : le déverrouillage invalide les signatures pour
            // permettre une nouvelle validation tripartite.
            return {
              ...f,
              etat: 'en-cours',
              signatures: {
                apprenti: { signe: false },
                maitre: { signe: false },
                formateur: { signe: false },
              },
              historiqueDeverrouillages: [...f.historiqueDeverrouillages, trace],
            };
          }),
        ),

      reinitialiserDemo: () =>
        set(() => ({
          livrets: livretsDemo,
          derniereModification: new Date().toISOString(),
        })),
    }),
    {
      name: 'livret-donnees',
      version: VERSION_SCHEMA,
      // CDC §C4 : si le numéro de version diffère, on reset (pas de migration en étape 1).
      migrate: () => ({
        livrets: livretsDemo,
        derniereModification: null,
      }),
    },
  ),
);
