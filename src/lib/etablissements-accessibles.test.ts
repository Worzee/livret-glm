import { describe, expect, it } from 'vitest';
import type {
  Apprenti,
  Coordo,
  Etablissement,
  Formateur,
  Formation,
  Maitre,
} from '@/types';
import { etablissementsAccessibles } from './etablissements-accessibles';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures locales — 2 établissements, 2 formations, 1 apprenti·e, 1 maître,
// 1 formateur, 1 coordo (rattaché à une seule formation).
// ─────────────────────────────────────────────────────────────────────────────

const eta1: Etablissement = { id: 'eta-1', nom: 'GRETA Site A', urlPronote: 'https://a/' };
const eta2: Etablissement = { id: 'eta-2', nom: 'GRETA Site B' };
const etaSansFormation: Etablissement = {
  id: 'eta-zombie',
  nom: 'Site sans formation',
};

const form1: Formation = {
  id: 'f-1',
  intitule: 'CAP X',
  niveau: 'CAP',
  annee: '2025-2026',
  referentielId: 'ref-x',
  dateDebut: '2025-09-01',
  dateFin: '2027-09-01',
  lieuId: eta1.id,
  periodes: [],
  nombreEntretiens: 2,
      questionsRetirees: [],
};
const form2: Formation = {
  id: 'f-2',
  intitule: 'CAP Y',
  niveau: 'CAP',
  annee: '2025-2026',
  referentielId: 'ref-y',
  dateDebut: '2025-09-01',
  dateFin: '2027-09-01',
  lieuId: eta2.id,
  periodes: [],
  nombreEntretiens: 2,
      questionsRetirees: [],
};

const app1: Apprenti = {
  id: 'app-1',
  role: 'apprenti',
  prenom: 'Léa',
  nom: 'MARTIN',
  email: 'lea@demo.fr',
  dateNaissance: '2007-04-15',
  formationId: form1.id,
  entrepriseId: 'e-1',
  maitreApprentissageId: 'mai-1',
  formateurReferentId: 'for-1',
  contratDebut: '2025-09-01',
  contratFin: '2027-09-01',
};

const mai1: Maitre = {
  id: 'mai-1',
  role: 'maitre',
  prenom: 'Karim',
  nom: 'BENALI',
  email: 'k@demo.fr',
  entreprise: 'Le Gourmet',
  fonction: 'Chef de cuisine',
  apprentiIds: [app1.id],
};

const for1: Formateur = {
  id: 'for-1',
  role: 'formateur',
  prenom: 'Sophie',
  nom: 'DUBOIS',
  email: 's@demo.fr',
  promoIds: [form1.id],
};

const coo1: Coordo = {
  id: 'coo-1',
  role: 'coordo',
  prenom: 'Martine',
  nom: 'LEFÈVRE',
  email: 'm@demo.fr',
  formationIds: [form2.id], // coordo en charge de la formation 2 uniquement
};

const baseCtx = {
  formations: [form1, form2],
  apprentis: [app1],
  maitres: [mai1],
  formateurs: [for1],
  coordos: [coo1],
  etablissements: [eta1, eta2, etaSansFormation],
};

describe('etablissementsAccessibles', () => {
  it('admin : voit tous les établissements (y compris sans formation rattachée)', () => {
    const r = etablissementsAccessibles({
      ...baseCtx,
      role: 'admin',
      utilisateurId: 'irrelevant',
    });
    expect(r.map((e) => e.id)).toEqual([eta1.id, eta2.id, etaSansFormation.id]);
  });

  it('apprenti·e : voit uniquement l\'établissement de sa formation', () => {
    const r = etablissementsAccessibles({
      ...baseCtx,
      role: 'apprenti',
      utilisateurId: app1.id,
    });
    expect(r.map((e) => e.id)).toEqual([eta1.id]);
  });

  it("maître : voit les établissements des formations de ses apprenti·e·s (déduplication)", () => {
    const r = etablissementsAccessibles({
      ...baseCtx,
      role: 'maitre',
      utilisateurId: mai1.id,
    });
    expect(r.map((e) => e.id)).toEqual([eta1.id]);
  });

  it('formateur : voit les établissements des promos qu\'il/elle encadre', () => {
    const r = etablissementsAccessibles({
      ...baseCtx,
      role: 'formateur',
      utilisateurId: for1.id,
    });
    expect(r.map((e) => e.id)).toEqual([eta1.id]);
  });

  it('coordo : voit uniquement les établissements des formations dont il/elle a la charge', () => {
    const r = etablissementsAccessibles({
      ...baseCtx,
      role: 'coordo',
      utilisateurId: coo1.id,
    });
    // coo1 est coordo de form2 (lieuId = eta2), pas de form1.
    expect(r.map((e) => e.id)).toEqual([eta2.id]);
  });

  it('coordo sans formation rattachée : voit la liste vide', () => {
    const coordoOrphelin: Coordo = { ...coo1, id: 'coo-z', formationIds: [] };
    const r = etablissementsAccessibles({
      ...baseCtx,
      coordos: [coordoOrphelin],
      role: 'coordo',
      utilisateurId: coordoOrphelin.id,
    });
    expect(r).toEqual([]);
  });

  it('utilisateur·rice inconnu·e : retourne la liste vide (sécurité)', () => {
    const r = etablissementsAccessibles({
      ...baseCtx,
      role: 'apprenti',
      utilisateurId: 'inexistant',
    });
    expect(r).toEqual([]);
  });

  it('tri alphabétique fr-FR par nom', () => {
    const etaZ: Etablissement = { id: 'eta-z', nom: 'Zèbre' };
    const etaA: Etablissement = { id: 'eta-a', nom: 'Alpha' };
    const formZ: Formation = { ...form1, id: 'f-z', lieuId: etaZ.id };
    const formA: Formation = { ...form1, id: 'f-a', lieuId: etaA.id };
    const r = etablissementsAccessibles({
      ...baseCtx,
      role: 'admin',
      utilisateurId: 'x',
      formations: [formA, formZ],
      etablissements: [etaZ, etaA],
    });
    expect(r.map((e) => e.nom)).toEqual(['Alpha', 'Zèbre']);
  });
});
