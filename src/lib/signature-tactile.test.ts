import { describe, expect, it } from 'vitest';
import {
  LONGUEUR_MIN_SIGNATURE,
  longueurTraits,
  traceEstSignificative,
  type TraitsSignature,
} from './signature-tactile';

/** Trait horizontal de longueur donnée, en 2 points. */
const traitHorizontal = (longueur: number): TraitsSignature[number] => [
  { x: 0, y: 0 },
  { x: longueur, y: 0 },
];

describe('longueurTraits', () => {
  it('vaut 0 sans trait ou avec un point isolé', () => {
    expect(longueurTraits([])).toBe(0);
    expect(longueurTraits([[{ x: 10, y: 10 }]])).toBe(0);
  });

  it('cumule la longueur euclidienne de chaque segment', () => {
    const traits: TraitsSignature = [
      [
        { x: 0, y: 0 },
        { x: 30, y: 40 }, // 50 px (3-4-5)
      ],
    ];
    expect(longueurTraits(traits)).toBe(50);
  });

  it('cumule plusieurs traits', () => {
    expect(longueurTraits([traitHorizontal(20), traitHorizontal(35)])).toBe(55);
  });
});

describe('traceEstSignificative', () => {
  it('rejette un tracé vide', () => {
    expect(traceEstSignificative([])).toBe(false);
  });

  it('rejette un point isolé (clic accidentel)', () => {
    expect(traceEstSignificative([[{ x: 5, y: 5 }]])).toBe(false);
  });

  it('rejette un micro-gribouillis sous le seuil', () => {
    expect(traceEstSignificative([traitHorizontal(LONGUEUR_MIN_SIGNATURE - 1)])).toBe(false);
  });

  it('accepte un tracé atteignant le seuil', () => {
    expect(traceEstSignificative([traitHorizontal(LONGUEUR_MIN_SIGNATURE)])).toBe(true);
  });

  it('accepte plusieurs petits traits dont le cumul atteint le seuil (initiales)', () => {
    const moitie = LONGUEUR_MIN_SIGNATURE / 2;
    expect(traceEstSignificative([traitHorizontal(moitie), traitHorizontal(moitie)])).toBe(true);
  });
});
