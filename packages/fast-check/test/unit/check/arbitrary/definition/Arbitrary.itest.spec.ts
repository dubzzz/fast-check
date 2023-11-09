import { Arbitrary } from '../../../../../src/check/arbitrary/definition/Arbitrary';

import { Value } from '../../../../../src/check/arbitrary/definition/Value';
import { cloneMethod, hasCloneMethod } from '../../../../../src/check/symbols';
import type { Random } from '../../../../../src/random/generator/Random';
import { Stream } from '../../../../../src/stream/Stream';

import * as stubRng from '../../../stubs/generators';
import { buildShrinkTree, renderTree, walkTree } from '../../../arbitrary/__test-helpers__/ShrinkTree';

const mrngNoCall = stubRng.mutable.nocall();

describe('Arbitrary', () => {
  describe('map', () => {
    it('should produce the right shrinking tree', () => {
      // Arrange
      class MyArbitrary extends Arbitrary<number> {
        generate(_mrng: Random): Value<number> {
          return new Value(10, { step: 2 });
        }
        canShrinkWithoutContext(value: unknown): value is number {
          throw new Error('No call expected in current scenario');
        }
        shrink(value: number, context?: unknown): Stream<Value<number>> {
          if (typeof context !== 'object' || context === null || !('step' in context)) {
            throw new Error('Invalid context for MyArbitrary');
          }
          const currentStep = (context as { step: number }).step;
          const nextStep = currentStep + 1;
          return Stream.of(
            ...(value - currentStep >= 0 ? [new Value(value - currentStep, { step: nextStep })] : []),
            ...(value - 1 >= 0 ? [new Value(value - 1, { step: nextStep })] : []),
          );
        }
      }
      const arb = new MyArbitrary().map((n) => String(n));

      // Act
      const g = arb.generate(mrngNoCall, undefined);
      const renderedTree = renderTree(buildShrinkTree(arb, g)).join('\n');

      // Assert
      expect(renderedTree).toMatchInlineSnapshot(`
        ""10"
        ├> "8"
        |  ├> "5"
        |  |  ├> "1"
        |  |  |  └> "0"
        |  |  └> "4"
        |  |     └> "3"
        |  |        └> "2"
        |  |           └> "1"
        |  |              └> "0"
        |  └> "7"
        |     ├> "3"
        |     |  └> "2"
        |     |     └> "1"
        |     |        └> "0"
        |     └> "6"
        |        ├> "1"
        |        |  └> "0"
        |        └> "5"
        |           └> "4"
        |              └> "3"
        |                 └> "2"
        |                    └> "1"
        |                       └> "0"
        └> "9"
           ├> "6"
           |  ├> "2"
           |  |  └> "1"
           |  |     └> "0"
           |  └> "5"
           |     ├> "0"
           |     └> "4"
           |        └> "3"
           |           └> "2"
           |              └> "1"
           |                 └> "0"
           └> "8"
              ├> "4"
              |  └> "3"
              |     └> "2"
              |        └> "1"
              |           └> "0"
              └> "7"
                 ├> "2"
                 |  └> "1"
                 |     └> "0"
                 └> "6"
                    ├> "0"
                    └> "5"
                       └> "4"
                          └> "3"
                             └> "2"
                                └> "1"
                                   └> "0""
      `);
    });

    it('should preserve cloneable capabilities during both generation and shrinking process', () => {
      // Arrange
      type MyArbitraryOutput = { value: number };
      class MyArbitrary extends Arbitrary<MyArbitraryOutput> {
        private create(value: number): MyArbitraryOutput {
          const complexInstance = { value, [cloneMethod]: () => this.create(value) };
          return complexInstance;
        }
        generate(_mrng: Random): Value<MyArbitraryOutput> {
          return new Value(this.create(10), undefined);
        }
        canShrinkWithoutContext(value: unknown): value is MyArbitraryOutput {
          throw new Error('No call expected in current scenario');
        }
        shrink(v: MyArbitraryOutput, _context?: unknown): Stream<Value<MyArbitraryOutput>> {
          const value = v.value;
          return Stream.of(
            ...(value - 2 >= 0 ? [new Value(this.create(value - 2), undefined)] : []),
            ...(value - 1 >= 0 ? [new Value(this.create(value - 1), undefined)] : []),
          );
        }
      }
      const seenInstances = new Set<unknown>();
      const arb = new MyArbitrary().map((out) => ({ stringValue: String(out.value), counter: 0 }));

      // Act
      const g = arb.generate(mrngNoCall, undefined);
      const shrinkTree = buildShrinkTree(arb, g);
      const shrinkTreeB = buildShrinkTree(arb, g);

      // Assert
      const visit = (instance: { counter: number }) => {
        expect(hasCloneMethod(instance)).toBe(true); // clone method should be provided
        expect(instance.counter).toBe(0); // counter should be unique per cloned instance
        expect(seenInstances.has(instance)).toBe(false); // each instance must appear only once in the tree
        instance.counter += 1;
        seenInstances.add(instance);
      };
      walkTree(shrinkTree, visit);
      walkTree(shrinkTreeB, visit);
    });

    it('should preserve cloneable capabilities during both generation and shrinking process even if output of map is already cloneable', () => {
      // Arrange
      type MyArbitraryOutput = { value: number; counter: number };
      class MyArbitrary extends Arbitrary<MyArbitraryOutput> {
        private create(value: number): MyArbitraryOutput {
          const complexInstance = { value, counter: 0, [cloneMethod]: () => this.create(value) };
          return complexInstance;
        }
        generate(_mrng: Random): Value<MyArbitraryOutput> {
          return new Value(this.create(10), undefined);
        }
        canShrinkWithoutContext(value: unknown): value is MyArbitraryOutput {
          throw new Error('No call expected in current scenario');
        }
        shrink(v: MyArbitraryOutput, _context?: unknown): Stream<Value<MyArbitraryOutput>> {
          const value = v.value;
          return Stream.of(
            ...(value - 2 >= 0 ? [new Value(this.create(value - 2), undefined)] : []),
            ...(value - 1 >= 0 ? [new Value(this.create(value - 1), undefined)] : []),
          );
        }
      }
      const seenInstances = new Set<unknown>();
      const arb = new MyArbitrary().map((out) => out); // out is already cloneable

      // Act
      const g = arb.generate(mrngNoCall, undefined);
      const shrinkTree = buildShrinkTree(arb, g);
      const shrinkTreeB = buildShrinkTree(arb, g);

      // Assert
      const visit = (instance: { counter: number }) => {
        expect(hasCloneMethod(instance)).toBe(true); // clone method should be provided
        expect(instance.counter).toBe(0); // counter should be unique per cloned instance
        expect(seenInstances.has(instance)).toBe(false); // each instance must appear only once in the tree
        instance.counter += 1;
        seenInstances.add(instance);
      };
      walkTree(shrinkTree, visit);
      walkTree(shrinkTreeB, visit);
    });
  });

  describe('chain', () => {
    it('should produce the right shrinking tree', () => {
      // Arrange
      class MyArbitrary extends Arbitrary<number> {
        generate(_mrng: Random): Value<number> {
          return new Value(5, { step: 2 });
        }
        canShrinkWithoutContext(value: unknown): value is number {
          throw new Error('No call expected in current scenario');
        }
        shrink(value: number, context?: unknown): Stream<Value<number>> {
          if (typeof context !== 'object' || context === null || !('step' in context)) {
            throw new Error('Invalid context for MyArbitrary');
          }
          const currentStep = (context as { step: number }).step;
          if (value - currentStep < 0) {
            return Stream.nil();
          }
          const nextStep = currentStep + 1;
          return Stream.of(new Value(value - currentStep, { step: nextStep }));
        }
      }
      class MyChainedArbitrary extends Arbitrary<number[]> {
        constructor(
          readonly size: number,
          readonly value: number,
        ) {
          super();
        }
        generate(_mrng: Random): Value<number[]> {
          return new Value(Array(this.size).fill(this.value), {
            size: this.size,
            value: this.value,
          });
        }
        canShrinkWithoutContext(value: unknown): value is number[] {
          throw new Error('No call expected in current scenario');
        }
        shrink(value: number[], context?: unknown): Stream<Value<number[]>> {
          if (typeof context !== 'object' || context === null || !('size' in context) || !('value' in context)) {
            throw new Error('Invalid context for MyChainedArbitrary');
          }
          const currentContext = context as { size: number; value: number };
          if (currentContext.size === 0) {
            return Stream.nil();
          }
          return Stream.of(
            ...(currentContext.value === value[0]
              ? [new Value(Array(currentContext.size).fill(0), currentContext)]
              : []),
            ...(value.length > 1 ? [new Value([value[0]], currentContext)] : []),
          );
        }
      }
      const arb = new MyArbitrary().chain((n) => new MyChainedArbitrary(n, n));

      // Act
      const g = arb.generate(mrngNoCall, undefined);
      const renderedTree = renderTree(buildShrinkTree(arb, g)).join('\n');

      // Assert
      expect(renderedTree).toMatchInlineSnapshot(`
        "[5,5,5,5,5]
        ├> [3,3,3]
        |  ├> []
        |  ├> [0,0,0]
        |  |  └> [0]
        |  └> [3]
        |     └> [0,0,0]
        |        └> [0]
        ├> [0,0,0,0,0]
        |  └> [0]
        └> [5]
           └> [0,0,0,0,0]
              └> [0]"
      `);
    });
  });

  describe('filter', () => {
    it('should produce the right shrinking tree', () => {
      // Arrange
      class MyArbitrary extends Arbitrary<number> {
        generate(_mrng: Random): Value<number> {
          return new Value(10, { step: 3 });
        }
        canShrinkWithoutContext(value: unknown): value is number {
          throw new Error('No call expected in current scenario');
        }
        shrink(value: number, context?: unknown): Stream<Value<number>> {
          if (typeof context !== 'object' || context === null || !('step' in context)) {
            throw new Error('Invalid context for MyArbitrary');
          }
          const currentStep = (context as { step: number }).step;
          const nextStep = currentStep + 1;
          return Stream.of(
            ...(value - currentStep >= 0 ? [new Value(value - currentStep, { step: nextStep })] : []),
            ...(value - 2 >= 0 ? [new Value(value - 2, { step: nextStep })] : []),
            ...(value - 1 >= 0 ? [new Value(value - 1, { step: nextStep })] : []),
          );
        }
      }
      const arb = new MyArbitrary().filter((n) => n % 2 === 0);

      // Act
      const g = arb.generate(mrngNoCall, undefined);
      const renderedTree = renderTree(buildShrinkTree(arb, g)).join('\n');

      // Assert
      expect(renderedTree).toMatchInlineSnapshot(`
        "10
        └> 8
           ├> 4
           |  └> 2
           |     └> 0
           └> 6
              └> 4
                 └> 2
                    └> 0"
      `);
    });
  });
});
