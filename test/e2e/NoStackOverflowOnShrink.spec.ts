import * as fc from '../../src/fast-check';
import { Shrinkable } from '../../src/fast-check';

const seed = Date.now();
describe(`NoStackOverflowOnShrink (seed: ${seed})`, () => {
  it('should not run into stack overflow during very deep shrink tasks', () => {
    const computeMaximalDepth = () => {
      // Compute the maximal call stack size
      let depth = 0;
      const f = () => {
        ++depth;
        f();
      };
      try {
        f();
      } catch (_err) {
        // throws 'RangeError: Maximum call stack size exceeded'
      }
      return depth;
    };
    const stopAtShrinkDepth = computeMaximalDepth() + 10000; // More than maximal call stack size
    class InfiniteShrinkingDepth extends fc.Arbitrary<number> {
      private static buildInfiniteShrinkable(n: number): fc.Shrinkable<number> {
        function* g() {
          yield n - 1;
        }
        if (n <= -stopAtShrinkDepth) {
          return new Shrinkable(n);
        }
        return new Shrinkable(n, () => fc.stream(g()).map(InfiniteShrinkingDepth.buildInfiniteShrinkable));
      }
      generate(_mrng: fc.Random): fc.Shrinkable<number> {
        return InfiniteShrinkingDepth.buildInfiniteShrinkable(0);
      }
    }

    const out = fc.check(fc.property(new InfiniteShrinkingDepth(), _n => false), { seed });
    expect(out.failed).toBe(true);
    expect(out.counterexamplePath).toBe([...Array(stopAtShrinkDepth + 1)].map(() => '0').join(':'));
  });
});
