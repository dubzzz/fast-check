import * as prand from 'pure-rand';
import fc, { Parameters } from '../../../../../../lib/fast-check';

import { Arbitrary } from '../../../../../../src/check/arbitrary/definition/Arbitrary';
import { Shrinkable } from '../../../../../../src/check/arbitrary/definition/Shrinkable';
import { Random } from '../../../../../../src/random/generator/Random';

export type TestSettings<U> = Parameters<[[number, number, number], U]>;

const seedArbitrary = fc.integer().noShrink();
const biasArbitrary = fc.option(fc.integer(2, 10).noShrink());

function* zipStreams<T>(allStreams: IterableIterator<Shrinkable<T>>[]): IterableIterator<Shrinkable<T>[]> {
  let cursors = allStreams.map(i => i.next());
  while (cursors.some(c => !c.done)) {
    yield cursors.map(c => c.value);
    cursors = allStreams.map(i => i.next());
  }
}

export function traverseShrinkN<T, U>(
  seedProducer: fc.Arbitrary<U>,
  arbitraryBuilders: ((u: U) => Arbitrary<T>)[],
  resetAssertFunction: () => void,
  assertFunction: (args: T[], u: U) => void,
  testSettings?: TestSettings<U>
): void {
  fc.assert(
    fc.property(
      fc.tuple(seedArbitrary, seedArbitrary, biasArbitrary),
      seedProducer,
      ([seed, shrinkPathSeed, bias], arbitrarySettings) => {
        resetAssertFunction();

        // Generate base shrinkables
        let arbs = arbitraryBuilders.map(b => b(arbitrarySettings));
        if (bias !== null) {
          arbs = arbs.map(a => a.withBias(bias));
        }
        const shrinkables: (Shrinkable<T> | null)[] = arbs.map(a =>
          a.generate(new Random(prand.xorshift128plus(seed)))
        );
        expect(shrinkables.every(s => s !== null)).toBe(true);

        const shrinkPathRandom = new Random(prand.xorshift128plus(shrinkPathSeed));
        while (shrinkables.some(s => s !== null)) {
          // Assert
          assertFunction(shrinkables.map(s => s!.value), arbitrarySettings);

          // Shrink all shrinkables together
          const g = zipStreams(shrinkables.map(s => s!.shrink()));
          let c = g.next();
          let lastCursorValue = c.done ? undefined : c.value;
          while (!c.done && shrinkPathRandom.nextDouble() < 0.9) {
            c = g.next();
            if (!c.done) lastCursorValue = c.value;
          }
          for (let i = 0; i !== shrinkables.length; ++i)
            shrinkables[i] = lastCursorValue !== undefined ? lastCursorValue[i] : null;
        }
      }
    ),
    testSettings
  );
}
