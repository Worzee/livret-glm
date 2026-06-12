import { describe, expect, it } from 'vitest';
import { estMaitreDeLApprenti, maitresIdsDeLApprenti } from './maitres-apprenti';

describe('maitresIdsDeLApprenti', () => {
  it("retourne le principal seul quand il n'y a pas de second", () => {
    expect(maitresIdsDeLApprenti({ maitreApprentissageId: 'm1' })).toEqual(['m1']);
  });

  it('retourne principal + second quand les deux sont renseignés', () => {
    expect(
      maitresIdsDeLApprenti({ maitreApprentissageId: 'm1', maitreApprentissageSecondId: 'm2' }),
    ).toEqual(['m1', 'm2']);
  });

  it('dédoublonne si le second est identique au principal (donnée corrompue)', () => {
    expect(
      maitresIdsDeLApprenti({ maitreApprentissageId: 'm1', maitreApprentissageSecondId: 'm1' }),
    ).toEqual(['m1']);
  });

  it('ignore les ids vides (apprenti·e importé·e sans affectation)', () => {
    expect(
      maitresIdsDeLApprenti({ maitreApprentissageId: '', maitreApprentissageSecondId: '' }),
    ).toEqual([]);
    expect(
      maitresIdsDeLApprenti({ maitreApprentissageId: 'm1', maitreApprentissageSecondId: '' }),
    ).toEqual(['m1']);
  });
});

describe('estMaitreDeLApprenti', () => {
  const apprenti = { maitreApprentissageId: 'm1', maitreApprentissageSecondId: 'm2' };

  it('reconnaît le maître principal', () => {
    expect(estMaitreDeLApprenti('m1', apprenti)).toBe(true);
  });

  it('reconnaît le second maître', () => {
    expect(estMaitreDeLApprenti('m2', apprenti)).toBe(true);
  });

  it('rejette un maître étranger', () => {
    expect(estMaitreDeLApprenti('m3', apprenti)).toBe(false);
  });

  it('rejette quand le second est absent', () => {
    expect(estMaitreDeLApprenti('m2', { maitreApprentissageId: 'm1' })).toBe(false);
  });
});
