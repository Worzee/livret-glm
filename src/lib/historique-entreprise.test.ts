import { describe, expect, it } from 'vitest';
import {
  ajouterAffectationSiChangement,
  creerAffectation,
  entrepriseActuelle,
} from './historique-entreprise';

const auteur = { id: 'u1', nom: 'Martine LEFÈVRE', role: 'coordo' as const };

describe('creerAffectation', () => {
  it('snapshot l\'auteur (nom + rôle) et la date', () => {
    const a = creerAffectation('e1', auteur, '2025-09-01T08:00:00.000Z');
    expect(a.entrepriseId).toBe('e1');
    expect(a.auteurId).toBe('u1');
    expect(a.auteurNom).toBe('Martine LEFÈVRE');
    expect(a.auteurRole).toBe('coordo');
    expect(a.dateIso).toBe('2025-09-01T08:00:00.000Z');
    expect(a.id).toMatch(/^aff-/);
  });
});

describe('ajouterAffectationSiChangement', () => {
  it('ajoute une 1ʳᵉ entrée sur un historique vide/undefined', () => {
    const h = ajouterAffectationSiChangement(undefined, 'e1', auteur, 'd1');
    expect(h).toHaveLength(1);
    expect(h[0].entrepriseId).toBe('e1');
  });

  it("ajoute une entrée quand l'entreprise change", () => {
    const h1 = ajouterAffectationSiChangement(undefined, 'e1', auteur, 'd1');
    const h2 = ajouterAffectationSiChangement(h1, 'e2', auteur, 'd2');
    expect(h2).toHaveLength(2);
    expect(h2.map((a) => a.entrepriseId)).toEqual(['e1', 'e2']);
  });

  it("ne duplique pas si l'entreprise est inchangée (même référence)", () => {
    const h1 = ajouterAffectationSiChangement(undefined, 'e1', auteur, 'd1');
    const h2 = ajouterAffectationSiChangement(h1, 'e1', auteur, 'd2');
    expect(h2).toBe(h1);
    expect(h2).toHaveLength(1);
  });
});

describe('entrepriseActuelle', () => {
  it('retourne la dernière entreprise affectée', () => {
    let h = ajouterAffectationSiChangement(undefined, 'e1', auteur, 'd1');
    h = ajouterAffectationSiChangement(h, 'e2', auteur, 'd2');
    expect(entrepriseActuelle(h)).toBe('e2');
  });

  it('retourne undefined sur un historique vide', () => {
    expect(entrepriseActuelle(undefined)).toBeUndefined();
    expect(entrepriseActuelle([])).toBeUndefined();
  });
});
