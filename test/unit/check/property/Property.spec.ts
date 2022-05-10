import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { property } from '../../../../src/check/property/Property';
import { pre } from '../../../../src/check/precondition/Pre';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure';
import { configureGlobal, resetConfigureGlobal } from '../../../../src/check/runner/configuration/GlobalParameters';

import * as stubArb from '../../stubs/arbitraries';
import * as stubRng from '../../stubs/generators';
import { fakeArbitrary } from '../../arbitrary/__test-helpers__/ArbitraryHelpers';
import { Value } from '../../../../src/check/arbitrary/definition/Value';
import { Stream } from '../../../../src/stream/Stream';
import { PropertyFailure } from '../../../../src/check/property/IRawProperty';

describe('Property', () => {
  afterEach(() => resetConfigureGlobal());

  it('Should fail if predicate fails', () => {
    const p = property(stubArb.single(8), (_arg: number) => {
      return false;
    });
    expect(p.run(p.generate(stubRng.mutable.nocall()).value)).not.toBe(null); // property fails
  });
  it('Should fail if predicate throws', () => {
    const p = property(stubArb.single(8), (_arg: number) => {
      throw 'predicate throws';
    });
    const out = p.run(p.generate(stubRng.mutable.nocall()).value);
    expect(out).toEqual({
      error: 'predicate throws', // the original error is a string in this test
      errorMessage: 'predicate throws', // the original error results in this message
    });
  });
  it('Should fail if predicate throws an Error', () => {
    let originalError: Error | null = null;
    const p = property(stubArb.single(8), (_arg: number) => {
      originalError = new Error('predicate throws');
      throw originalError;
    });
    const out = p.run(p.generate(stubRng.mutable.nocall()).value);
    expect((out as PropertyFailure).errorMessage).toContain('predicate throws');
    expect((out as PropertyFailure).errorMessage).toContain('\n\nStack trace:');
    expect((out as PropertyFailure).error).toBe(originalError);
  });
  it('Should forward failure of runs with failing precondition', async () => {
    let doNotResetThisValue = false;
    const p = property(stubArb.single(8), (_arg: number) => {
      pre(false);
      doNotResetThisValue = true;
      return false;
    });
    const out = p.run(p.generate(stubRng.mutable.nocall()).value);
    expect(PreconditionFailure.isFailure(out)).toBe(true);
    expect(doNotResetThisValue).toBe(false); // does not run code after the failing precondition
  });
  it('Should succeed if predicate is true', () => {
    const p = property(stubArb.single(8), (_arg: number) => {
      return true;
    });
    expect(p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
  });
  it('Should succeed if predicate does not return anything', () => {
    const p = property(stubArb.single(8), (_arg: number) => {});
    expect(p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
  });
  it('Should call and forward arbitraries one time', () => {
    let oneCallToPredicate = false;
    const arbs: [
      stubArb.SingleUseArbitrary<number>,
      stubArb.SingleUseArbitrary<string>,
      stubArb.SingleUseArbitrary<string>
    ] = [stubArb.single(3), stubArb.single('hello'), stubArb.single('world')];
    const p = property(arbs[0], arbs[1], arbs[2], (arg1: number, _arb2: string, _arg3: string) => {
      if (oneCallToPredicate) {
        throw 'Predicate has already been evaluated once';
      }
      oneCallToPredicate = true;
      return arg1 === arbs[0].id;
    });
    expect(oneCallToPredicate).toBe(false); // property creation does not trigger call to predicate
    for (let idx = 0; idx !== arbs.length; ++idx) {
      expect(arbs[idx].calledOnce).toBe(false); // property creation does not trigger call to generator #${idx + 1}
    }
    expect(p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
    expect(oneCallToPredicate).toBe(true);
    for (let idx = 0; idx !== arbs.length; ++idx) {
      expect(arbs[idx].calledOnce).toBe(true); //  Generator #${idx + 1} called by run
    }
  });
  it('Should throw on invalid arbitrary', () =>
    expect(() => property(stubArb.single(8), stubArb.single(8), {} as Arbitrary<any>, () => {})).toThrowError());
  it('Should use the unbiased arbitrary by default', () => {
    const { instance, generate } = fakeArbitrary<number>();
    generate.mockReturnValue(new Value(69, undefined));
    const mrng = stubRng.mutable.nocall();

    const p = property(instance, () => {});
    expect(generate).not.toHaveBeenCalled();

    expect(p.generate(mrng).value).toEqual([69]);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledWith(mrng, undefined);
  });
  it('Should use the biased arbitrary when asked to', () => {
    const { instance, generate } = fakeArbitrary<number>();
    generate.mockReturnValue(new Value(42, undefined));
    const mrng = stubRng.mutable.nocall();

    const p = property(instance, () => {});
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
  it('Should always execute beforeEach before the test', () => {
    const prob = { beforeEachCalled: false };
    const p = property(stubArb.single(8), (_arg: number) => {
      const beforeEachCalled = prob.beforeEachCalled;
      prob.beforeEachCalled = false;
      return beforeEachCalled;
    })
      .beforeEach((globalBeforeEach) => {
        prob.beforeEachCalled = false;
        globalBeforeEach();
      })
      .beforeEach((previousBeforeEach) => {
        previousBeforeEach();
        prob.beforeEachCalled = true;
      });
    expect(p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
  });
  it('Should execute both global and local beforeEach hooks before the test', () => {
    const globalBeforeEach = jest.fn();
    const prob = { beforeEachCalled: false };
    configureGlobal({
      beforeEach: globalBeforeEach,
    });
    const p = property(stubArb.single(8), (_arg: number) => {
      const beforeEachCalled = prob.beforeEachCalled;
      prob.beforeEachCalled = false;
      return beforeEachCalled;
    }).beforeEach((globalBeforeEach) => {
      prob.beforeEachCalled = true;
      globalBeforeEach();
    });
    expect(p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
    expect(globalBeforeEach).toBeCalledTimes(1);
  });
  it('Should use global beforeEach as default if specified', () => {
    const prob = { beforeEachCalled: false };
    configureGlobal({
      beforeEach: () => (prob.beforeEachCalled = true),
    });
    const p = property(stubArb.single(8), (_arg: number) => {
      const beforeEachCalled = prob.beforeEachCalled;
      prob.beforeEachCalled = false;
      return beforeEachCalled;
    });
    expect(p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
  });
  it('should fail if global asyncBeforeEach has been set', () => {
    configureGlobal({
      asyncBeforeEach: () => {},
    });
    expect(() => property(stubArb.single(8), (_arg: number) => {})).toThrowError(
      '"asyncBeforeEach" can\'t be set when running synchronous properties'
    );
  });
  it('Should execute afterEach after the test on success', () => {
    const callOrder: string[] = [];
    const p = property(stubArb.single(8), (_arg: number) => {
      callOrder.push('test');
      return true;
    })
      .afterEach((globalAfterEach) => {
        callOrder.push('afterEach');
        globalAfterEach();
      })
      .afterEach((previousAfterEach) => {
        previousAfterEach();
        callOrder.push('after afterEach');
      });
    expect(p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
    expect(callOrder).toEqual(['test', 'afterEach', 'after afterEach']);
  });
  it('Should execute afterEach after the test on failure', () => {
    const callOrder: string[] = [];
    const p = property(stubArb.single(8), (_arg: number) => {
      callOrder.push('test');
      return false;
    }).afterEach(() => callOrder.push('afterEach'));
    expect(p.run(p.generate(stubRng.mutable.nocall()).value)).not.toBe(null);
    expect(callOrder).toEqual(['test', 'afterEach']);
  });
  it('Should execute afterEach after the test on uncaught exception', () => {
    const callOrder: string[] = [];
    const p = property(stubArb.single(8), (_arg: number) => {
      callOrder.push('test');
      throw new Error('uncaught');
    }).afterEach(() => callOrder.push('afterEach'));
    expect(p.run(p.generate(stubRng.mutable.nocall()).value)).not.toBe(null);
    expect(callOrder).toEqual(['test', 'afterEach']);
  });
  it('Should use global afterEach as default if specified', () => {
    const callOrder: string[] = [];
    configureGlobal({
      afterEach: () => callOrder.push('afterEach'),
    });
    const p = property(stubArb.single(8), (_arg: number) => {
      callOrder.push('test');
      return false;
    });
    expect(p.run(p.generate(stubRng.mutable.nocall()).value)).not.toBe(null);
    expect(callOrder).toEqual(['test', 'afterEach']);
  });
  it('Should execute both global and local afterEach hooks', () => {
    const callOrder: string[] = [];
    configureGlobal({
      afterEach: () => callOrder.push('globalAfterEach'),
    });
    const p = property(stubArb.single(8), (_arg: number) => {
      callOrder.push('test');
      return true;
    }).afterEach((globalAfterEach) => {
      callOrder.push('afterEach');
      globalAfterEach();
    });
    expect(p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
    expect(callOrder).toEqual(['test', 'afterEach', 'globalAfterEach']);
  });
  it('should fail if global asyncAfterEach has been set', () => {
    configureGlobal({
      asyncAfterEach: () => {},
    });
    expect(() => property(stubArb.single(8), (_arg: number) => {})).toThrowError(
      '"asyncAfterEach" can\'t be set when running synchronous properties'
    );
  });
  it('should not call shrink on the arbitrary if no context and not unhandled value', () => {
    // Arrange
    const { instance: arb, shrink, canShrinkWithoutContext } = fakeArbitrary();
    canShrinkWithoutContext.mockReturnValue(false);
    const value = Symbol();

    // Act
    const p = property(arb, jest.fn());
    const shrinks = p.shrink(new Value([value], undefined)); // context=undefined in the case of user defined values

    // Assert
    expect(canShrinkWithoutContext).toHaveBeenCalledWith(value);
    expect(canShrinkWithoutContext).toHaveBeenCalledTimes(1);
    expect(shrink).not.toHaveBeenCalled();
    expect([...shrinks]).toEqual([]);
  });
  it('should call shrink on the arbitrary if no context but properly handled value', () => {
    // Arrange
    const { instance: arb, shrink, canShrinkWithoutContext } = fakeArbitrary();
    canShrinkWithoutContext.mockReturnValue(true);
    const s1 = Symbol();
    const s2 = Symbol();
    shrink.mockReturnValue(Stream.of(new Value<symbol>(s1, undefined), new Value(s2, undefined)));
    const value = Symbol();

    // Act
    const p = property(arb, jest.fn());
    const shrinks = p.shrink(new Value([value], undefined)); // context=undefined in the case of user defined values

    // Assert
    expect(canShrinkWithoutContext).toHaveBeenCalledWith(value);
    expect(canShrinkWithoutContext).toHaveBeenCalledTimes(1);
    expect(shrink).toHaveBeenCalledWith(value, undefined);
    expect(shrink).toHaveBeenCalledTimes(1);
    expect([...shrinks].map((s) => s.value_)).toEqual([[s1], [s2]]);
  });
});
