import * as fc from '../../../../lib/fast-check';

import { subarray } from '../../../../src/arbitrary/subarray';
import { shuffledSubarray } from '../../../../src/arbitrary/shuffledSubarray';

import { generateOneValue } from './generic/GenerateOneValue';
import * as genericHelper from './generic/GenericArbitraryHelper';

const isOrderedSubarray = (originalArray: number[], subarray: number[]): boolean => {
  let idxOriginal = 0;
  for (let idx = 0; idx !== subarray.length; ++idx) {
    while (originalArray[idxOriginal] !== subarray[idx]) {
      ++idxOriginal;
      if (idxOriginal >= originalArray.length) return false;
    }
    ++idxOriginal;
  }
  return true;
};

const isSubarray = (originalArray: number[], subarray: number[]): boolean => {
  return isOrderedSubarray(
    [...originalArray].sort((a, b) => a - b),
    [...subarray].sort((a, b) => a - b)
  );
};

const isStrictlySmallerValue = (current: number[], prev: number[]) => {
  return isOrderedSubarray(prev, current);
};

type SubarrayMinMaxConstraits = { src: number[]; a: number; b: number };
const computeMinMaxFor = (constraints: SubarrayMinMaxConstraits) => {
  const a = constraints.a % (constraints.src.length + 1);
  const b = constraints.b % (constraints.src.length + 1);
  return {
    min: Math.min(a, b),
    max: Math.max(a, b),
  };
};

describe('SubarrayArbitrary', () => {
  describe('subarray', () => {
    it('Should raise an error whenever minLength is below zero', () =>
      fc.assert(
        fc.property(
          fc.array(fc.integer()),
          fc.nat(),
          fc.option(fc.nat(), { nil: undefined }),
          (originalArray: number[], length: number, otherLength: number | undefined) => {
            expect(() => {
              subarray(originalArray, {
                minLength: -length - 1,
                maxLength: otherLength !== undefined ? otherLength % (originalArray.length + 1) : undefined,
              });
            }).toThrowError(/minimal length to be between 0/);
          }
        )
      ));
    it('Should raise an error whenever minLength is greater than array size', () =>
      fc.assert(
        fc.property(
          fc.array(fc.integer()),
          fc.nat(),
          fc.option(fc.nat(), { nil: undefined }),
          (originalArray: number[], offset: number, otherLength: number | undefined) => {
            expect(() => {
              subarray(originalArray, {
                minLength: originalArray.length + offset + 1,
                maxLength: otherLength !== undefined ? otherLength % (originalArray.length + 1) : undefined,
              });
            }).toThrowError(/minimal length to be between 0/);
          }
        )
      ));
    it('Should raise an error whenever maxLength is below zero', () =>
      fc.assert(
        fc.property(
          fc.array(fc.integer()),
          fc.nat(),
          fc.option(fc.nat(), { nil: undefined }),
          (originalArray: number[], length: number, otherLength: number | undefined) => {
            expect(() => {
              subarray(originalArray, {
                minLength: otherLength !== undefined ? otherLength % (originalArray.length + 1) : undefined,
                maxLength: -length - 1,
              });
            }).toThrowError(/maximal length to be between 0/);
          }
        )
      ));
    it('Should raise an error whenever maxLength is greater than array size', () =>
      fc.assert(
        fc.property(
          fc.array(fc.integer()),
          fc.nat(),
          fc.option(fc.nat(), { nil: undefined }),
          (originalArray: number[], offset: number, otherLength: number | undefined) => {
            expect(() => {
              subarray(originalArray, {
                minLength: otherLength !== undefined ? otherLength % (originalArray.length + 1) : undefined,
                maxLength: originalArray.length + offset + 1,
              });
            }).toThrowError(/maximal length to be between 0/);
          }
        )
      ));
    it('Should raise an error whenever minLength is greater than maxLength', () =>
      fc.assert(
        fc.property(
          genericHelper.minMax(fc.nat(100)).filter((v) => v.min !== v.max),
          fc.nat(100),
          (minMax: { min: number; max: number }, offset: number) => {
            expect(() => {
              subarray(
                [...Array(minMax.max + offset)].map((_) => 0),
                {
                  minLength: minMax.max,
                  maxLength: minMax.min,
                }
              );
            }).toThrowError(/minimal length to be inferior or equal to the maximal length/);
          }
        )
      ));
    describe('Given no length constraints', () => {
      genericHelper.isValidArbitrary((constraints: { src: number[] }) => subarray(constraints.src), {
        seedGenerator: fc.record({ src: fc.array(fc.integer()) }),
        isStrictlySmallerValue,
        isValidValue: (g: number[], constraints: { src: number[] }) =>
          Array.isArray(g) && isOrderedSubarray(constraints.src, g),
      });
    });
    describe('Given minimal and maximal lengths', () => {
      genericHelper.isValidArbitrary(
        (constraints: SubarrayMinMaxConstraits) => {
          const dims = computeMinMaxFor(constraints);
          return subarray(constraints.src, {
            minLength: dims.min,
            maxLength: dims.max,
          });
        },
        {
          seedGenerator: fc.record({ src: fc.array(fc.integer()), a: fc.nat(), b: fc.nat() }),
          isStrictlySmallerValue,
          isValidValue: (g: number[], constraints: SubarrayMinMaxConstraits) => {
            const dims = computeMinMaxFor(constraints);
            return (
              Array.isArray(g) && g.length >= dims.min && g.length <= dims.max && isOrderedSubarray(constraints.src, g)
            );
          },
        }
      );
    });
    describe('Still support non recommended signatures', () => {
      it('Should support fc.subarray(originalArray, minLength, maxLength)', () => {
        fc.assert(
          fc.property(
            fc.integer(),
            fc.array(fc.nat(), { minLength: 1 }),
            fc.nat(),
            fc.nat(),
            (seed, originalArray, aLength, bLength) => {
              const aLengthMod = aLength % originalArray.length;
              const bLengthMod = bLength % originalArray.length;
              const minLength = Math.min(aLengthMod, bLengthMod);
              const maxLength = Math.max(aLengthMod, bLengthMod);
              const refArbitrary = subarray(originalArray, { minLength, maxLength });
              const nonRecommendedArbitrary = subarray(originalArray, minLength, maxLength);
              expect(generateOneValue(seed, nonRecommendedArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
            }
          )
        );
      });
    });
  });
  describe('shuffledSubarray', () => {
    describe('Given no length constraints', () => {
      genericHelper.isValidArbitrary((constraints: { src: number[] }) => shuffledSubarray(constraints.src), {
        seedGenerator: fc.record({ src: fc.array(fc.integer()) }),
        isStrictlySmallerValue,
        isValidValue: (g: number[], constraints: { src: number[] }) =>
          Array.isArray(g) && isSubarray(constraints.src, g),
      });
    });
    describe('Given minimal and maximal lengths', () => {
      genericHelper.isValidArbitrary(
        (constraints: SubarrayMinMaxConstraits) => {
          const dims = computeMinMaxFor(constraints);
          return shuffledSubarray(constraints.src, {
            minLength: dims.min,
            maxLength: dims.max,
          });
        },
        {
          seedGenerator: fc.record({ src: fc.array(fc.integer()), a: fc.nat(), b: fc.nat() }),
          isStrictlySmallerValue,
          isValidValue: (g: number[], constraints: SubarrayMinMaxConstraits) => {
            const dims = computeMinMaxFor(constraints);
            return Array.isArray(g) && g.length >= dims.min && g.length <= dims.max && isSubarray(constraints.src, g);
          },
        }
      );
    });

    describe('Still support non recommended signatures', () => {
      it('Should support fc.shuffledSubarray(originalArray, minLength, maxLength)', () => {
        fc.assert(
          fc.property(
            fc.integer(),
            fc.array(fc.nat(), { minLength: 1 }),
            fc.nat(),
            fc.nat(),
            (seed, originalArray, aLength, bLength) => {
              const aLengthMod = aLength % originalArray.length;
              const bLengthMod = bLength % originalArray.length;
              const minLength = Math.min(aLengthMod, bLengthMod);
              const maxLength = Math.max(aLengthMod, bLengthMod);
              const refArbitrary = shuffledSubarray(originalArray, { minLength, maxLength });
              const nonRecommendedArbitrary = shuffledSubarray(originalArray, minLength, maxLength);
              expect(generateOneValue(seed, nonRecommendedArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
            }
          )
        );
      });
    });
  });
});
