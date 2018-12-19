import * as prand from 'pure-rand';
import * as fc from '../../../../../lib/fast-check';

import { Arbitrary } from '../../../../../src/check/arbitrary/definition/Arbitrary';
import { Shrinkable } from '../../../../../src/check/arbitrary/definition/Shrinkable';
import { Random } from '../../../../../src/random/generator/Random';

const testSameSeedSameValues = function<U, T>(
  argsForArbGenerator: fc.Arbitrary<U>,
  arbGenerator: (u: U) => Arbitrary<T>,
  assertEquality: (v1: T, v2: T) => void
) {
  it(`Should produce the same value given the same seed`, () =>
    fc.assert(
      fc.property(argsForArbGenerator, fc.integer().noShrink(), (params, seed) => {
        const arb = arbGenerator(params);
        const v1 = arb.generate(new Random(prand.xorshift128plus(seed))).value;
        const v2 = arb.generate(new Random(prand.xorshift128plus(seed))).value;
        assertEquality(v1, v2);
      })
    ));
};

const testSameSeedSameShrinks = function<U, T>(
  argsForArbGenerator: fc.Arbitrary<U>,
  arbGenerator: (u: U) => Arbitrary<T>,
  assertEquality: (v1: T, v2: T) => void
) {
  it(`Should produce the same shrunk values given the same seed`, () =>
    fc.assert(
      fc.property(
        argsForArbGenerator,
        fc.integer().noShrink(),
        fc.set(fc.nat(100), 1, 10),
        (params, seed, shrinkPath) => {
          const arb = arbGenerator(params);
          let s1: Shrinkable<T> | null = arb.generate(new Random(prand.xorshift128plus(seed)));
          let s2: Shrinkable<T> | null = arb.generate(new Random(prand.xorshift128plus(seed)));
          let id = 0;
          while (s1 !== null && s2 !== null) {
            assertEquality(s1.value, s2.value);
            s1 = s1.shrink().getNthOrLast(id);
            s2 = s2.shrink().getNthOrLast(id);
            id = (id + 1) % shrinkPath.length;
          }
          expect(s1).toBe(null);
          expect(s2).toBe(null);
        }
      )
    ));
};

const testShrinkPathStrictlyDecreasing = function<U, T>(
  argsForArbGenerator: fc.Arbitrary<U>,
  arbGenerator: (u: U) => Arbitrary<T>,
  isStrictlySmallerValue: (g1: T, g2: T) => boolean
) {
  it(`Should produce strictly smaller values along the shrink path`, () =>
    fc.assert(
      fc.property(
        argsForArbGenerator,
        fc.integer().noShrink(),
        fc.set(fc.nat(100), 1, 10),
        (params, seed, shrinkPath) => {
          const arb = arbGenerator(params);
          let shrinkable: Shrinkable<T> | null = arb.generate(new Random(prand.xorshift128plus(seed)));
          let prevValue = shrinkable!.value;
          let id = 0;
          while (shrinkable !== null) {
            shrinkable = shrinkable.shrink().getNthOrLast(id);
            if (shrinkable !== null) {
              expect(isStrictlySmallerValue(shrinkable.value, prevValue)).toBe(true);
              prevValue = shrinkable.value;
            }
            id = (id + 1) % shrinkPath.length;
          }
        }
      )
    ));
};

const testAlwaysGenerateCorrectValues = function<U, T>(
  argsForArbGenerator: fc.Arbitrary<U>,
  arbGenerator: (u: U) => Arbitrary<T>,
  isValidValue: (g: T, seed: U) => boolean
) {
  it(`Should always generate correct values`, () =>
    fc.assert(
      fc.property(argsForArbGenerator, fc.integer().noShrink(), (params, seed) => {
        const arb = arbGenerator(params);
        const shrinkable = arb.generate(new Random(prand.xorshift128plus(seed)));
        expect(isValidValue(shrinkable.value, params)).toBe(true);
      })
    ));
};

const testAlwaysShrinkToCorrectValues = function<U, T>(
  argsForArbGenerator: fc.Arbitrary<U>,
  arbGenerator: (u: U) => Arbitrary<T>,
  isValidValue: (g: T, seed: U) => boolean
) {
  it(`Should always shrink to correct values`, () =>
    fc.assert(
      fc.property(
        argsForArbGenerator,
        fc.integer().noShrink(),
        fc.set(fc.nat(100), 1, 10),
        (params, seed, shrinkPath) => {
          const arb = arbGenerator(params);
          let shrinkable: Shrinkable<T> | null = arb.generate(new Random(prand.xorshift128plus(seed)));
          let id = 0;
          while (shrinkable !== null) {
            expect(isValidValue(shrinkable.value, params)).toBe(true);
            shrinkable = shrinkable.shrink().getNthOrLast(id);
            id = (id + 1) % shrinkPath.length;
          }
        }
      )
    ));
};

export const isValidArbitrary = function<U, T>(
  arbitraryBuilder: (u: U) => Arbitrary<T>,
  settings: {
    seedGenerator?: fc.Arbitrary<U>;
    isEqual?: (g1: T, g2: T) => boolean;
    isStrictlySmallerValue?: (g1: T, g2: T) => boolean;
    isValidValue: (g: T, seed: U) => boolean;
  }
) {
  const seedGenerator = settings.seedGenerator || fc.constant(undefined);

  const biasedSeedGenerator = fc.tuple(fc.option(fc.integer(2, 100), 2), seedGenerator);
  const biasedArbitraryBuilder = ([biasedFactor, u]: [(number | null), U]) => {
    return biasedFactor != null ? arbitraryBuilder(u).withBias(biasedFactor) : arbitraryBuilder(u);
  };
  const biasedIsValidValue = (g: T, [biasedFactor, u]: [(number | null), U]) => {
    return settings.isValidValue(g, u);
  };

  const assertEquality = (v1: T, v2: T) => {
    if (settings.isEqual) expect(settings.isEqual(v1, v2)).toBe(true);
    else expect(v1).toStrictEqual(v2);
  };
  testSameSeedSameValues(biasedSeedGenerator, biasedArbitraryBuilder, assertEquality);
  testSameSeedSameShrinks(biasedSeedGenerator, biasedArbitraryBuilder, assertEquality);
  if (settings.isStrictlySmallerValue != null) {
    testShrinkPathStrictlyDecreasing(biasedSeedGenerator, biasedArbitraryBuilder, settings.isStrictlySmallerValue);
  }
  testAlwaysGenerateCorrectValues(biasedSeedGenerator, biasedArbitraryBuilder, biasedIsValidValue);
  testAlwaysShrinkToCorrectValues(biasedSeedGenerator, biasedArbitraryBuilder, biasedIsValidValue);
};

export const minMax = <NType extends number | bigint>(arb: fc.Arbitrary<NType>) =>
  fc.tuple(arb, arb).map(v => ({ min: v[0] < v[1] ? v[0] : v[1], max: v[0] < v[1] ? v[1] : v[0] }));
