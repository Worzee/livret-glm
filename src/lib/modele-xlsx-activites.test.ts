// @vitest-environment node
// Même contrainte que parser-xlsx.test.ts : fflate manipule des Uint8Array
// que jsdom altère subtilement — le round-trip zipSync/unzipSync ne marche
// que sous Node pur.

import { describe, expect, it } from 'vitest';
import {
  GABARIT_XLSX_ACTIVITES,
  genererXlsxGabaritActivites,
  NOM_FICHIER_GABARIT_ACTIVITES,
} from './modele-xlsx-activites';
import { parserXlsxBuffer } from './parser-xlsx';
import { construireModeleActivites } from './import-modele-activites';

function enArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

describe('genererXlsxGabaritActivites', () => {
  it('produit un XLSX re-parsable : en-têtes Code/Libellé/Description + lignes d’exemple', () => {
    const lignes = parserXlsxBuffer(enArrayBuffer(genererXlsxGabaritActivites()));
    expect(lignes[0]).toEqual(['Code', 'Libellé', 'Description']);
    expect(lignes.length).toBe(1 + GABARIT_XLSX_ACTIVITES.exemples!.length);
    expect(lignes.length).toBeGreaterThanOrEqual(3);
  });

  it('boucle fermée : le gabarit rempli tel quel passe le pipeline d’import', () => {
    // Un coordo qui télécharge le gabarit et le réimporte SANS le modifier
    // doit obtenir un modèle valide (les exemples deviennent des activités).
    const lignes = parserXlsxBuffer(enArrayBuffer(genererXlsxGabaritActivites()));
    const rapport = construireModeleActivites(
      lignes,
      { nomModele: 'Test gabarit', referentielId: 'ref-test' },
      'utf-8',
      '\t',
    );
    expect(rapport.modele.activites.length).toBe(GABARIT_XLSX_ACTIVITES.exemples!.length);
    expect(rapport.avertissements).toEqual([]);
    // Le mapping démarre vide — il se fait dans l'UI (arbitrage Q1).
    expect(rapport.modele.activites.every((a) => a.competenceIds.length === 0)).toBe(true);
  });

  it('expose un nom de fichier stable pour le téléchargement', () => {
    expect(NOM_FICHIER_GABARIT_ACTIVITES).toBe('modele-activites.xlsx');
  });
});
