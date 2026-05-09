import { describe, expect, it } from 'vitest';
import {
  apprentiAyaKouame,
  apprentiLeaMartin,
  apprentiMinhNguyen,
  apprentiSofiaPereira,
  apprentiTheoDubois,
} from '@/fixtures/utilisateurs';
import { livretsDemo } from '@/fixtures/livret-demo';
import { calculerResumeLivret } from './etat-livret';
import type { Livret } from '@/types';

/**
 * Tests des résumés de livret pour le tableau de bord.
 * Référence : cahier des charges v1.3, sections 10.3 et 24.5.
 *
 * Les fixtures couvrent les cas démonstratifs : un test par cas.
 */

const MAINTENANT = new Date('2026-05-09T10:00:00.000Z');

function getLivret(apprentiId: string): Livret {
  const livret = Object.values(livretsDemo).find((l) => l.apprentiId === apprentiId);
  if (!livret) throw new Error(`Pas de livret pour ${apprentiId}`);
  return livret;
}

describe('calculerResumeLivret — cas pédagogique', () => {
  it('Léa (cas principal) : entretien complet, 2 fiches signées sur 3 → "en-cours"', () => {
    const r = calculerResumeLivret(apprentiLeaMartin, getLivret(apprentiLeaMartin.id), MAINTENANT);
    expect(r.cas).toBe('en-cours');
    expect(r.entretienComplet).toBe(true);
    expect(r.entretienAbsent).toBe(false);
    expect(r.alerteR7).toBe(false);
    expect(r.aDeverrouillage).toBe(false);
    expect(r.cloture).toBe(false);
    expect(r.nbFiches).toBe(3);
    expect(r.nbFichesSignees).toBe(2);
    expect(r.nbFichesVerrouillees).toBe(1);
  });

  it('Théo (bon élève) : 3 fiches verrouillées → "toutes-signees"', () => {
    const r = calculerResumeLivret(apprentiTheoDubois, getLivret(apprentiTheoDubois.id), MAINTENANT);
    expect(r.cas).toBe('toutes-signees');
    expect(r.nbFiches).toBe(3);
    expect(r.nbFichesSignees).toBe(3);
    expect(r.nbFichesVerrouillees).toBe(3);
    expect(r.entretienComplet).toBe(true);
  });

  it('Sofia (entretien manquant) : R7 déclenchée → "alerte-r7"', () => {
    const r = calculerResumeLivret(
      apprentiSofiaPereira,
      getLivret(apprentiSofiaPereira.id),
      MAINTENANT,
    );
    expect(r.cas).toBe('alerte-r7');
    expect(r.alerteR7).toBe(true);
    expect(r.entretienAbsent).toBe(true);
    expect(r.entretienComplet).toBe(false);
  });

  it('Minh (démarrage) : entretien signé, aucune fiche → "demarrage"', () => {
    const r = calculerResumeLivret(apprentiMinhNguyen, getLivret(apprentiMinhNguyen.id), MAINTENANT);
    expect(r.cas).toBe('demarrage');
    expect(r.entretienComplet).toBe(true);
    expect(r.alerteR7).toBe(false);
    expect(r.nbFiches).toBe(0);
  });

  it('Aya (désaccord) : historique R10 non vide → "desaccord"', () => {
    const r = calculerResumeLivret(apprentiAyaKouame, getLivret(apprentiAyaKouame.id), MAINTENANT);
    expect(r.cas).toBe('desaccord');
    expect(r.aDeverrouillage).toBe(true);
  });

  it('priorise « cloture » sur tous les autres cas', () => {
    const livretClos: Livret = {
      ...getLivret(apprentiLeaMartin.id),
      cloture: {
        dateCloture: '2026-04-15T10:00:00.000Z',
        auteurId: 'u-formateur-sophie',
        auteurNom: 'Sophie DUBOIS',
        auteurRole: 'formateur',
      },
    };
    const r = calculerResumeLivret(apprentiLeaMartin, livretClos, MAINTENANT);
    expect(r.cas).toBe('cloture');
    expect(r.cloture).toBe(true);
  });

  it('priorise « alerte-r7 » sur « desaccord » (saillance plus forte)', () => {
    // Construit un livret factice : R7 active + déverrouillage présent.
    const livretSofia = getLivret(apprentiSofiaPereira.id);
    const livretAya = getLivret(apprentiAyaKouame.id);
    const fusion: Livret = {
      ...livretSofia,
      fichesSuivi: livretAya.fichesSuivi, // historique R10 non vide
    };
    const r = calculerResumeLivret(apprentiSofiaPereira, fusion, MAINTENANT);
    expect(r.cas).toBe('alerte-r7');
    expect(r.aDeverrouillage).toBe(true); // toujours détecté
  });
});
