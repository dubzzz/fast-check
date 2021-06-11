import * as fc from '../../src/fast-check';
import { seed } from './seed';
import * as prand from 'pure-rand';

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

// Configure arbitraries and provide them with a maximal length much greater than the default one
// This value is hardcoded in order to avoid variations from one env to another and ease replays in case of problem
const maxDepthForArrays = 40000;

// Not all the shrunk values of a given generated value will be asked
// The aim is to check if asking for the first maxShrinksToAsk might trigger unwanted stack overflows
const maxShrinksToAsk = 100;

describe(`NoStackOverflowOnShrink (seed: ${seed})`, () => {
  const iterateOverShrunkValues = <T>(s: fc.Shrinkable<T>) => {
    const it = s.shrink().take(maxShrinksToAsk)[Symbol.iterator]();
    let cur = it.next();
    while (!cur.done) {
      cur = it.next();
    }
  };

  it('should not run into stack overflow during very deep shrink tasks', () => {
    // We expect the depth used by this test to be greater than
    // the maximal depth we computed before reaching a stack overflow
    expect(maxDepthForArrays).toBeGreaterThan(callStackSizeWithMargin);

    class InfiniteShrinkingDepth extends fc.Arbitrary<number> {
      private static buildInfiniteShrinkable(n: number): fc.Shrinkable<number> {
        function* g() {
          yield n - 1;
        }
        if (n <= -maxDepthForArrays) {
          return new fc.Shrinkable(n);
        }
        return new fc.Shrinkable(n, () => fc.stream(g()).map(InfiniteShrinkingDepth.buildInfiniteShrinkable));
      }
      generate(_mrng: fc.Random): fc.Shrinkable<number> {
        return InfiniteShrinkingDepth.buildInfiniteShrinkable(0);
      }
    }

    const out = fc.check(
      fc.property(new InfiniteShrinkingDepth(), (_n) => false),
      { seed }
    );
    expect(out.failed).toBe(true);
    expect(out.counterexamplePath).toBe([...Array(maxDepthForArrays + 1)].map(() => '0').join(':'));
  });

  it('should not run into stack overflow while calling shrink on very large arrays', () => {
    // We expect the depth used by this test to be greater than
    // the maximal depth we computed before reaching a stack overflow
    expect(maxDepthForArrays).toBeGreaterThan(callStackSizeWithMargin);

    const mrng = new fc.Random(prand.xorshift128plus(seed));
    const arb = fc.array(fc.boolean(), { maxLength: maxDepthForArrays });
    let s: fc.Shrinkable<boolean[]> | null = null;
    while (s === null) {
      const tempShrinkable = arb.generate(mrng);
      if (tempShrinkable.value.length >= callStackSize) {
        s = tempShrinkable;
      }
    }
    expect(() => iterateOverShrunkValues(s!)).not.toThrow();
  });

  it('should not run into stack overflow while calling shrink on very large shuffled sub-arrays', () => {
    // We expect the depth used by this test to be greater than
    // the maximal depth we computed before reaching a stack overflow
    expect(maxDepthForArrays).toBeGreaterThan(callStackSizeWithMargin);

    const mrng = new fc.Random(prand.xorshift128plus(seed));
    const arb = fc.shuffledSubarray([...Array(maxDepthForArrays)].map((_, i) => i));
    let s: fc.Shrinkable<number[]> | null = null;
    while (s === null) {
      const tempShrinkable = arb.generate(mrng);
      if (tempShrinkable.value.length >= callStackSize) {
        s = tempShrinkable;
      }
    }
    expect(() => iterateOverShrunkValues(s!)).not.toThrow();
  });

  it('should not run into stack overflow while calling shrink on very large arrays of commands', () => {
    // We expect the depth used by this test to be greater than
    // the maximal depth we computed before reaching a stack overflow
    expect(maxDepthForArrays).toBeGreaterThan(callStackSizeWithMargin);

    class AnyCommand implements fc.Command<Record<string, unknown>, unknown> {
      constructor(readonly b: boolean) {}
      check = () => true;
      run = () => {};
    }

    const mrng = new fc.Random(prand.xorshift128plus(seed));
    const arb = fc.commands([fc.boolean().map((b) => new AnyCommand(b))], { maxCommands: maxDepthForArrays });
    let s: fc.Shrinkable<Iterable<fc.Command<Record<string, unknown>, unknown>>> | null = null;
    while (s === null) {
      const tempShrinkable = arb.generate(mrng);
      const cmds = [...tempShrinkable.value];
      if (cmds.length >= callStackSize) {
        fc.modelRun(() => ({ model: {}, real: {} }), cmds);
        s = tempShrinkable;
      }
    }
    expect(() => iterateOverShrunkValues(s!)).not.toThrow();
  });
});
