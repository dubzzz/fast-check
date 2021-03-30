import * as fc from '../../../../../lib/fast-check';

import { ArrayInt64 } from '../../../../../src/check/arbitrary/helpers/ArrayInt64';
import { arrayInt64 } from '../../../../../src/check/arbitrary/helpers/ArrayInt64Arbitrary';

import { mocked } from 'ts-jest/utils';
import { Random } from '../../../../../src/random/generator/Random';
import { buildShrinkTree, renderTree } from '../generic/ShrinkTree';
import { convertToNext } from '../../../../../src/check/arbitrary/definition/Converters';
import { NextArbitrary, NextValue, Stream } from '../../../../../src/fast-check-default';

import * as BiasedNextArbitraryWrapperMock from '../../../../../src/check/arbitrary/definition/BiasedNextArbitraryWrapper';
import * as BiasNumericMock from '../../../../../src/check/arbitrary/helpers/BiasNumeric';
jest.mock('../../../../../src/check/arbitrary/definition/BiasedNextArbitraryWrapper');
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
            const { nextBiasWrapper } = mocked(BiasedNextArbitraryWrapperMock);
            nextBiasWrapper.mockImplementation(() => {
              return new (class extends NextArbitrary<any> {
                generate(_mrng: Random): NextValue<any> {
                  throw new Error('Method not implemented.');
                }
                canGenerate(value: unknown): value is any {
                  throw new Error('Method not implemented.');
                }
                shrink(_value: any, _context?: unknown): Stream<NextValue<any>> {
                  throw new Error('Method not implemented.');
                }
              })();
            });
            const rawArbitrary = arrayInt64(toArrayInt64(ct.min), toArrayInt64(ct.max));
            const rawNextArbitrary = convertToNext(rawArbitrary);

            // Act
            rawArbitrary.withBias(freq1);
            rawArbitrary.withBias(freq2);

            // Assert
            expect(nextBiasWrapper).toHaveBeenCalledTimes(2); // called each time for the moment
            expect(nextBiasWrapper).toHaveBeenCalledWith(freq1, rawNextArbitrary, expect.any(Function));
            expect(nextBiasWrapper).toHaveBeenCalledWith(freq2, rawNextArbitrary, expect.any(Function));
            const [[, , biasedBuilder1], [, , biasedBuilder2]] = nextBiasWrapper.mock.calls;
            expect(biasedBuilder2(rawNextArbitrary)).toBe(biasedBuilder1(rawNextArbitrary));
          })
        ));

      it('Should build biased instances compatible with initial constraints', () =>
        fc.assert(
          fc.property(constraintsArb(), fc.integer({ min: 2 }), (ct, freq) => {
            // Arrange
            fc.pre(ct.min !== ct.max); // Otherwise we have a special case (biased version is itself)
            const { nextBiasWrapper } = mocked(BiasedNextArbitraryWrapperMock);
            nextBiasWrapper.mockImplementation(() => {
              return new (class extends NextArbitrary<any> {
                generate(_mrng: Random): NextValue<any> {
                  throw new Error('Method not implemented.');
                }
                canGenerate(value: unknown): value is any {
                  throw new Error('Method not implemented.');
                }
                shrink(_value: any, _context?: unknown): Stream<NextValue<any>> {
                  throw new Error('Method not implemented.');
                }
              })();
            });
            const { BiasedNumericArbitrary } = mocked(BiasNumericMock);
            const rawArbitrary = arrayInt64(toArrayInt64(ct.min), toArrayInt64(ct.max));
            const rawNextArbitrary = convertToNext(rawArbitrary);

            // Act
            rawArbitrary.withBias(freq);
            const [, , biasedBuilder] = nextBiasWrapper.mock.calls[0];
            expect(BiasedNumericArbitrary).not.toHaveBeenCalled();
            biasedBuilder(rawNextArbitrary); // Triggers calls to BiasedNumericArbitrary

            // Assert
            expect(BiasedNumericArbitrary).toHaveBeenCalledTimes(1);
            const biasedArbs = (BiasedNumericArbitrary as any).mock.calls[0];
            expect(Array.isArray(biasedArbs)).toBe(true);
            expect(biasedArbs).not.toHaveLength(0);
            for (const biasedArb of biasedArbs) {
              expect(biasedArb.constructor).toBe(rawNextArbitrary.constructor);
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
              const { nextBiasWrapper } = mocked(BiasedNextArbitraryWrapperMock);
              nextBiasWrapper.mockImplementation(() => {
                return new (class extends NextArbitrary<any> {
                  generate(_mrng: Random): NextValue<any> {
                    throw new Error('Method not implemented.');
                  }
                  canGenerate(value: unknown): value is any {
                    throw new Error('Method not implemented.');
                  }
                  shrink(_value: any, _context?: unknown): Stream<NextValue<any>> {
                    throw new Error('Method not implemented.');
                  }
                })();
              });
              const rawArbitrary = arrayInt64(toArrayInt64(minMax), toArrayInt64(minMax));
              const rawNextArbitrary = convertToNext(rawArbitrary);

              // Act
              rawArbitrary.withBias(freq);

              // Assert
              expect(nextBiasWrapper).toHaveBeenCalledTimes(1);
              expect(nextBiasWrapper).toHaveBeenCalledWith(freq, rawNextArbitrary, expect.any(Function));
              const [, , biasedBuilder] = nextBiasWrapper.mock.calls[0];
              expect(biasedBuilder(rawNextArbitrary)).toBe(rawNextArbitrary);
            }
          )
        ));
    });
  });

  describe('contextualShrinkableFor', () => {
    it('Should shrink strictly positive value for positive range including zero', () => {
      // Arrange
      const arb = arrayInt64({ sign: 1, data: [0, 0] }, { sign: 1, data: [0, 10] });

      // Act
      const tree = buildShrinkTree(arb.contextualShrinkableFor({ sign: 1, data: [0, 8] }));
      const renderedTree = renderTree(tree).join('\n');

      // Assert
      //   When there is no more option, the shrinker retry one time with the value
      //   current-1 to check if something that changed outside (another value not itself)
      //   may have changed the situation
      expect(renderedTree).toMatchInlineSnapshot(`
        "{\\"sign\\":1,\\"data\\":[0,8]}
        ├> {\\"sign\\":1,\\"data\\":[0,0]}
        ├> {\\"sign\\":1,\\"data\\":[0,4]}
        |  ├> {\\"sign\\":1,\\"data\\":[0,2]}
        |  |  └> {\\"sign\\":1,\\"data\\":[0,1]}
        |  |     └> {\\"sign\\":1,\\"data\\":[0,0]}
        |  └> {\\"sign\\":1,\\"data\\":[0,3]}
        |     └> {\\"sign\\":1,\\"data\\":[0,2]}
        |        ├> {\\"sign\\":1,\\"data\\":[0,0]}
        |        └> {\\"sign\\":1,\\"data\\":[0,1]}
        |           └> {\\"sign\\":1,\\"data\\":[0,0]}
        ├> {\\"sign\\":1,\\"data\\":[0,6]}
        |  └> {\\"sign\\":1,\\"data\\":[0,5]}
        |     └> {\\"sign\\":1,\\"data\\":[0,4]}
        |        ├> {\\"sign\\":1,\\"data\\":[0,0]}
        |        ├> {\\"sign\\":1,\\"data\\":[0,2]}
        |        |  └> {\\"sign\\":1,\\"data\\":[0,1]}
        |        |     └> {\\"sign\\":1,\\"data\\":[0,0]}
        |        └> {\\"sign\\":1,\\"data\\":[0,3]}
        |           └> {\\"sign\\":1,\\"data\\":[0,2]}
        |              ├> {\\"sign\\":1,\\"data\\":[0,0]}
        |              └> {\\"sign\\":1,\\"data\\":[0,1]}
        |                 └> {\\"sign\\":1,\\"data\\":[0,0]}
        └> {\\"sign\\":1,\\"data\\":[0,7]}
           └> {\\"sign\\":1,\\"data\\":[0,6]}
              ├> {\\"sign\\":1,\\"data\\":[0,0]}
              ├> {\\"sign\\":1,\\"data\\":[0,3]}
              |  └> {\\"sign\\":1,\\"data\\":[0,2]}
              |     └> {\\"sign\\":1,\\"data\\":[0,1]}
              |        └> {\\"sign\\":1,\\"data\\":[0,0]}
              └> {\\"sign\\":1,\\"data\\":[0,5]}
                 └> {\\"sign\\":1,\\"data\\":[0,4]}
                    └> {\\"sign\\":1,\\"data\\":[0,3]}
                       ├> {\\"sign\\":1,\\"data\\":[0,0]}
                       └> {\\"sign\\":1,\\"data\\":[0,2]}
                          └> {\\"sign\\":1,\\"data\\":[0,1]}
                             └> {\\"sign\\":1,\\"data\\":[0,0]}"
      `);
    });
    it('Should shrink strictly positive value for range not including zero', () => {
      // Arrange
      const arb = arrayInt64({ sign: 1, data: [1, 10] }, { sign: 1, data: [1, 20] });

      // Act
      const tree = buildShrinkTree(arb.contextualShrinkableFor({ sign: 1, data: [1, 18] }));
      const renderedTree = renderTree(tree).join('\n');

      // Assert
      //   As the range [[1,10], [1,20]] and the value [1,18]
      //   are just offset by +[1,10] compared to the first case,
      //   the rendered tree will be offset by [1,10] too
      expect(renderedTree).toMatchInlineSnapshot(`
        "{\\"sign\\":1,\\"data\\":[1,18]}
        ├> {\\"sign\\":1,\\"data\\":[1,10]}
        ├> {\\"sign\\":1,\\"data\\":[1,14]}
        |  ├> {\\"sign\\":1,\\"data\\":[1,12]}
        |  |  └> {\\"sign\\":1,\\"data\\":[1,11]}
        |  |     └> {\\"sign\\":1,\\"data\\":[1,10]}
        |  └> {\\"sign\\":1,\\"data\\":[1,13]}
        |     └> {\\"sign\\":1,\\"data\\":[1,12]}
        |        ├> {\\"sign\\":1,\\"data\\":[1,10]}
        |        └> {\\"sign\\":1,\\"data\\":[1,11]}
        |           └> {\\"sign\\":1,\\"data\\":[1,10]}
        ├> {\\"sign\\":1,\\"data\\":[1,16]}
        |  └> {\\"sign\\":1,\\"data\\":[1,15]}
        |     └> {\\"sign\\":1,\\"data\\":[1,14]}
        |        ├> {\\"sign\\":1,\\"data\\":[1,10]}
        |        ├> {\\"sign\\":1,\\"data\\":[1,12]}
        |        |  └> {\\"sign\\":1,\\"data\\":[1,11]}
        |        |     └> {\\"sign\\":1,\\"data\\":[1,10]}
        |        └> {\\"sign\\":1,\\"data\\":[1,13]}
        |           └> {\\"sign\\":1,\\"data\\":[1,12]}
        |              ├> {\\"sign\\":1,\\"data\\":[1,10]}
        |              └> {\\"sign\\":1,\\"data\\":[1,11]}
        |                 └> {\\"sign\\":1,\\"data\\":[1,10]}
        └> {\\"sign\\":1,\\"data\\":[1,17]}
           └> {\\"sign\\":1,\\"data\\":[1,16]}
              ├> {\\"sign\\":1,\\"data\\":[1,10]}
              ├> {\\"sign\\":1,\\"data\\":[1,13]}
              |  └> {\\"sign\\":1,\\"data\\":[1,12]}
              |     └> {\\"sign\\":1,\\"data\\":[1,11]}
              |        └> {\\"sign\\":1,\\"data\\":[1,10]}
              └> {\\"sign\\":1,\\"data\\":[1,15]}
                 └> {\\"sign\\":1,\\"data\\":[1,14]}
                    └> {\\"sign\\":1,\\"data\\":[1,13]}
                       ├> {\\"sign\\":1,\\"data\\":[1,10]}
                       └> {\\"sign\\":1,\\"data\\":[1,12]}
                          └> {\\"sign\\":1,\\"data\\":[1,11]}
                             └> {\\"sign\\":1,\\"data\\":[1,10]}"
      `);
    });
    it('Should shrink strictly negative value for negative range including zero', () => {
      // Arrange
      const arb = arrayInt64({ sign: -1, data: [0, 10] }, { sign: 1, data: [0, 0] });

      // Act
      const tree = buildShrinkTree(arb.contextualShrinkableFor({ sign: -1, data: [0, 8] }));
      const renderedTree = renderTree(tree).join('\n');

      // Assert
      //   As the range [-10, 0] and the value -8
      //   are the opposite of first case, the rendered tree will be the same except
      //   it contains opposite values
      expect(renderedTree).toMatchInlineSnapshot(`
        "{\\"sign\\":-1,\\"data\\":[0,8]}
        ├> {\\"sign\\":1,\\"data\\":[0,0]}
        ├> {\\"sign\\":-1,\\"data\\":[0,4]}
        |  ├> {\\"sign\\":-1,\\"data\\":[0,2]}
        |  |  └> {\\"sign\\":-1,\\"data\\":[0,1]}
        |  |     └> {\\"sign\\":1,\\"data\\":[0,0]}
        |  └> {\\"sign\\":-1,\\"data\\":[0,3]}
        |     └> {\\"sign\\":-1,\\"data\\":[0,2]}
        |        ├> {\\"sign\\":1,\\"data\\":[0,0]}
        |        └> {\\"sign\\":-1,\\"data\\":[0,1]}
        |           └> {\\"sign\\":1,\\"data\\":[0,0]}
        ├> {\\"sign\\":-1,\\"data\\":[0,6]}
        |  └> {\\"sign\\":-1,\\"data\\":[0,5]}
        |     └> {\\"sign\\":-1,\\"data\\":[0,4]}
        |        ├> {\\"sign\\":1,\\"data\\":[0,0]}
        |        ├> {\\"sign\\":-1,\\"data\\":[0,2]}
        |        |  └> {\\"sign\\":-1,\\"data\\":[0,1]}
        |        |     └> {\\"sign\\":1,\\"data\\":[0,0]}
        |        └> {\\"sign\\":-1,\\"data\\":[0,3]}
        |           └> {\\"sign\\":-1,\\"data\\":[0,2]}
        |              ├> {\\"sign\\":1,\\"data\\":[0,0]}
        |              └> {\\"sign\\":-1,\\"data\\":[0,1]}
        |                 └> {\\"sign\\":1,\\"data\\":[0,0]}
        └> {\\"sign\\":-1,\\"data\\":[0,7]}
           └> {\\"sign\\":-1,\\"data\\":[0,6]}
              ├> {\\"sign\\":1,\\"data\\":[0,0]}
              ├> {\\"sign\\":-1,\\"data\\":[0,3]}
              |  └> {\\"sign\\":-1,\\"data\\":[0,2]}
              |     └> {\\"sign\\":-1,\\"data\\":[0,1]}
              |        └> {\\"sign\\":1,\\"data\\":[0,0]}
              └> {\\"sign\\":-1,\\"data\\":[0,5]}
                 └> {\\"sign\\":-1,\\"data\\":[0,4]}
                    └> {\\"sign\\":-1,\\"data\\":[0,3]}
                       ├> {\\"sign\\":1,\\"data\\":[0,0]}
                       └> {\\"sign\\":-1,\\"data\\":[0,2]}
                          └> {\\"sign\\":-1,\\"data\\":[0,1]}
                             └> {\\"sign\\":1,\\"data\\":[0,0]}"
      `);
    });
  });
});
