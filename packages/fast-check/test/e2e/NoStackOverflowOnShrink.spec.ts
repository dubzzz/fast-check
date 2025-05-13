import { describe, it, expect } from 'vitest';
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
  } catch {
    // throws 'RangeError: Maximum call stack size exceeded'
  }
  return depth;
};

const callStackSize = computeMaximalStackSize();
const callStackSizeWithMargin = 2 * callStackSize;

// Configure arbitraries and provide them with a maximal length much greater than the default one
// This value is hardcoded in order to avoid variations from one env to another and ease replays in case of problem
const maxDepthForArrays = 50_000;

// Not all the shrunk values of a given generated value will be asked
// The aim is to check if asking for the first maxShrinksToAsk might trigger unwanted stack overflows
const maxShrinksToAsk = 100;

describe(`NoStackOverflowOnShrink (seed: ${seed})`, () => {
  const iterateOverShrunkValues = <T>(arb: fc.Arbitrary<T>, v: fc.Value<T>) => {
    const it = arb.shrink(v.value_, v.context).take(maxShrinksToAsk)[Symbol.iterator]();
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
      generate(_mrng: fc.Random): fc.Value<number> {
        return new fc.Value(0, undefined);
      }
      canShrinkWithoutContext(value: unknown): value is number {
        return false;
      }
      shrink(value: number): fc.Stream<fc.Value<number>> {
        if (value <= -maxDepthForArrays) {
          return fc.Stream.nil();
        }
        return fc.Stream.of(new fc.Value(value - 1, undefined));
      }
    }

    const out = fc.check(
      fc.property(new InfiniteShrinkingDepth(), (_n) => false),
      { seed },
    );
    expect(out.failed).toBe(true);
    expect(out.counterexamplePath).toBe([...Array(maxDepthForArrays + 1)].map(() => '0').join(':'));
  });

  it('should not run into stack overflow while calling shrink on very large arrays', () => {
    // We expect the depth used by this test to be greater than
    // the maximal depth we computed before reaching a stack overflow
    expect(maxDepthForArrays).toBeGreaterThan(callStackSizeWithMargin);

    const mrng = new fc.Random(prand.xorshift128plus(seed));
    const arb = fc.array(fc.boolean(), { maxLength: maxDepthForArrays, size: 'max' });
    let value: fc.Value<boolean[]> | null = null;
    while (value === null) {
      const tempShrinkable = arb.generate(mrng, undefined);
      if (tempShrinkable.value.length >= callStackSize) {
        value = tempShrinkable;
      }
    }
    expect(() => iterateOverShrunkValues(arb, value!)).not.toThrow();
  });

  it('should not run into stack overflow while calling shrink on very large arrays used as tuples', () => {
    // We expect the depth used by this test to be greater than
    // the maximal depth we computed before reaching a stack overflow
    expect(maxDepthForArrays).toBeGreaterThan(callStackSizeWithMargin);

    const mrng = new fc.Random(prand.xorshift128plus(seed));
    const arb = fc.array(fc.boolean(), { minLength: maxDepthForArrays, maxLength: maxDepthForArrays });
    const value: fc.Value<boolean[]> = arb.generate(mrng, undefined);
    expect(() => iterateOverShrunkValues(arb, value)).not.toThrow();
  });

  it('should not run into stack overflow while calling shrink on very large tuple', () => {
    // We expect the depth used by this test to be greater than
    // the maximal depth we computed before reaching a stack overflow
    expect(maxDepthForArrays).toBeGreaterThan(callStackSizeWithMargin);

    const mrng = new fc.Random(prand.xorshift128plus(seed));
    const arb = fc.tuple<boolean[]>(...[...Array(maxDepthForArrays)].fill(fc.boolean()));
    const value: fc.Value<boolean[]> = arb.generate(mrng, undefined);
    expect(() => iterateOverShrunkValues(arb, value)).not.toThrow();
  });

  it('should not run into stack overflow while calling shrink on very large shuffled sub-arrays', () => {
    // We expect the depth used by this test to be greater than
    // the maximal depth we computed before reaching a stack overflow
    expect(maxDepthForArrays).toBeGreaterThan(callStackSizeWithMargin);

    const mrng = new fc.Random(prand.xorshift128plus(seed));
    const arb = fc.shuffledSubarray([...Array(maxDepthForArrays)].map((_, i) => i));
    let value: fc.Value<number[]> | null = null;
    while (value === null) {
      const tempShrinkable = arb.generate(mrng, undefined);
      if (tempShrinkable.value.length >= callStackSize) {
        value = tempShrinkable;
      }
    }
    expect(() => iterateOverShrunkValues(arb, value!)).not.toThrow();
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
    const arb = fc.commands([fc.boolean().map((b) => new AnyCommand(b))], {
      maxCommands: maxDepthForArrays,
      size: 'max',
    });
    let value: fc.Value<Iterable<fc.Command<Record<string, unknown>, unknown>>> | null = null;
    while (value === null) {
      const tempShrinkable = arb.generate(mrng, undefined);
      const cmds = [...tempShrinkable.value];
      if (cmds.length >= callStackSize) {
        fc.modelRun(() => ({ model: {}, real: {} }), cmds);
        value = tempShrinkable;
      }
    }
    expect(() => iterateOverShrunkValues(arb, value!)).not.toThrow();
  });
});
