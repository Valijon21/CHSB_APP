import { describe, it, expect } from 'vitest';
import { parseSmartTableText } from '../src/features/organization/services/smartTableTextParser';

describe('smartTableTextParser', () => {
  const context = {
    tenantSlug: 'al-xorazmiy',
    schoolId: 'school-ax-1',
    classGroupId: 'class-ax-10a',
    className: '10-A sinf',
  };

  it('correctly skips header and parses copied table lines with row numbers', () => {
    const rawInput = `
X/X №\tFamiliya va Ism\tJinsi\tTug'ilgan sana\tO'chirish
1\tAliyev Vali Rustamovich\tO'g'il\t2009-01-01\t✕
2\tKarimova Diyora Shavkatovna\tQiz\t2009-05-15\t✕
3\tBoboyev Sardor\tM\t2008-11-20\t✕
    `;

    const result = parseSmartTableText(rawInput, context);
    expect(result).toHaveLength(3);

    expect(result[0]?.lastName).toBe('Aliyev');
    expect(result[0]?.firstName).toBe('Vali');
    expect(result[0]?.middleName).toBe('Rustamovich');
    expect(result[0]?.gender).toBe('M');
    expect(result[0]?.birthDate).toBe('2009-01-01');

    expect(result[1]?.lastName).toBe('Karimova');
    expect(result[1]?.firstName).toBe('Diyora');
    expect(result[1]?.gender).toBe('F');
    expect(result[1]?.birthDate).toBe('2009-05-15');

    expect(result[2]?.lastName).toBe('Boboyev');
    expect(result[2]?.firstName).toBe('Sardor');
  });

  it('correctly handles eMaktab ID and tabs without confusing row numbers for names', () => {
    const rawInput = `
T/r\tFamiliya, Ism\teMaktab ID\tJinsi
1\tAbdullayev Jasur Dilmurod o'g'li\t2555715665172681667\tO'g'il
2\tXudoyberdiyeva Marjona Farhod qizi\t2555715665172681668\tQiz
    `;

    const result = parseSmartTableText(rawInput, context);
    expect(result).toHaveLength(2);

    expect(result[0]?.lastName).toBe('Abdullayev');
    expect(result[0]?.firstName).toBe('Jasur');
    expect(result[0]?.emaktabId).toBe('2555715665172681667');
    expect(result[0]?.gender).toBe('M');

    expect(result[1]?.lastName).toBe('Xudoyberdiyeva');
    expect(result[1]?.firstName).toBe('Marjona');
    expect(result[1]?.emaktabId).toBe('2555715665172681668');
    expect(result[1]?.gender).toBe('F');
  });

  it('transliterates Cyrillic names cleanly to Latin', () => {
    const rawInput = `
1\tЮнусов Дилмурод Рахматалиевич\t12.04.2008
2\tШарафхонова Дилрабо Турдиалиевна\t25.08.2008
    `;

    const result = parseSmartTableText(rawInput, context);
    expect(result).toHaveLength(2);

    expect(result[0]?.lastName).toBe('Yunusov');
    expect(result[0]?.firstName).toBe('Dilmurod');
    expect(result[0]?.birthDate).toBe('2008-04-12');

    expect(result[1]?.lastName).toBe('Sharafxonova');
    expect(result[1]?.firstName).toBe('Dilrabo');
    expect(result[1]?.gender).toBe('F');
    expect(result[1]?.birthDate).toBe('2008-08-25');
  });

  it('rejects binary file contents and returns empty list safely', () => {
    const binaryJunk = 'ࡱ\x00\x02\x04\x00\x00\x00Ismsiz\x00\x00';
    const result = parseSmartTableText(binaryJunk, context);
    expect(result).toHaveLength(0);
  });
});

