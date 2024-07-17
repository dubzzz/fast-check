import { describe, it, vi, expect } from 'vitest';
import { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary';
import { Value } from '../../../src/check/arbitrary/definition/Value';
import type { Stream } from '../../../src/stream/Stream';
import { noShrink } from '../../../src/arbitrary/noShrink';
import * as stubRng from '../stubs/generators';

const mrngNoCall = stubRng.mutable.nocall();

describe('noShrink', () => {
  it('should simply return the original instance of Value on generate', () => {
    // Arrange
    const expectedBiasFactor = 48;
    const generate = vi.fn();
    const canShrinkWithoutContext = vi.fn() as any as (value: unknown) => value is any;
    const shrink = vi.fn();
    const choice = new Value(1, Symbol());
    generate.mockReturnValueOnce(choice);
    class MyNextArbitrary extends Arbitrary<any> {
      generate = generate;
      canShrinkWithoutContext = canShrinkWithoutContext;
      shrink = shrink;
    }

    // Act
    const arb = noShrink(new MyNextArbitrary());
    const g = arb.generate(mrngNoCall, expectedBiasFactor);

    // Assert
    expect(g).toBe(choice); // just returning the instance of the source arbitrary (including its context)
    expect(generate).toHaveBeenCalledWith(mrngNoCall, expectedBiasFactor);
  });

  it('should override default shrink with function returning an empty Stream', () => {
    // Arrange
    const shrink = vi.fn();
    class MyNextArbitrary extends Arbitrary<any> {
      generate(): Value<any> {
        throw new Error('Not implemented.');
      }
      canShrinkWithoutContext(value: unknown): value is any {
        throw new Error('Not implemented.');
      }
      shrink = shrink;
    }
    const fakeArbitrary: Arbitrary<any> = new MyNextArbitrary();
    const noShrinkArbitrary = noShrink(fakeArbitrary);

    // Act
    const out = noShrinkArbitrary.shrink(5, Symbol());

    // Assert
    expect([...out]).toHaveLength(0);
    expect(shrink).not.toHaveBeenCalled();
  });

  it('should return itself when called twice', () => {
    // Arrange
    class MyNextArbitrary extends Arbitrary<any> {
      generate(): Value<any> {
        throw new Error('Not implemented.');
      }
      canShrinkWithoutContext(value: unknown): value is any {
        throw new Error('Not implemented.');
      }
      shrink(): Stream<Value<any>> {
        throw new Error('Not implemented.');
      }
    }
    const fakeArbitrary: Arbitrary<any> = new MyNextArbitrary();

    // Act
    const firstNoShrink = noShrink(fakeArbitrary);
    const secondNoShrink = noShrink(firstNoShrink);

    // Assert
    expect(secondNoShrink).toBe(firstNoShrink);
  });

  it('should return itself when called twice except when altered on shrink', () => {
    // Arrange
    class MyNextArbitrary extends Arbitrary<any> {
      generate(): Value<any> {
        throw new Error('Not implemented.');
      }
      canShrinkWithoutContext(value: unknown): value is any {
        throw new Error('Not implemented.');
      }
      shrink(): Stream<Value<any>> {
        throw new Error('Not implemented.');
      }
    }
    const fakeArbitrary: Arbitrary<any> = new MyNextArbitrary();

    // Act
    const firstNoShrink = noShrink(fakeArbitrary);
    // @ts-expect-error - Evil inplace override of a method
    firstNoShrink.shrink = () => {};
    const secondNoShrink = noShrink(firstNoShrink);

    // Assert
    expect(secondNoShrink).not.toBe(firstNoShrink);
  });
});
