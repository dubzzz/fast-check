import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { asyncProperty } from '../../../../src/check/property/AsyncProperty';
import { pre } from '../../../../src/check/precondition/Pre';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure';
import { configureGlobal, resetConfigureGlobal } from '../../../../src/check/runner/configuration/GlobalParameters';

import * as stubArb from '../../stubs/arbitraries';
import * as stubRng from '../../stubs/generators';
import { NextValue } from '../../../../src/check/arbitrary/definition/NextValue';
import { fakeNextArbitrary } from '../../arbitrary/__test-helpers__/NextArbitraryHelpers';
import { Stream } from '../../../../src/stream/Stream';

describe('AsyncProperty', () => {
  afterEach(() => resetConfigureGlobal());

  it('Should fail if predicate fails', async () => {
    const p = asyncProperty(stubArb.single(8), async (_arg: number) => {
      return false;
    });
    expect(await p.run(p.generate(stubRng.mutable.nocall()).value)).not.toBe(null); // property fails
  });
  it('Should fail if predicate throws', async () => {
    const p = asyncProperty(stubArb.single(8), async (_arg: number) => {
      throw 'predicate throws';
    });
    expect(await p.run(p.generate(stubRng.mutable.nocall()).value)).toEqual('predicate throws');
  });
  it('Should fail if predicate throws an Error', async () => {
    const p = asyncProperty(stubArb.single(8), async (_arg: number) => {
      throw new Error('predicate throws');
    });
    const out = await p.run(p.generate(stubRng.mutable.nocall()).value);
    expect(out).toContain('predicate throws');
    expect(out).toContain('\n\nStack trace:');
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
    runner.then(() => (runnerHasCompleted = true));

    await delay(); // give back the control for other threads
    expect(runnerHasCompleted).toBe(false);

    resolvePromise(true);
    await delay(); // give back the control for other threads
    expect(runnerHasCompleted).toBe(true);
    expect(await runner).toBe(null); // property success
  });
  it('Should throw on invalid arbitrary', () =>
    expect(() =>
      asyncProperty(stubArb.single(8), stubArb.single(8), {} as Arbitrary<any>, async () => {})
    ).toThrowError());

  it('Should use the unbiased arbitrary by default', () => {
    const { instance, generate } = fakeNextArbitrary<number>();
    generate.mockReturnValue(new NextValue(42, undefined));
    const mrng = stubRng.mutable.nocall();

    const p = asyncProperty(instance, async () => {});
    expect(generate).not.toHaveBeenCalled();

    expect(p.generate(mrng).value).toEqual([69]);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledWith(mrng, undefined);
  });
  it('Should use the biased arbitrary when asked to', () => {
    const { instance, generate } = fakeNextArbitrary<number>();
    generate.mockReturnValue(new NextValue(42, undefined));
    const mrng = stubRng.mutable.nocall();

    const p = asyncProperty(instance, async () => {});
    expect(generate).not.toHaveBeenCalled();

    expect(p.generate(mrng, 0).value).toEqual([42]);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledWith(mrng, 0);

    expect(p.generate(stubRng.mutable.nocall(), 2).value).toEqual([42]);
    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate).toHaveBeenCalledWith(mrng, 2);
  });
  it('Should always execute beforeEach before the test', async () => {
    const prob = { beforeEachCalled: false };
    const p = asyncProperty(stubArb.single(8), async (_arg: number) => {
      const beforeEachCalled = prob.beforeEachCalled;
      prob.beforeEachCalled = false;
      return beforeEachCalled;
    }).beforeEach(async (globalBeforeEach) => {
      prob.beforeEachCalled = true;
      await globalBeforeEach();
    });
    expect(await p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
  });
  it('Should execute both global and local beforeEach hooks before the test', async () => {
    const globalAsyncBeforeEach = jest.fn();
    const prob = { beforeEachCalled: false };
    configureGlobal({
      asyncBeforeEach: globalAsyncBeforeEach,
    });
    const p = asyncProperty(stubArb.single(8), async (_arg: number) => {
      const beforeEachCalled = prob.beforeEachCalled;
      prob.beforeEachCalled = false;
      return beforeEachCalled;
    })
      .beforeEach(async (globalBeforeEach) => {
        prob.beforeEachCalled = false;
        await globalBeforeEach();
      })
      .beforeEach(async (previousBeforeEach) => {
        await previousBeforeEach();
        prob.beforeEachCalled = true;
      });
    expect(await p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
    expect(globalAsyncBeforeEach).toBeCalledTimes(1);
  });
  it('Should use global asyncBeforeEach as default if specified', async () => {
    const prob = { beforeEachCalled: false };
    configureGlobal({
      asyncBeforeEach: () => (prob.beforeEachCalled = true),
    });
    const p = asyncProperty(stubArb.single(8), async (_arg: number) => {
      const beforeEachCalled = prob.beforeEachCalled;
      prob.beforeEachCalled = false;
      return beforeEachCalled;
    });
    expect(await p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
  });
  it('Should use global beforeEach as default if specified', async () => {
    const prob = { beforeEachCalled: false };
    configureGlobal({
      beforeEach: () => (prob.beforeEachCalled = true),
    });
    const p = asyncProperty(stubArb.single(8), async (_arg: number) => {
      const beforeEachCalled = prob.beforeEachCalled;
      prob.beforeEachCalled = false;
      return beforeEachCalled;
    });
    expect(await p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
  });
  it('Should fail if both global asyncBeforeEach and beforeEach are specified', () => {
    configureGlobal({
      asyncBeforeEach: () => {},
      beforeEach: () => {},
    });
    expect(() => asyncProperty(stubArb.single(8), async () => {})).toThrowError(
      'Global "asyncBeforeEach" and "beforeEach" parameters can\'t be set at the same time when running async properties'
    );
  });
  it('Should execute afterEach after the test on success', async () => {
    const callOrder: string[] = [];
    const p = asyncProperty(stubArb.single(8), async (_arg: number) => {
      callOrder.push('test');
      return true;
    }).afterEach(async () => {
      callOrder.push('afterEach');
    });
    expect(await p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
    expect(callOrder).toEqual(['test', 'afterEach']);
  });
  it('Should execute afterEach after the test on failure', async () => {
    const callOrder: string[] = [];
    const p = asyncProperty(stubArb.single(8), async (_arg: number) => {
      callOrder.push('test');
      return false;
    }).afterEach(async () => {
      callOrder.push('afterEach');
    });
    expect(await p.run(p.generate(stubRng.mutable.nocall()).value)).not.toBe(null);
    expect(callOrder).toEqual(['test', 'afterEach']);
  });
  it('Should execute afterEach after the test on uncaught exception', async () => {
    const callOrder: string[] = [];
    const p = asyncProperty(stubArb.single(8), async (_arg: number) => {
      callOrder.push('test');
      throw new Error('uncaught');
    }).afterEach(async () => {
      callOrder.push('afterEach');
    });
    expect(await p.run(p.generate(stubRng.mutable.nocall()).value)).not.toBe(null);
    expect(callOrder).toEqual(['test', 'afterEach']);
  });
  it('Should use global asyncAfterEach as default if specified', async () => {
    const callOrder: string[] = [];
    configureGlobal({
      asyncAfterEach: async () => callOrder.push('globalAsyncAfterEach'),
    });
    const p = asyncProperty(stubArb.single(8), async (_arg: number) => {
      callOrder.push('test');
      return false;
    });
    expect(await p.run(p.generate(stubRng.mutable.nocall()).value)).not.toBe(null);
    expect(callOrder).toEqual(['test', 'globalAsyncAfterEach']);
  });
  it('Should use global afterEach as default if specified', async () => {
    const callOrder: string[] = [];
    configureGlobal({
      afterEach: async () => callOrder.push('globalAfterEach'),
    });
    const p = asyncProperty(stubArb.single(8), async (_arg: number) => {
      callOrder.push('test');
      return false;
    });
    expect(await p.run(p.generate(stubRng.mutable.nocall()).value)).not.toBe(null);
    expect(callOrder).toEqual(['test', 'globalAfterEach']);
  });
  it('Should execute both global and local afterEach hooks', async () => {
    const callOrder: string[] = [];
    configureGlobal({
      asyncAfterEach: async () => callOrder.push('globalAsyncAfterEach'),
    });
    const p = asyncProperty(stubArb.single(8), async (_arg: number) => {
      callOrder.push('test');
      return true;
    })
      .afterEach(async (globalAfterEach) => {
        callOrder.push('afterEach');
        await globalAfterEach();
      })
      .afterEach(async (previousAfterEach) => {
        await previousAfterEach();
        callOrder.push('after afterEach');
      });
    expect(await p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
    expect(callOrder).toEqual(['test', 'afterEach', 'globalAsyncAfterEach', 'after afterEach']);
  });
  it('Should fail if both global asyncAfterEach and afterEach are specified', () => {
    configureGlobal({
      asyncAfterEach: () => {},
      afterEach: () => {},
    });
    expect(() => asyncProperty(stubArb.single(8), async () => {})).toThrowError(
      'Global "asyncAfterEach" and "afterEach" parameters can\'t be set at the same time when running async properties'
    );
  });
  it('should not call shrink on the arbitrary if no context and not unhandled value', () => {
    // Arrange
    const { instance: arb, shrink, canShrinkWithoutContext } = fakeNextArbitrary();
    canShrinkWithoutContext.mockReturnValue(false);
    const value = Symbol();

    // Act
    const p = asyncProperty(arb, jest.fn());
    const shrinks = p.shrink(new NextValue([value], undefined)); // context=undefined in the case of user defined values

    // Assert
    expect(canShrinkWithoutContext).toHaveBeenCalledWith(value);
    expect(canShrinkWithoutContext).toHaveBeenCalledTimes(1);
    expect(shrink).not.toHaveBeenCalled();
    expect([...shrinks]).toEqual([]);
  });
  it('should call shrink on the arbitrary if no context but properly handled value', () => {
    // Arrange
    const { instance: arb, shrink, canShrinkWithoutContext } = fakeNextArbitrary();
    canShrinkWithoutContext.mockReturnValue(true);
    const s1 = Symbol();
    const s2 = Symbol();
    shrink.mockReturnValue(Stream.of(new NextValue<symbol>(s1, undefined), new NextValue(s2, undefined)));
    const value = Symbol();

    // Act
    const p = asyncProperty(arb, jest.fn());
    const shrinks = p.shrink(new NextValue([value], undefined)); // context=undefined in the case of user defined values

    // Assert
    expect(canShrinkWithoutContext).toHaveBeenCalledWith(value);
    expect(canShrinkWithoutContext).toHaveBeenCalledTimes(1);
    expect(shrink).toHaveBeenCalledWith(value, undefined);
    expect(shrink).toHaveBeenCalledTimes(1);
    expect([...shrinks].map((s) => s.value_)).toEqual([[s1], [s2]]);
  });
});
