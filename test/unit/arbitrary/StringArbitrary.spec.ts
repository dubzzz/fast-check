import * as fc from '../../../lib/fast-check';

import { constantFrom } from '../../../src/arbitrary/constantFrom';
import { asciiString } from '../../../src/arbitrary/asciiString';
import { base64String } from '../../../src/arbitrary/base64String';
import { hexaString } from '../../../src/arbitrary/hexaString';
import { string } from '../../../src/arbitrary/string';
import { string16bits } from '../../../src/arbitrary/string16bits';
import { stringOf } from '../../../src/arbitrary/stringOf';
import { unicodeString } from '../../../src/arbitrary/unicodeString';

import { generateOneValue } from '../check/arbitrary/generic/GenerateOneValue';
import * as genericHelper from '../check/arbitrary/generic/GenericArbitraryHelper';

import * as stubRng from '../stubs/generators';

const minMax = fc
  .tuple(fc.integer(0, 10000), fc.integer(0, 10000))
  .map((t) => (t[0] < t[1] ? { min: t[0], max: t[1] } : { min: t[1], max: t[0] }));

describe('StringArbitrary', () => {
  describe('stringOf', () => {
    describe('Given no length constraints', () => {
      genericHelper.isValidArbitrary(() => stringOf(constantFrom('\u{1f431}', 'D', '1').noShrink()), {
        isStrictlySmallerValue: (g1, g2) => [...g1].length < [...g2].length,
        isValidValue: (g: string) =>
          typeof g === 'string' && [...g].every((c) => c === '\u{1f431}' || c === 'D' || c === '1'),
      });
    });
    describe('Given minimal length only', () => {
      genericHelper.isValidArbitrary(
        (minLength: number) => stringOf(constantFrom('\u{1f431}', 'D', '1').noShrink(), { minLength }),
        {
          seedGenerator: fc.nat(100),
          isStrictlySmallerValue: (g1, g2) => [...g1].length < [...g2].length,
          isValidValue: (g: string, minLength: number) =>
            typeof g === 'string' &&
            [...g].length >= minLength &&
            [...g].every((c) => c === '\u{1f431}' || c === 'D' || c === '1'),
        }
      );
    });
    describe('Given maximal length only', () => {
      genericHelper.isValidArbitrary(
        (maxLength: number) => stringOf(constantFrom('\u{1f431}', 'D', '1').noShrink(), { maxLength }),
        {
          seedGenerator: fc.nat(100),
          isStrictlySmallerValue: (g1, g2) => [...g1].length < [...g2].length,
          isValidValue: (g: string, maxLength: number) =>
            typeof g === 'string' &&
            [...g].length <= maxLength &&
            [...g].every((c) => c === '\u{1f431}' || c === 'D' || c === '1'),
        }
      );
    });
    describe('Given minimal and maximal lengths', () => {
      genericHelper.isValidArbitrary(
        (constraints: { min: number; max: number }) =>
          stringOf(constantFrom('\u{1f431}', 'D', '1').noShrink(), {
            minLength: constraints.min,
            maxLength: constraints.max,
          }),
        {
          seedGenerator: genericHelper.minMax(fc.nat(100)),
          isStrictlySmallerValue: (g1, g2) => [...g1].length < [...g2].length,
          isValidValue: (g: string, constraints: { min: number; max: number }) =>
            typeof g === 'string' &&
            [...g].length >= constraints.min &&
            [...g].length <= constraints.max &&
            [...g].every((c) => c === '\u{1f431}' || c === 'D' || c === '1'),
        }
      );
    });
    describe('Still support non recommended signatures', () => {
      it('Should support fc.stringOf(charArb, maxLength)', () => {
        fc.assert(
          fc.property(fc.integer(), fc.nat(100), (seed, maxLength) => {
            const refArbitrary = stringOf(constantFrom('a', 'b'), { maxLength });
            const nonRecommendedArbitrary = stringOf(constantFrom('a', 'b'), maxLength);
            expect(generateOneValue(seed, nonRecommendedArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
          })
        );
      });
      it('Should support fc.stringOf(charArb, minLength, maxLength)', () => {
        fc.assert(
          fc.property(fc.integer(), genericHelper.minMax(fc.nat(100)), (seed, minMaxLength) => {
            const refArbitrary = stringOf(constantFrom('a', 'b'), {
              minLength: minMaxLength.min,
              maxLength: minMaxLength.max,
            });
            const nonRecommendedArbitrary = stringOf(constantFrom('a', 'b'), minMaxLength.min, minMaxLength.max);
            expect(generateOneValue(seed, nonRecommendedArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
          })
        );
      });
    });
  });
  describe('string', () => {
    it('Should generate printable characters', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = string().generate(mrng).value;
          return g.split('').every((c) => 0x20 <= c.charCodeAt(0) && c.charCodeAt(0) <= 0x7e);
        })
      ));
    it('Should generate a string given maximal length', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(0, 10000), (seed, maxLength) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = string({ maxLength: maxLength }).generate(mrng).value;
          return g.length <= maxLength;
        })
      ));
    it('Should generate a string given minimal and maximal length', () =>
      fc.assert(
        fc.property(fc.integer(), minMax, (seed, lengths) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = string({ minLength: lengths.min, maxLength: lengths.max }).generate(mrng).value;
          return lengths.min <= g.length && g.length <= lengths.max;
        })
      ));
    describe('Still support non recommended signatures', () => {
      it('Should support fc.string(maxLength)', () => {
        fc.assert(
          fc.property(fc.integer(), fc.nat(100), (seed, maxLength) => {
            const refArbitrary = string({ maxLength });
            const nonRecommendedArbitrary = string(maxLength);
            expect(generateOneValue(seed, nonRecommendedArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
          })
        );
      });
      it('Should support fc.string(minLength, maxLength)', () => {
        fc.assert(
          fc.property(fc.integer(), genericHelper.minMax(fc.nat(100)), (seed, minMaxLength) => {
            const refArbitrary = string({ minLength: minMaxLength.min, maxLength: minMaxLength.max });
            const nonRecommendedArbitrary = string(minMaxLength.min, minMaxLength.max);
            expect(generateOneValue(seed, nonRecommendedArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
          })
        );
      });
    });
  });
  describe('asciiString', () => {
    it('Should generate ascii string', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = asciiString().generate(mrng).value;
          return g.split('').every((c) => 0x00 <= c.charCodeAt(0) && c.charCodeAt(0) <= 0x7f);
        })
      ));
    it('Should generate a string given maximal length', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(0, 10000), (seed, maxLength) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = asciiString({ maxLength: maxLength }).generate(mrng).value;
          return g.length <= maxLength;
        })
      ));
    it('Should generate a string given minimal and maximal length', () =>
      fc.assert(
        fc.property(fc.integer(), minMax, (seed, lengths) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = asciiString({ minLength: lengths.min, maxLength: lengths.max }).generate(mrng).value;
          return lengths.min <= g.length && g.length <= lengths.max;
        })
      ));
  });
  describe('string16bits', () => {
    it('Should generate string of 16 bits characters', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = string16bits().generate(mrng).value;
          return g.split('').every((c) => 0x0000 <= c.charCodeAt(0) && c.charCodeAt(0) <= 0xffff);
        })
      ));
    it('Should generate a string given maximal length', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(0, 10000), (seed, maxLength) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = string16bits({ maxLength: maxLength }).generate(mrng).value;
          return g.length <= maxLength;
        })
      ));
    it('Should generate a string given minimal and maximal length', () =>
      fc.assert(
        fc.property(fc.integer(), minMax, (seed, lengths) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = string16bits({ minLength: lengths.min, maxLength: lengths.max }).generate(mrng).value;
          return lengths.min <= g.length && g.length <= lengths.max;
        })
      ));
  });
  describe('unicodeString', () => {
    it('Should generate unicode string (ucs-2 characters only)', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = unicodeString().generate(mrng).value;
          return g
            .split('')
            .every(
              (c) =>
                0x0000 <= c.charCodeAt(0) &&
                c.charCodeAt(0) <= 0xffff &&
                !(0xd800 <= c.charCodeAt(0) && c.charCodeAt(0) <= 0xdfff)
            );
        })
      ));
    it('Should generate a string given maximal length', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(0, 10000), (seed, maxLength) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = unicodeString({ maxLength: maxLength }).generate(mrng).value;
          return g.length <= maxLength;
        })
      ));
    it('Should generate a string given minimal and maximal length', () =>
      fc.assert(
        fc.property(fc.integer(), minMax, (seed, lengths) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = unicodeString({ minLength: lengths.min, maxLength: lengths.max }).generate(mrng).value;
          return lengths.min <= g.length && g.length <= lengths.max;
        })
      ));
  });
  describe('hexaString', () => {
    it('Should generate hexa string', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = hexaString().generate(mrng).value;
          return g.split('').every((c) => ('0' <= c && c <= '9') || ('a' <= c && c <= 'f'));
        })
      ));
    it('Should generate a string given maximal length', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(0, 10000), (seed, maxLength) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = hexaString({ maxLength: maxLength }).generate(mrng).value;
          return g.length <= maxLength;
        })
      ));
    it('Should generate a string given minimal and maximal length', () =>
      fc.assert(
        fc.property(fc.integer(), minMax, (seed, lengths) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = hexaString({ minLength: lengths.min, maxLength: lengths.max }).generate(mrng).value;
          return lengths.min <= g.length && g.length <= lengths.max;
        })
      ));
  });
  describe('base64String', () => {
    function isValidBase64(g: string) {
      const valid = (c: string) =>
        ('a' <= c && c <= 'z') || ('A' <= c && c <= 'Z') || ('0' <= c && c <= '9') || c === '+' || c === '/';
      const padStart = g.indexOf('=');
      return g
        .substr(0, padStart === -1 ? g.length : padStart)
        .split('')
        .every(valid);
    }
    function hasValidBase64Padding(g: string) {
      const padStart = g.indexOf('=');
      return g
        .substr(padStart === -1 ? g.length : padStart)
        .split('')
        .every((c) => c === '=');
    }
    it('Should generate base64 string', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = base64String().generate(mrng).value;
          return isValidBase64(g);
        })
      ));
    it('Should pad base64 string with spaces', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = base64String().generate(mrng).value;
          return hasValidBase64Padding(g);
        })
      ));
    it('Should have a length multiple of 4', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = base64String().generate(mrng).value;
          return g.length % 4 === 0;
        })
      ));
    it('Should generate a string given maximal length', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(0, 10000), (seed, maxLength) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = base64String({ maxLength: maxLength }).generate(mrng).value;
          return g.length <= maxLength;
        })
      ));
    it('Should generate a string given minimal and maximal length', () =>
      fc.assert(
        fc.property(
          fc.integer(),
          minMax.filter((l) => l.max >= l.min + 4),
          (seed, lengths) => {
            const mrng = stubRng.mutable.fastincrease(seed);
            const g = base64String({ minLength: lengths.min, maxLength: lengths.max }).generate(mrng).value;
            return lengths.min <= g.length && g.length <= lengths.max;
          }
        )
      ));
    it('Should shrink and suggest valid base64 strings', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const shrinkable = base64String().generate(mrng);
          return shrinkable
            .shrink()
            .every((s) => s.value.length % 4 === 0 && isValidBase64(s.value) && hasValidBase64Padding(s.value));
        })
      ));
    describe('Still support non recommended signatures', () => {
      it('Should support fc.base64String(maxLength)', () => {
        fc.assert(
          fc.property(fc.integer(), fc.nat(25), (seed, maxLength) => {
            const refArbitrary = base64String({ maxLength: maxLength * 4 });
            const nonRecommendedArbitrary = base64String(maxLength * 4);
            expect(generateOneValue(seed, nonRecommendedArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
          })
        );
      });
      it('Should support fc.base64String(minLength, maxLength)', () => {
        fc.assert(
          fc.property(fc.integer(), genericHelper.minMax(fc.nat(100)), (seed, minMaxLength) => {
            const refArbitrary = base64String({ minLength: minMaxLength.min * 4, maxLength: minMaxLength.max * 4 });
            const nonRecommendedArbitrary = base64String(minMaxLength.min * 4, minMaxLength.max * 4);
            expect(generateOneValue(seed, nonRecommendedArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
          })
        );
      });
    });
  });
});
