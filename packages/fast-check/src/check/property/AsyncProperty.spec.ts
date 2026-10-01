import { describe, it, expect, vi } from 'vitest';
import { asyncProperty } from './AsyncProperty.js';
import { pre } from '../precondition/Pre.js';
import { PreconditionFailure } from '../precondition/PreconditionFailure.js';

import * as stubArb from '../../__test-helpers__/arbitraries.js';
import * as stubRng from '../../__test-helpers__/generators.js';
import { Value } from '../arbitrary/definition/Value.js';
import { fakeArbitrary } from '../../arbitrary/__test-helpers__/ArbitraryHelpers.js';
import type { PropertyFailure } from './types/PropertyFailure.js';
import * as fc from 'fast-check';

describe('AsyncProperty', () => {
  it('Should fail if predicate fails', async () => {
    const p = asyncProperty(stubArb.single(8), async (_arg: number) => {
      return false;
    });
    expect(await p.run(p.generate(stubRng.mutable.nocall()).value)).not.toBe(null); // property fails
  });
  it('Should fail if predicate throws an Error', async () => {
    // Arrange
    let originalError: Error | null = null;
    const p = asyncProperty(stubArb.single(8), async (_arg: number) => {
      originalError = new Error('predicate throws');
      throw originalError;
    });

    // Act
    const out = await p.run(p.generate(stubRng.mutable.nocall()).value);

    // Assert
    expect((out as PropertyFailure).error).toBe(originalError);
  });
  it('Should fail if predicate throws a raw string', async () => {
    // Arrange
    const p = asyncProperty(stubArb.single(8), async (_arg: number) => {
      throw 'predicate throws';
    });

    // Act
    const out = await p.run(p.generate(stubRng.mutable.nocall()).value);

    // Assert
    expect(out).toEqual({
      error: 'predicate throws', // the original error is a string in this test
    });
  });
  it('Should fail if predicate throws anything', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (stuff) => {
        // Arrange
        fc.pre(stuff === null || typeof stuff !== 'object' || !('toString' in stuff));
        const p = asyncProperty(stubArb.single(8), (_arg: number) => {
          throw stuff;
        });

        // Act
        const out = await p.run(p.generate(stubRng.mutable.nocall()).value);

        // Assert
        expect(out).toEqual({ error: stuff });
      }),
    );
  });
  it('Should forward failure of runs with failing precondition', async () => {
    let doNotResetThisValue = false;
    const p = asyncProperty(stubArb.single(8), async (_arg: number) => {
      pre(false);
      doNotResetThisValue = true;
      return false;
    });
    const out = await p.run(p.generate(stubRng.mutable.nocall()).value);
    expect(PreconditionFailure.isFailure(out)).toBe(true);
    expect(doNotResetThisValue).toBe(false); // does not run code after the failing precondition
  });
  it('Should succeed if predicate is true', async () => {
    const p = asyncProperty(stubArb.single(8), async (_arg: number) => {
      return true;
    });
    expect(await p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
  });
  it('Should succeed if predicate does not return anything', async () => {
    const p = asyncProperty(stubArb.single(8), async (_arg: number) => {});
    expect(await p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
  });
  it('Should behave synchronously on run when predicate is synchronous', () => {
    let called = false;
    const p = asyncProperty(stubArb.single(8), (_arg: number) => {
      called = true;
    });
    expect(p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
    expect(called).toBe(true);
  });
  it('Should behave asynchronously on run when predicate is asynchronous', async () => {
    let called = false;
    const p = asyncProperty(stubArb.single(8), async (_arg: number) => {
      called = true;
    });
    const out = p.run(p.generate(stubRng.mutable.nocall()).value);
    expect(out).not.toBe(null);
    expect(called).toBe(true);
    expect(out).toBeInstanceOf(Promise);
    expect(await out).toBe(null);
  });
  it('Should wait until completion of the check to follow', async () => {
    const delay = () => new Promise((resolve) => setTimeout(resolve, 0));

    let runnerHasCompleted = false;
    let resolvePromise: (t: boolean) => void = null as any as (t: boolean) => void;
    const p = asyncProperty(stubArb.single(8), async (_arg: number) => {
      return await new Promise<boolean>(function (resolve) {
        resolvePromise = resolve;
      });
    });
    const runner = p.run(p.generate(stubRng.mutable.nocall()).value);
    expect(runner).toBeInstanceOf(Promise); // run is linked to an async predicate
    (runner as Promise<unknown>).then(() => (runnerHasCompleted = true));

    await delay(); // give back the control for other threads
    expect(runnerHasCompleted).toBe(false);

    resolvePromise(true);
    await delay(); // give back the control for other threads
    expect(runnerHasCompleted).toBe(true);
    expect(await runner).toBe(null); // property success
  });

  it('Should use the unbiased arbitrary by default', () => {
    const { instance, generate } = fakeArbitrary<number>();
    generate.mockReturnValue(new Value(69, undefined));
    const mrng = stubRng.mutable.nocall();

    const p = asyncProperty(instance, async () => {});
    expect(generate).not.toHaveBeenCalled();

    expect(p.generate(mrng).value).toEqual([69]);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledWith(mrng, undefined);
  });
  it('Should use the biased arbitrary when asked to', () => {
    const { instance, generate } = fakeArbitrary<number>();
    generate.mockReturnValue(new Value(42, undefined));
    const mrng = stubRng.mutable.nocall();

    const p = asyncProperty(instance, async () => {});
    expect(generate).not.toHaveBeenCalled();

    const runId1 = 0;
    const expectedBias1 = 2;
    expect(p.generate(mrng, runId1).value).toEqual([42]);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledWith(mrng, expectedBias1);

    const runId2 = 100;
    const expectedBias2 = 4;
    expect(p.generate(stubRng.mutable.nocall(), runId2).value).toEqual([42]);
    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate).toHaveBeenCalledWith(mrng, expectedBias2);
  });
  it('should not call shrink on the arbitrary if no context and not unhandled value', () => {
    // Arrange
    const { instance: arb, shrink, canShrinkWithoutContext } = fakeArbitrary();
    canShrinkWithoutContext.mockReturnValue(false);
    const value = Symbol();

    // Act
    const p = asyncProperty(arb, vi.fn());
    const shrinksStream = p.shrink(new Value([value], undefined)); // context=undefined in the case of user defined values
    expect(canShrinkWithoutContext).not.toHaveBeenCalled(); // lazy evaluation of shrink for tuples
    const shrinks = [...shrinksStream];

    // Assert
    expect(canShrinkWithoutContext).toHaveBeenCalledWith(value);
    expect(canShrinkWithoutContext).toHaveBeenCalledTimes(1);
    expect(shrink).not.toHaveBeenCalled();
    expect(shrinks).toEqual([]);
  });
  it('should call shrink on the arbitrary if no context but properly handled value', () => {
    // Arrange
    const { instance: arb, shrink, canShrinkWithoutContext } = fakeArbitrary();
    canShrinkWithoutContext.mockReturnValue(true);
    const s1 = Symbol();
    const s2 = Symbol();
    shrink.mockReturnValue(Iterator.from([new Value<symbol>(s1, undefined), new Value(s2, undefined)]));
    const value = Symbol();

    // Act
    const p = asyncProperty(arb, vi.fn());
    const shrinksStream = p.shrink(new Value([value], undefined)); // context=undefined in the case of user defined values
    expect(canShrinkWithoutContext).not.toHaveBeenCalled(); // lazy evaluation of shrink for tuples
    expect(shrink).not.toHaveBeenCalled();
    const shrinks = [...shrinksStream];

    // Assert
    expect(canShrinkWithoutContext).toHaveBeenCalledWith(value);
    expect(canShrinkWithoutContext).toHaveBeenCalledTimes(1);
    expect(shrink).toHaveBeenCalledWith(value, undefined);
    expect(shrink).toHaveBeenCalledTimes(1);
    expect(shrinks.map((s) => s.value_)).toEqual([[s1], [s2]]);
  });
});
