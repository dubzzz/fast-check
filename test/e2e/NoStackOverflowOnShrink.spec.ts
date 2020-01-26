import * as fc from '../../src/fast-check';
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

class ShrinkLimitedArbitrary<T> extends fc.Arbitrary<T> {
  constructor(private readonly arb: fc.Arbitrary<T>, private readonly maxDepth: number) {
    super();
  }
  private static wrapShrinkable<T>(s: fc.Shrinkable<T>, remainingDepth: number): fc.Shrinkable<T> {
    if (remainingDepth <= 0) {
      return new fc.Shrinkable(s.value_);
    }
    return new fc.Shrinkable(s.value_, () => {
      return s
        .shrink()
        .take(100)
        .map(i => ShrinkLimitedArbitrary.wrapShrinkable(i, remainingDepth - 1));
    });
  }
  generate(mrng: fc.Random): fc.Shrinkable<T> {
    return ShrinkLimitedArbitrary.wrapShrinkable(this.arb.generate(mrng), this.maxDepth);
  }
}

const shrinkLimiter = <T>(arb: fc.Arbitrary<T>): fc.Arbitrary<T> => {
  return new ShrinkLimitedArbitrary(arb, 10);
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

  it('should not run into stack overflow while shrinking very large arrays', () => {
    // We expect the depth used by this test to be greater than
    // the maximal depth we computed before reaching a stack overflow
    expect(stopAtShrinkDepth).toBeGreaterThan(callStackSizeWithMargin);

    const out = fc.check(
      fc.property(shrinkLimiter(fc.array(fc.boolean(), stopAtShrinkDepth)), data => {
        return data.length < callStackSize;
      }),
      { seed }
    );
    expect(out.failed).toBe(true);
  });

  it('should not run into stack overflow while shrinking very large shuffled sub-arrays', () => {
    // We expect the depth used by this test to be greater than
    // the maximal depth we computed before reaching a stack overflow
    expect(stopAtShrinkDepth).toBeGreaterThan(callStackSizeWithMargin);

    const out = fc.check(
      fc.property(shrinkLimiter(fc.shuffledSubarray([...Array(stopAtShrinkDepth)].map((_, i) => i))), data => {
        return data.length < callStackSize;
      }),
      { seed }
    );
    expect(out.failed).toBe(true);
  });

  it('should not run into stack overflow while shrinking very large arrays of commands', () => {
    // We expect the depth used by this test to be greater than
    // the maximal depth we computed before reaching a stack overflow
    expect(stopAtShrinkDepth).toBeGreaterThan(callStackSizeWithMargin);

    class DummyCommand implements fc.Command<{}, {}> {
      check = () => true;
      run = () => {};
    }

    const out = fc.check(
      fc.property(
        shrinkLimiter(fc.commands([fc.constant(new DummyCommand())], { maxCommands: stopAtShrinkDepth })),
        cmds => {
          fc.modelRun(() => ({ model: {}, real: {} }), cmds);
          return [...cmds].length === 0;
        }
      ),
      { seed }
    );
    expect(out.failed).toBe(true);
  });
});
