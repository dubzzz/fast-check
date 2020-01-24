import * as fc from '../../src/fast-check';
import { Shrinkable } from '../../src/fast-check';
import { SuccessCommand } from './model/StepCommands';

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

const stopAtShrinkDepth = 20000;
const seed = Date.now();
describe(`NoStackOverflowOnShrink (seed: ${seed})`, () => {
  it('should not run into stack overflow during very deep shrink tasks', () => {
    // We expect the depth used by this test to be greater than
    // the maximal depth we computed before reaching a stack overflow
    expect(stopAtShrinkDepth).toBeGreaterThan(computeMaximalDepth());

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
    expect(stopAtShrinkDepth).toBeGreaterThan(computeMaximalDepth());

    const out = fc.check(
      fc.property(fc.array(fc.boolean(), stopAtShrinkDepth), data => {
        return data.length === 0;
      }),
      { seed }
    );
    expect(out.failed).toBe(true);
  });

  it('should not run into stack overflow while shrinking very large shuffled sub-arrays', () => {
    // We expect the depth used by this test to be greater than
    // the maximal depth we computed before reaching a stack overflow
    expect(stopAtShrinkDepth).toBeGreaterThan(computeMaximalDepth());

    const out = fc.check(
      fc.property(fc.shuffledSubarray([...Array(stopAtShrinkDepth)].map((_, i) => i)), data => {
        return data.length === 0;
      }),
      { seed }
    );
    expect(out.failed).toBe(true);
  });

  it('should not run into stack overflow while shrinking very large arrays of commands', () => {
    // We expect the depth used by this test to be greater than
    // the maximal depth we computed before reaching a stack overflow
    expect(stopAtShrinkDepth).toBeGreaterThan(computeMaximalDepth());

    const out = fc.check(
      fc.property(fc.commands([fc.constant(new SuccessCommand())], { maxCommands: stopAtShrinkDepth }), cmds => {
        return [...cmds].length === 0;
      }),
      { seed }
    );
    expect(out.failed).toBe(true);
  });
});
