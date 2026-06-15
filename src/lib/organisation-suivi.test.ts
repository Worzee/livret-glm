import { describe, expect, it } from 'vitest';
import type {
  EntretienTripartite,
  EvenementOrganisationSuivi,
  Livret,
  MotifOrganisationSuivi,
} from '@/types';
import {
  MOTIFS_ORGANISATION_SUIVI,
  creerEvenementVierge,
  evenementFigeParSignature,
  libelleEvenement,
  libelleModalite,
  libelleMotif,
  metadonneesMotif,
  modaliteEffective,
  modaliteImposee,
  modaliteParDefaut,
  motifAvecModalite,
  motifsDisponibles,
  motifsProposablesPourRole,
  numeroEntretienPourMotif,
  peutSupprimerEvenement,
} from './organisation-suivi';

/** Entretien minimal avec n signatures apposées (0 à 3). */
function entretienAvecSignatures(nbSignatures: number): EntretienTripartite {
  return {
    questionsApprentiSelectionnees: [],
    questionsMaitreSelectionnees: [],
    questionsImposees: [],
    questionsObligatoires: [],
    evaluationsAttitudes: {},
    reponsesApprenti: {},
    reponsesMaitre: {},
    appreciationMaitre: {},
    demarchesAdministratives: {
      contratSigne: null,
      visiteMedicale: null,
      permisConduire: null,
      voiture: null,
    },
    conditionsPratiques: {},
    aidesDemandees: { logement: null, premierEquipement: null, permis: null },
    commentaires: {},
    signatures: {
      apprenti: { signe: nbSignatures >= 1 },
      maitre: { signe: nbSignatures >= 2 },
      formateur: { signe: nbSignatures >= 3 },
    },
  };
}

/** Record des 4 entretiens avec E1 fourni, les autres non initialisés. */
function entretiens(e1: EntretienTripartite | null): Livret['entretiens'] {
  return { 1: e1, 2: null, 3: null, 4: null };
}

describe('MOTIFS_ORGANISATION_SUIVI', () => {
  it("expose les 11 motifs (juin 2026 : jusqu'à 4 entretiens tripartites)", () => {
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

  it("motifsProposablesPourRole : le coordo et l'admin créent tous les motifs", () => {
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
  const evtE1: EvenementOrganisationSuivi = { id: 'evt-e1', motif: 'entretien-tripartite-1' };

  it("bloque la suppression d'un événement entretien dès qu'une partie a signé", () => {
    const r = peutSupprimerEvenement(evtE1, entretiens(entretienAvecSignatures(1)));
    expect(r.supprimable).toBe(false);
    expect(r.raison).toMatch(/signé/i);
  });

  it('bloque aussi avec les 3 signatures', () => {
    const r = peutSupprimerEvenement(evtE1, entretiens(entretienAvecSignatures(3)));
    expect(r.supprimable).toBe(false);
  });

  it("autorise la suppression si l'entretien est initialisé mais sans aucune signature", () => {
    const r = peutSupprimerEvenement(evtE1, entretiens(entretienAvecSignatures(0)));
    expect(r).toEqual({ supprimable: true });
  });

  it("autorise la suppression si l'entretien n'est pas initialisé", () => {
    expect(peutSupprimerEvenement(evtE1, entretiens(null))).toEqual({ supprimable: true });
  });

  it('un motif non-entretien reste supprimable même avec un entretien signé', () => {
    const r = peutSupprimerEvenement(base, entretiens(entretienAvecSignatures(3)));
    expect(r).toEqual({ supprimable: true });
  });

  it('le verrou manuel prime sur la règle de signature (message déverrouillage)', () => {
    const r = peutSupprimerEvenement(
      { ...evtE1, verrouille: true },
      entretiens(entretienAvecSignatures(2)),
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
    expect(evt.modalite).toBeUndefined();
  });

  it('initialise la modalité « presentiel » pour un entretien tripartite (15 juin 2026)', () => {
    expect(creerEvenementVierge('entretien-tripartite-1').modalite).toBe('presentiel');
    expect(creerEvenementVierge('entretien-tripartite-2').modalite).toBe('presentiel');
  });

  it('ne pose pas de modalité pour un motif non-entretien', () => {
    expect(creerEvenementVierge('visite-entreprise').modalite).toBeUndefined();
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
// Modalité présentiel / distanciel (15 juin 2026)
// ─────────────────────────────────────────────────────────────────────────────

describe('modalité présentiel / distanciel', () => {
  it('motifAvecModalite : vrai pour les entretiens tripartites uniquement', () => {
    expect(motifAvecModalite('entretien-tripartite-1')).toBe(true);
    expect(motifAvecModalite('entretien-tripartite-4')).toBe(true);
    expect(motifAvecModalite('visite-entreprise')).toBe(false);
    expect(motifAvecModalite('autre')).toBe(false);
  });

  it('modaliteImposee : présentiel pour E1, libre (null) pour E2..E4 et les autres', () => {
    expect(modaliteImposee('entretien-tripartite-1')).toBe('presentiel');
    expect(modaliteImposee('entretien-tripartite-2')).toBeNull();
    expect(modaliteImposee('entretien-tripartite-3')).toBeNull();
    expect(modaliteImposee('visite-entreprise')).toBeNull();
  });

  it('modaliteParDefaut : présentiel pour tout entretien, undefined sinon', () => {
    expect(modaliteParDefaut('entretien-tripartite-1')).toBe('presentiel');
    expect(modaliteParDefaut('entretien-tripartite-3')).toBe('presentiel');
    expect(modaliteParDefaut('reunion-rentree')).toBeUndefined();
  });

  it('modaliteEffective : E1 toujours présentiel, même si une autre valeur est stockée', () => {
    const e1 = {
      id: 'e1',
      motif: 'entretien-tripartite-1' as const,
      modalite: 'distanciel' as const,
    };
    expect(modaliteEffective(e1)).toBe('presentiel');
  });

  it('modaliteEffective : E2 reflète la valeur stockée, défaut présentiel', () => {
    const e2 = { id: 'e2', motif: 'entretien-tripartite-2' as const };
    expect(modaliteEffective(e2)).toBe('presentiel');
    expect(modaliteEffective({ ...e2, modalite: 'distanciel' })).toBe('distanciel');
  });

  it('modaliteEffective : null pour un motif sans modalité', () => {
    expect(modaliteEffective({ id: 'v', motif: 'visite-entreprise' })).toBeNull();
  });

  it('libelleModalite : libellés humains', () => {
    expect(libelleModalite('presentiel')).toBe('Présentiel');
    expect(libelleModalite('distanciel')).toBe('Distanciel');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Verrou de la fiche de suivi par signature de l'entretien (15 juin 2026)
// ─────────────────────────────────────────────────────────────────────────────

describe('evenementFigeParSignature', () => {
  const evtE1: EvenementOrganisationSuivi = { id: 'evt-e1', motif: 'entretien-tripartite-1' };
  const evtAutre: EvenementOrganisationSuivi = { id: 'evt-a', motif: 'visite-entreprise' };

  it("fige la carte dès que l'entretien est signé par les 3 parties", () => {
    expect(evenementFigeParSignature(evtE1, entretiens(entretienAvecSignatures(3)))).toBe(true);
  });

  it('ne fige pas tant que les 3 signatures ne sont pas réunies', () => {
    expect(evenementFigeParSignature(evtE1, entretiens(entretienAvecSignatures(0)))).toBe(false);
    expect(evenementFigeParSignature(evtE1, entretiens(entretienAvecSignatures(1)))).toBe(false);
    expect(evenementFigeParSignature(evtE1, entretiens(entretienAvecSignatures(2)))).toBe(false);
  });

  it("ne fige pas si l'entretien n'est pas initialisé", () => {
    expect(evenementFigeParSignature(evtE1, entretiens(null))).toBe(false);
  });

  it('ne fige jamais un motif hors entretien tripartite', () => {
    expect(evenementFigeParSignature(evtAutre, entretiens(entretienAvecSignatures(3)))).toBe(false);
  });

  it('renvoie false sans le registre des entretiens', () => {
    expect(evenementFigeParSignature(evtE1)).toBe(false);
  });
});
