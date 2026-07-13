import { describe, expect, it } from 'vitest';
import {
  apprentiAyaKouame,
  apprentieCamilleMoreau,
  apprentiLeaMartin,
  apprentiLucaBianchi,
  apprentiMinhNguyen,
  apprentiSofiaPereira,
  apprentiTheoDubois,
  apprentiYanisBelkacem,
  apprentisDemo,
  adminGuillaumeFerreri,
  coordoBernardPetit,
  coordoMartineLefevre,
  formateurMarcTissier,
  formatriceSophieDubois,
  maitreHeleneRoche,
  maitreKarimBenali,
  responsableThiNguyen,
} from '@/fixtures/utilisateurs';
import {
  anneesFormationsDisponibles,
  apprentisAccessibles,
  filtrerApprentis,
  filtrerParAnneeFormation,
  grouperParFormation,
  trierApprentis,
  trierApprentisParAnneePuisNom,
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

  it("apprenti ne voit pas le livret d'un·e autre apprenti·e (R3)", () => {
    const r = apprentisAccessibles(apprentiLeaMartin, apprentisDemo);
    expect(r.some((a) => a.id === apprentiTheoDubois.id)).toBe(false);
  });

  it('responsable légale Thi ne voit que son fils Minh (13 juillet 2026 — demande 5)', () => {
    const r = apprentisAccessibles(responsableThiNguyen, apprentisDemo);
    expect(r.map((a) => a.id)).toEqual([apprentiMinhNguyen.id]);
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

  it('coordo Martine ne voit que son périmètre (CAP Le Gourmet + promo BTS — 3 juillet 2026)', () => {
    const r = apprentisAccessibles(coordoMartineLefevre, apprentisDemo);
    expect(r.map((a) => a.id).sort()).toEqual(
      [
        apprentiLeaMartin.id,
        apprentiTheoDubois.id,
        apprentiSofiaPereira.id,
        apprentieCamilleMoreau.id,
        apprentiYanisBelkacem.id,
      ].sort(),
    );
  });

  it('coordo Bernard voit son périmètre (Minh, Aya, Luca — juin 2026)', () => {
    const r = apprentisAccessibles(coordoBernardPetit, apprentisDemo);
    expect(r.map((a) => a.id).sort()).toEqual(
      [apprentiMinhNguyen.id, apprentiAyaKouame.id, apprentiLucaBianchi.id].sort(),
    );
  });

  it("un·e apprenti·e sans coordo n'est visible d'aucun coordo (admin seul)", () => {
    const sansCoordo = { ...apprentiLeaMartin, id: 'a-orphelin', coordoId: undefined };
    expect(apprentisAccessibles(coordoMartineLefevre, [sansCoordo])).toEqual([]);
    expect(apprentisAccessibles(adminGuillaumeFerreri, [sansCoordo])).toHaveLength(1);
  });

  it('admin voit tous les apprenti·e·s', () => {
    const r = apprentisAccessibles(adminGuillaumeFerreri, apprentisDemo);
    expect(r).toHaveLength(8);
  });

  it('formateur Marc voit sa promo BTS (2 apprenti·e·s — 3 juillet 2026)', () => {
    const r = apprentisAccessibles(formateurMarcTissier, apprentisDemo);
    expect(r.map((a) => a.id).sort()).toEqual(
      [apprentieCamilleMoreau.id, apprentiYanisBelkacem.id].sort(),
    );
  });

  it('formateur·rice sans promo voit quand même ses référé·e·s direct·e·s (1ᵉʳ juillet 2026)', () => {
    // `promoIds` n'est pas maintenu pour les formations créées en ligne : la
    // relation directe `formateurReferentId` fait foi. Sophie est référente
    // des 6 apprenti·e·s fixtures → visibles même sans promoIds.
    const formateurSansPromo = { ...formatriceSophieDubois, promoIds: [] };
    const r = apprentisAccessibles(formateurSansPromo, apprentisDemo);
    expect(r).toHaveLength(6);
  });

  it("un formateur ne voit pas les apprenti·e·s dont il n'est ni promo ni référent", () => {
    const autreFormateur = {
      ...formatriceSophieDubois,
      id: 'u-formateur-autre',
      promoIds: [],
    };
    expect(apprentisAccessibles(autreFormateur, apprentisDemo)).toEqual([]);
  });

  it("une apprentie d'une formation hors promoIds reste visible de son formateur référent (cas Sonia — 1ᵉʳ juillet 2026)", () => {
    const sonia = {
      ...apprentiLeaMartin,
      id: 'a-sonia',
      formationId: 'f-bts-textile-2026', // formation créée en ligne, absente des promoIds
      formateurReferentId: formatriceSophieDubois.id,
    };
    const r = apprentisAccessibles(formatriceSophieDubois, [sonia]);
    expect(r.map((a) => a.id)).toEqual(['a-sonia']);
  });

  it('maître sans apprenti·e retourne une liste vide', () => {
    const maitreSansApprenti = { ...maitreKarimBenali, apprentiIds: [] };
    const r = apprentisAccessibles(maitreSansApprenti, apprentisDemo);
    expect(r).toEqual([]);
  });
});

describe('grouperParFormation — sections du tableau de bord (1ᵉʳ juillet 2026)', () => {
  const FORMATIONS = {
    'f-cap-cuisine-2025': { intitule: 'CAP Cuisine', annee: '2025-2026' },
    'f-bts-mhr-2025': { intitule: 'BTS MHR', annee: '2025-2027' },
    'f-bts-textile-2026': { intitule: 'BTS Textile', annee: '2026-2028' },
  };

  it('regroupe par formation et trie les apprenti·e·s par nom dans chaque groupe', () => {
    const g = grouperParFormation(apprentisDemo, FORMATIONS);
    expect(g).toHaveLength(2);
    // Promo la plus récente en premier (BTS 2025-2027 avant CAP 2025-2026).
    expect(g[0].libelle).toBe('BTS MHR (2025-2027)');
    expect(g[0].apprentis.map((a) => a.nom)).toEqual(['BELKACEM', 'MOREAU']);
    expect(g[1].libelle).toBe('CAP Cuisine (2025-2026)');
    expect(g[1].apprentis.map((a) => a.nom)).toEqual([
      'BIANCHI',
      'DUBOIS',
      'KOUAMÉ',
      'MARTIN',
      'NGUYEN',
      'PEREIRA',
    ]);
  });

  it('trie les groupes par année décroissante (promo récente en premier)', () => {
    const sonia = { ...apprentiLeaMartin, id: 'a-sonia', formationId: 'f-bts-textile-2026' };
    const g = grouperParFormation([...apprentisDemo, sonia], FORMATIONS);
    expect(g.map((x) => x.libelle)).toEqual([
      'BTS Textile (2026-2028)',
      'BTS MHR (2025-2027)',
      'CAP Cuisine (2025-2026)',
    ]);
  });

  it('regroupe les apprenti·e·s sans formation résolue dans « Sans formation », en dernier', () => {
    const orphelin = { ...apprentiLeaMartin, id: 'a-orphelin', formationId: '' };
    const g = grouperParFormation([...apprentisDemo, orphelin], FORMATIONS);
    expect(g).toHaveLength(3);
    expect(g[2].libelle).toBe('Sans formation');
    expect(g[2].formationId).toBe('');
    expect(g[2].apprentis.map((a) => a.id)).toEqual(['a-orphelin']);
  });

  it('retourne une liste vide pour aucun·e apprenti·e', () => {
    expect(grouperParFormation([], FORMATIONS)).toEqual([]);
  });
});

describe('trierApprentis — tri canonique fr-FR', () => {
  it('trie par NOM puis prénom', () => {
    const trie = trierApprentis(apprentisDemo).map((a) => `${a.nom} ${a.prenom}`);
    expect(trie).toEqual([
      'BELKACEM Yanis',
      'BIANCHI Luca',
      'DUBOIS Théo',
      'KOUAMÉ Aya',
      'MARTIN Léa',
      'MOREAU Camille',
      'NGUYEN Minh',
      'PEREIRA Sofia',
    ]);
  });

  it("ne mute pas le tableau d'origine", () => {
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

describe('tri / filtre par année de formation (retours coordos juin 2026)', () => {
  // Mini-promos : 2 années académiques distinctes + une formation orpheline.
  const formations = {
    'f-2025': { annee: '2025-2026' },
    'f-2024': { annee: '2024-2025' },
  };
  const a = (id: string, nom: string, formationId: string) => ({
    ...apprentiLeaMartin,
    id,
    nom,
    formationId,
  });
  const promo2025 = [a('a1', 'ZOLA', 'f-2025'), a('a2', 'AUBRY', 'f-2025')];
  const promo2024 = [a('a3', 'BREL', 'f-2024')];
  const orphelin = a('a4', 'CAMUS', 'f-supprimee');
  const tous = [...promo2024, ...promo2025, orphelin];

  it('anneesFormationsDisponibles : années distinctes, plus récente en premier', () => {
    expect(anneesFormationsDisponibles(tous, formations)).toEqual(['2025-2026', '2024-2025']);
  });

  it('anneesFormationsDisponibles : ignore les formations introuvables', () => {
    expect(anneesFormationsDisponibles([orphelin], formations)).toEqual([]);
  });

  it('filtrerParAnneeFormation : « toutes » retourne tout (y compris formation introuvable)', () => {
    expect(filtrerParAnneeFormation(tous, formations, 'toutes')).toEqual(tous);
  });

  it('filtrerParAnneeFormation : restreint à la promo demandée', () => {
    const r = filtrerParAnneeFormation(tous, formations, '2024-2025');
    expect(r.map((x) => x.id)).toEqual(['a3']);
  });

  it("filtrerParAnneeFormation : un apprenti sans formation résolue est exclu d'un filtre précis", () => {
    expect(filtrerParAnneeFormation([orphelin], formations, '2025-2026')).toEqual([]);
  });

  it('trierApprentisParAnneePuisNom : promo récente en premier, puis ordre alphabétique', () => {
    const r = trierApprentisParAnneePuisNom(tous, formations);
    expect(r.map((x) => x.nom)).toEqual(['AUBRY', 'ZOLA', 'BREL', 'CAMUS']);
  });
});
