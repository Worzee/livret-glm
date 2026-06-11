import { describe, expect, it } from 'vitest';
import type { Apprenti, EntretienTripartite, FicheSuiviPeriode, Livret } from '@/types';
import { evaluerVerrouAffectation } from './affectation-verrou';

// Helpers minimaux pour fabriquer un livret + apprenti·e à des fins de test.

function fabriquerApprenti(contratDebut: string): Apprenti {
  return {
    id: 'u-test',
    role: 'apprenti',
    nom: 'TEST',
    prenom: 'Cas',
    email: 'cas.test@demo.fr',
    dateNaissance: '2008-01-01',
    formationId: 'f-test',
    entrepriseId: 'e-test',
    maitreApprentissageId: 'u-maitre-test',
    formateurReferentId: 'u-formateur-test',
    contratDebut,
    contratFin: '2027-09-01',
  };
}

function fabriquerLivret(overrides: Partial<Livret> = {}): Livret {
  return {
    id: 'livret-test',
    apprentiId: 'u-test',
    formationId: 'f-test',
    organisationSuivi: {
      evenements: [],
      modifieLe: '2025-09-01T00:00:00.000Z',
      modifiePar: 'u-test',
    },
    entretiens: { 1: null, 2: null, 3: null, 4: null },
    fichesSuivi: [],
    evaluationFinaleCompetences: { lignes: [], modifieLe: '2025-09-01T00:00:00.000Z' },
    evaluationFinaleAttitudes: { lignes: [], modifieLe: '2025-09-01T00:00:00.000Z' },
    selectionCompetencesEntreprise: {
      ids: [],
      modifieLe: '2025-09-01T00:00:00.000Z',
      historiqueInvalidations: [],
    },
    cloture: null,
    creeLe: '2025-09-01T00:00:00.000Z',
    modifieLe: '2025-09-01T00:00:00.000Z',
    ...overrides,
  };
}

const FICHE_VIDE: FicheSuiviPeriode = {
  id: 'fp-test',
  numeroPeriode: 1,
  dateDebut: '2025-09-02',
  dateFin: '2025-12-20',
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

const ENTRETIEN_VIDE: EntretienTripartite = {
  questionsApprentiSelectionnees: [],
  questionsMaitreSelectionnees: [],
  questionsImposees: [],
  questionsObligatoires: [],
  reponsesApprenti: {},
  reponsesMaitre: {},
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

describe('evaluerVerrouAffectation', () => {
  it("ne verrouille PAS si le contrat n'a pas démarré ET pas de fiche ni entretien", () => {
    const apprenti = fabriquerApprenti('2026-09-01'); // futur
    const livret = fabriquerLivret();
    const r = evaluerVerrouAffectation(apprenti, livret, new Date('2026-05-09'));
    expect(r.verrouille).toBe(false);
    expect(r.raison).toBeUndefined();
  });

  it('verrouille si le contrat a démarré (date courante >= contratDebut)', () => {
    const apprenti = fabriquerApprenti('2025-09-02');
    const livret = fabriquerLivret();
    const r = evaluerVerrouAffectation(apprenti, livret, new Date('2026-05-09'));
    expect(r.verrouille).toBe(true);
    expect(r.raison).toMatch(/Contrat démarré le 02\/09\/2025/);
  });

  it('ne verrouille PAS pour des fiches restées en brouillon (auto-créées par le planning formation)', () => {
    // Chantier planning au niveau formation : les fiches sont créées vierges
    // (état brouillon) dès la création du livret. Leur simple existence ne
    // témoigne d'aucun travail — le verrou ne doit pas se déclencher.
    const apprenti = fabriquerApprenti('2099-09-01'); // contrat futur
    const livret = fabriquerLivret({
      fichesSuivi: [FICHE_VIDE, { ...FICHE_VIDE, id: 'fp-2' }, { ...FICHE_VIDE, id: 'fp-3' }],
    });
    const r = evaluerVerrouAffectation(apprenti, livret, new Date('2026-05-09'));
    expect(r.verrouille).toBe(false);
  });

  it("verrouille dès qu'une fiche est sortie du brouillon (priorité sur contrat)", () => {
    const apprenti = fabriquerApprenti('2099-09-01'); // contrat futur — sans travail, pas de verrou
    const livret = fabriquerLivret({
      fichesSuivi: [{ ...FICHE_VIDE, etat: 'en-cours' }],
    });
    const r = evaluerVerrouAffectation(apprenti, livret, new Date('2026-05-09'));
    expect(r.verrouille).toBe(true);
    expect(r.raison).toMatch(/1 fiche de période travaillée/);
  });

  it('verrouille si plusieurs fiches sont travaillées (libellé pluriel)', () => {
    const apprenti = fabriquerApprenti('2099-09-01');
    const livret = fabriquerLivret({
      fichesSuivi: [
        { ...FICHE_VIDE, etat: 'en-cours' },
        { ...FICHE_VIDE, id: 'fp-2', etat: 'signee' },
        { ...FICHE_VIDE, id: 'fp-3', etat: 'verrouillee' },
      ],
    });
    const r = evaluerVerrouAffectation(apprenti, livret, new Date('2026-05-09'));
    expect(r.verrouille).toBe(true);
    expect(r.raison).toMatch(/3 fiches de période travaillées/);
  });

  it('ne compte que les fiches travaillées dans le libellé (mix brouillon + en-cours)', () => {
    const apprenti = fabriquerApprenti('2099-09-01');
    const livret = fabriquerLivret({
      fichesSuivi: [
        FICHE_VIDE,
        { ...FICHE_VIDE, id: 'fp-2', etat: 'en-cours' },
        { ...FICHE_VIDE, id: 'fp-3' },
      ],
    });
    const r = evaluerVerrouAffectation(apprenti, livret, new Date('2026-05-09'));
    expect(r.verrouille).toBe(true);
    expect(r.raison).toMatch(/1 fiche de période travaillée/);
  });

  it("verrouille si l'entretien tripartite a été initialisé (sans fiche, contrat futur)", () => {
    const apprenti = fabriquerApprenti('2099-09-01');
    const livret = fabriquerLivret({ entretiens: { 1: ENTRETIEN_VIDE, 2: null, 3: null, 4: null } });
    const r = evaluerVerrouAffectation(apprenti, livret, new Date('2026-05-09'));
    expect(r.verrouille).toBe(true);
    expect(r.raison).toMatch(/Entretien tripartite initialisé/);
  });

  it("priorise la raison « fiches » sur « entretien » et « contrat »", () => {
    const apprenti = fabriquerApprenti('2025-09-02'); // contrat démarré
    const livret = fabriquerLivret({
      entretiens: { 1: ENTRETIEN_VIDE, 2: null, 3: null, 4: null },
      fichesSuivi: [{ ...FICHE_VIDE, etat: 'en-cours' }],
    });
    const r = evaluerVerrouAffectation(apprenti, livret, new Date('2026-05-09'));
    expect(r.verrouille).toBe(true);
    expect(r.raison).toMatch(/fiche de période/);
    expect(r.raison).not.toMatch(/Entretien|Contrat démarré/);
  });

  it("priorise « entretien » sur « contrat » quand il n'y a pas de fiche", () => {
    const apprenti = fabriquerApprenti('2025-09-02');
    const livret = fabriquerLivret({ entretiens: { 1: ENTRETIEN_VIDE, 2: null, 3: null, 4: null } });
    const r = evaluerVerrouAffectation(apprenti, livret, new Date('2026-05-09'));
    expect(r.verrouille).toBe(true);
    expect(r.raison).toMatch(/Entretien tripartite/);
  });
});
