import { tuple } from '../../../../src/check/arbitrary/TupleArbitrary';

import { convertFromNext } from '../../../../src/check/arbitrary/definition/Converters';
import { NextArbitrary } from '../../../../src/check/arbitrary/definition/NextArbitrary';
import { NextValue } from '../../../../src/check/arbitrary/definition/NextValue';
import { Random } from '../../../../src/random/generator/Random';
import { Stream } from '../../../../src/stream/Stream';

import * as stubRng from '../../stubs/generators';
import { buildShrinkTree, renderTree } from './generic/ShrinkTree';

const mrng = stubRng.mutable.nocall();

describe('tuple', () => {
  it('should produce the right shrinking tree', () => {
    // Arrange
    const expectedFirst = 4;
    const expectedSecond = 97;
    class FirstArbitrary extends NextArbitrary<number> {
      generate(_mrng: Random): NextValue<number> {
        return new NextValue(expectedFirst, { step: 2 });
      }
      shrink(value: number, context?: unknown): Stream<NextValue<number>> {
        if (typeof context !== 'object' || context === null || !('step' in context)) {
          throw new Error('Invalid context for FirstArbitrary');
        }
        if (value <= 0) {
          return Stream.nil();
        }
        const currentStep = (context as { step: number }).step;
        const nextStep = currentStep + 1;
        return Stream.of(
          ...(value - currentStep >= 0 ? [new NextValue(value - currentStep, { step: nextStep })] : []),
          ...(value - currentStep + 1 >= 0 ? [new NextValue(value - currentStep + 1, { step: nextStep })] : [])
        );
      }
    }
    class SecondArbitrary extends NextArbitrary<number> {
      generate(_mrng: Random): NextValue<number> {
        return new NextValue(expectedSecond, { step: 2 });
      }
      shrink(value: number, context?: unknown): Stream<NextValue<number>> {
        if (typeof context !== 'object' || context === null || !('step' in context)) {
          throw new Error('Invalid context for SecondArbitrary');
        }
        if (value >= 100) {
          return Stream.nil();
        }
        const currentStep = (context as { step: number }).step;
        const nextStep = currentStep + 1;
        return Stream.of(
          ...(value + currentStep <= 100 ? [new NextValue(value + currentStep, { step: nextStep })] : []),
          ...(value + currentStep - 1 <= 100 ? [new NextValue(value + currentStep - 1, { step: nextStep })] : [])
        );
      }
    }
    const firstArb = convertFromNext(new FirstArbitrary());
    const secondArb = convertFromNext(new SecondArbitrary());
    const arb = tuple(firstArb, secondArb);

    // Act
    const g = arb.generate(mrng);
    const renderedTree = renderTree(buildShrinkTree(g)).join('\n');

    // Assert
    expect(g.hasToBeCloned).toBe(false);
    expect(g.value).toBe(g.value_);
    expect(g.value).toEqual([expectedFirst, expectedSecond]);
    expect(renderedTree).toMatchInlineSnapshot(`
      "[4,97]
      ├> [2,97]
      |  ├> [0,97]
      |  |  ├> [0,99]
      |  |  └> [0,98]
      |  |     └> [0,100]
      |  ├> [2,99]
      |  |  └> [0,99]
      |  └> [2,98]
      |     ├> [0,98]
      |     |  └> [0,100]
      |     └> [2,100]
      |        └> [0,100]
      ├> [3,97]
      |  ├> [0,97]
      |  |  ├> [0,99]
      |  |  └> [0,98]
      |  |     └> [0,100]
      |  ├> [1,97]
      |  |  ├> [1,99]
      |  |  └> [1,98]
      |  |     └> [1,100]
      |  ├> [3,99]
      |  |  ├> [0,99]
      |  |  └> [1,99]
      |  └> [3,98]
      |     ├> [0,98]
      |     |  └> [0,100]
      |     ├> [1,98]
      |     |  └> [1,100]
      |     └> [3,100]
      |        ├> [0,100]
      |        └> [1,100]
      ├> [4,99]
      |  ├> [2,99]
      |  |  └> [0,99]
      |  └> [3,99]
      |     ├> [0,99]
      |     └> [1,99]
      └> [4,98]
         ├> [2,98]
         |  ├> [0,98]
         |  |  └> [0,100]
         |  └> [2,100]
         |     └> [0,100]
         ├> [3,98]
         |  ├> [0,98]
         |  |  └> [0,100]
         |  ├> [1,98]
         |  |  └> [1,100]
         |  └> [3,100]
         |     ├> [0,100]
         |     └> [1,100]
         └> [4,100]
            ├> [2,100]
            |  └> [0,100]
            └> [3,100]
               ├> [0,100]
               └> [1,100]"
    `);
  });
});
