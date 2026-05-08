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
  FicheSuiviPeriode,
  LigneEvaluationFinaleAttitude,
  LigneEvaluationFinaleCompetence,
  LigneSuiviEntreprise,
  LigneSuiviGreta,
  Livret,
  NiveauMaitrise,
  NiveauMaitriseEntreprise,
  ObservationsFiche,
  OrganisationSuivi,
  ReponsesApprentiEntretien,
  ReponsesMaitreEntretien,
  Role,
} from '@/types';
import { livretsDemo } from '@/fixtures/livret-demo';
import { deduireEtat } from '@/lib/transitions-fiche';
import { creerCloture } from '@/lib/cloture-livret';

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

// Bumpé en sprint 5 : ajout `cloture` (R22) et `historiqueDeverrouillages` (R10).
const VERSION_SCHEMA = 3;

interface LivretStore {
  livrets: Record<string, Livret>;
  /** Bumpé à chaque mutation, sert d'indicateur "Enregistré" dans l'UI. */
  derniereModification: string | null;

  // ── Lecture ──────────────────────────────────────────────────────────────
  getLivret: (livretId: string) => Livret | undefined;
  getFiche: (livretId: string, ficheId: string) => FicheSuiviPeriode | undefined;

  // ── Mutations sur les fiches de période ──────────────────────────────────
  /** Met à jour une cellule du tableau tri-colonnes pour une compétence donnée. */
  setEvaluationLigne: (
    livretId: string,
    ficheId: string,
    ligneId: string,
    champ:
      | { type: 'evaluationGreta'; valeur: NiveauMaitrise | null }
      | { type: 'evaluationEntreprise'; valeur: NiveauMaitriseEntreprise | null }
      | { type: 'retourApprenti'; valeur: string },
  ) => void;

  /** Met à jour la zone d'observation d'un rôle pour la fiche. */
  setObservation: (
    livretId: string,
    ficheId: string,
    role: Role,
    valeur: string,
  ) => void;

  /** Met à jour une ligne du suivi GRETA CFA. */
  setLigneSuiviGreta: (
    livretId: string,
    ficheId: string,
    ligneId: string,
    patch: Partial<Omit<LigneSuiviGreta, 'id'>>,
  ) => void;

  /** Ajoute une ligne au suivi GRETA CFA. */
  ajouterLigneSuiviGreta: (livretId: string, ficheId: string) => string;

  /** Supprime une ligne du suivi GRETA CFA. */
  supprimerLigneSuiviGreta: (livretId: string, ficheId: string, ligneId: string) => void;

  /** Ajoute une ligne au suivi entreprise (compétence du référentiel ou ad hoc). */
  ajouterLigneSuiviEntreprise: (
    livretId: string,
    ficheId: string,
    competenceId: string | null,
    libelleLibre?: string,
  ) => string;

  /** Supprime une ligne du suivi entreprise. */
  supprimerLigneSuiviEntreprise: (
    livretId: string,
    ficheId: string,
    ligneId: string,
  ) => void;

  /** Appose ou retire la signature d'un rôle. La validation R18/R20 est faite côté UI. */
  signer: (livretId: string, ficheId: string, role: Role) => void;

  /** Verrouille/déverrouille une fiche (formateur uniquement, validation côté UI). */
  setEtatFiche: (livretId: string, ficheId: string, etat: EtatFiche) => void;

  // ── Mutations sur l'organisation du suivi (CDC §5.1) ─────────────────────
  setOrganisationSuivi: (
    livretId: string,
    auteurId: string,
    patch: Partial<Omit<OrganisationSuivi, 'modifieLe' | 'modifiePar'>>,
  ) => void;

  // ── Mutations sur l'entretien tripartite (CDC §5.2) ──────────────────────
  /** Initialise une fiche d'entretien vierge si elle n'existe pas encore (R6). */
  initialiserEntretien: (livretId: string) => void;
  setEntretienDate: (livretId: string, dateEntretien: string) => void;
  setReponsesApprenti: (
    livretId: string,
    patch: Partial<ReponsesApprentiEntretien>,
  ) => void;
  setReponsesMaitre: (livretId: string, patch: Partial<ReponsesMaitreEntretien>) => void;
  setAppreciationMaitre: (livretId: string, patch: Partial<AppreciationMaitre>) => void;
  setDemarchesAdministratives: (
    livretId: string,
    patch: Partial<DemarchesAdministratives>,
  ) => void;
  setConditionsPratiques: (livretId: string, patch: Partial<ConditionsPratiques>) => void;
  setAidesDemandees: (livretId: string, patch: Partial<AidesDemandees>) => void;
  setCommentaireEntretien: (
    livretId: string,
    role: 'apprenti' | 'maitre' | 'formateur',
    valeur: string,
  ) => void;
  signerEntretien: (livretId: string, role: 'apprenti' | 'maitre' | 'formateur') => void;

  // ── Mutations sur les grilles d'évaluation finales (CDC §5.4 / §5.5) ─────
  setLigneCompetenceFinale: (
    livretId: string,
    competenceId: string,
    patch: Partial<Omit<LigneEvaluationFinaleCompetence, 'competenceId'>>,
  ) => void;
  setLigneAttitudeFinale: (
    livretId: string,
    attitudeId: string,
    patch: Partial<Omit<LigneEvaluationFinaleAttitude, 'attitudeId'>>,
  ) => void;

  // ── Clôture livret (R22) ─────────────────────────────────────────────────
  /**
   * Clôture le livret. Validation R22 (toutes fiches verrouillées) effectuée
   * côté UI avant l'appel. La date de clôture est l'horodatage du clic.
   */
  cloturerLivret: (
    livretId: string,
    auteurId: string,
    auteurNom: string,
    auteurRole: Role,
  ) => void;

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

/** Crée un entretien tripartite vide (R6 — un seul par livret). */
function entretienVierge(): EntretienTripartite {
  return {
    reponsesApprenti: {},
    reponsesMaitre: { dejaFormeApprenti: null },
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
  patch: (fiche: FicheSuiviPeriode) => FicheSuiviPeriode,
): Pick<LivretStore, 'livrets' | 'derniereModification'> {
  const livret = store.livrets[livretId];
  if (!livret) return { livrets: store.livrets, derniereModification: store.derniereModification };
  const idx = livret.fichesSuivi.findIndex((f) => f.id === ficheId);
  if (idx === -1) return { livrets: store.livrets, derniereModification: store.derniereModification };

  const nouvelleFiche = patch(livret.fichesSuivi[idx]);
  // Recalcul de l'état (R15/R16) — sauf si la fiche est verrouillée.
  const ficheAvecEtat: FicheSuiviPeriode = {
    ...nouvelleFiche,
    etat: deduireEtat(nouvelleFiche),
  };
  const fichesSuivi = [...livret.fichesSuivi];
  fichesSuivi[idx] = ficheAvecEtat;
  const maintenant = new Date().toISOString();
  return {
    livrets: {
      ...store.livrets,
      [livretId]: { ...livret, fichesSuivi, modifieLe: maintenant },
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
      getFiche: (livretId, ficheId) =>
        get().livrets[livretId]?.fichesSuivi.find((f) => f.id === ficheId),

      setEvaluationLigne: (livretId, ficheId, ligneId, champ) =>
        set((s) =>
          muterFiche(s, livretId, ficheId, (f) => {
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

      setObservation: (livretId, ficheId, role, valeur) =>
        set((s) =>
          muterFiche(s, livretId, ficheId, (f) => {
            // Ni coordo ni admin n'ont de zone observation propre dans la fiche.
            // L'admin écrit dans une des 3 zones via le slot du rôle ciblé,
            // pas via son propre rôle.
            if (role === 'coordo' || role === 'admin') return f;
            const observations: ObservationsFiche = { ...f.observations, [role]: valeur };
            return { ...f, observations };
          }),
        ),

      setLigneSuiviGreta: (livretId, ficheId, ligneId, patch) =>
        set((s) =>
          muterFiche(s, livretId, ficheId, (f) => {
            const idx = f.suiviGretaCfa.findIndex((l) => l.id === ligneId);
            if (idx === -1) return f;
            const nouvelles = [...f.suiviGretaCfa];
            nouvelles[idx] = { ...nouvelles[idx], ...patch };
            return { ...f, suiviGretaCfa: nouvelles };
          }),
        ),

      ajouterLigneSuiviGreta: (livretId, ficheId) => {
        const nouvelId = `sg-${crypto.randomUUID()}`;
        set((s) =>
          muterFiche(s, livretId, ficheId, (f) => ({
            ...f,
            suiviGretaCfa: [
              ...f.suiviGretaCfa,
              { id: nouvelId, nomCours: '', nomFormateur: '', contenu: '' },
            ],
          })),
        );
        return nouvelId;
      },

      supprimerLigneSuiviGreta: (livretId, ficheId, ligneId) =>
        set((s) =>
          muterFiche(s, livretId, ficheId, (f) => ({
            ...f,
            suiviGretaCfa: f.suiviGretaCfa.filter((l) => l.id !== ligneId),
          })),
        ),

      ajouterLigneSuiviEntreprise: (livretId, ficheId, competenceId, libelleLibre) => {
        const nouvelId = `se-${crypto.randomUUID()}`;
        set((s) =>
          muterFiche(s, livretId, ficheId, (f) => ({
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

      supprimerLigneSuiviEntreprise: (livretId, ficheId, ligneId) =>
        set((s) =>
          muterFiche(s, livretId, ficheId, (f) => ({
            ...f,
            suiviEntreprise: f.suiviEntreprise.filter((l) => l.id !== ligneId),
          })),
        ),

      signer: (livretId, ficheId, role) =>
        set((s) =>
          muterFiche(s, livretId, ficheId, (f) => {
            // Ni coordo ni admin ne signent en leur nom propre.
            // Pour signer côté admin, l'UI appelle signer() avec le rôle
            // métier ciblé (apprenti/maitre/formateur), pas 'admin'.
            if (role === 'coordo' || role === 'admin') return f;
            const signatures = { ...f.signatures };
            signatures[role] = { signe: true, dateSignature: new Date().toISOString() };
            return { ...f, signatures };
          }),
        ),

      setEtatFiche: (livretId, ficheId, etat) =>
        set((s) =>
          muterFiche(s, livretId, ficheId, (f) => ({ ...f, etat })),
        ),

      // ── Organisation du suivi ─────────────────────────────────────────────
      setOrganisationSuivi: (livretId, auteurId, patch) =>
        set((s) =>
          muterLivret(s, livretId, (l) => ({
            ...l,
            organisationSuivi: {
              ...l.organisationSuivi,
              ...patch,
              modifieLe: new Date().toISOString(),
              modifiePar: auteurId,
            },
          })),
        ),

      // ── Entretien tripartite ──────────────────────────────────────────────
      initialiserEntretien: (livretId) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            // R6 : un seul entretien par livret — ne pas écraser s'il existe déjà
            if (l.entretienTripartite) return l;
            return { ...l, entretienTripartite: entretienVierge() };
          }),
        ),

      setEntretienDate: (livretId, dateEntretien) =>
        set((s) =>
          muterLivret(s, livretId, (l) => ({
            ...l,
            entretienTripartite: {
              ...(l.entretienTripartite ?? entretienVierge()),
              dateEntretien,
            },
          })),
        ),

      setReponsesApprenti: (livretId, patch) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const e = l.entretienTripartite ?? entretienVierge();
            return {
              ...l,
              entretienTripartite: {
                ...e,
                reponsesApprenti: { ...e.reponsesApprenti, ...patch },
              },
            };
          }),
        ),

      setReponsesMaitre: (livretId, patch) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const e = l.entretienTripartite ?? entretienVierge();
            return {
              ...l,
              entretienTripartite: {
                ...e,
                reponsesMaitre: { ...e.reponsesMaitre, ...patch },
              },
            };
          }),
        ),

      setAppreciationMaitre: (livretId, patch) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const e = l.entretienTripartite ?? entretienVierge();
            return {
              ...l,
              entretienTripartite: {
                ...e,
                appreciationMaitre: { ...e.appreciationMaitre, ...patch },
              },
            };
          }),
        ),

      setDemarchesAdministratives: (livretId, patch) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const e = l.entretienTripartite ?? entretienVierge();
            return {
              ...l,
              entretienTripartite: {
                ...e,
                demarchesAdministratives: { ...e.demarchesAdministratives, ...patch },
              },
            };
          }),
        ),

      setConditionsPratiques: (livretId, patch) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const e = l.entretienTripartite ?? entretienVierge();
            return {
              ...l,
              entretienTripartite: {
                ...e,
                conditionsPratiques: { ...e.conditionsPratiques, ...patch },
              },
            };
          }),
        ),

      setAidesDemandees: (livretId, patch) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const e = l.entretienTripartite ?? entretienVierge();
            return {
              ...l,
              entretienTripartite: {
                ...e,
                aidesDemandees: { ...e.aidesDemandees, ...patch },
              },
            };
          }),
        ),

      setCommentaireEntretien: (livretId, role, valeur) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const e = l.entretienTripartite ?? entretienVierge();
            return {
              ...l,
              entretienTripartite: {
                ...e,
                commentaires: { ...e.commentaires, [role]: valeur },
              },
            };
          }),
        ),

      signerEntretien: (livretId, role) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const e = l.entretienTripartite ?? entretienVierge();
            const signatures = {
              ...e.signatures,
              [role]: { signe: true, dateSignature: new Date().toISOString() },
            };
            return {
              ...l,
              entretienTripartite: { ...e, signatures },
            };
          }),
        ),

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

      setLigneAttitudeFinale: (livretId, attitudeId, patch) =>
        set((s) =>
          muterLivret(s, livretId, (l) => {
            const lignes = l.evaluationFinaleAttitudes.lignes.map((ligne) =>
              ligne.attitudeId === attitudeId ? { ...ligne, ...patch } : ligne,
            );
            if (!lignes.some((ll) => ll.attitudeId === attitudeId)) {
              lignes.push({
                attitudeId,
                evaluationMaitre: null,
                evaluationFormateur: null,
                ...patch,
              });
            }
            return {
              ...l,
              evaluationFinaleAttitudes: {
                lignes,
                modifieLe: new Date().toISOString(),
              },
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
      deverrouillerFiche: (livretId, ficheId, auteurId, auteurNom, auteurRole, motif) =>
        set((s) =>
          muterFiche(s, livretId, ficheId, (f) => {
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
