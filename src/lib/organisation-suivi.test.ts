import { describe, expect, it } from 'vitest';
import type { EvenementOrganisationSuivi, MotifOrganisationSuivi } from '@/types';
import {
  MOTIFS_ORGANISATION_SUIVI,
  creerEvenementVierge,
  libelleEvenement,
  libelleMotif,
  metadonneesMotif,
  motifsDisponibles,
  motifsProposablesPourRole,
  numeroEntretienPourMotif,
  peutSupprimerEvenement,
} from './organisation-suivi';

describe('MOTIFS_ORGANISATION_SUIVI', () => {
  it('expose les 11 motifs (juin 2026 : jusqu\'à 4 entretiens tripartites)', () => {
    const cles = MOTIFS_ORGANISATION_SUIVI.map((m) => m.motif);
    expect(cles).toEqual([
      'reunion-rentree',
      'entretien-individuel',
      'accueil-tuteur',
      'visite-entreprise',
      'restitution-activites',
      'bilan-formation',
      'entretien-tripartite-1',
      'entretien-tripartite-2',
      'entretien-tripartite-3',
      'entretien-tripartite-4',
      'autre',
    ]);
  });

  it('motifsDisponibles masque les entretiens au-delà du nombre de la formation', () => {
    const pour2 = motifsDisponibles(2).map((m) => m.motif);
    expect(pour2).toContain('entretien-tripartite-2');
    expect(pour2).not.toContain('entretien-tripartite-3');
    expect(pour2).not.toContain('entretien-tripartite-4');
    expect(pour2).toContain('autre'); // les motifs non-entretien restent

    const pour4 = motifsDisponibles(4).map((m) => m.motif);
    expect(pour4).toContain('entretien-tripartite-4');

    const pour1 = motifsDisponibles(1).map((m) => m.motif);
    expect(pour1).toContain('entretien-tripartite-1');
    expect(pour1).not.toContain('entretien-tripartite-2');
  });

  it('numeroEntretienPourMotif couvre les 4 entretiens', () => {
    expect(numeroEntretienPourMotif('entretien-tripartite-3')).toBe(3);
    expect(numeroEntretienPourMotif('entretien-tripartite-4')).toBe(4);
    expect(numeroEntretienPourMotif('visite-entreprise')).toBeNull();
  });

  it('motifsProposablesPourRole : le formateur ne crée que les motifs entretien (juin 2026)', () => {
    const motifs = motifsProposablesPourRole(2, 'formateur').map((m) => m.motif);
    expect(motifs).toEqual(['entretien-tripartite-1', 'entretien-tripartite-2']);
  });

  it('motifsProposablesPourRole : le coordo et l\'admin créent tous les motifs', () => {
    const coordo = motifsProposablesPourRole(2, 'coordo').map((m) => m.motif);
    expect(coordo).toContain('reunion-rentree');
    expect(coordo).toContain('entretien-tripartite-1');
    expect(coordo).toContain('autre');
    expect(coordo).not.toContain('entretien-tripartite-3'); // formation à 2
    expect(motifsProposablesPourRole(4, 'admin').map((m) => m.motif)).toContain(
      'entretien-tripartite-4',
    );
  });

  it('motifsProposablesPourRole : aucun motif pour les rôles en lecture seule', () => {
    expect(motifsProposablesPourRole(2, 'apprenti')).toEqual([]);
    expect(motifsProposablesPourRole(2, 'maitre')).toEqual([]);
  });

  it('chaque motif porte un libellé, une description et un placeholder non vides', () => {
    for (const meta of MOTIFS_ORGANISATION_SUIVI) {
      expect(meta.libelle.length).toBeGreaterThan(0);
      expect(meta.description.length).toBeGreaterThan(0);
      expect(meta.placeholderCommentaire.length).toBeGreaterThan(0);
    }
  });
});

describe('numeroEntretienPourMotif (chantier #2)', () => {
  it('retourne 1 pour le motif entretien-tripartite-1', () => {
    expect(numeroEntretienPourMotif('entretien-tripartite-1')).toBe(1);
  });

  it('retourne 2 pour le motif entretien-tripartite-2', () => {
    expect(numeroEntretienPourMotif('entretien-tripartite-2')).toBe(2);
  });

  it('retourne null pour tous les autres motifs', () => {
    const autres: MotifOrganisationSuivi[] = [
      'reunion-rentree',
      'entretien-individuel',
      'accueil-tuteur',
      'visite-entreprise',
      'restitution-activites',
      'bilan-formation',
      'autre',
    ];
    for (const m of autres) {
      expect(numeroEntretienPourMotif(m)).toBeNull();
    }
  });
});

describe('metadonneesMotif / libelleMotif', () => {
  it('renvoie les métadonnées attendues pour un motif connu', () => {
    expect(metadonneesMotif('visite-entreprise').libelle).toBe('Visites en entreprise');
    expect(libelleMotif('accueil-tuteur')).toBe('Accueil tuteur');
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

  it("autorise la suppression quand verrouille vaut explicitement false", () => {
    expect(peutSupprimerEvenement({ ...base, verrouille: false })).toEqual({
      supprimable: true,
    });
  });

  it("bloque la suppression et fournit une raison quand l'événement est verrouillé", () => {
    const r = peutSupprimerEvenement({ ...base, verrouille: true });
    expect(r.supprimable).toBe(false);
    expect(r.raison).toMatch(/déverrouillez/i);
  });
});

describe('creerEvenementVierge', () => {
  it("génère un événement avec id unique, motif fourni, autres champs vides", () => {
    const evt = creerEvenementVierge('autre');
    expect(evt.motif).toBe('autre');
    expect(evt.id).toMatch(/^evt-/);
    expect(evt.titre).toBe('');
    expect(evt.date).toBe('');
    expect(evt.commentaire).toBe('');
    expect(evt.verrouille).toBeUndefined();
  });

  it("respecte un id custom (utile pour les fixtures déterministes)", () => {
    const evt = creerEvenementVierge('reunion-rentree', 'evt-fixture-1');
    expect(evt.id).toBe('evt-fixture-1');
  });

  it("génère deux ids distincts pour deux appels successifs", () => {
    const a = creerEvenementVierge('visite-entreprise');
    const b = creerEvenementVierge('visite-entreprise');
    expect(a.id).not.toBe(b.id);
  });
});
