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
import type { FicheSuiviPeriode, Livret } from '@/types';

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
    const r = calculerResumeLivret(
      apprentiTheoDubois,
      getLivret(apprentiTheoDubois.id),
      MAINTENANT,
    );
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
    const r = calculerResumeLivret(
      apprentiMinhNguyen,
      getLivret(apprentiMinhNguyen.id),
      MAINTENANT,
    );
    expect(r.cas).toBe('demarrage');
    expect(r.entretienComplet).toBe(true);
    expect(r.alerteR7).toBe(false);
    expect(r.nbFiches).toBe(0);
  });

  it('Aya (désaccord) : fiche déverrouillée encore en-cours → "desaccord"', () => {
    const r = calculerResumeLivret(apprentiAyaKouame, getLivret(apprentiAyaKouame.id), MAINTENANT);
    expect(r.cas).toBe('desaccord');
    expect(r.aDeverrouillage).toBe(true);
  });

  it('désaccord résolu : fiche déverrouillée puis re-signée → quitte le cas "desaccord"', () => {
    const livretAya = getLivret(apprentiAyaKouame.id);
    // Simule la fin du désaccord : on re-signe la fiche déverrouillée par
    // les 3 parties → état passe à `signee`, l'historique R10 reste pour
    // traçabilité mais ne doit plus tirer le cas pédagogique vers "desaccord".
    const livretResolu: Livret = {
      ...livretAya,
      fichesSuivi: livretAya.fichesSuivi.map((f) =>
        f.etat === 'en-cours' && f.historiqueDeverrouillages.length > 0
          ? {
              ...f,
              etat: 'signee' as const,
              signatures: {
                apprenti: { signe: true, dateSignature: '2026-03-20T10:00:00.000Z' },
                maitre: { signe: true, dateSignature: '2026-03-20T11:00:00.000Z' },
                formateur: { signe: true, dateSignature: '2026-03-20T12:00:00.000Z' },
              },
            }
          : f,
      ),
    };
    const r = calculerResumeLivret(apprentiAyaKouame, livretResolu, MAINTENANT);
    expect(r.cas).not.toBe('desaccord');
    // L'historique R10 reste pour audit, mais le badge "Désaccord en cours"
    // doit disparaître. Avec 2/2 fiches signées + entretien complet, on tombe
    // sur "toutes-signees".
    expect(r.cas).toBe('toutes-signees');
    expect(r.aDeverrouillage).toBe(true); // historique conservé, cf. JSDoc
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

// ─────────────────────────────────────────────────────────────────────────────
// Transitions de cas — vérifie qu'une mutation fait basculer le badge
// (prémunition contre les bugs « flag collant » comme le cas désaccord du
//  18 mai 2026 où le badge restait après re-signature).
// ─────────────────────────────────────────────────────────────────────────────

function ficheVierge(numero: number): FicheSuiviPeriode {
  return {
    id: `fp-test-${numero}`,
    numeroPeriode: numero,
    dateDebut: `2026-0${numero}-01`,
    dateFin: `2026-0${numero}-28`,
    suiviGretaCfa: {},
    suiviEntreprise: [],
    observations: {},
    signatures: {
      apprenti: { signe: false },
      maitre: { signe: false },
      formateur: { signe: false },
    },
    etat: 'brouillon',
    historiqueDeverrouillages: [],
  };
}

describe('calculerResumeLivret — transitions de cas', () => {
  it('démarrage → en-cours après création de la 1ère fiche', () => {
    const livretMinh = getLivret(apprentiMinhNguyen.id);
    expect(calculerResumeLivret(apprentiMinhNguyen, livretMinh, MAINTENANT).cas).toBe('demarrage');

    const livretAvecFiche: Livret = { ...livretMinh, fichesSuivi: [ficheVierge(1)] };
    const r = calculerResumeLivret(apprentiMinhNguyen, livretAvecFiche, MAINTENANT);
    expect(r.cas).toBe('en-cours');
    expect(r.nbFiches).toBe(1);
    expect(r.nbFichesSignees).toBe(0);
  });

  it('en-cours → toutes-signees après signature de la dernière fiche', () => {
    const livretLea = getLivret(apprentiLeaMartin.id);
    expect(calculerResumeLivret(apprentiLeaMartin, livretLea, MAINTENANT).cas).toBe('en-cours');

    // Marque toutes les fiches comme signées.
    const livretComplet: Livret = {
      ...livretLea,
      fichesSuivi: livretLea.fichesSuivi.map((f) => ({
        ...f,
        etat: 'signee' as const,
        signatures: {
          apprenti: { signe: true, dateSignature: '2026-04-01T10:00:00.000Z' },
          maitre: { signe: true, dateSignature: '2026-04-01T11:00:00.000Z' },
          formateur: { signe: true, dateSignature: '2026-04-01T12:00:00.000Z' },
        },
      })),
    };
    const r = calculerResumeLivret(apprentiLeaMartin, livretComplet, MAINTENANT);
    expect(r.cas).toBe('toutes-signees');
    expect(r.nbFichesSignees).toBe(r.nbFiches);
  });

  it("toutes-signees → en-cours après création d'une nouvelle fiche en brouillon", () => {
    const livretTheo = getLivret(apprentiTheoDubois.id);
    expect(calculerResumeLivret(apprentiTheoDubois, livretTheo, MAINTENANT).cas).toBe(
      'toutes-signees',
    );

    const livretAvecP4: Livret = {
      ...livretTheo,
      fichesSuivi: [...livretTheo.fichesSuivi, ficheVierge(4)],
    };
    const r = calculerResumeLivret(apprentiTheoDubois, livretAvecP4, MAINTENANT);
    expect(r.cas).toBe('en-cours');
    expect(r.nbFiches).toBe(livretTheo.fichesSuivi.length + 1);
  });

  it('toutes-signees → desaccord après déverrouillage R10 sur la dernière fiche', () => {
    const livretTheo = getLivret(apprentiTheoDubois.id);
    expect(calculerResumeLivret(apprentiTheoDubois, livretTheo, MAINTENANT).cas).toBe(
      'toutes-signees',
    );

    const dernierIdx = livretTheo.fichesSuivi.length - 1;
    const livretDeverrouille: Livret = {
      ...livretTheo,
      fichesSuivi: livretTheo.fichesSuivi.map((f, i) =>
        i === dernierIdx
          ? {
              ...f,
              etat: 'en-cours' as const,
              signatures: {
                apprenti: { signe: false },
                maitre: { signe: false },
                formateur: { signe: false },
              },
              historiqueDeverrouillages: [
                {
                  id: 'dv-test',
                  dateIso: '2026-05-15T10:00:00.000Z',
                  auteurId: 'u-formateur-test',
                  auteurNom: 'Sophie DUBOIS',
                  auteurRole: 'formateur' as const,
                  motif: 'Test de transition vers desaccord (motif suffisamment long).',
                },
              ],
            }
          : f,
      ),
    };
    const r = calculerResumeLivret(apprentiTheoDubois, livretDeverrouille, MAINTENANT);
    expect(r.cas).toBe('desaccord');
    expect(r.aDeverrouillage).toBe(true);
  });

  it("alerte-r7 → quitte le cas après signature complète de l'entretien", () => {
    // Sofia : entretien null → R7 active.
    const livretSofia = getLivret(apprentiSofiaPereira.id);
    expect(calculerResumeLivret(apprentiSofiaPereira, livretSofia, MAINTENANT).cas).toBe(
      'alerte-r7',
    );

    // Récupère un entretien complet (celui de Théo) et l'attache à Sofia.
    const livretTheo = getLivret(apprentiTheoDubois.id);
    const livretSofiaEntretienSigne: Livret = {
      ...livretSofia,
      entretiens: { ...livretSofia.entretiens, 1: livretTheo.entretiens[1] },
    };
    const r = calculerResumeLivret(apprentiSofiaPereira, livretSofiaEntretienSigne, MAINTENANT);
    expect(r.cas).not.toBe('alerte-r7');
    expect(r.alerteR7).toBe(false);
    expect(r.entretienComplet).toBe(true);
  });
});
