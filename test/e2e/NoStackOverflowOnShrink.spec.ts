import * as fc from '../../src/fast-check';
import * as prand from 'pure-rand';
import { Shrinkable } from '../../src/fast-check';

const computeMaximalStackSize = () => {
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

const callStackSize = computeMaximalStackSize();
const callStackSizeWithMargin = 2 * callStackSize;
const stopAtShrinkDepth = 40000;
const seed = Date.now();
describe(`NoStackOverflowOnShrink (seed: ${seed})`, () => {
  it('should not run into stack overflow during very deep shrink tasks', () => {
    // We expect the depth used by this test to be greater than
    // the maximal depth we computed before reaching a stack overflow
    expect(stopAtShrinkDepth).toBeGreaterThan(callStackSizeWithMargin);

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

  it('should not run into stack overflow while calling shrink on very large arrays', () => {
    // We expect the depth used by this test to be greater than
    // the maximal depth we computed before reaching a stack overflow
    expect(stopAtShrinkDepth).toBeGreaterThan(callStackSizeWithMargin);

    const mrng = new fc.Random(prand.xorshift128plus(seed));
    const arb = fc.array(fc.boolean(), stopAtShrinkDepth);
    let s: Shrinkable<boolean[]> | null = null;
    while (s === null) {
      const tempShrinkable = arb.generate(mrng);
      if (tempShrinkable.value.length >= callStackSize) {
        s = tempShrinkable;
      }
    }
    expect(() => s!.shrink()).not.toThrow();
  });

  it('should not run into stack overflow while calling shrink on very large shuffled sub-arrays', () => {
    // We expect the depth used by this test to be greater than
    // the maximal depth we computed before reaching a stack overflow
    expect(stopAtShrinkDepth).toBeGreaterThan(callStackSizeWithMargin);

    const mrng = new fc.Random(prand.xorshift128plus(seed));
    const arb = fc.shuffledSubarray([...Array(stopAtShrinkDepth)].map((_, i) => i));
    let s: Shrinkable<number[]> | null = null;
    while (s === null) {
      const tempShrinkable = arb.generate(mrng);
      if (tempShrinkable.value.length >= callStackSize) {
        s = tempShrinkable;
      }
    }
    expect(() => s!.shrink()).not.toThrow();
  });
});
