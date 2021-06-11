import * as fc from '../../../../../lib/fast-check';
import * as prand from 'pure-rand';

import { NextArbitrary } from '../../../../../src/check/arbitrary/definition/NextArbitrary';
import { Random } from '../../../../../src/random/generator/Random';
import { NextValue } from '../../../../../src/check/arbitrary/definition/NextValue';
import { ConverterFromNext } from '../../../../../src/check/arbitrary/definition/ConverterFromNext';
import { ConverterToNext } from '../../../../../src/check/arbitrary/definition/ConverterToNext';
import { buildNextShrinkTree, renderTree } from '../generic/ShrinkTree';
import { Stream } from '../../../../../src/stream/Stream';

describe('ConverterFromNext', () => {
  it('should be revertable using ConverterToNext', () => {
    fc.assert(
      fc.property(fc.integer().noShrink(), (seed) => {
        // Arrange
        class MyNextArbitrary extends NextArbitrary<[number, number]> {
          // 2-natural-number tuple arbitrary, with shrinking capabilities
          generate(mrng: Random): NextValue<[number, number]> {
            const v1 = mrng.nextInt(0, 20);
            const v2 = mrng.nextInt(0, 20);
            const context = mrng.nextInt(0, 1);
            return new NextValue([v1, v2], context);
          }
          canShrinkWithoutContext(_value: unknown): _value is [number, number] {
            throw new Error('Unused in this context');
          }
          shrink(value: [number, number], context?: unknown): Stream<NextValue<[number, number]>> {
            if (context === undefined) {
              throw new Error('Unexpected error occurred: Unspecified context encountered');
            }
            const safeContext = context as 0 | 1;
            if (value[safeContext] === 0) {
              return Stream.nil();
            }
            if (context === 0) {
              return Stream.of(new NextValue([0, value[1]], 1), new NextValue([value[0] - 1, value[1]], 1));
            } else {
              return Stream.of(new NextValue([value[0], 0], 0), new NextValue([value[0], value[1] - 1], 0));
            }
          }
        }
        const originalInstance = new MyNextArbitrary();
        const transformedInstance = new ConverterToNext(new ConverterFromNext(originalInstance));

        // Act
        const nextValueFromOriginal = originalInstance.generate(new Random(prand.xorshift128plus(seed)));
        const treeFromOriginal = renderTree(buildNextShrinkTree(originalInstance, nextValueFromOriginal));
        const nextValueFromTransformed = transformedInstance.generate(
          new Random(prand.xorshift128plus(seed)),
          undefined
        );
        const treeFromTransformed = renderTree(buildNextShrinkTree(originalInstance, nextValueFromOriginal));

        // Assert
        expect(transformedInstance).not.toBe(originalInstance); // not the same instance
        expect(nextValueFromTransformed.value).toEqual(nextValueFromOriginal.value); // but the same generated value
        expect(nextValueFromTransformed.context).not.toEqual(nextValueFromOriginal.context); // without the same context (will be rewrapped)
        expect(treeFromTransformed).toEqual(treeFromOriginal); // but with the same shrinks
      })
    );
  });
});
