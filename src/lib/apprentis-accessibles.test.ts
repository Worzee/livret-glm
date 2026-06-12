import { describe, expect, it } from 'vitest';
import {
  apprentiAyaKouame,
  apprentiLeaMartin,
  apprentiLucaBianchi,
  apprentiMinhNguyen,
  apprentiSofiaPereira,
  apprentiTheoDubois,
  apprentisDemo,
  adminGuillaumeFerreri,
  coordoMartineLefevre,
  formatriceSophieDubois,
  maitreHeleneRoche,
  maitreKarimBenali,
} from '@/fixtures/utilisateurs';
import {
  apprentisAccessibles,
  filtrerApprentis,
  trierApprentis,
} from './apprentis-accessibles';

/**
 * Tests de la lib `apprentis-accessibles` — filtre par rôle et utilitaires.
 * Référence : cahier des charges v1.3, section 6 (matrice droits) et 10.3.
 */

describe('apprentisAccessibles — filtre par rôle', () => {
  it('apprenti ne voit que son propre id', () => {
    const r = apprentisAccessibles(apprentiLeaMartin, apprentisDemo);
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe(apprentiLeaMartin.id);
  });

  it('apprenti ne voit pas le livret d\'un·e autre apprenti·e (R3)', () => {
    const r = apprentisAccessibles(apprentiLeaMartin, apprentisDemo);
    expect(r.some((a) => a.id === apprentiTheoDubois.id)).toBe(false);
  });

  it('maître Karim voit ses 4 apprenti·e·s (Léa, Théo, Sofia + Luca en second — juin 2026)', () => {
    const r = apprentisAccessibles(maitreKarimBenali, apprentisDemo);
    expect(r.map((a) => a.id).sort()).toEqual(
      [
        apprentiLeaMartin.id,
        apprentiTheoDubois.id,
        apprentiSofiaPereira.id,
        apprentiLucaBianchi.id,
      ].sort(),
    );
  });

  it('maître Hélène voit ses 3 apprenti·e·s (Minh, Aya, Luca en principal)', () => {
    const r = apprentisAccessibles(maitreHeleneRoche, apprentisDemo);
    expect(r.map((a) => a.id).sort()).toEqual(
      [apprentiMinhNguyen.id, apprentiAyaKouame.id, apprentiLucaBianchi.id].sort(),
    );
  });

  it('formateur·rice voit toute sa promo (6 apprenti·e·s)', () => {
    const r = apprentisAccessibles(formatriceSophieDubois, apprentisDemo);
    expect(r).toHaveLength(6);
  });

  it('coordo voit tous les apprenti·e·s des formations qu\'il/elle gère', () => {
    const r = apprentisAccessibles(coordoMartineLefevre, apprentisDemo);
    expect(r).toHaveLength(6);
  });

  it('admin voit tous les apprenti·e·s', () => {
    const r = apprentisAccessibles(adminGuillaumeFerreri, apprentisDemo);
    expect(r).toHaveLength(6);
  });

  it('formateur·rice sans promo retourne une liste vide', () => {
    const formateurSansPromo = { ...formatriceSophieDubois, promoIds: [] };
    const r = apprentisAccessibles(formateurSansPromo, apprentisDemo);
    expect(r).toEqual([]);
  });

  it('maître sans apprenti·e retourne une liste vide', () => {
    const maitreSansApprenti = { ...maitreKarimBenali, apprentiIds: [] };
    const r = apprentisAccessibles(maitreSansApprenti, apprentisDemo);
    expect(r).toEqual([]);
  });
});

describe('trierApprentis — tri canonique fr-FR', () => {
  it('trie par NOM puis prénom', () => {
    const trie = trierApprentis(apprentisDemo).map((a) => `${a.nom} ${a.prenom}`);
    expect(trie).toEqual([
      'BIANCHI Luca',
      'DUBOIS Théo',
      'KOUAMÉ Aya',
      'MARTIN Léa',
      'NGUYEN Minh',
      'PEREIRA Sofia',
    ]);
  });

  it('ne mute pas le tableau d\'origine', () => {
    const original = [...apprentisDemo];
    trierApprentis(apprentisDemo);
    expect(apprentisDemo).toEqual(original);
  });

  it('trie en mode insensible aux accents (KOUAMÉ ≈ KOUAME)', () => {
    const liste = [
      { ...apprentiLeaMartin, nom: 'MARTIN' },
      { ...apprentiAyaKouame, nom: 'KOUAME' }, // sans accent
    ];
    const trie = trierApprentis(liste);
    expect(trie[0].nom).toBe('KOUAME');
  });
});

describe('filtrerApprentis — recherche par nom/prénom', () => {
  it('renvoie la liste complète si la requête est vide', () => {
    expect(filtrerApprentis(apprentisDemo, '')).toEqual(apprentisDemo);
    expect(filtrerApprentis(apprentisDemo, '   ')).toEqual(apprentisDemo);
  });

  it('filtre par prénom (insensible à la casse)', () => {
    const r = filtrerApprentis(apprentisDemo, 'lea');
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe(apprentiLeaMartin.id);
  });

  it('filtre par nom (insensible à la casse)', () => {
    const r = filtrerApprentis(apprentisDemo, 'martin');
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe(apprentiLeaMartin.id);
  });

  it('filtre en ignorant les accents (kouame trouve KOUAMÉ)', () => {
    const r = filtrerApprentis(apprentisDemo, 'kouame');
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe(apprentiAyaKouame.id);
  });

  it('filtre sur "prénom nom" comme sur "nom prénom"', () => {
    expect(filtrerApprentis(apprentisDemo, 'theo dubois')).toHaveLength(1);
    expect(filtrerApprentis(apprentisDemo, 'dubois theo')).toHaveLength(1);
  });

  it('renvoie une liste vide si aucun match', () => {
    expect(filtrerApprentis(apprentisDemo, 'inexistant-zzz')).toEqual([]);
  });
});
