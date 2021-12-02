import * as fc from '../../../lib/fast-check';
import { func } from '../../../src/arbitrary/func';

import { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary';
import { Value } from '../../../src/check/arbitrary/definition/Value';
import { hasCloneMethod, cloneIfNeeded, cloneMethod } from '../../../src/check/symbols';
import { Random } from '../../../src/random/generator/Random';
import { Stream } from '../../../src/stream/Stream';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
} from './__test-helpers__/ArbitraryAssertions';
import { FakeIntegerArbitrary } from './__test-helpers__/ArbitraryHelpers';
import { assertToStringIsSameFunction } from './__test-helpers__/ToStringIsSameFunction';

describe('func (integration)', () => {
  const funcBuilder = () => func(new FakeIntegerArbitrary());

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(funcBuilder, {
      extraParameters: fc.array(fc.array(fc.anything()), { minLength: 1 }),
      isEqual: (fa, fb, calls) => {
        for (const args of calls) {
          expect(fb(...args)).toBe(fa(...args));
        }
      },
    });
  });

  it('should not depend on the ordering of the calls', () => {
    assertProduceSameValueGivenSameSeed(funcBuilder, {
      extraParameters: fc.record({
        call: fc.array(fc.anything()),
        noiseCallsA: fc.array(fc.array(fc.anything())),
        noiseCallsB: fc.array(fc.array(fc.anything())),
      }),
      isEqual: (fa, fb, { call, noiseCallsA, noiseCallsB }) => {
        for (const args of noiseCallsA) {
          fa(...args);
        }
        for (const args of noiseCallsB) {
          fb(...args);
        }
        expect(fb(...call)).toBe(fa(...call));
      },
    });
  });

  it('should return the same value given the same input', () => {
    assertProduceCorrectValues(
      funcBuilder,
      (f, { call, noiseCallsA, noiseCallsB }) => {
        for (const args of noiseCallsA) {
          f(...args);
        }
        const out = f(...call);
        for (const args of noiseCallsB) {
          f(...args);
        }
        expect(f(...call)).toBe(out);
      },
      {
        extraParameters: fc.record({
          call: fc.array(fc.anything()),
          noiseCallsA: fc.array(fc.array(fc.anything())),
          noiseCallsB: fc.array(fc.array(fc.anything())),
        }),
      }
    );
  });

  it('should give a re-usable string representation of the function', () => {
    assertProduceCorrectValues(funcBuilder, (f, calls) => assertToStringIsSameFunction(f, calls), {
      extraParameters: fc.array(fc.array(fc.anything())),
    });
  });

  it('should produce cloneable instances with independant histories', () => {
    assertProduceCorrectValues(
      funcBuilder,
      (f, calls) => {
        for (const args of calls) {
          f(...args);
        }
        expect(String(f)).toBe(String(f)); // calling toString does not alter the output
        expect(hasCloneMethod(f)).toBe(true); // f should be cloneable
        const clonedF = cloneIfNeeded(f);
        expect(String(clonedF)).not.toBe(String(f)); // f has been called with inputs, clonedF has not yet!
        for (const args of calls) {
          clonedF(...args);
        }
        expect(String(clonedF)).toBe(String(f)); // both called with same inputs in the same order
      },
      { extraParameters: fc.array(fc.array(fc.anything()), { minLength: 1 }) }
    );
  });

  it('should only clone produced values if they implement [fc.cloneMethod]', () => {
    class CloneableArbitrary extends Arbitrary<number[]> {
      private instance(value: number, cloneable: boolean) {
        if (!cloneable) return [value, 0];
        return Object.defineProperty([value, 1], cloneMethod, { value: () => this.instance(value, cloneable) });
      }
      generate(mrng: Random): Value<number[]> {
        return new Value(this.instance(mrng.nextInt(), mrng.nextBoolean()), { shrunkOnce: false });
      }
      canShrinkWithoutContext(_value: unknown): _value is number[] {
        throw new Error('No call expected in that scenario');
      }
      shrink(value: number[], context?: unknown): Stream<Value<number[]>> {
        const safeContext = context as { shrunkOnce: boolean };
        if (safeContext.shrunkOnce) {
          return Stream.nil();
        }
        return Stream.of(new Value(this.instance(0, value[1] === 1), { shrunkOnce: true }));
      }
    }
    assertProduceCorrectValues(
      () => func(new CloneableArbitrary()),
      (f, args) => {
        const out1 = f(...args);
        const out2 = f(...args);
        expect(out2).toEqual(out1);
        const cloneable = out1[1] === 1;
        if (!cloneable) {
          expect(out2).toBe(out1);
        } else {
          expect(out2).not.toBe(out1);
        }
        expect(hasCloneMethod(out1)).toBe(cloneable);
        expect(hasCloneMethod(out2)).toBe(cloneable);
      },
      { extraParameters: fc.array(fc.anything()) }
    );
  });
});
