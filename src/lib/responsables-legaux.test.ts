import { describe, expect, it } from 'vitest';
import { validerResponsablesLegaux, type SaisieResponsable } from './responsables-legaux';

/**
 * Validation des responsables légaux d'un·e apprenti·e mineur·e (13 juillet
 * 2026 — réunion DG, demande 5). Arbitrages : 1 responsable minimum si
 * mineur·e (2 max), emails différents de l'apprenti·e et entre eux, uniques
 * par rapport aux autres utilisateurs SAUF rattachement fratrie (email déjà
 * connu comme responsable = même personne).
 */

const REFERENCE = new Date('2026-07-13T12:00:00.000Z');

function saisie(sur: Partial<SaisieResponsable> = {}): SaisieResponsable {
  return {
    prenom: 'Thi',
    nom: 'NGUYEN',
    email: 'thi.nguyen@demo.fr',
    ...sur,
  };
}

const CONTEXTE = {
  emailsAutresUtilisateurs: ['lea.martin@demo.fr', 'sophie.dubois@greta.fr'],
  emailsResponsablesExistants: ['parent.connu@demo.fr'],
};

function valider(params: {
  emailApprenti?: string;
  dateNaissance?: string;
  responsables?: SaisieResponsable[];
}) {
  return validerResponsablesLegaux({
    emailApprenti: params.emailApprenti ?? 'minh.nguyen@demo.fr',
    dateNaissance: params.dateNaissance ?? '2009-03-15', // mineur au 2026-07-13
    responsables: params.responsables ?? [saisie()],
    contexte: CONTEXTE,
    reference: REFERENCE,
  });
}

describe('validerResponsablesLegaux', () => {
  it('accepte un·e mineur·e avec 1 ou 2 responsables valides', () => {
    expect(valider({}).ok).toBe(true);
    expect(
      valider({
        responsables: [saisie(), saisie({ prenom: 'Duc', email: 'duc.nguyen@demo.fr' })],
      }).ok,
    ).toBe(true);
  });

  it('exige au moins 1 responsable pour un·e mineur·e', () => {
    const r = valider({ responsables: [] });
    expect(r.ok).toBe(false);
    expect(r.erreurs.join(' ')).toMatch(/mineur/i);
  });

  it("n'exige rien pour un·e majeur·e (aucun responsable saisi)", () => {
    expect(valider({ dateNaissance: '2000-01-01', responsables: [] }).ok).toBe(true);
  });

  it('refuse plus de 2 responsables', () => {
    const r = valider({
      responsables: [saisie(), saisie({ email: 'a@b.fr' }), saisie({ email: 'c@d.fr' })],
    });
    expect(r.ok).toBe(false);
    expect(r.erreurs.join(' ')).toMatch(/2 responsables/i);
  });

  it('exige prénom, nom et email valide pour chaque responsable', () => {
    expect(valider({ responsables: [saisie({ prenom: ' ' })] }).ok).toBe(false);
    expect(valider({ responsables: [saisie({ nom: '' })] }).ok).toBe(false);
    const r = valider({ responsables: [saisie({ email: 'pas-un-email' })] });
    expect(r.ok).toBe(false);
    expect(r.erreurs.join(' ')).toMatch(/email/i);
  });

  it("refuse un email identique à celui de l'apprenti·e (insensible à la casse)", () => {
    const r = valider({ responsables: [saisie({ email: 'Minh.Nguyen@demo.fr' })] });
    expect(r.ok).toBe(false);
    expect(r.erreurs.join(' ')).toMatch(/apprenti/i);
  });

  it('refuse deux responsables avec le même email', () => {
    const r = valider({
      responsables: [saisie(), saisie({ prenom: 'Duc', email: 'THI.NGUYEN@demo.fr' })],
    });
    expect(r.ok).toBe(false);
    expect(r.erreurs.join(' ')).toMatch(/distincts/i);
  });

  it('refuse un email déjà pris par un utilisateur NON responsable', () => {
    const r = valider({ responsables: [saisie({ email: 'lea.martin@demo.fr' })] });
    expect(r.ok).toBe(false);
    expect(r.erreurs.join(' ')).toMatch(/déjà utilisé/i);
  });

  it('accepte un email de responsable déjà connu (rattachement fratrie — arbitrage 6)', () => {
    expect(valider({ responsables: [saisie({ email: 'parent.connu@demo.fr' })] }).ok).toBe(true);
  });
});
