import { toRoman, fromRoman, MaxRoman, LettersValue, NumLetters } from './src/roman';
import fc from 'fast-check';

describe('toRoman', () => {
  it('should be able to revert toRoman using fromRoman', () => {
    fc.assert(
      fc.property(romanNumberArb, (n) => {
        expect(fromRoman(toRoman(n))).toBe(n);
      })
    );
  });

  it('should produce a non empty string', () => {
    fc.assert(
      fc.property(romanNumberArb, (n) => {
        expect(toRoman(n)).not.toBe('');
      })
    );
  });

  it('should be injective', () => {
    fc.assert(
      fc.property(romanNumberArb, romanNumberArb, (n1, n2) => {
        fc.pre(n1 !== n2);
        expect(toRoman(n2)).not.toBe(toRoman(n1));
      })
    );
  });

  it('should start negative romans with a minus sign', () => {
    fc.assert(
      fc.property(fc.integer(-MaxRoman, -1), (n) => {
        expect(toRoman(n)[0]).toBe('-');
      })
    );
  });

  it('should return same value for positive and negative romans excluding minus sign', () => {
    fc.assert(
      fc.property(posRomanNumberArb, (n) => {
        expect(toRoman(-n)).toBe(`-${toRoman(n)}`);
      })
    );
  });

  it('should produce only one of the allowed letters', () => {
    const letters: string[] = LettersValue.map(([_, v]) => v);
    fc.assert(
      fc.property(posRomanNumberArb, (n) => {
        expect([...toRoman(n)].every((c) => letters.includes(c))).toBe(true);
      })
    );
  });

  it('should not output too many times the same letter', () => {
    const letters: string[] = LettersValue.map(([_, v]) => v);
    fc.assert(
      fc.property(posRomanNumberArb, (n) => {
        const repr = toRoman(n);
        for (let idx = 0; idx !== letters.length; ++idx) {
          expect([...repr].filter((c) => c === letters[idx]).length).toBeLessThanOrEqual(
            idx % 2
              ? 1 // 5 * 10^N appear at most 1 time
              : 4 // 10^N appear at most 4 times
          );
        }
      })
    );
  });

  it('should not produce a too long roman output', () => {
    const MaxRomanReprLength = (NumLetters - 1) / 2 + (3 * (NumLetters + 1)) / 2 + 1;
    fc.assert(
      fc.property(romanNumberArb, (n) => {
        expect(toRoman(n).length).toBeLessThanOrEqual(MaxRomanReprLength);
      })
    );
  });
});

describe('fromRoman', () => {
  it('should read simple roman strings (no letter doing a minus)', () => {
    fc.assert(
      fc.property(fc.array(fc.nat(3), { minLength: NumLetters, maxLength: NumLetters }), (choices) => {
        fc.pre(choices.find((e) => e !== 0) !== undefined);

        let romanRepr = '';
        let expected = 0;
        for (let ridx = 0; ridx !== choices.length; ++ridx) {
          const idx = NumLetters - ridx - 1;
          const num = idx % 2 && choices[idx] > 1 ? 1 : choices[idx];
          romanRepr += LettersValue[idx][1].repeat(num);
          expected += num * LettersValue[idx][0];
        }
        expect(fromRoman(romanRepr)).toBe(expected);
      })
    );
  });
});

// Helpers

const romanNumberArb = fc.integer(-MaxRoman, MaxRoman);
const posRomanNumberArb = fc.integer(1, MaxRoman);
