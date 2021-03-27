import { NextArbitrary } from '../../../../../src/check/arbitrary/definition/NextArbitrary';

import { NextValue } from '../../../../../src/check/arbitrary/definition/NextValue';
import { Random } from '../../../../../src/random/generator/Random';
import { Stream } from '../../../../../src/stream/Stream';

import * as stubRng from '../../../stubs/generators';
import { buildNextShrinkTree, renderTree } from '../generic/ShrinkTree';

const mrngNoCall = stubRng.mutable.nocall();

describe('NextArbitrary', () => {
  describe('map', () => {
    it('should produce the right shrinking tree', () => {
      // Arrange
      class MyArbitrary extends NextArbitrary<number> {
        generate(_mrng: Random): NextValue<number> {
          return new NextValue(10, { step: 2 });
        }
        shrink(value: number, context?: unknown): Stream<NextValue<number>> {
          if (typeof context !== 'object' || context === null || !('step' in context)) {
            throw new Error('Invalid context for MyArbitrary');
          }
          const currentStep = (context as { step: number }).step;
          const nextStep = currentStep + 1;
          return Stream.of(
            ...(value - currentStep >= 0 ? [new NextValue(value - currentStep, { step: nextStep })] : []),
            ...(value - 1 >= 0 ? [new NextValue(value - 1, { step: nextStep })] : [])
          );
        }
      }
      const arb = new MyArbitrary().map((n) => String(n));

      // Act
      const g = arb.generate(mrngNoCall);
      const renderedTree = renderTree(buildNextShrinkTree(arb, g)).join('\n');

      // Assert
      expect(renderedTree).toMatchInlineSnapshot(`
        "\\"10\\"
        ├> \\"8\\"
        |  ├> \\"5\\"
        |  |  ├> \\"1\\"
        |  |  |  └> \\"0\\"
        |  |  └> \\"4\\"
        |  |     └> \\"3\\"
        |  |        └> \\"2\\"
        |  |           └> \\"1\\"
        |  |              └> \\"0\\"
        |  └> \\"7\\"
        |     ├> \\"3\\"
        |     |  └> \\"2\\"
        |     |     └> \\"1\\"
        |     |        └> \\"0\\"
        |     └> \\"6\\"
        |        ├> \\"1\\"
        |        |  └> \\"0\\"
        |        └> \\"5\\"
        |           └> \\"4\\"
        |              └> \\"3\\"
        |                 └> \\"2\\"
        |                    └> \\"1\\"
        |                       └> \\"0\\"
        └> \\"9\\"
           ├> \\"6\\"
           |  ├> \\"2\\"
           |  |  └> \\"1\\"
           |  |     └> \\"0\\"
           |  └> \\"5\\"
           |     ├> \\"0\\"
           |     └> \\"4\\"
           |        └> \\"3\\"
           |           └> \\"2\\"
           |              └> \\"1\\"
           |                 └> \\"0\\"
           └> \\"8\\"
              ├> \\"4\\"
              |  └> \\"3\\"
              |     └> \\"2\\"
              |        └> \\"1\\"
              |           └> \\"0\\"
              └> \\"7\\"
                 ├> \\"2\\"
                 |  └> \\"1\\"
                 |     └> \\"0\\"
                 └> \\"6\\"
                    ├> \\"0\\"
                    └> \\"5\\"
                       └> \\"4\\"
                          └> \\"3\\"
                             └> \\"2\\"
                                └> \\"1\\"
                                   └> \\"0\\""
      `);
    });
  });

  describe('chain', () => {
    it('should produce the right shrinking tree', () => {
      // Arrange
      class MyArbitrary extends NextArbitrary<number> {
        generate(_mrng: Random): NextValue<number> {
          return new NextValue(5, { step: 2 });
        }
        shrink(value: number, context?: unknown): Stream<NextValue<number>> {
          if (typeof context !== 'object' || context === null || !('step' in context)) {
            throw new Error('Invalid context for MyArbitrary');
          }
          const currentStep = (context as { step: number }).step;
          if (value - currentStep < 0) {
            return Stream.nil();
          }
          const nextStep = currentStep + 1;
          return Stream.of(new NextValue(value - currentStep, { step: nextStep }));
        }
      }
      class MyChainedArbitrary extends NextArbitrary<number[]> {
        constructor(readonly size: number, readonly value: number) {
          super();
        }
        generate(_mrng: Random): NextValue<number[]> {
          return new NextValue(Array(this.size).fill(this.value), {
            size: this.size,
            value: this.value,
          });
        }
        shrink(value: number[], context?: unknown): Stream<NextValue<number[]>> {
          if (typeof context !== 'object' || context === null || !('size' in context) || !('value' in context)) {
            throw new Error('Invalid context for MyChainedArbitrary');
          }
          const currentContext = context as { size: number; value: number };
          if (currentContext.size === 0) {
            return Stream.nil();
          }
          return Stream.of(
            ...(currentContext.value === value[0]
              ? [new NextValue(Array(currentContext.size).fill(0), currentContext)]
              : []),
            ...(value.length > 1 ? [new NextValue([value[0]], currentContext)] : [])
          );
        }
      }
      const arb = new MyArbitrary().chain((n) => new MyChainedArbitrary(n, n));

      // Act
      const g = arb.generate(mrngNoCall);
      const renderedTree = renderTree(buildNextShrinkTree(arb, g)).join('\n');

      // Assert
      expect(renderedTree).toMatchInlineSnapshot(`
        "[5,5,5,5,5]
        ├> [3,3,3]
        |  ├> []
        |  ├> [0,0,0]
        |  |  ├> []
        |  |  └> [0]
        |  |     └> []
        |  └> [3]
        |     ├> []
        |     └> [0,0,0]
        |        ├> []
        |        └> [0]
        |           └> []
        ├> [0,0,0,0,0]
        |  ├> [3,3,3]
        |  |  ├> []
        |  |  ├> [0,0,0]
        |  |  |  ├> []
        |  |  |  └> [0]
        |  |  |     └> []
        |  |  └> [3]
        |  |     ├> []
        |  |     └> [0,0,0]
        |  |        ├> []
        |  |        └> [0]
        |  |           └> []
        |  └> [0]
        |     └> [3,3,3]
        |        ├> []
        |        ├> [0,0,0]
        |        |  ├> []
        |        |  └> [0]
        |        |     └> []
        |        └> [3]
        |           ├> []
        |           └> [0,0,0]
        |              ├> []
        |              └> [0]
        |                 └> []
        └> [5]
           ├> [3,3,3]
           |  ├> []
           |  ├> [0,0,0]
           |  |  ├> []
           |  |  └> [0]
           |  |     └> []
           |  └> [3]
           |     ├> []
           |     └> [0,0,0]
           |        ├> []
           |        └> [0]
           |           └> []
           └> [0,0,0,0,0]
              ├> [3,3,3]
              |  ├> []
              |  ├> [0,0,0]
              |  |  ├> []
              |  |  └> [0]
              |  |     └> []
              |  └> [3]
              |     ├> []
              |     └> [0,0,0]
              |        ├> []
              |        └> [0]
              |           └> []
              └> [0]
                 └> [3,3,3]
                    ├> []
                    ├> [0,0,0]
                    |  ├> []
                    |  └> [0]
                    |     └> []
                    └> [3]
                       ├> []
                       └> [0,0,0]
                          ├> []
                          └> [0]
                             └> []"
      `);
    });
  });

  describe('filter', () => {
    it('should produce the right shrinking tree', () => {
      // Arrange
      class MyArbitrary extends NextArbitrary<number> {
        generate(_mrng: Random): NextValue<number> {
          return new NextValue(10, { step: 3 });
        }
        shrink(value: number, context?: unknown): Stream<NextValue<number>> {
          if (typeof context !== 'object' || context === null || !('step' in context)) {
            throw new Error('Invalid context for MyArbitrary');
          }
          const currentStep = (context as { step: number }).step;
          const nextStep = currentStep + 1;
          return Stream.of(
            ...(value - currentStep >= 0 ? [new NextValue(value - currentStep, { step: nextStep })] : []),
            ...(value - 2 >= 0 ? [new NextValue(value - 2, { step: nextStep })] : []),
            ...(value - 1 >= 0 ? [new NextValue(value - 1, { step: nextStep })] : [])
          );
        }
      }
      const arb = new MyArbitrary().filter((n) => n % 2 === 0);

      // Act
      const g = arb.generate(mrngNoCall);
      const renderedTree = renderTree(buildNextShrinkTree(arb, g)).join('\n');

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
