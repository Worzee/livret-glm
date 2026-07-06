import { describe, expect, it } from 'vitest';
import type { FicheSuiviPeriode, SignaturesTripartite } from '@/types';
import {
  DUREE_VERROU_JOURS,
  deduireEtat,
  ficheEstVide,
  fichePeutEtreVerrouilleeAuto,
  nombreSignatures,
  peutEncoreEditerFiche,
} from './transitions-fiche';

const ficheVide = (): FicheSuiviPeriode => ({
  id: 'f',
  numeroPeriode: 1,
  dateDebut: '2026-01-01',
  dateFin: '2026-01-31',
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
});

const sig = (apprenti: boolean, maitre: boolean, formateur: boolean): SignaturesTripartite => ({
  apprenti: { signe: apprenti, dateSignature: apprenti ? '2026-04-01T10:00:00Z' : undefined },
  maitre: { signe: maitre, dateSignature: maitre ? '2026-04-01T10:00:00Z' : undefined },
  formateur: { signe: formateur, dateSignature: formateur ? '2026-04-01T10:00:00Z' : undefined },
});

describe('nombreSignatures', () => {
  it('retourne 0 sur une fiche vierge', () => {
    expect(nombreSignatures(sig(false, false, false))).toBe(0);
  });

  it('compte les signatures effectives parmi les signataires du lieu', () => {
    expect(nombreSignatures(sig(true, false, false))).toBe(1);
    expect(nombreSignatures(sig(true, true, false))).toBe(2);
    // 1ᵉʳ juillet 2026 : le formateur ne signe plus en entreprise — une
    // signature formateur résiduelle n'est pas comptée.
    expect(nombreSignatures(sig(true, true, true))).toBe(2);
  });
});

describe('ficheEstVide', () => {
  it('retourne true sur une fiche fraîchement créée', () => {
    expect(ficheEstVide(ficheVide())).toBe(true);
  });

  it('retourne false dès que la zone GRETA formateur est renseignée', () => {
    const f = ficheVide();
    f.suiviGretaCfa = { formateur: 'Contenus de la période.' };
    expect(ficheEstVide(f)).toBe(false);
  });

  it('retourne false dès que la zone GRETA apprenti est renseignée', () => {
    const f = ficheVide();
    f.suiviGretaCfa = { apprenti: "Ce que j'ai appris au CFA." };
    expect(ficheEstVide(f)).toBe(false);
  });

  it('ignore les chaînes ne contenant que des espaces', () => {
    const f = ficheVide();
    f.suiviGretaCfa = { apprenti: '   ', formateur: '\n\t' };
    expect(ficheEstVide(f)).toBe(true);
  });

  it("retourne false dès qu'une observation est saisie", () => {
    const f = ficheVide();
    f.observations.apprenti = 'Mon retour';
    expect(ficheEstVide(f)).toBe(false);
  });

  it("retourne false dès qu'une signature est apposée", () => {
    const f = ficheVide();
    f.signatures.apprenti.signe = true;
    expect(ficheEstVide(f)).toBe(false);
  });

  it("retourne false dès qu'une attitude est évaluée (juillet 2026)", () => {
    const f = ficheVide();
    f.evaluationsAttitudes = { a5: 'plus' };
    expect(ficheEstVide(f)).toBe(false);
  });

  it('des évaluations d’attitudes toutes à null laissent la fiche vide', () => {
    const f = ficheVide();
    f.evaluationsAttitudes = { a5: null };
    expect(ficheEstVide(f)).toBe(true);
  });
});

describe('deduireEtat (R15, R16)', () => {
  it('R16 : une fiche vide reste en brouillon', () => {
    expect(deduireEtat(ficheVide())).toBe('brouillon');
  });

  it('R16 : une fiche avec données passe en en-cours', () => {
    const f = ficheVide();
    f.observations.apprenti = 'X';
    expect(deduireEtat(f)).toBe('en-cours');
  });

  it('R15 : signature partielle = en-cours', () => {
    const f1 = ficheVide();
    f1.signatures = sig(true, false, false);
    expect(deduireEtat(f1)).toBe('en-cours');
  });

  it('R15 : apprenti·e + maître / tuteur = signee (2 signataires — 1ᵉʳ juillet 2026)', () => {
    const f2 = ficheVide();
    f2.signatures = sig(true, true, false);
    expect(deduireEtat(f2)).toBe('signee');
  });

  it('R15 : une signature formateur résiduelle ne change rien (entreprise)', () => {
    const f = ficheVide();
    f.signatures = sig(true, true, true);
    expect(deduireEtat(f)).toBe('signee');
  });

  it('R17 : verrouillee reste verrouillee (priorité)', () => {
    const f = ficheVide();
    f.etat = 'verrouillee';
    f.signatures = sig(true, true, true);
    expect(deduireEtat(f)).toBe('verrouillee');
  });
});

describe('fichePeutEtreVerrouilleeAuto (R17)', () => {
  it("retourne false si la fiche n'est pas signée", () => {
    const f = ficheVide();
    f.etat = 'en-cours';
    expect(fichePeutEtreVerrouilleeAuto(f)).toBe(false);
  });

  it('retourne false moins de 15 jours après la dernière signature', () => {
    const f = ficheVide();
    f.etat = 'signee';
    f.signatures = sig(true, true, true); // toutes signées au 2026-04-01
    const dans10Jours = new Date('2026-04-11T10:00:00Z');
    expect(fichePeutEtreVerrouilleeAuto(f, dans10Jours)).toBe(false);
  });

  it(`retourne true au moins ${DUREE_VERROU_JOURS} jours après la dernière signature`, () => {
    const f = ficheVide();
    f.etat = 'signee';
    f.signatures = sig(true, true, true);
    const dansLongtemps = new Date('2026-05-01T10:00:00Z'); // ~30 jours plus tard
    expect(fichePeutEtreVerrouilleeAuto(f, dansLongtemps)).toBe(true);
  });
});

describe('peutEncoreEditerFiche (R21 — non régression de signature)', () => {
  it('autorise tous les rôles sur une fiche brouillon', () => {
    const f = ficheVide();
    expect(peutEncoreEditerFiche(f, 'apprenti')).toBe(true);
    expect(peutEncoreEditerFiche(f, 'maitre')).toBe(true);
    expect(peutEncoreEditerFiche(f, 'formateur')).toBe(true);
  });

  it('autorise tous les rôles sur une fiche en cours non signée', () => {
    const f = { ...ficheVide(), etat: 'en-cours' as const };
    expect(peutEncoreEditerFiche(f, 'apprenti')).toBe(true);
    expect(peutEncoreEditerFiche(f, 'maitre')).toBe(true);
    expect(peutEncoreEditerFiche(f, 'formateur')).toBe(true);
  });

  it('bloque uniquement le rôle qui a déjà signé', () => {
    const f = { ...ficheVide(), signatures: sig(true, false, false), etat: 'en-cours' as const };
    expect(peutEncoreEditerFiche(f, 'apprenti')).toBe(false);
    expect(peutEncoreEditerFiche(f, 'maitre')).toBe(true);
    expect(peutEncoreEditerFiche(f, 'formateur')).toBe(true);
  });

  it('bloque tous les rôles signés (cas 2 sur 3)', () => {
    const f = { ...ficheVide(), signatures: sig(true, true, false), etat: 'en-cours' as const };
    expect(peutEncoreEditerFiche(f, 'apprenti')).toBe(false);
    expect(peutEncoreEditerFiche(f, 'maitre')).toBe(false);
    expect(peutEncoreEditerFiche(f, 'formateur')).toBe(true);
  });

  it('bloque tous les rôles quand la fiche est signée (3 sur 3)', () => {
    const f = { ...ficheVide(), signatures: sig(true, true, true), etat: 'signee' as const };
    expect(peutEncoreEditerFiche(f, 'apprenti')).toBe(false);
    expect(peutEncoreEditerFiche(f, 'maitre')).toBe(false);
    expect(peutEncoreEditerFiche(f, 'formateur')).toBe(false);
  });

  it('bloque tous les rôles quand la fiche est verrouillée, même si signature absente', () => {
    // Cas théorique : verrouillage manuel sur une fiche partiellement signée.
    const f = { ...ficheVide(), etat: 'verrouillee' as const };
    expect(peutEncoreEditerFiche(f, 'apprenti')).toBe(false);
    expect(peutEncoreEditerFiche(f, 'maitre')).toBe(false);
    expect(peutEncoreEditerFiche(f, 'formateur')).toBe(false);
  });
});

describe('logique centre (signataires apprenti·e + formateur, 17 juin 2026)', () => {
  it('nombreSignatures(centre) ne compte que apprenti·e + formateur', () => {
    expect(nombreSignatures(sig(false, false, false), 'centre')).toBe(0);
    expect(nombreSignatures(sig(true, false, false), 'centre')).toBe(1);
    expect(nombreSignatures(sig(true, false, true), 'centre')).toBe(2);
    // Une signature maître résiduelle n'est jamais comptée au centre.
    expect(nombreSignatures(sig(true, true, false), 'centre')).toBe(1);
    expect(nombreSignatures(sig(true, true, true), 'centre')).toBe(2);
  });

  it('deduireEtat(centre) : signee dès apprenti·e + formateur (2/2)', () => {
    const f = ficheVide();
    f.signatures = sig(true, false, true);
    expect(deduireEtat(f, 'centre')).toBe('signee');
  });

  it('deduireEtat(centre) : une seule des deux parties = en-cours', () => {
    const f1 = ficheVide();
    f1.signatures = sig(true, false, false);
    expect(deduireEtat(f1, 'centre')).toBe('en-cours');

    const f2 = ficheVide();
    f2.signatures = sig(false, false, true);
    expect(deduireEtat(f2, 'centre')).toBe('en-cours');
  });

  it('deduireEtat(centre) : la signature maître ne suffit pas à passer signee', () => {
    const f = ficheVide();
    // apprenti·e + maître signés, formateur non → seule la partie apprenti·e
    // attendue est satisfaite (1/2).
    f.signatures = sig(true, true, false);
    expect(deduireEtat(f, 'centre')).toBe('en-cours');
  });

  it('deduireEtat(centre) : fiche vide reste brouillon', () => {
    expect(deduireEtat(ficheVide(), 'centre')).toBe('brouillon');
  });

  it('fichePeutEtreVerrouilleeAuto(centre) se base sur apprenti·e + formateur', () => {
    const f = ficheVide();
    f.etat = 'signee';
    f.signatures = sig(true, false, true); // signées au 2026-04-01
    expect(fichePeutEtreVerrouilleeAuto(f, new Date('2026-04-11T10:00:00Z'), 'centre')).toBe(false);
    expect(fichePeutEtreVerrouilleeAuto(f, new Date('2026-05-01T10:00:00Z'), 'centre')).toBe(true);
  });
});
