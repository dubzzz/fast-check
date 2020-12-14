import * as fc from '../../../../../lib/fast-check';

import { ArrayInt64 } from '../../../../../src/check/arbitrary/helpers/ArrayInt64';
import { arrayInt64 } from '../../../../../src/check/arbitrary/helpers/ArrayInt64Arbitrary';

import { mocked } from 'ts-jest/utils';
import { Random } from '../../../../../src/random/generator/Random';

import * as BiasedArbitraryWrapperMock from '../../../../../src/check/arbitrary/definition/BiasedArbitraryWrapper';
import * as BiasNumericMock from '../../../../../src/check/arbitrary/helpers/BiasNumeric';
jest.mock('../../../../../src/check/arbitrary/definition/BiasedArbitraryWrapper');
jest.mock('../../../../../src/check/arbitrary/helpers/BiasNumeric');

function toArrayInt64(b: bigint): ArrayInt64 {
  const posB = b < BigInt(0) ? -b : b;
  return {
    sign: b < BigInt(0) ? -1 : 1,
    data: [Number(posB >> BigInt(32)), Number(posB & ((BigInt(1) << BigInt(32)) - BigInt(1)))],
  };
}

function toBigInt(a: ArrayInt64): bigint {
  return BigInt(a.sign) * ((BigInt(a.data[0]) << BigInt(32)) + BigInt(a.data[1]));
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});
const previousGlobal = fc.readConfigureGlobal();
fc.configureGlobal({
  ...previousGlobal,
  beforeEach: () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  },
});

describe('ArrayInt64', () => {
  if (typeof BigInt === 'undefined') {
    it('no test', () => {
      expect(true).toBe(true);
    });
    return;
  }

  const MaxArrayIntValue = (BigInt(1) << BigInt(64)) - BigInt(1);

  const constraintsArb = () =>
    fc
      .tuple(
        fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
        fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue })
      )
      .map((vs) => ({
        min: vs[0] <= vs[1] ? vs[0] : vs[1],
        max: vs[0] <= vs[1] ? vs[1] : vs[0],
      }));

  describe('arrayInt64', () => {
    describe('withBias', () => {
      it('Should preserve biased instance across calls', () =>
        fc.assert(
          fc.property(constraintsArb(), fc.integer({ min: 2 }), fc.integer({ min: 2 }), (ct, freq1, freq2) => {
            // Arrange
            const { biasWrapper } = mocked(BiasedArbitraryWrapperMock);
            const rawArbitrary = arrayInt64(toArrayInt64(ct.min), toArrayInt64(ct.max));

            // Act
            rawArbitrary.withBias(freq1);
            rawArbitrary.withBias(freq2);

            // Assert
            expect(biasWrapper).toHaveBeenCalledTimes(2); // called each time for the moment
            expect(biasWrapper).toHaveBeenCalledWith(freq1, rawArbitrary, expect.any(Function));
            expect(biasWrapper).toHaveBeenCalledWith(freq2, rawArbitrary, expect.any(Function));
            const [[, , biasedBuilder1], [, , biasedBuilder2]] = biasWrapper.mock.calls;
            expect(biasedBuilder2(rawArbitrary)).toBe(biasedBuilder1(rawArbitrary));
          })
        ));

      it('Should build biased instances compatible with initial constraints', () =>
        fc.assert(
          fc.property(constraintsArb(), fc.integer({ min: 2 }), (ct, freq) => {
            // Arrange
            fc.pre(ct.min !== ct.max); // Otherwise we have a special case (biased version is itself)
            const { biasWrapper } = mocked(BiasedArbitraryWrapperMock);
            const { BiasedNumericArbitrary } = mocked(BiasNumericMock);
            const rawArbitrary = arrayInt64(toArrayInt64(ct.min), toArrayInt64(ct.max));

            // Act
            rawArbitrary.withBias(freq);
            const [, , biasedBuilder] = biasWrapper.mock.calls[0];
            expect(BiasedNumericArbitrary).not.toHaveBeenCalled();
            biasedBuilder(rawArbitrary); // Triggers calls to BiasedNumericArbitrary

            // Assert
            expect(BiasedNumericArbitrary).toHaveBeenCalledTimes(1);
            const biasedArbs = (BiasedNumericArbitrary as any).mock.calls[0];
            expect(Array.isArray(biasedArbs)).toBe(true);
            expect(biasedArbs).not.toHaveLength(0);
            for (const biasedArb of biasedArbs) {
              expect(biasedArb.constructor).toBe(rawArbitrary.constructor);
              const nextArrayInt = jest.fn().mockImplementation((min) => min);
              biasedArb.generate(({ nextArrayInt } as any) as Random);
              expect(nextArrayInt).toHaveBeenCalledTimes(1);
              const [min64, max64] = nextArrayInt.mock.calls[0];
              const [min, max] = [toBigInt(min64), toBigInt(max64)];
              expect(min).toBeLessThanOrEqual(max);
              expect(min).toBeGreaterThanOrEqual(ct.min);
              expect(min).toBeLessThanOrEqual(ct.max);
              expect(max).toBeGreaterThanOrEqual(ct.min);
              expect(max).toBeLessThanOrEqual(ct.max);
            }
          })
        ));

      it('Should bias towards itself for single value ranges', () =>
        fc.assert(
          fc.property(
            fc.bigInt({ min: -MaxArrayIntValue, max: MaxArrayIntValue }),
            fc.integer({ min: 2 }),
            (minMax, freq) => {
              // Arrange
              const { biasWrapper } = mocked(BiasedArbitraryWrapperMock);
              const rawArbitrary = arrayInt64(toArrayInt64(minMax), toArrayInt64(minMax));

              // Act
              rawArbitrary.withBias(freq);

              // Assert
              expect(biasWrapper).toHaveBeenCalledTimes(1);
              expect(biasWrapper).toHaveBeenCalledWith(freq, rawArbitrary, expect.any(Function));
              const [, , biasedBuilder] = biasWrapper.mock.calls[0];
              expect(biasedBuilder(rawArbitrary)).toBe(rawArbitrary);
            }
          )
        ));
    });
  });
});
