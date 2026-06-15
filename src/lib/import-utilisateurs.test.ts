// @vitest-environment node
// Même contrainte que les autres tests qui touchent fflate via parser-xlsx.

import { describe, expect, it } from 'vitest';
import { genererXlsx } from './generer-xlsx-modele';
import { importerDepuisXlsx, MODELES, normaliserDate } from './import-utilisateurs';

/**
 * Helper : génère un XLSX en mémoire à partir d'en-têtes + lignes, puis
 * appelle l'importeur. Évite d'avoir à manipuler des fixtures binaires
 * dans le repo pour chaque cas testé.
 */
function importerLignes(
  type: 'apprenti' | 'maitre' | 'formateur',
  lignes: string[][],
  emailsExistants: ReadonlySet<string> = new Set(),
) {
  const entetes = MODELES[type].entetes;
  const bytes = genererXlsx({ entetes, exemples: lignes });
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return importerDepuisXlsx(ab, type, emailsExistants);
}

describe('importerDepuisXlsx — Apprenti·e', () => {
  it('accepte un fichier conforme avec une ligne valide', () => {
    const r = importerLignes('apprenti', [
      ['Léa', 'Martin', 'lea@demo.fr', '2007-04-15', '2025-09-02', '2027-09-01'],
    ]);
    expect(r.ok).toBe(true);
    expect(r.erreurs).toHaveLength(0);
    expect(r.lignes).toHaveLength(1);
    // Normalise le nom en MAJUSCULES (cohérent avec la modale manuelle).
    expect(r.lignes[0].nom).toBe('MARTIN');
    expect(r.lignes[0].prenom).toBe('Léa');
  });

  it('refuse une ligne avec prénom manquant', () => {
    const r = importerLignes('apprenti', [
      ['', 'Martin', 'lea@demo.fr', '2007-04-15', '2025-09-02', '2027-09-01'],
    ]);
    expect(r.ok).toBe(false);
    expect(r.erreurs.some((e) => e.colonne === 'Prénom')).toBe(true);
  });

  it('refuse un email mal formé', () => {
    const r = importerLignes('apprenti', [
      ['Léa', 'Martin', 'pas-un-email', '2007-04-15', '2025-09-02', '2027-09-01'],
    ]);
    expect(r.ok).toBe(false);
    expect(r.erreurs.some((e) => e.colonne === 'Email')).toBe(true);
  });

  it('refuse une date de naissance hors format ISO', () => {
    const r = importerLignes('apprenti', [
      ['Léa', 'Martin', 'lea@demo.fr', '15/04/2007', '2025-09-02', '2027-09-01'],
    ]);
    expect(r.ok).toBe(false);
    expect(r.erreurs.some((e) => e.colonne === 'Date de naissance')).toBe(true);
  });

  it('refuse une date civile invalide (2025-02-30)', () => {
    const r = importerLignes('apprenti', [
      ['Léa', 'Martin', 'lea@demo.fr', '2025-02-30', '2025-09-02', '2027-09-01'],
    ]);
    expect(r.ok).toBe(false);
    expect(r.erreurs.some((e) => /invalide/.test(e.message))).toBe(true);
  });

  it('refuse une fin de contrat antérieure au début (R2)', () => {
    const r = importerLignes('apprenti', [
      ['Léa', 'Martin', 'lea@demo.fr', '2007-04-15', '2025-09-02', '2024-09-01'],
    ]);
    expect(r.ok).toBe(false);
    expect(r.erreurs.some((e) => e.colonne === 'Fin de contrat')).toBe(true);
  });

  it('refuse un email déjà présent dans le store (doublon)', () => {
    const r = importerLignes(
      'apprenti',
      [['Léa', 'Martin', 'lea@demo.fr', '2007-04-15', '2025-09-02', '2027-09-01']],
      new Set(['lea@demo.fr']),
    );
    expect(r.ok).toBe(false);
    expect(r.erreurs.some((e) => /déjà utilisé/.test(e.message))).toBe(true);
  });

  it('refuse 2 lignes du même fichier avec le même email', () => {
    const r = importerLignes('apprenti', [
      ['Léa', 'Martin', 'lea@demo.fr', '2007-04-15', '2025-09-02', '2027-09-01'],
      ['Théo', 'Dubois', 'lea@demo.fr', '2006-11-23', '2025-09-02', '2027-09-01'],
    ]);
    expect(r.ok).toBe(false);
    expect(r.erreurs.some((e) => /plusieurs fois/.test(e.message))).toBe(true);
  });

  it('refus complet (tout-ou-rien) si UNE ligne sur N est en erreur', () => {
    const r = importerLignes('apprenti', [
      ['Léa', 'Martin', 'lea@demo.fr', '2007-04-15', '2025-09-02', '2027-09-01'],
      ['Théo', 'Dubois', 'email-invalide', '2006-11-23', '2025-09-02', '2027-09-01'],
    ]);
    expect(r.ok).toBe(false);
    // Les lignes valides ne sont PAS exposées tant qu'il reste une erreur.
    expect(r.lignes).toHaveLength(0);
  });

  it('ignore les lignes complètement vides en fin de fichier', () => {
    const r = importerLignes('apprenti', [
      ['Léa', 'Martin', 'lea@demo.fr', '2007-04-15', '2025-09-02', '2027-09-01'],
      ['', '', '', '', '', ''], // ligne fantôme Excel
    ]);
    expect(r.ok).toBe(true);
    expect(r.lignes).toHaveLength(1);
  });
});

describe("importerDepuisXlsx — Maître d'apprentissage", () => {
  it('accepte un maître avec entreprise + fonction', () => {
    const r = importerLignes('maitre', [
      ['Karim', 'Benali', 'karim@demo.fr', 'Le Gourmet', 'Chef de cuisine'],
    ]);
    expect(r.ok).toBe(true);
    expect(r.lignes[0]).toMatchObject({
      prenom: 'Karim',
      nom: 'BENALI',
      entreprise: 'Le Gourmet',
      fonction: 'Chef de cuisine',
    });
  });

  it('refuse un maître sans entreprise', () => {
    const r = importerLignes('maitre', [
      ['Karim', 'Benali', 'karim@demo.fr', '', 'Chef de cuisine'],
    ]);
    expect(r.ok).toBe(false);
    expect(r.erreurs.some((e) => e.colonne === 'Entreprise')).toBe(true);
  });

  it('refuse un maître sans fonction', () => {
    const r = importerLignes('maitre', [['Karim', 'Benali', 'karim@demo.fr', 'Le Gourmet', '']]);
    expect(r.ok).toBe(false);
    expect(r.erreurs.some((e) => e.colonne === 'Fonction')).toBe(true);
  });
});

describe('importerDepuisXlsx — Formateur·rice', () => {
  it('accepte un formateur avec juste identité + email', () => {
    const r = importerLignes('formateur', [['Sophie', 'Dubois', 'sophie@demo.fr']]);
    expect(r.ok).toBe(true);
    expect(r.lignes[0]).toEqual({
      prenom: 'Sophie',
      nom: 'DUBOIS',
      email: 'sophie@demo.fr',
    });
  });
});

describe('normaliserDate', () => {
  it('laisse intacte une date ISO YYYY-MM-DD', () => {
    expect(normaliserDate('2025-09-02')).toBe('2025-09-02');
  });

  it('convertit un serial Excel en ISO (cellule date du modèle généré)', () => {
    // Serial 45902 = 2025-09-02 (vérifié contre Excel).
    expect(normaliserDate('45902')).toBe('2025-09-02');
  });

  it('convertit le serial 25569 (1970-01-01, date pivot Unix)', () => {
    expect(normaliserDate('25569')).toBe('1970-01-01');
  });

  it('ignore les nombres hors plage date raisonnable (codes postaux, etc.)', () => {
    expect(normaliserDate('69001')).toBe('69001'); // code postal, hors plage
    expect(normaliserDate('1')).toBe('1'); // 1900-01-01 — trop ancien, ambigu
  });

  it('retourne tel quel un texte non reconnu (la validation finale rejettera)', () => {
    expect(normaliserDate('20/01/1988')).toBe('20/01/1988');
    expect(normaliserDate('')).toBe('');
  });
});

describe('importerDepuisXlsx — Apprenti·e via cellules date Excel', () => {
  it('accepte un fichier généré par le modèle (cellules date au format Excel)', () => {
    // On regénère le modèle apprenti avec colonnesDate puis on lui injecte
    // une ligne de données. Le parser retourne les dates en serial, et
    // normaliserDate doit re-convertir avant validation. Bout-en-bout.
    const bytes = genererXlsx({
      entetes: MODELES.apprenti.entetes,
      colonnesDate: MODELES.apprenti.colonnesDate,
      exemples: [['Alban', 'RENOIR', 'alban@demo.fr', '2007-04-15', '2025-09-02', '2027-09-01']],
    });
    const ab = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(ab).set(bytes);
    const r = importerDepuisXlsx(ab, 'apprenti', new Set());
    expect(r.ok).toBe(true);
    expect(r.lignes[0].dateNaissance).toBe('2007-04-15');
    expect(r.lignes[0].contratDebut).toBe('2025-09-02');
    expect(r.lignes[0].contratFin).toBe('2027-09-01');
  });
});

describe('importerDepuisXlsx — robustesse', () => {
  it("retourne une erreur lisible si le fichier n'est pas un XLSX valide", () => {
    const fauxBuffer = new TextEncoder().encode('Pas un fichier XLSX').buffer as ArrayBuffer;
    const r = importerDepuisXlsx(fauxBuffer, 'apprenti', new Set());
    expect(r.ok).toBe(false);
    expect(r.erreurs[0]?.message).toMatch(/XLSX valide/);
  });

  it("rejette un fichier ne contenant que l'en-tête (aucune ligne de données)", () => {
    const r = importerLignes('formateur', []);
    expect(r.ok).toBe(false);
    expect(r.erreurs.some((e) => /Aucune ligne/.test(e.message))).toBe(true);
  });

  it("refuse un fichier avec une colonne manquante dans l'en-tête", () => {
    // On bricole un XLSX avec en-têtes incomplètes (sans la colonne « Fonction »).
    const bytes = genererXlsx({
      entetes: ['Prénom', 'Nom', 'Email', 'Entreprise'],
      exemples: [['Karim', 'Benali', 'karim@demo.fr', 'Le Gourmet']],
    });
    const ab = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(ab).set(bytes);
    const r = importerDepuisXlsx(ab, 'maitre', new Set());
    expect(r.ok).toBe(false);
    expect(r.erreurs.some((e) => e.colonne === 'Fonction')).toBe(true);
  });
});
