import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { Shrinkable } from '../../../../src/check/arbitrary/definition/Shrinkable';
import { property } from '../../../../src/check/property/Property';
import { pre } from '../../../../src/check/precondition/Pre';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure';

import * as stubArb from '../../stubs/arbitraries';
import * as stubRng from '../../stubs/generators';

describe('Property', () => {
  it('Should fail if predicate fails', () => {
    const p = property(stubArb.single(8), (arg: number) => {
      return false;
    });
    expect(p.run(p.generate(stubRng.mutable.nocall()).value)).not.toBe(null); // property fails
  });
  it('Should fail if predicate throws', () => {
    const p = property(stubArb.single(8), (arg: number) => {
      throw 'predicate throws';
    });
    const out = p.run(p.generate(stubRng.mutable.nocall()).value);
    expect(out).toEqual('predicate throws');
  });
  it('Should fail if predicate throws an Error', () => {
    const p = property(stubArb.single(8), (arg: number) => {
      throw new Error('predicate throws');
    });
    const out = p.run(p.generate(stubRng.mutable.nocall()).value);
    expect(out).toContain('predicate throws');
    expect(out).toContain('\n\nStack trace:');
  });
  it('Should forward failure of runs with failing precondition', async () => {
    let doNotResetThisValue: boolean = false;
    const p = property(stubArb.single(8), (arg: number) => {
      pre(false);
      doNotResetThisValue = true;
      return false;
    });
    const out = p.run(p.generate(stubRng.mutable.nocall()).value);
    expect(PreconditionFailure.isFailure(out)).toBe(true);
    expect(doNotResetThisValue).toBe(false); // does not run code after the failing precondition
  });
  it('Should succeed if predicate is true', () => {
    const p = property(stubArb.single(8), (arg: number) => {
      return true;
    });
    expect(p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
  });
  it('Should succeed if predicate does not return anything', () => {
    const p = property(stubArb.single(8), (arg: number) => {});
    expect(p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
  });
  it('Should call and forward arbitraries one time', () => {
    let one_call_to_predicate = false;
    const arbs: [
      stubArb.SingleUseArbitrary<number>,
      stubArb.SingleUseArbitrary<string>,
      stubArb.SingleUseArbitrary<string>
    ] = [stubArb.single(3), stubArb.single('hello'), stubArb.single('world')];
    const p = property(arbs[0], arbs[1], arbs[2], (arg1: number, arb2: string, arg3: string) => {
      if (one_call_to_predicate) {
        throw 'Predicate has already been evaluated once';
      }
      one_call_to_predicate = true;
      return arg1 === arbs[0].id;
    });
    expect(one_call_to_predicate).toBe(false); // property creation does not trigger call to predicate
    for (let idx = 0; idx !== arbs.length; ++idx) {
      expect(arbs[idx].called_once).toBe(false); // property creation does not trigger call to generator #${idx + 1}
    }
    expect(p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
    expect(one_call_to_predicate).toBe(true);
    for (let idx = 0; idx !== arbs.length; ++idx) {
      expect(arbs[idx].called_once).toBe(true); //  Generator #${idx + 1} called by run
    }
  });
  it('Should throw on invalid arbitrary', () =>
    expect(() => property(stubArb.single(8), stubArb.single(8), <Arbitrary<any>>{}, () => {})).toThrowError());
  it('Should use the unbiased arbitrary by default', () => {
    const p = property(
      new class extends Arbitrary<number> {
        generate(): Shrinkable<number> {
          return new Shrinkable(69);
        }
        withBias(): Arbitrary<number> {
          throw 'Should not call withBias if not forced to';
        }
      }(),
      () => {}
    );
    expect(p.generate(stubRng.mutable.nocall()).value).toEqual([69]);
  });
  it('Should use the biased arbitrary when asked to', () => {
    const p = property(
      new class extends Arbitrary<number> {
        generate(): Shrinkable<number> {
          return new Shrinkable(69);
        }
        withBias(freq: number): Arbitrary<number> {
          if (typeof freq !== 'number' || freq < 2) {
            throw new Error(`freq atribute must always be superior or equal to 2, got: ${freq}`);
          }
          return new class extends Arbitrary<number> {
            generate(): Shrinkable<number> {
              return new Shrinkable(42);
            }
          }();
        }
      }(),
      () => {}
    );
    expect(p.generate(stubRng.mutable.nocall(), 0).value).toEqual([42]);
    expect(p.generate(stubRng.mutable.nocall(), 2).value).toEqual([42]);
  });
  it('Should always execute beforeEach before the test', () => {
    const prob = { beforeEachCalled: false };
    const p = property(stubArb.single(8), (arg: number) => {
      const beforeEachCalled = prob.beforeEachCalled;
      prob.beforeEachCalled = false;
      return beforeEachCalled;
    }).beforeEach(() => (prob.beforeEachCalled = true));
    expect(p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
  });
  it('Should execute afterEach after the test on success', () => {
    const callOrder: string[] = [];
    const p = property(stubArb.single(8), (arg: number) => {
      callOrder.push('test');
      return true;
    }).afterEach(() => callOrder.push('afterEach'));
    expect(p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
    expect(callOrder).toEqual(['test', 'afterEach']);
  });
  it('Should execute afterEach after the test on failure', () => {
    const callOrder: string[] = [];
    const p = property(stubArb.single(8), (arg: number) => {
      callOrder.push('test');
      return false;
    }).afterEach(() => callOrder.push('afterEach'));
    expect(p.run(p.generate(stubRng.mutable.nocall()).value)).not.toBe(null);
    expect(callOrder).toEqual(['test', 'afterEach']);
  });
  it('Should execute afterEach after the test on uncaught exception', () => {
    const callOrder: string[] = [];
    const p = property(stubArb.single(8), (arg: number) => {
      callOrder.push('test');
      throw new Error('uncaught');
    }).afterEach(() => callOrder.push('afterEach'));
    expect(p.run(p.generate(stubRng.mutable.nocall()).value)).not.toBe(null);
    expect(callOrder).toEqual(['test', 'afterEach']);
  });
});
