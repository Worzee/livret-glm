import { describe, expect, it } from 'vitest';
import type {
  Competence,
  LigneEvaluationFinaleCompetence,
  Referentiel,
  SelectionCompetencesEntreprise,
} from '@/types';
import {
  competencesNonSelectionneesAvecSaisie,
  creerSelectionInitiale,
  creerSelectionVierge,
  estSelectionnee,
  estValidee,
  invaliderAvecMotif,
  marquerValidee,
  nettoyerApresMajReferentiel,
  peutEtreEditee,
  realignerSurReferentiel,
  toggleCompetence,
} from './selection-competences-entreprise';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de fabrication
// ─────────────────────────────────────────────────────────────────────────────

const dateRef = new Date('2026-05-17T10:00:00.000Z');

function sel(
  partial: Partial<SelectionCompetencesEntreprise> = {},
): SelectionCompetencesEntreprise {
  return {
    ids: [],
    modifieLe: '2026-05-17T08:00:00.000Z',
    historiqueInvalidations: [],
    ...partial,
  };
}

function ref(ids: string[]): Referentiel {
  return {
    id: 'r1',
    formation: 'CAP Test',
    blocs: [
      {
        id: 'b1',
        code: 'B1',
        libelle: 'Bloc 1',
        competences: ids.map(
          (id): Competence => ({
            id,
            code: id.toUpperCase(),
            libelle: `Lib ${id}`,
          }),
        ),
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// creerSelectionVierge
// ─────────────────────────────────────────────────────────────────────────────

describe('creerSelectionVierge', () => {
  it('retourne une sélection vide non validée', () => {
    const s = creerSelectionVierge(dateRef);
    expect(s.ids).toEqual([]);
    expect(s.validePar).toBeUndefined();
    expect(s.modifieLe).toBe(dateRef.toISOString());
    expect(s.historiqueInvalidations).toEqual([]);
  });

  it('utilise new Date() par défaut si aucune horloge fournie', () => {
    const avant = Date.now();
    const s = creerSelectionVierge();
    const apres = Date.now();
    const t = Date.parse(s.modifieLe);
    expect(t).toBeGreaterThanOrEqual(avant);
    expect(t).toBeLessThanOrEqual(apres);
  });
});

describe('creerSelectionInitiale (13 juin 2026 — toutes activées par défaut)', () => {
  it('active toutes les compétences fournies, non validée', () => {
    const s = creerSelectionInitiale(['c1', 'c2', 'c3'], dateRef);
    expect(s.ids).toEqual(['c1', 'c2', 'c3']);
    expect(s.validePar).toBeUndefined();
    expect(s.modifieLe).toBe(dateRef.toISOString());
    expect(s.historiqueInvalidations).toEqual([]);
  });

  it("copie le tableau d'ids (pas de référence partagée)", () => {
    const ids = ['c1'];
    const s = creerSelectionInitiale(ids, dateRef);
    ids.push('c2');
    expect(s.ids).toEqual(['c1']);
  });

  it('accepte une liste vide (référentiel sans compétence)', () => {
    expect(creerSelectionInitiale([], dateRef).ids).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// estValidee
// ─────────────────────────────────────────────────────────────────────────────

describe('estValidee', () => {
  it('retourne false quand validePar est absent', () => {
    expect(estValidee(sel())).toBe(false);
  });

  it('retourne true quand validePar est rempli', () => {
    expect(
      estValidee(
        sel({
          validePar: { formateurId: 'f', maitreId: 'm', dateIso: dateRef.toISOString() },
        }),
      ),
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// estSelectionnee
// ─────────────────────────────────────────────────────────────────────────────

describe('estSelectionnee', () => {
  it('retourne true pour une compétence présente dans ids', () => {
    expect(estSelectionnee(sel({ ids: ['c1', 'c2'] }), 'c1')).toBe(true);
  });

  it('retourne false pour une compétence absente', () => {
    expect(estSelectionnee(sel({ ids: ['c1', 'c2'] }), 'c3')).toBe(false);
  });

  it('retourne false sur une sélection vide', () => {
    expect(estSelectionnee(sel(), 'c1')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// peutEtreEditee
// ─────────────────────────────────────────────────────────────────────────────

describe('peutEtreEditee', () => {
  it("retourne true tant que la sélection n'est pas validée", () => {
    expect(peutEtreEditee(sel())).toBe(true);
  });

  it('retourne false dès que la sélection est validée', () => {
    expect(
      peutEtreEditee(
        sel({
          validePar: { formateurId: 'f', maitreId: 'm', dateIso: dateRef.toISOString() },
        }),
      ),
    ).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// toggleCompetence
// ─────────────────────────────────────────────────────────────────────────────

describe('toggleCompetence', () => {
  it('ajoute une compétence absente', () => {
    const s = toggleCompetence(sel({ ids: ['a'] }), 'b', dateRef);
    expect(s.ids).toEqual(['a', 'b']);
    expect(s.modifieLe).toBe(dateRef.toISOString());
  });

  it('retire une compétence présente', () => {
    const s = toggleCompetence(sel({ ids: ['a', 'b'] }), 'a', dateRef);
    expect(s.ids).toEqual(['b']);
  });

  it("ne modifie pas la sélection d'origine (immuabilité)", () => {
    const initial = sel({ ids: ['a'] });
    const apres = toggleCompetence(initial, 'b', dateRef);
    expect(initial.ids).toEqual(['a']);
    expect(apres.ids).toEqual(['a', 'b']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// marquerValidee
// ─────────────────────────────────────────────────────────────────────────────

describe('marquerValidee', () => {
  it("renseigne validePar avec les ids et l'horodatage fournis", () => {
    const s = marquerValidee(sel({ ids: ['c1'] }), 'f1', 'm1', dateRef);
    expect(s.validePar).toEqual({
      formateurId: 'f1',
      maitreId: 'm1',
      dateIso: dateRef.toISOString(),
    });
    expect(s.modifieLe).toBe(dateRef.toISOString());
  });

  it('préserve les ids existants', () => {
    const s = marquerValidee(sel({ ids: ['a', 'b'] }), 'f1', 'm1', dateRef);
    expect(s.ids).toEqual(['a', 'b']);
  });

  it("ne modifie pas la sélection d'origine", () => {
    const initial = sel({ ids: ['a'] });
    marquerValidee(initial, 'f', 'm', dateRef);
    expect(initial.validePar).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// invaliderAvecMotif
// ─────────────────────────────────────────────────────────────────────────────

describe('invaliderAvecMotif', () => {
  const valide = sel({
    ids: ['a', 'b'],
    validePar: { formateurId: 'f1', maitreId: 'm1', dateIso: '2026-04-10T10:00:00.000Z' },
  });

  it('retire validePar et empile une entrée dans historiqueInvalidations', () => {
    const s = invaliderAvecMotif(valide, {
      id: 'inv-1',
      auteurId: 'f1',
      auteurNom: 'Sophie DUBOIS',
      auteurRole: 'formateur',
      motif: 'Désaccord apprenti·e sur 3 compétences — à revoir en visite',
      maintenant: dateRef,
    });
    expect(s.validePar).toBeUndefined();
    expect(s.historiqueInvalidations).toHaveLength(1);
    expect(s.historiqueInvalidations[0]).toEqual({
      id: 'inv-1',
      dateIso: dateRef.toISOString(),
      auteurId: 'f1',
      auteurNom: 'Sophie DUBOIS',
      auteurRole: 'formateur',
      motif: 'Désaccord apprenti·e sur 3 compétences — à revoir en visite',
    });
  });

  it('préserve les ids sélectionnés', () => {
    const s = invaliderAvecMotif(valide, {
      id: 'inv-1',
      auteurId: 'f1',
      auteurNom: 'S. D.',
      auteurRole: 'formateur',
      motif: 'Motif suffisamment long pour passer.',
      maintenant: dateRef,
    });
    expect(s.ids).toEqual(['a', 'b']);
  });

  it('empile une 2ᵉ invalidation par-dessus la 1ʳᵉ', () => {
    const apresInv1 = invaliderAvecMotif(valide, {
      id: 'inv-1',
      auteurId: 'f1',
      auteurNom: 'S. D.',
      auteurRole: 'formateur',
      motif: 'Première invalidation officielle.',
      maintenant: new Date('2026-04-15T10:00:00.000Z'),
    });
    const apresValidation2 = marquerValidee(
      apresInv1,
      'f1',
      'm1',
      new Date('2026-04-20T10:00:00.000Z'),
    );
    const apresInv2 = invaliderAvecMotif(apresValidation2, {
      id: 'inv-2',
      auteurId: 'f1',
      auteurNom: 'S. D.',
      auteurRole: 'formateur',
      motif: 'Seconde invalidation après évolution du poste.',
      maintenant: dateRef,
    });
    expect(apresInv2.historiqueInvalidations).toHaveLength(2);
    expect(apresInv2.historiqueInvalidations.map((e) => e.id)).toEqual(['inv-1', 'inv-2']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// realignerSurReferentiel (1ᵉʳ juillet 2026 — tout coché par défaut)
// ─────────────────────────────────────────────────────────────────────────────

describe('realignerSurReferentiel', () => {
  it('recoche toutes les compétences du nouveau référentiel (sélection non validée)', () => {
    const initial = sel({ ids: ['ancien-1', 'ancien-2'] });
    const s = realignerSurReferentiel(initial, ref(['c1', 'c2', 'c3']), dateRef);
    expect(s.ids).toEqual(['c1', 'c2', 'c3']);
    expect(s.modifieLe).toBe(dateRef.toISOString());
  });

  it('ne touche pas une sélection déjà validée (même référence)', () => {
    const initial = sel({
      ids: ['ancien-1'],
      validePar: { formateurId: 'f1', maitreId: 'm1', dateIso: '2026-05-17T09:00:00.000Z' },
    });
    expect(realignerSurReferentiel(initial, ref(['c1', 'c2']), dateRef)).toBe(initial);
  });

  it("retourne la même référence si l'ensemble d'ids est déjà identique", () => {
    const initial = sel({ ids: ['c2', 'c1'] }); // même ensemble, ordre différent
    expect(realignerSurReferentiel(initial, ref(['c1', 'c2']), dateRef)).toBe(initial);
  });

  it('recoche les compétences décochées si le contenu du référentiel a changé', () => {
    // Le maître avait décoché c2 ; un réimport (nouvelle version) repart
    // de « tout coché par défaut » — comportement demandé par la direction.
    const initial = sel({ ids: ['c1'] });
    const s = realignerSurReferentiel(initial, ref(['c1', 'c2']), dateRef);
    expect(s.ids).toEqual(['c1', 'c2']);
  });

  it("préserve l'historique d'invalidations", () => {
    const initial = sel({
      ids: ['ancien-1'],
      historiqueInvalidations: [
        {
          id: 'inv-1',
          dateIso: '2026-05-17T09:00:00.000Z',
          auteurId: 'f1',
          auteurNom: 'Sophie DUBOIS',
          auteurRole: 'formateur',
          motif: 'Erreur de composition initiale.',
        },
      ],
    });
    const s = realignerSurReferentiel(initial, ref(['c1']), dateRef);
    expect(s.historiqueInvalidations).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// nettoyerApresMajReferentiel
// ─────────────────────────────────────────────────────────────────────────────

describe('nettoyerApresMajReferentiel', () => {
  it('retire les ids de compétences absentes du référentiel', () => {
    const s = nettoyerApresMajReferentiel(
      sel({ ids: ['c1', 'c2', 'c3-supprimee'] }),
      ref(['c1', 'c2']),
      dateRef,
    );
    expect(s.ids).toEqual(['c1', 'c2']);
  });

  it("ne touche pas modifieLe si rien n'a changé", () => {
    const initial = sel({ ids: ['c1', 'c2'], modifieLe: '2025-01-01T00:00:00.000Z' });
    const s = nettoyerApresMajReferentiel(initial, ref(['c1', 'c2', 'c3']), dateRef);
    expect(s.ids).toEqual(['c1', 'c2']);
    expect(s.modifieLe).toBe('2025-01-01T00:00:00.000Z');
  });

  it('met à jour modifieLe quand des ids sont retirés', () => {
    const initial = sel({ ids: ['c1', 'c2'], modifieLe: '2025-01-01T00:00:00.000Z' });
    const s = nettoyerApresMajReferentiel(initial, ref(['c1']), dateRef);
    expect(s.ids).toEqual(['c1']);
    expect(s.modifieLe).toBe(dateRef.toISOString());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// competencesNonSelectionneesAvecSaisie
// ─────────────────────────────────────────────────────────────────────────────

describe('competencesNonSelectionneesAvecSaisie', () => {
  const ligne = (
    competenceId: string,
    acquisEntreprise: LigneEvaluationFinaleCompetence['acquisEntreprise'],
  ): LigneEvaluationFinaleCompetence => ({
    competenceId,
    acquisEntreprise,
    acquisCentre: null,
  });

  it('retourne les compétences non sélectionnées qui ont une saisie historique', () => {
    const ids = competencesNonSelectionneesAvecSaisie(sel({ ids: ['c1'] }), [
      ligne('c1', 'maitrise'),
      ligne('c2', 'partiel'),
      ligne('c3', null),
    ]);
    expect(ids).toEqual(['c2']);
  });

  it('retourne un tableau vide quand toutes les saisies concernent des compétences sélectionnées', () => {
    const ids = competencesNonSelectionneesAvecSaisie(sel({ ids: ['c1', 'c2'] }), [
      ligne('c1', 'maitrise'),
      ligne('c2', 'partiel'),
    ]);
    expect(ids).toEqual([]);
  });

  it("retourne un tableau vide quand aucune saisie historique n'existe", () => {
    const ids = competencesNonSelectionneesAvecSaisie(sel({ ids: [] }), [
      ligne('c1', null),
      ligne('c2', null),
    ]);
    expect(ids).toEqual([]);
  });
});
