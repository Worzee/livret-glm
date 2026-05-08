import { describe, expect, it } from 'vitest';
import { LONGUEUR_MIN_MOTIF, LONGUEUR_MAX_MOTIF, validerMotifDeverrouillage } from './deverrouillage-fiche';

describe('validerMotifDeverrouillage (R10)', () => {
  it('refuse une chaîne vide', () => {
    const r = validerMotifDeverrouillage('');
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(/obligatoire/i);
  });

  it("refuse une chaîne d'espaces uniquement", () => {
    const r = validerMotifDeverrouillage('   \t\n');
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(/obligatoire/i);
  });

  it('refuse un motif trop court', () => {
    const r = validerMotifDeverrouillage('Bug.');
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(new RegExp(`${LONGUEUR_MIN_MOTIF}`));
  });

  it('accepte un motif au seuil minimal', () => {
    const motif = 'a'.repeat(LONGUEUR_MIN_MOTIF);
    const r = validerMotifDeverrouillage(motif);
    expect(r.ok).toBe(true);
    expect(r.raison).toBeUndefined();
  });

  it('accepte un motif normal', () => {
    const r = validerMotifDeverrouillage(
      "Erreur de saisie côté maître d'apprentissage : niveau 'maîtrise' inversé.",
    );
    expect(r.ok).toBe(true);
  });

  it('refuse un motif trop long', () => {
    const r = validerMotifDeverrouillage('x'.repeat(LONGUEUR_MAX_MOTIF + 1));
    expect(r.ok).toBe(false);
    expect(r.raison).toMatch(new RegExp(`${LONGUEUR_MAX_MOTIF}`));
  });

  it('accepte un motif au seuil maximal exact', () => {
    const r = validerMotifDeverrouillage('y'.repeat(LONGUEUR_MAX_MOTIF));
    expect(r.ok).toBe(true);
  });

  it("ignore les espaces de bordure pour la longueur", () => {
    // '  Bug.  ' -> trim -> 'Bug.' (4 chars) < min : refusé
    const r = validerMotifDeverrouillage('  Bug.  ');
    expect(r.ok).toBe(false);
  });
});
