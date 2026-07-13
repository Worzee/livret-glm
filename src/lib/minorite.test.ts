import { describe, expect, it } from 'vitest';
import { estMineur } from './minorite';

/**
 * Minorité d'un·e apprenti·e (13 juillet 2026 — réunion DG, demande 5).
 * Arbitrage 1 : recalcul EN CONTINU à la date du jour (pas de statut figé à
 * l'inscription) — à la majorité, les droits basculent automatiquement.
 */

describe('estMineur', () => {
  const reference = new Date('2026-07-13T12:00:00.000Z');

  it('mineur strictement avant le 18ᵉ anniversaire', () => {
    expect(estMineur('2009-03-15', reference)).toBe(true);
    expect(estMineur('2008-07-14', reference)).toBe(true); // 18 ans demain
  });

  it('majeur le jour du 18ᵉ anniversaire et après', () => {
    expect(estMineur('2008-07-13', reference)).toBe(false); // 18 ans aujourd'hui
    expect(estMineur('2007-02-19', reference)).toBe(false);
    expect(estMineur('1990-01-01', reference)).toBe(false);
  });

  it('gère les années bissextiles (né le 29 février)', () => {
    // Né le 29/02/2008 → 18 ans le 01/03/2026 (convention : fin février).
    expect(estMineur('2008-02-29', new Date('2026-02-28T12:00:00.000Z'))).toBe(true);
    expect(estMineur('2008-02-29', new Date('2026-03-01T12:00:00.000Z'))).toBe(false);
  });

  it('date de naissance invalide ou vide → considéré·e majeur·e (pas de blocage)', () => {
    expect(estMineur('', reference)).toBe(false);
    expect(estMineur('n/a', reference)).toBe(false);
  });
});
