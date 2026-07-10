import { describe, expect, it } from 'vitest';
import type {
  Formation,
  Livret,
  ModeleActivites,
  Referentiel,
  SignaturesTripartite,
} from '@/types';
import {
  formationsEnModeActivites,
  livretAUneSaisieSignee,
  modeEffectif,
  peutBasculerMode,
  peutChangerReferentielFormation,
  peutExclureCompetence,
  peutReimporterReferentiel,
  promoAUneSaisieSignee,
} from './mode-evaluation';

// ── Fabriques minimales ──────────────────────────────────────────────────────

const signaturesVierges = (): SignaturesTripartite => ({
  apprenti: { signe: false },
  maitre: { signe: false },
  formateur: { signe: false },
});

const livretVierge = (id = 'l-1'): Livret => ({
  id,
  apprentiId: `app-${id}`,
  formationId: 'f-test',
  organisationSuivi: { evenements: [], modifieLe: '', modifiePar: '' },
  entretien: null,
  fichesSuivi: [],
  fichesSuiviCentre: [],
  evaluationFinaleCompetences: { lignes: [], modifieLe: '' },
  selectionCompetencesEntreprise: { ids: [], modifieLe: '', historiqueInvalidations: [] },
  selectionActivitesEntreprise: { ids: [], modifieLe: '', historiqueInvalidations: [] },
  attitudesSelectionnees: [],
  cloture: null,
  creeLe: '2025-09-01',
  modifieLe: '2025-09-01',
});

const ficheVierge = (id: string) => ({
  id,
  numeroPeriode: 1,
  dateDebut: '2025-09-01',
  dateFin: '2025-12-19',
  suiviGretaCfa: {},
  suiviEntreprise: [],
  observations: {},
  signatures: signaturesVierges(),
  etat: 'brouillon' as const,
  historiqueDeverrouillages: [],
});

const formation = (patch: Partial<Formation> = {}): Formation => ({
  id: 'f-test',
  intitule: 'Formation test',
  niveau: 'CAP',
  annee: '2025-2026',
  referentielId: 'ref-test',
  dateDebut: '2025-09-01',
  dateFin: '2026-08-31',
  lieuId: 'eta-test',
  periodes: [],
  periodesCentre: [],
  ...patch,
});

const referentiel: Referentiel = {
  id: 'ref-test',
  formation: 'Formation test',
  blocs: [
    {
      id: 'b1',
      code: 'B1',
      libelle: 'Bloc 1',
      competences: [
        { id: 'c1', code: 'C1', libelle: 'Compétence 1' },
        { id: 'c2', code: 'C2', libelle: 'Compétence 2' },
      ],
    },
  ],
};

const modeleComplet: ModeleActivites = {
  id: 'act-test',
  nom: 'Modèle test',
  referentielId: 'ref-test',
  activites: [{ id: 'a1', code: 'A1', libelle: 'Activité 1', competenceIds: ['c1', 'c2'] }],
};

// ── Saisie signée ────────────────────────────────────────────────────────────

describe('livretAUneSaisieSignee / promoAUneSaisieSignee', () => {
  it('un livret vierge n’a aucune saisie signée', () => {
    expect(livretAUneSaisieSignee(livretVierge())).toBe(false);
    expect(promoAUneSaisieSignee([livretVierge(), livretVierge('l-2')])).toBe(false);
  });

  it('une signature sur l’entretien compte comme saisie signée', () => {
    const l = livretVierge();
    l.entretien = {
      reponsesTrame: {},
      appreciationMaitre: {},
      commentaires: {},
      signatures: { ...signaturesVierges(), apprenti: { signe: true } },
    };
    expect(livretAUneSaisieSignee(l)).toBe(true);
  });

  it('une signature sur une fiche entreprise ou centre compte', () => {
    const entreprise = livretVierge();
    entreprise.fichesSuivi = [
      { ...ficheVierge('fp-1'), signatures: { ...signaturesVierges(), maitre: { signe: true } } },
    ];
    expect(livretAUneSaisieSignee(entreprise)).toBe(true);

    const centre = livretVierge();
    centre.fichesSuiviCentre = [
      {
        ...ficheVierge('fc-1'),
        signatures: { ...signaturesVierges(), formateur: { signe: true } },
      },
    ];
    expect(livretAUneSaisieSignee(centre)).toBe(true);
  });

  it('un seul livret signé suffit à verrouiller la promo', () => {
    const signe = livretVierge('l-2');
    signe.fichesSuivi = [
      { ...ficheVierge('fp-1'), signatures: { ...signaturesVierges(), apprenti: { signe: true } } },
    ];
    expect(promoAUneSaisieSignee([livretVierge(), signe])).toBe(true);
  });
});

// ── Bascule du mode ──────────────────────────────────────────────────────────

describe('peutBasculerMode', () => {
  it('autorise le passage en mode activités : balayage complet, rien de signé', () => {
    const r = peutBasculerMode({
      formation: formation({ modeleActivitesId: 'act-test' }),
      cible: 'activites',
      modele: modeleComplet,
      referentiel,
      livretsPromo: [livretVierge()],
    });
    expect(r.ok).toBe(true);
  });

  it('refuse si le mode cible est déjà le mode courant', () => {
    const r = peutBasculerMode({
      formation: formation(),
      cible: 'competences',
      referentiel,
      livretsPromo: [],
    });
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(/déjà/i);
  });

  it('refuse dès la première saisie signée dans la promo — dans les deux sens (Q2)', () => {
    const signe = livretVierge();
    signe.fichesSuivi = [
      { ...ficheVierge('fp-1'), signatures: { ...signaturesVierges(), apprenti: { signe: true } } },
    ];
    const versActivites = peutBasculerMode({
      formation: formation({ modeleActivitesId: 'act-test' }),
      cible: 'activites',
      modele: modeleComplet,
      referentiel,
      livretsPromo: [signe],
    });
    expect(versActivites.ok).toBe(false);
    expect(versActivites.raison).toMatch(/signée/i);

    const versCompetences = peutBasculerMode({
      formation: formation({ modeEvaluation: 'activites', modeleActivitesId: 'act-test' }),
      cible: 'competences',
      modele: modeleComplet,
      referentiel,
      livretsPromo: [signe],
    });
    expect(versCompetences.ok).toBe(false);
  });

  it('refuse le passage en activités sans modèle rattaché', () => {
    const r = peutBasculerMode({
      formation: formation(),
      cible: 'activites',
      referentiel,
      livretsPromo: [],
    });
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(/modèle/i);
  });

  it('autorise le passage en activités même à balayage INCOMPLET, dès que chaque activité est mappée (10 juillet 2026)', () => {
    // a1 ne couvre que c1 : c2 reste non balayée — plus bloquant depuis la
    // révision de l'invariant (retour démo direction).
    const modelePartiel: ModeleActivites = {
      ...modeleComplet,
      activites: [{ id: 'a1', code: 'A1', libelle: 'Activité 1', competenceIds: ['c1'] }],
    };
    const r = peutBasculerMode({
      formation: formation({ modeleActivitesId: 'act-test' }),
      cible: 'activites',
      modele: modelePartiel,
      referentiel,
      livretsPromo: [],
    });
    expect(r.ok).toBe(true);
  });

  it('refuse le passage en activités si une activité ne fait appel à aucune compétence', () => {
    const modeleAvecActiviteVide: ModeleActivites = {
      ...modeleComplet,
      activites: [
        { id: 'a1', code: 'A1', libelle: 'Activité 1', competenceIds: ['c1'] },
        { id: 'a2', code: 'A2', libelle: 'Activité 2', competenceIds: [] },
      ],
    };
    const r = peutBasculerMode({
      formation: formation({ modeleActivitesId: 'act-test' }),
      cible: 'activites',
      modele: modeleAvecActiviteVide,
      referentiel,
      livretsPromo: [],
    });
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(/sans compétence mappée/i);
    expect(r.raison).toContain('Activité 2');
  });

  it('refuse le passage en activités si le modèle est mappé sur un autre référentiel', () => {
    const r = peutBasculerMode({
      formation: formation({ modeleActivitesId: 'act-test', referentielId: 'ref-autre' }),
      cible: 'activites',
      modele: modeleComplet,
      referentiel: { ...referentiel, id: 'ref-autre' },
      livretsPromo: [],
    });
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(/référentiel/i);
  });

  it('le retour en compétences reste libre tant que rien n’est signé', () => {
    const r = peutBasculerMode({
      formation: formation({ modeEvaluation: 'activites', modeleActivitesId: 'act-test' }),
      cible: 'competences',
      referentiel,
      livretsPromo: [livretVierge()],
    });
    expect(r.ok).toBe(true);
  });
});

// ── Gardes du référentiel vivant (Q6) ───────────────────────────────────────

describe('gardes référentiel × mode activités', () => {
  const fActivites = formation({
    id: 'f-act',
    modeEvaluation: 'activites',
    modeleActivitesId: 'act-test',
  });
  const fCompetences = formation({ id: 'f-comp' });

  it('modeEffectif : compétences par défaut', () => {
    expect(modeEffectif(undefined)).toBe('competences');
    expect(modeEffectif(fCompetences)).toBe('competences');
    expect(modeEffectif(fActivites)).toBe('activites');
  });

  it('formationsEnModeActivites filtre par référentiel et par mode', () => {
    expect(formationsEnModeActivites('ref-test', [fActivites, fCompetences])).toEqual([fActivites]);
    expect(formationsEnModeActivites('ref-autre', [fActivites])).toEqual([]);
  });

  it('peutReimporterReferentiel : bloqué si une formation rattachée est en mode activités', () => {
    const bloque = peutReimporterReferentiel('ref-test', [fActivites, fCompetences]);
    expect(bloque.ok).toBe(false);
    expect(bloque.raison).toMatch(/mode activités/i);
    expect(peutReimporterReferentiel('ref-test', [fCompetences]).ok).toBe(true);
  });

  it('peutChangerReferentielFormation : bloqué en mode activités', () => {
    expect(peutChangerReferentielFormation(fActivites).ok).toBe(false);
    expect(peutChangerReferentielFormation(fCompetences).ok).toBe(true);
  });

  it('peutExclureCompetence : bloqué si une activité ne serait plus mappée sur rien (10 juillet 2026)', () => {
    // a1 est mappée sur c1 ET c2 : exclure c1 laisse c2 → permis.
    const modeles = { 'act-test': modeleComplet };
    expect(peutExclureCompetence('c1', referentiel, [fActivites], modeles).ok).toBe(true);

    // a1 mappée sur c1 seule : exclure c1 la ferait tomber à 0 → bloqué.
    const modelesEtroits = {
      'act-test': {
        ...modeleComplet,
        activites: [{ id: 'a1', code: 'A1', libelle: 'Activité 1', competenceIds: ['c1'] }],
      },
    };
    const bloque = peutExclureCompetence('c1', referentiel, [fActivites], modelesEtroits);
    expect(bloque.ok).toBe(false);
    expect(bloque.raison).toMatch(/Exclusion bloquée/i);
    expect(bloque.raison).toContain('Activité 1');

    // Sans formation en mode activités : toujours permis.
    expect(peutExclureCompetence('c1', referentiel, [fCompetences], modelesEtroits).ok).toBe(true);
  });
});
