import { describe, it, vi, expect } from 'vitest';
import { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary.js';
import type { Value } from '../../../src/check/arbitrary/definition/Value.js';
import type { Stream } from '../../../src/stream/Stream.js';
import { noBias } from '../../../src/arbitrary/noBias.js';
import * as stubRng from '../stubs/generators.js';

const mrngNoCall = stubRng.mutable.nocall();

describe('noBias', () => {
  it('should override passed bias with undefined', () => {
    // Arrange
    const generate = vi.fn();
    class MyNextArbitrary extends Arbitrary<any> {
      generate = generate;
      canShrinkWithoutContext(value: unknown): value is any {
        throw new Error('Not implemented.');
      }
      shrink(): Stream<Value<any>> {
        throw new Error('Not implemented.');
      }
    }
    const fakeArbitrary: Arbitrary<any> = new MyNextArbitrary();
    const noBiasArbitrary = noBias(fakeArbitrary);

    // Act
    noBiasArbitrary.generate(mrngNoCall, 42);

    // Assert
    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledWith(mrngNoCall, undefined);
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
    const firstNoBias = noBias(fakeArbitrary);
    const secondNoBias = noBias(firstNoBias);

    // Assert
    expect(secondNoBias).toBe(firstNoBias);
  });

  it.each([{ method: 'generate' }, { method: 'canShrinkWithoutContext' }, { method: 'shrink' }])(
    'should return itself when called twice except when altered on $method',
    ({ method }) => {
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
      const firstNoBias = noBias(fakeArbitrary);
      // @ts-expect-error - Evil inplace override of a method
      firstNoBias[method] = () => {};
      const secondNoBias = noBias(firstNoBias);

      // Assert
      expect(secondNoBias).not.toBe(firstNoBias);
    },
  );
});
