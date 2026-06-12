import { describe, expect, it } from 'vitest';
import type { Apprenti, EntretienTripartite } from '@/types';
import {
  calculerAlerteR7,
  calculerProgression,
  DELAI_ENTRETIEN_JOURS,
  peutEncoreEditer,
  peutInitialiserEntretien,
  validerSignatureEntretien,
} from './regles-entretien';
import { QUESTIONS_BANQUE_INITIALE, indexerBanque } from './questions-entretien';

const apprenti = (contratDebut: string): Apprenti => ({
  id: 'a',
  role: 'apprenti',
  nom: 'TEST',
  prenom: 'A',
  email: 'a@demo.fr',
  dateNaissance: '2000-01-01',
  formationId: 'f',
  entrepriseId: 'e',
  maitreApprentissageId: 'm',
  formateurReferentId: 'f',
  contratDebut,
  contratFin: '2027-01-01',
});

const entretienVide = (): EntretienTripartite => ({
  // Refonte mai 2026 : on simule la sélection par défaut (toutes les
  // questions de la banque) — équivalent fonctionnel à l'ancien format.
  questionsApprentiSelectionnees: [
    'q-app-motivations',
    'q-app-contact-entreprise',
    'q-app-connaissance-entreprise',
    'q-app-metier-representation',
    'q-app-difficultes-formation',
    'q-app-difficultes-autres',
    'q-app-ressenti-equipe',
  ],
  questionsMaitreSelectionnees: [
    'q-mai-deja-forme',
    'q-mai-diplomes-deja-formes',
    'q-mai-objectifs-embauche',
    'q-mai-organisation-tutorat',
  ],
  // Snapshots vides par défaut — les cas « questions obligatoires » les
  // renseignent explicitement.
  questionsImposees: [],
  questionsObligatoires: [],
  evaluationsAttitudes: {},
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
});

// ─────────────────────────────────────────────────────────────────────────────
describe('R7 — alerte délai entretien tripartite', () => {
  it("ne déclenche pas l'alerte si on est dans les 60 jours", () => {
    const a = apprenti('2026-04-01');
    const r = calculerAlerteR7(a, null, new Date('2026-05-01'));
    expect(r.declenchee).toBe(false);
    expect(r.joursDepasses).toBeLessThan(0);
  });

  it("déclenche l'alerte au-delà de 60 jours sans entretien", () => {
    const a = apprenti('2026-01-01');
    const r = calculerAlerteR7(a, null, new Date('2026-04-01')); // ~90 jours
    expect(r.declenchee).toBe(true);
    expect(r.joursDepasses).toBeGreaterThan(0);
  });

  it("ne déclenche pas l'alerte si l'entretien existe et est entièrement signé", () => {
    const a = apprenti('2026-01-01');
    const e = entretienVide();
    e.signatures = {
      apprenti: { signe: true, dateSignature: '2026-02-01T10:00:00Z' },
      maitre: { signe: true, dateSignature: '2026-02-01T10:00:00Z' },
      formateur: { signe: true, dateSignature: '2026-02-01T10:00:00Z' },
    };
    const r = calculerAlerteR7(a, e, new Date('2026-04-01'));
    expect(r.declenchee).toBe(false);
  });

  it("déclenche l'alerte si l'entretien est partiellement signé seulement", () => {
    const a = apprenti('2026-01-01');
    const e = entretienVide();
    e.signatures.apprenti = { signe: true, dateSignature: '2026-04-01T10:00:00Z' };
    const r = calculerAlerteR7(a, e, new Date('2026-04-15')); // > 60 j
    expect(r.declenchee).toBe(true);
  });

  it("la butée est exactement contratDebut + DELAI jours", () => {
    const a = apprenti('2026-01-01');
    const r = calculerAlerteR7(a, null, new Date('2026-01-02'));
    const debut = new Date('2026-01-01').getTime();
    const butoir = new Date(r.dateButoir).getTime();
    const jours = Math.round((butoir - debut) / (24 * 60 * 60 * 1000));
    expect(jours).toBe(DELAI_ENTRETIEN_JOURS);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('R8 / R9 — verrouillage progressif des sections', () => {
  it("R8 : un rôle qui n'a pas signé peut encore éditer", () => {
    const e = entretienVide();
    expect(peutEncoreEditer('apprenti', e)).toBe(true);
    expect(peutEncoreEditer('maitre', e)).toBe(true);
    expect(peutEncoreEditer('formateur', e)).toBe(true);
  });

  it("R8 : dès qu'un rôle a signé, il ne peut plus éditer sa section", () => {
    const e = entretienVide();
    e.signatures.apprenti = { signe: true, dateSignature: '2026-04-01T10:00:00Z' };
    expect(peutEncoreEditer('apprenti', e)).toBe(false);
    // Les autres peuvent encore
    expect(peutEncoreEditer('maitre', e)).toBe(true);
    expect(peutEncoreEditer('formateur', e)).toBe(true);
  });

  it("R9 : 3 signatures → tout figé pour tous", () => {
    const e = entretienVide();
    e.signatures = {
      apprenti: { signe: true, dateSignature: '2026-04-01T10:00:00Z' },
      maitre: { signe: true, dateSignature: '2026-04-01T10:00:00Z' },
      formateur: { signe: true, dateSignature: '2026-04-01T10:00:00Z' },
    };
    expect(peutEncoreEditer('apprenti', e)).toBe(false);
    expect(peutEncoreEditer('maitre', e)).toBe(false);
    expect(peutEncoreEditer('formateur', e)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('peutInitialiserEntretien — séquencement (juin 2026)', () => {
  const signe = (): EntretienTripartite => ({
    ...entretienVide(),
    signatures: {
      apprenti: { signe: true, dateSignature: '2026-04-01T10:00:00Z' },
      maitre: { signe: true, dateSignature: '2026-04-01T10:00:00Z' },
      formateur: { signe: true, dateSignature: '2026-04-01T10:00:00Z' },
    },
  });
  const vides = { 1: null, 2: null, 3: null, 4: null } as const;

  it('E1 est toujours initialisable', () => {
    expect(peutInitialiserEntretien(1, { ...vides }).ok).toBe(true);
  });

  it('un entretien déjà initialisé ne l\'est pas une seconde fois (R6)', () => {
    expect(peutInitialiserEntretien(1, { ...vides, 1: entretienVide() }).ok).toBe(false);
  });

  it('E2 refusé tant que E1 n\'est pas initialisé', () => {
    const r = peutInitialiserEntretien(2, { ...vides });
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(/entretien tripartite 1/);
  });

  it('E2 refusé tant que E1 n\'est pas signé par les 3 parties', () => {
    const partiel = entretienVide();
    partiel.signatures.apprenti = { signe: true, dateSignature: '2026-04-01T10:00:00Z' };
    const r = peutInitialiserEntretien(2, { ...vides, 1: partiel });
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(/signé par les 3 parties/);
  });

  it('E2 autorisé quand E1 est signé par les 3 parties', () => {
    expect(peutInitialiserEntretien(2, { ...vides, 1: signe() }).ok).toBe(true);
  });

  it('E4 exige E3 signé — peu importe E1/E2', () => {
    const entretiens = { 1: signe(), 2: signe(), 3: entretienVide(), 4: null };
    const r = peutInitialiserEntretien(4, entretiens);
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(/entretien tripartite 3/);
    expect(peutInitialiserEntretien(4, { ...entretiens, 3: signe() }).ok).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('validerSignatureEntretien', () => {
  const BANQUE = indexerBanque(QUESTIONS_BANQUE_INITIALE);

  it("apprenti·e ne peut pas signer sans aucune réponse", () => {
    const e = entretienVide();
    const r = validerSignatureEntretien(e, 'apprenti', BANQUE);
    expect(r.peutSigner).toBe(false);
  });

  it("apprenti·e peut signer avec au moins une réponse renseignée", () => {
    const e = entretienVide();
    e.reponsesApprenti['q-app-motivations'] = 'Mon projet professionnel.';
    expect(validerSignatureEntretien(e, 'apprenti', BANQUE).peutSigner).toBe(true);
  });

  // Refonte mai 2026 : la signature maître exige uniquement au moins un
  // critère d'appréciation. La saisie des questions est laissée libre.
  it("maître ne peut pas signer sans aucun critère d'appréciation", () => {
    const e = entretienVide();
    const r = validerSignatureEntretien(e, 'maitre', BANQUE);
    expect(r.peutSigner).toBe(false);
    expect(r.raisons.some((m) => m.includes('appréciation'))).toBe(true);
  });

  it("maître peut signer avec un critère d'appréciation ET une attitude évaluée (juin 2026)", () => {
    const e = entretienVide();
    e.appreciationMaitre.qualiteTravail = 'plusplus';
    e.evaluationsAttitudes = { a1: 'plus' };
    expect(validerSignatureEntretien(e, 'maitre', BANQUE).peutSigner).toBe(true);
  });

  it('maître bloqué sans aucune attitude évaluée, même avec appréciation (extension R20 juin 2026)', () => {
    const e = entretienVide();
    e.appreciationMaitre.qualiteTravail = 'plusplus';
    const r = validerSignatureEntretien(e, 'maitre', BANQUE);
    expect(r.peutSigner).toBe(false);
    expect(r.raisons.some((m) => m.includes('attitude professionnelle'))).toBe(true);
  });

  it("formateur ne peut pas signer sans aucune démarche administrative", () => {
    const e = entretienVide();
    expect(validerSignatureEntretien(e, 'formateur', BANQUE).peutSigner).toBe(false);
  });

  it("formateur peut signer avec au moins une démarche renseignée", () => {
    const e = entretienVide();
    e.demarchesAdministratives.contratSigne = true;
    expect(validerSignatureEntretien(e, 'formateur', BANQUE).peutSigner).toBe(true);
  });

  it("coordo et admin ne peuvent jamais signer l'entretien", () => {
    const e = entretienVide();
    expect(validerSignatureEntretien(e, 'coordo', BANQUE).peutSigner).toBe(false);
    expect(validerSignatureEntretien(e, 'admin', BANQUE).peutSigner).toBe(false);
  });

  // Extension R20 juin 2026 (retours coordos) : questions obligatoires.
  it("apprenti·e bloqué·e si une question obligatoire (cible apprenti) est sans réponse", () => {
    const e = entretienVide();
    e.questionsObligatoires = ['q-app-motivations'];
    // Une réponse à une AUTRE question ne suffit pas.
    e.reponsesApprenti['q-app-ressenti-equipe'] = 'Bonne ambiance.';
    const r = validerSignatureEntretien(e, 'apprenti', BANQUE);
    expect(r.peutSigner).toBe(false);
    expect(r.raisons.some((m) => m.includes('obligatoire') && m.includes('motivations'))).toBe(true);
  });

  it("apprenti·e peut signer une fois la question obligatoire répondue", () => {
    const e = entretienVide();
    e.questionsObligatoires = ['q-app-motivations'];
    e.reponsesApprenti['q-app-motivations'] = 'Devenir chef·fe de partie.';
    expect(validerSignatureEntretien(e, 'apprenti', BANQUE).peutSigner).toBe(true);
  });

  it("maître bloqué si une question obligatoire (cible maître) est sans réponse, même avec appréciation", () => {
    const e = entretienVide();
    e.questionsObligatoires = ['q-mai-deja-forme'];
    e.appreciationMaitre.qualiteTravail = 'plus';
    const r = validerSignatureEntretien(e, 'maitre', BANQUE);
    expect(r.peutSigner).toBe(false);
    expect(r.raisons.some((m) => m.includes('obligatoire'))).toBe(true);
  });

  it("maître : « non » (false) est une réponse valable à une question oui-non obligatoire", () => {
    const e = entretienVide();
    e.questionsObligatoires = ['q-mai-deja-forme'];
    e.appreciationMaitre.qualiteTravail = 'plus';
    e.evaluationsAttitudes = { a1: 'plus' };
    e.reponsesMaitre['q-mai-deja-forme'] = false;
    expect(validerSignatureEntretien(e, 'maitre', BANQUE).peutSigner).toBe(true);
  });

  it("les questions obligatoires de l'autre cible ne bloquent pas la signature", () => {
    const e = entretienVide();
    e.questionsObligatoires = ['q-app-motivations', 'q-mai-deja-forme'];
    e.appreciationMaitre.qualiteTravail = 'plus';
    e.evaluationsAttitudes = { a1: 'plus' };
    e.reponsesMaitre['q-mai-deja-forme'] = true;
    // Le maître signe alors que la question obligatoire APPRENTI est sans réponse.
    expect(validerSignatureEntretien(e, 'maitre', BANQUE).peutSigner).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('calculerProgression', () => {
  it("retourne 0% sur un entretien vierge", () => {
    const r = calculerProgression(entretienVide());
    expect(r.global).toBe(0);
    expect(r.parRole.apprenti).toBe(0);
    expect(r.parRole.maitre).toBe(0);
    expect(r.parRole.formateur).toBe(0);
  });

  it("incrémente le score apprenti·e au fur et à mesure", () => {
    const e = entretienVide();
    e.reponsesApprenti['q-app-motivations'] = 'X';
    e.reponsesApprenti['q-app-contact-entreprise'] = 'Y';
    const r = calculerProgression(e);
    // 2 / 7 ≈ 29 %
    expect(r.parRole.apprenti).toBeGreaterThan(20);
    expect(r.parRole.apprenti).toBeLessThan(40);
  });

  it("retourne 100% pour le rôle dont la section est entièrement remplie", () => {
    const e = entretienVide();
    e.demarchesAdministratives = {
      contratSigne: true,
      visiteMedicale: true,
      permisConduire: false,
      voiture: false,
    };
    e.conditionsPratiques = {
      hebergementCentre: 'X',
      hebergementEntreprise: 'X',
      transportCentre: 'X',
      transportEntreprise: 'X',
    };
    e.aidesDemandees = { logement: false, premierEquipement: false, permis: false };
    expect(calculerProgression(e).parRole.formateur).toBe(100);
  });
});
