import * as prand from 'pure-rand';
import fc, { Parameters } from '../../../../../../lib/fast-check';

import { Arbitrary } from '../../../../../../src/check/arbitrary/definition/Arbitrary';
import { Shrinkable } from '../../../../../../src/check/arbitrary/definition/Shrinkable';
import { Random } from '../../../../../../src/random/generator/Random';

export type TestSettings<U> = Parameters<[[number, number[]], U]>;

function traverseShrinkN<T, U>(
  seedProducer: fc.Arbitrary<U>,
  arbitraryBuilders: ((u: U) => Arbitrary<T>)[],
  assertFunction: (args: T[], u: U) => void,
  testSettings?: TestSettings<U>
): void {
  fc.assert(
    fc.property(
      fc.tuple(fc.integer().noShrink(), fc.array(fc.nat(), 1, 10)),
      seedProducer,
      ([seed, shrinkPath], arbitrarySettings) => {
        const arbs = arbitraryBuilders.map(b => b(arbitrarySettings));
        const shrinkables: (Shrinkable<T> | null)[] = arbs.map(a =>
          a.generate(new Random(prand.xorshift128plus(seed)))
        );

        expect(shrinkables.every(s => s !== null)).toBe(true);

        let id = 0;
        while (shrinkables.some(s => s !== null)) {
          // Assert
          assertFunction(shrinkables.map(s => s!.value), arbitrarySettings); // throw if failure

          // Go to the next level of shrink
          const shrinkOffset = shrinkPath[id++];
          for (let i = 0; i !== shrinkables.length; ++i)
            shrinkables[i] = shrinkables[i]!.shrink().getNthOrLast(shrinkOffset);
          id = (id + 1) % shrinkPath.length;
        }
      }
    ),
    testSettings
  );
}

export function traverseShrink1<T, U>(
  seedProducer: fc.Arbitrary<U>,
  arbitraryBuilders: [(u: U) => Arbitrary<T>],
  assertFunction: (args: [T], u: U) => void,
  testSettings?: TestSettings<U>
): void {
  return traverseShrinkN(seedProducer, arbitraryBuilders, assertFunction, testSettings);
}

export function traverseShrink2<T, U>(
  seedProducer: fc.Arbitrary<U>,
  arbitraryBuilders: [(u: U) => Arbitrary<T>, (u: U) => Arbitrary<T>],
  assertFunction: (args: [T, T], u: U) => void,
  testSettings?: TestSettings<U>
): void {
  return traverseShrinkN(seedProducer, arbitraryBuilders, assertFunction, testSettings);
}
