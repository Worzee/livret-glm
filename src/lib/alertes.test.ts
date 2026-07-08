import { describe, expect, it } from 'vitest';
import type {
  Apprenti,
  EntretienTripartite,
  FicheSuiviPeriode,
  Livret,
  SignaturesTripartite,
} from '@/types';
import { apprentiLeaMartin } from '@/fixtures/utilisateurs';
import { alertesTableauBord } from './alertes';

/**
 * Centre d'alertes du tableau de bord (3 juillet 2026).
 * Fixtures minimales locales, date « maintenant » injectée.
 */

const MAINTENANT = new Date('2026-07-03T12:00:00.000Z');

const AUCUNE: SignaturesTripartite = {
  apprenti: { signe: false },
  maitre: { signe: false },
  formateur: { signe: false },
};

function fiche(sur: Partial<FicheSuiviPeriode>): FicheSuiviPeriode {
  return {
    id: 'f-1',
    numeroPeriode: 1,
    dateDebut: '2025-09-01',
    dateFin: '2025-12-19',
    suiviGretaCfa: {},
    suiviEntreprise: [],
    observations: {},
    signatures: AUCUNE,
    etat: 'en-cours',
    historiqueDeverrouillages: [],
    ...sur,
  };
}

function entretien(signatures: Partial<SignaturesTripartite> = {}): EntretienTripartite {
  return {
    reponsesTrame: {},
    appreciationMaitre: {},
    commentaires: {},
    signatures: { ...AUCUNE, ...signatures },
  };
}

function livret(apprentiId: string, sur: Partial<Livret> = {}): Livret {
  return {
    id: `livret-${apprentiId}`,
    apprentiId,
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
    creeLe: '',
    modifieLe: '',
    ...sur,
  };
}

function apprenti(id: string, sur: Partial<Apprenti> = {}): Apprenti {
  return {
    ...apprentiLeaMartin,
    id,
    nom: 'TEST',
    prenom: 'Alex',
    formationId: 'f-test',
    contratDebut: '2025-09-01',
    ...sur,
  };
}

function alertesPour(
  role: 'apprenti' | 'maitre' | 'formateur' | 'coordo' | 'admin',
  l: Livret,
  a = apprenti('a1'),
) {
  return alertesTableauBord(role, [a], { [l.id]: l }, MAINTENANT);
}

describe('alertesTableauBord — signatures de fiches', () => {
  it('signale au maître une fiche entreprise entamée dont la période est finie', () => {
    const l = livret('a1', { fichesSuivi: [fiche({ etat: 'en-cours' })] });
    const r = alertesPour('maitre', l);
    expect(r).toHaveLength(1);
    expect(r[0].type).toBe('signature-fiche');
    expect(r[0].message).toContain('Période 1 terminée');
    expect(r[0].lien).toBe('/livret/fiches-suivi/f-1');
  });

  it("ne signale pas une fiche dont la période n'est pas terminée, ni une fiche brouillon", () => {
    const enCours = fiche({ id: 'f-encours', dateFin: '2026-07-10' }); // finit après « maintenant »
    const brouillon = fiche({ id: 'f-brouillon', etat: 'brouillon' });
    const l = livret('a1', { fichesSuivi: [enCours, brouillon] });
    expect(alertesPour('maitre', l)).toHaveLength(0);
  });

  it("ne signale pas une fiche que j'ai déjà signée", () => {
    const l = livret('a1', {
      fichesSuivi: [fiche({ signatures: { ...AUCUNE, maitre: { signe: true } } })],
    });
    expect(alertesPour('maitre', l)).toHaveLength(0);
  });

  it('au centre, le signataire est le formateur (pas le maître)', () => {
    const l = livret('a1', { fichesSuiviCentre: [fiche({ id: 'fc-1' })] });
    expect(alertesPour('maitre', l)).toHaveLength(0);
    const r = alertesPour('formateur', l);
    expect(r.map((x) => x.type)).toContain('signature-fiche');
    expect(r.find((x) => x.type === 'signature-fiche')?.lien).toBe(
      '/livret/fiches-suivi-centre/fc-1',
    );
  });
});

describe('alertesTableauBord — entretien', () => {
  it('signale à chaque partie manquante un entretien initialisé non signé', () => {
    const l = livret('a1', {
      entretien: entretien({ apprenti: { signe: true } }),
    });
    expect(alertesPour('apprenti', l)).toHaveLength(0);
    expect(alertesPour('maitre', l).map((a) => a.type)).toContain('signature-entretien');
    expect(alertesPour('formateur', l).map((a) => a.type)).toContain('signature-entretien');
  });

  it('signale au formateur un entretien planifié (événement) prêt à initialiser', () => {
    const l = livret('a1', {
      organisationSuivi: {
        evenements: [{ id: 'evt-1', motif: 'entretien-tripartite' }],
        modifieLe: '',
        modifiePar: '',
      },
    });
    const r = alertesPour('formateur', l);
    expect(r.map((x) => x.type)).toContain('entretien-a-initialiser');
    expect(r.find((x) => x.type === 'entretien-a-initialiser')?.lien).toBe('/livret/entretien');
  });

  it("ne propose pas d'initialiser un entretien déjà initialisé", () => {
    const l = livret('a1', {
      organisationSuivi: {
        evenements: [{ id: 'evt-1', motif: 'entretien-tripartite' }],
        modifieLe: '',
        modifiePar: '',
      },
      entretien: entretien({ apprenti: { signe: true } }),
    });
    const types = alertesPour('formateur', l).map((x) => x.type);
    expect(types).not.toContain('entretien-a-initialiser');
  });
});

describe('alertesTableauBord — verrouillage et R7', () => {
  it('signale au formateur une fiche signée à verrouiller', () => {
    const l = livret('a1', { fichesSuivi: [fiche({ etat: 'signee' })] });
    const r = alertesPour('formateur', l);
    expect(r.map((x) => x.type)).toContain('fiche-a-verrouiller');
  });

  it("signale l'alerte R7 au formateur, au coordo et à l'admin — pas au maître", () => {
    const l = livret('a1'); // aucun E1, contrat démarré depuis > 60 j
    expect(alertesPour('formateur', l).map((x) => x.type)).toContain('alerte-r7');
    expect(alertesPour('coordo', l).map((x) => x.type)).toContain('alerte-r7');
    expect(alertesPour('admin', l).map((x) => x.type)).toContain('alerte-r7');
    expect(alertesPour('maitre', l).map((x) => x.type)).not.toContain('alerte-r7');
  });

  it('classe les R7 avant les signatures et trie par apprenti·e', () => {
    const a1 = apprenti('a1', { nom: 'ZOLA' });
    const a2 = apprenti('a2', { nom: 'AUBRY' });
    const livrets = {
      l1: livret('a1', { fichesSuiviCentre: [fiche({ id: 'fc-a1' })] }),
      l2: livret('a2'),
    };
    const r = alertesTableauBord('formateur', [a1, a2], livrets, MAINTENANT);
    expect(r.map((x) => x.type)).toEqual(['alerte-r7', 'alerte-r7', 'signature-fiche']);
    expect(r[0].apprentiNom).toContain('AUBRY');
  });
});

describe('alertesTableauBord — coordo / admin (sans droit pédagogique)', () => {
  it("ne remonte jamais de signature ou d'initialisation au coordo", () => {
    const l = livret('a1', {
      fichesSuivi: [fiche({ etat: 'en-cours' }), fiche({ id: 'f-2', etat: 'signee' })],
      entretien: entretien(),
    });
    const types = alertesPour('coordo', l).map((x) => x.type);
    expect(types).not.toContain('signature-fiche');
    expect(types).not.toContain('signature-entretien');
    expect(types).not.toContain('fiche-a-verrouiller');
  });

  it("signale à l'admin une affectation incomplète", () => {
    const orphelin = apprenti('a1', { maitreApprentissageId: '', entrepriseId: undefined });
    const r = alertesPour(
      'admin',
      livret('a1', {
        entretien: entretien({
          apprenti: { signe: true },
          maitre: { signe: true },
          formateur: { signe: true },
        }),
      }),
      orphelin,
    );
    expect(r).toHaveLength(1);
    expect(r[0].type).toBe('affectation-incomplete');
    expect(r[0].message).toContain('maître / tuteur');
    expect(r[0].message).toContain('entreprise');
    expect(r[0].lien).toBe('/admin/affectations');
  });
});

describe("alertesTableauBord — points d'alerte de l'entretien (8 juillet 2026)", () => {
  // Entretien signé 3/3 avec une réponse en alerte (logement : alerteSi 'oui').
  const entretienAvecAlerte: EntretienTripartite = {
    ...entretien({
      apprenti: { signe: true },
      maitre: { signe: true },
      formateur: { signe: true },
    }),
    reponsesTrame: { 'e1-diff-logement': true },
  };

  it("remonte les points d'alerte non traités au coordo et à l'admin", () => {
    const l = livret('a1', { entretien: entretienAvecAlerte });
    for (const role of ['coordo', 'admin'] as const) {
      const alerte = alertesPour(role, l).find((x) => x.type === 'point-alerte-entretien');
      expect(alerte).toBeDefined();
      expect(alerte?.questionId).toBe('e1-diff-logement');
      expect(alerte?.livretId).toBe('livret-a1');
      expect(alerte?.message).toBe('Logement');
      expect(alerte?.lien).toBe('/livret/entretien');
    }
  });

  it("ne remonte PAS les points d'alerte aux rôles pédagogiques (apprenti, maître, formateur)", () => {
    const l = livret('a1', { entretien: entretienAvecAlerte });
    for (const role of ['apprenti', 'maitre', 'formateur'] as const) {
      expect(alertesPour(role, l).map((x) => x.type)).not.toContain('point-alerte-entretien');
    }
  });

  it("ne remonte pas un point d'alerte déjà marqué « traité »", () => {
    const l = livret('a1', {
      entretien: entretienAvecAlerte,
      pointsAlerteTraites: ['e1-diff-logement'],
    });
    expect(alertesPour('coordo', l).map((x) => x.type)).not.toContain('point-alerte-entretien');
  });

  it("classe les points d'alerte juste après les alertes R7", () => {
    // a1 : entretien signé avec alerte (pas de R7 car signé). a2 : pas
    // d'entretien → R7. L'ordre global met les R7 avant les points d'alerte.
    const a1 = apprenti('a1', { nom: 'BLIN' });
    const a2 = apprenti('a2', { nom: 'ADAM' });
    const livrets = {
      l1: livret('a1', { entretien: entretienAvecAlerte }),
      l2: livret('a2'),
    };
    const types = alertesTableauBord('coordo', [a1, a2], livrets, MAINTENANT).map((x) => x.type);
    expect(types.indexOf('alerte-r7')).toBeLessThan(types.indexOf('point-alerte-entretien'));
  });
});
