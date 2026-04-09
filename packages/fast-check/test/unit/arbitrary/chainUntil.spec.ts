import { describe, expect, it, vi } from 'vitest';
import { Value } from '../../../src/check/arbitrary/definition/Value.js';
import { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary.js';
import { Stream } from '../../../src/stream/Stream.js';
import { chainUntil } from '../../../src/arbitrary/chainUntil.js';
import * as stubRng from '../stubs/generators.js';
import { buildShrinkTree, renderTree } from './__test-helpers__/ShrinkTree.js';
import type { Random } from '../../../src/random/generator/Random.js';

const mrngNoCall = stubRng.mutable.nocall();

const computeMaximalStackSize = () => {
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

describe('chainUntil', () => {
  describe('generate', () => {
    it('should return startArb value when chainer immediately returns undefined', () => {
      // Arrange
      const startValue = new Value(42, { ctx: 'start' });
      class StartArb extends Arbitrary<number> {
        generate = vi.fn().mockReturnValue(startValue);
        canShrinkWithoutContext(value: unknown): value is number {
          return false;
        }
        shrink = vi.fn().mockReturnValue(Stream.nil());
      }

      // Act
      const arb = chainUntil(new StartArb(), () => undefined);
      const g = arb.generate(mrngNoCall, undefined);

      // Assert
      expect(g.value_).toBe(42);
    });

    it('should chain through multiple arbitraries until undefined', () => {
      // Arrange
      const mrng = stubRng.mutable.counter(0);
      class NumArb extends Arbitrary<number> {
        constructor(readonly val: number) {
          super();
        }
        generate(_mrng: any, _biasFactor: any): Value<number> {
          return new Value(this.val, undefined);
        }
        canShrinkWithoutContext(value: unknown): value is number {
          return false;
        }
        shrink(): Stream<Value<number>> {
          return Stream.nil();
        }
      }
      const startArb = new NumArb(1);
      const chainer = vi.fn((prev: number): Arbitrary<number> | undefined => {
        if (prev >= 3) return undefined;
        return new NumArb(prev + 1);
      });

      // Act
      const arb = chainUntil(startArb, chainer);
      const g = arb.generate(mrng, undefined);

      // Assert
      expect(g.value_).toBe(3);
      expect(chainer).toHaveBeenCalledTimes(3); // called with 1, 2, 3
    });

    it('should pass biasFactor to all generated arbitraries', () => {
      // Arrange
      const mrng = stubRng.mutable.counter(0);
      const generateCalls: (number | undefined)[] = [];
      class TrackingArb extends Arbitrary<number> {
        constructor(readonly val: number) {
          super();
        }
        generate(_mrng: any, biasFactor: number | undefined): Value<number> {
          generateCalls.push(biasFactor);
          return new Value(this.val, undefined);
        }
        canShrinkWithoutContext(value: unknown): value is number {
          return false;
        }
        shrink(): Stream<Value<number>> {
          return Stream.nil();
        }
      }
      const chainer = (prev: number): Arbitrary<number> | undefined => {
        if (prev >= 2) return undefined;
        return new TrackingArb(prev + 1);
      };

      // Act
      const arb = chainUntil(new TrackingArb(1), chainer);
      arb.generate(mrng, 48);

      // Assert
      expect(generateCalls).toEqual([48, 48]);
    });
  });

  describe('canShrinkWithoutContext', () => {
    it('should always return false', () => {
      // Arrange
      class StartArb extends Arbitrary<number> {
        generate(): Value<number> {
          return new Value(0, undefined);
        }
        canShrinkWithoutContext(value: unknown): value is number {
          return true;
        }
        shrink(): Stream<Value<number>> {
          return Stream.nil();
        }
      }

      // Act / Assert
      const arb = chainUntil(new StartArb(), () => undefined);
      expect(arb.canShrinkWithoutContext(0)).toBe(false);
      expect(arb.canShrinkWithoutContext(42)).toBe(false);
      expect(arb.canShrinkWithoutContext('hello')).toBe(false);
    });
  });

  describe('shrink', () => {
    it('should return empty stream when shrinking without context', () => {
      // Arrange
      class StartArb extends Arbitrary<number> {
        generate(): Value<number> {
          return new Value(0, undefined);
        }
        canShrinkWithoutContext(value: unknown): value is number {
          return false;
        }
        shrink(): Stream<Value<number>> {
          return Stream.of(new Value(42, undefined));
        }
      }

      // Act
      const arb = chainUntil(new StartArb(), () => undefined);
      const shrinks = [...arb.shrink(0, undefined)];

      // Assert
      expect(shrinks).toHaveLength(0);
    });

    it('should shrink the startArb value when chain has single entry', () => {
      // Arrange
      class ShrinkableArb extends Arbitrary<number> {
        generate(_mrng: any): Value<number> {
          return new Value(10, { step: 5 });
        }
        canShrinkWithoutContext(value: unknown): value is number {
          return false;
        }
        shrink(value: number, context?: unknown): Stream<Value<number>> {
          const ctx = context as { step: number };
          if (value - ctx.step < 0) return Stream.nil();
          return Stream.of(new Value(value - ctx.step, { step: ctx.step + 1 }));
        }
      }

      // Act
      const arb = chainUntil(new ShrinkableArb(), () => undefined);
      const g = arb.generate(mrngNoCall, undefined);
      const shrinks = [...arb.shrink(g.value_, g.context)];

      // Assert
      expect(shrinks).toEqual([expect.objectContaining({ value_: 5 })]);
    });

    it('should shrink earlier levels before later levels', () => {
      // Arrange
      // A chain of: startArb(10) -> chainer -> arb(20) -> chainer -> undefined
      // startArb shrinks: 10 -> 5
      // chained arb shrinks: 20 -> 15
      const mrng = stubRng.mutable.counter(0);
      class FixedArb extends Arbitrary<number> {
        constructor(
          readonly val: number,
          readonly shrinkVal: number | undefined,
        ) {
          super();
        }
        generate(_mrng: any): Value<number> {
          return new Value(this.val, 'ctx');
        }
        canShrinkWithoutContext(value: unknown): value is number {
          return false;
        }
        shrink(_value: number, context?: unknown): Stream<Value<number>> {
          if (context !== 'ctx') return Stream.nil();
          if (this.shrinkVal === undefined) return Stream.nil();
          return Stream.of(new Value(this.shrinkVal, 'ctx-shrunk'));
        }
      }
      const chainer = vi.fn((prev: number): Arbitrary<number> | undefined => {
        if (prev === 10 || prev === 5) {
          return new FixedArb(20, 15);
        }
        return undefined; // stop after one chain step
      });

      // Act
      const arb = chainUntil(new FixedArb(10, 5), chainer);
      const g = arb.generate(mrng, undefined);
      const shrinks = [...arb.shrink(g.value_, g.context)];

      // Assert - level 0 shrink (startArb 10->5) comes first, then level 1 shrink (chained 20->15)
      // First shrink regenerates the chain from the shrunk startArb value (5)
      // The chained arbitrary still produces 20 via regeneration
      // Second shrink is from the chained level
      expect(shrinks).toEqual([
        expect.objectContaining({ value_: 20 }), // regenerated chain from shrunk start value
        expect.objectContaining({ value_: 15 }), // shrunk chained value
      ]);
    });

    it('should produce the right shrinking tree for a simple chain', () => {
      // Arrange
      // An arbitrary that produces string values encoding the chain path.
      // Each level appends "-L{depth}" (uppercase). Shrinking lowercases the last segment.
      // This makes the tree output descriptive: you can see exactly which level was shrunk.
      class LevelArb extends Arbitrary<string> {
        constructor(readonly val: string) {
          super();
        }
        generate(_mrng: any): Value<string> {
          return new Value(this.val, 'ctx');
        }
        canShrinkWithoutContext(value: unknown): value is string {
          return false;
        }
        shrink(value: string, context?: unknown): Stream<Value<string>> {
          if (context === undefined) return Stream.nil();
          const parts = value.split('-');
          const last = parts[parts.length - 1];
          if (last === last.toLowerCase()) return Stream.nil();
          parts[parts.length - 1] = last.toLowerCase();
          return Stream.of(new Value(parts.join('-'), 'ctx'));
        }
      }

      // Chain: "L0" -> "L0-L1" -> "L0-L1-L2" -> stop (depth >= 3)
      const chainer = (prev: string): Arbitrary<string> | undefined => {
        const depth = prev.split('-').length;
        if (depth >= 3) return undefined;
        return new LevelArb(prev + '-L' + depth);
      };

      // Act
      const arb = chainUntil(new LevelArb('L0'), chainer);
      const g = arb.generate(mrngNoCall, undefined);

      // The chain: LevelArb("L0") -> "L0" -> chainer -> LevelArb("L0-L1") -> "L0-L1" -> chainer -> LevelArb("L0-L1-L2") -> "L0-L1-L2" -> chainer -> undefined
      // Final value: "L0-L1-L2"
      expect(g.value_).toBe('L0-L1-L2');

      const renderedTree = renderTree(buildShrinkTree(arb, g, { numItems: 30 })).join('\n');

      // Assert - verify the tree structure
      // Uppercase = unshrunk, lowercase = shrunk at that level
      expect(renderedTree).toMatchInlineSnapshot(`
        ""L0-L1-L2"
        ├> "l0-L1-L2"
        |  ├> "l0-l1-L2"
        |  |  └> "l0-l1-l2"
        |  └> "l0-L1-l2"
        ├> "L0-l1-L2"
        |  └> "L0-l1-l2"
        └> "L0-L1-l2""
      `);
    });

    it('should be non-recursive and handle long chains without stack overflow', () => {
      // Arrange
      const callStackSize = computeMaximalStackSize();
      const chainLength = callStackSize * 2;
      const mrng = stubRng.mutable.counter(0);
      class SimpleArb extends Arbitrary<number> {
        constructor(readonly val: number) {
          super();
        }
        generate(_mrng: any): Value<number> {
          return new Value(this.val, undefined);
        }
        canShrinkWithoutContext(value: unknown): value is number {
          return false;
        }
        shrink(): Stream<Value<number>> {
          return Stream.nil();
        }
      }

      // Confirm that this chain length would cause a stack overflow with a naive recursive approach
      const recursiveCall = (n: number): number => {
        if (n <= 0) return 0;
        return recursiveCall(n - 1);
      };
      expect(() => recursiveCall(chainLength)).toThrow();

      const chainer = (prev: number): Arbitrary<number> | undefined => {
        if (prev >= chainLength) return undefined;
        return new SimpleArb(prev + 1);
      };

      // Act
      const arb = chainUntil(new SimpleArb(1), chainer);
      const g = arb.generate(mrng, undefined);

      // Assert
      expect(g.value_).toBe(chainLength);
      // Shrinking should also not cause stack overflow
      const shrinks = [...arb.shrink(g.value_, g.context)];
      expect(shrinks).toHaveLength(0); // no shrinks since SimpleArb doesn't shrink
    });

    it('should handle chains where shrinking changes the chain length', () => {
      // Arrange
      const mrng = stubRng.mutable.counter(0);
      // An arbitrary whose value determines the chain length
      // Values >= 3 continue the chain, values < 3 stop
      class StepArb extends Arbitrary<number> {
        constructor(readonly val: number) {
          super();
        }
        generate(_mrng: any): Value<number> {
          return new Value(this.val, 'has-context');
        }
        canShrinkWithoutContext(value: unknown): value is number {
          return false;
        }
        shrink(value: number, context?: unknown): Stream<Value<number>> {
          if (context !== 'has-context') return Stream.nil();
          if (value <= 0) return Stream.nil();
          // Shrink to value - 1
          return Stream.of(new Value(value - 1, 'has-context'));
        }
      }

      const chainer = (prev: number): Arbitrary<number> | undefined => {
        if (prev >= 3) {
          return new StepArb(prev - 1);
        }
        return undefined; // stop when value < 3
      };

      // Act
      const arb = chainUntil(new StepArb(5), chainer);
      const g = arb.generate(mrng, undefined);

      // Chain: StepArb(5) -> value 5 -> chainer(5) -> StepArb(4) -> value 4 -> chainer(4) -> StepArb(3) -> value 3 -> chainer(3) -> StepArb(2) -> value 2 -> chainer(2) -> undefined
      // Final value: 2
      expect(g.value_).toBe(2);

      // When we shrink the first entry (5 -> 4), the chain regenerates:
      // StepArb(5) shrinks to 4, then chainer(4) -> StepArb(3) -> value 3 -> chainer(3) -> StepArb(2) -> value 2 -> chainer(2) -> undefined
      // So the chain is now shorter
      const shrinks = [...arb.shrink(g.value_, g.context)];
      expect(shrinks).toEqual([
        expect.objectContaining({ value_: 2 }), // level 0: 5->4, chain regenerates to 2
        expect.objectContaining({ value_: 2 }), // level 1: 4->3, chain regenerates to 2
        expect.objectContaining({ value_: 2 }), // level 2: 3->2, chain stops
        expect.objectContaining({ value_: 1 }), // level 3: 2->1, chain stops
      ]);
    });

    it('should properly propagate shrink context through multiple levels', () => {
      // Arrange
      const mrng = stubRng.mutable.counter(0);
      // An arbitrary that generates a string value and shrinks by lowercasing the last segment
      class ConcatArb extends Arbitrary<string> {
        constructor(readonly val: string) {
          super();
        }
        generate(_mrng: Random): Value<string> {
          return new Value(this.val, 'ctx');
        }
        canShrinkWithoutContext(_value: unknown): _value is string {
          return false;
        }
        shrink(value: string, context?: unknown): Stream<Value<string>> {
          if (context !== 'ctx') return Stream.nil();
          const parts = value.split('-');
          const last = parts[parts.length - 1];
          if (last === last.toLowerCase()) return Stream.nil();
          parts[parts.length - 1] = last.toLowerCase();
          return Stream.of(new Value(parts.join('-'), 'ctx'));
        }
      }

      // Chainer creates a 3-level chain: L0 -> L0-L1 -> L0-L1-L2 -> stop
      const chainer = (prev: string): Arbitrary<string> | undefined => {
        const level = prev.split('-').length;
        if (level < 3) {
          return new ConcatArb(prev + '-L' + level);
        }
        return undefined;
      };

      // Act
      const arb = chainUntil(new ConcatArb('L0'), chainer);
      const g = arb.generate(mrng, undefined);

      // Chain: ConcatArb('L0') -> 'L0' -> chainer -> ConcatArb('L0-L1') -> 'L0-L1' -> chainer -> ConcatArb('L0-L1-L2') -> 'L0-L1-L2' -> stop
      expect(g.value_).toBe('L0-L1-L2');

      const renderedTree = renderTree(buildShrinkTree(arb, g, { numItems: 30 })).join('\n');
      expect(renderedTree).toMatchInlineSnapshot(`
        ""L0-L1-L2"
        ├> "l0-L1-L2"
        |  ├> "l0-l1-L2"
        |  |  └> "l0-l1-l2"
        |  └> "l0-L1-l2"
        ├> "L0-l1-L2"
        |  └> "L0-l1-l2"
        └> "L0-L1-l2""
      `);
    });
  });
});
