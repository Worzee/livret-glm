import { describe, expect, it } from 'vitest';
import type {
  EntretienTripartite,
  EvenementOrganisationSuivi,
  MotifOrganisationSuivi,
} from '@/types';
import {
  MOTIFS_ORGANISATION_SUIVI,
  creerEvenementVierge,
  estMotifEntretienTripartite,
  evenementFigeParSignature,
  libelleEvenement,
  libelleMotif,
  metadonneesMotif,
  motifsProposablesPourRole,
  peutSupprimerEvenement,
} from './organisation-suivi';

/** Entretien minimal avec n signatures apposées (0 à 3). */
function entretienAvecSignatures(nbSignatures: number): EntretienTripartite {
  return {
    evaluationsAttitudes: {},
    reponsesTrame: {},
    appreciationMaitre: {},
    commentaires: {},
    signatures: {
      apprenti: { signe: nbSignatures >= 1 },
      maitre: { signe: nbSignatures >= 2 },
      formateur: { signe: nbSignatures >= 3 },
    },
  };
}

describe('MOTIFS_ORGANISATION_SUIVI', () => {
  it('expose les 8 motifs (juillet 2026 : entretien tripartite unique)', () => {
    const cles = MOTIFS_ORGANISATION_SUIVI.map((m) => m.motif);
    expect(cles).toEqual([
      'reunion-rentree',
      'entretien-individuel',
      'accueil-tuteur',
      'visite-entreprise',
      'restitution-activites',
      'bilan-formation',
      'entretien-tripartite',
      'autre',
    ]);
  });

  it("estMotifEntretienTripartite : vrai uniquement pour l'entretien tripartite", () => {
    expect(estMotifEntretienTripartite('entretien-tripartite')).toBe(true);
    expect(estMotifEntretienTripartite('visite-entreprise')).toBe(false);
    expect(estMotifEntretienTripartite('entretien-individuel')).toBe(false);
    expect(estMotifEntretienTripartite('autre')).toBe(false);
  });

  it("motifsProposablesPourRole : le formateur ne crée que l'entretien tripartite (juin 2026)", () => {
    const motifs = motifsProposablesPourRole('formateur').map((m) => m.motif);
    expect(motifs).toEqual(['entretien-tripartite']);
  });

  it("motifsProposablesPourRole : le coordo et l'admin créent tous les motifs", () => {
    const coordo = motifsProposablesPourRole('coordo').map((m) => m.motif);
    expect(coordo).toContain('reunion-rentree');
    expect(coordo).toContain('entretien-tripartite');
    expect(coordo).toContain('autre');
    expect(motifsProposablesPourRole('admin')).toHaveLength(MOTIFS_ORGANISATION_SUIVI.length);
  });

  it('motifsProposablesPourRole : aucun motif pour les rôles en lecture seule', () => {
    expect(motifsProposablesPourRole('apprenti')).toEqual([]);
    expect(motifsProposablesPourRole('maitre')).toEqual([]);
  });

  it('chaque motif porte un libellé, une description et un placeholder non vides', () => {
    for (const meta of MOTIFS_ORGANISATION_SUIVI) {
      expect(meta.libelle.length).toBeGreaterThan(0);
      expect(meta.description.length).toBeGreaterThan(0);
      expect(meta.placeholderCommentaire.length).toBeGreaterThan(0);
    }
  });
});

describe('metadonneesMotif / libelleMotif', () => {
  it('renvoie les métadonnées attendues pour un motif connu', () => {
    expect(metadonneesMotif('visite-entreprise').libelle).toBe('Visites en entreprise');
    expect(libelleMotif('accueil-tuteur')).toBe('Accueil tuteur');
    expect(libelleMotif('entretien-tripartite')).toBe('Entretien Tripartite');
    expect(libelleMotif('autre')).toBe('Autre');
  });

  it('lance une erreur explicite pour un motif inconnu (données corrompues)', () => {
    const corrompu = 'inconnu' as unknown as MotifOrganisationSuivi;
    expect(() => metadonneesMotif(corrompu)).toThrow(/inconnu/i);
  });
});

describe('libelleEvenement', () => {
  const base: EvenementOrganisationSuivi = {
    id: 'evt-1',
    motif: 'visite-entreprise',
  };

  it('renvoie le libellé du motif seul si aucun titre custom', () => {
    expect(libelleEvenement(base)).toBe('Visites en entreprise');
  });

  it('concatène le titre quand il est renseigné', () => {
    expect(libelleEvenement({ ...base, titre: 'Visite n°1 — novembre' })).toBe(
      'Visites en entreprise — Visite n°1 — novembre',
    );
  });

  it("ignore un titre vide ou composé uniquement d'espaces", () => {
    expect(libelleEvenement({ ...base, titre: '' })).toBe('Visites en entreprise');
    expect(libelleEvenement({ ...base, titre: '   ' })).toBe('Visites en entreprise');
  });
});

describe('peutSupprimerEvenement', () => {
  const base: EvenementOrganisationSuivi = {
    id: 'evt-1',
    motif: 'visite-entreprise',
  };

  it('autorise la suppression quand le verrou est absent', () => {
    expect(peutSupprimerEvenement(base)).toEqual({ supprimable: true });
  });

  it('autorise la suppression quand verrouille vaut explicitement false', () => {
    expect(peutSupprimerEvenement({ ...base, verrouille: false })).toEqual({
      supprimable: true,
    });
  });

  it("bloque la suppression et fournit une raison quand l'événement est verrouillé", () => {
    const r = peutSupprimerEvenement({ ...base, verrouille: true });
    expect(r.supprimable).toBe(false);
    expect(r.raison).toMatch(/déverrouillez/i);
  });

  // ── Entretien signé = fiche de suivi insupprimable (juin 2026) ───────────
  const evtEntretien: EvenementOrganisationSuivi = { id: 'evt-e', motif: 'entretien-tripartite' };

  it("bloque la suppression de l'événement entretien dès qu'une partie a signé", () => {
    const r = peutSupprimerEvenement(evtEntretien, entretienAvecSignatures(1));
    expect(r.supprimable).toBe(false);
    expect(r.raison).toMatch(/signé/i);
  });

  it('bloque aussi avec les 3 signatures', () => {
    const r = peutSupprimerEvenement(evtEntretien, entretienAvecSignatures(3));
    expect(r.supprimable).toBe(false);
  });

  it("autorise la suppression si l'entretien est initialisé mais sans aucune signature", () => {
    const r = peutSupprimerEvenement(evtEntretien, entretienAvecSignatures(0));
    expect(r).toEqual({ supprimable: true });
  });

  it("autorise la suppression si l'entretien n'est pas initialisé", () => {
    expect(peutSupprimerEvenement(evtEntretien, null)).toEqual({ supprimable: true });
  });

  it('un motif non-entretien reste supprimable même avec un entretien signé', () => {
    const r = peutSupprimerEvenement(base, entretienAvecSignatures(3));
    expect(r).toEqual({ supprimable: true });
  });

  it('le verrou manuel prime sur la règle de signature (message déverrouillage)', () => {
    const r = peutSupprimerEvenement(
      { ...evtEntretien, verrouille: true },
      entretienAvecSignatures(2),
    );
    expect(r.supprimable).toBe(false);
    expect(r.raison).toMatch(/déverrouillez/i);
  });
});

describe('creerEvenementVierge', () => {
  it('génère un événement avec id unique, motif fourni, autres champs vides', () => {
    const evt = creerEvenementVierge('autre');
    expect(evt.motif).toBe('autre');
    expect(evt.id).toMatch(/^evt-/);
    expect(evt.titre).toBe('');
    expect(evt.date).toBe('');
    expect(evt.commentaire).toBe('');
    expect(evt.verrouille).toBeUndefined();
  });

  it('respecte un id custom (utile pour les fixtures déterministes)', () => {
    const evt = creerEvenementVierge('reunion-rentree', 'evt-fixture-1');
    expect(evt.id).toBe('evt-fixture-1');
  });

  it('génère deux ids distincts pour deux appels successifs', () => {
    const a = creerEvenementVierge('visite-entreprise');
    const b = creerEvenementVierge('visite-entreprise');
    expect(a.id).not.toBe(b.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Verrou de la fiche de suivi par signature de l'entretien (15 juin 2026)
// ─────────────────────────────────────────────────────────────────────────────

describe('evenementFigeParSignature', () => {
  const evtEntretien: EvenementOrganisationSuivi = { id: 'evt-e', motif: 'entretien-tripartite' };
  const evtAutre: EvenementOrganisationSuivi = { id: 'evt-a', motif: 'visite-entreprise' };

  it("fige la carte dès que l'entretien est signé par les 3 parties", () => {
    expect(evenementFigeParSignature(evtEntretien, entretienAvecSignatures(3))).toBe(true);
  });

  it('ne fige pas tant que les 3 signatures ne sont pas réunies', () => {
    expect(evenementFigeParSignature(evtEntretien, entretienAvecSignatures(0))).toBe(false);
    expect(evenementFigeParSignature(evtEntretien, entretienAvecSignatures(1))).toBe(false);
    expect(evenementFigeParSignature(evtEntretien, entretienAvecSignatures(2))).toBe(false);
  });

  it("ne fige pas si l'entretien n'est pas initialisé", () => {
    expect(evenementFigeParSignature(evtEntretien, null)).toBe(false);
  });

  it('ne fige jamais un motif hors entretien tripartite', () => {
    expect(evenementFigeParSignature(evtAutre, entretienAvecSignatures(3))).toBe(false);
  });

  it("renvoie false sans l'entretien", () => {
    expect(evenementFigeParSignature(evtEntretien)).toBe(false);
  });
});
