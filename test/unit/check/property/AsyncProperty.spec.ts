import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { Shrinkable } from '../../../../src/check/arbitrary/definition/Shrinkable';
import { asyncProperty } from '../../../../src/check/property/AsyncProperty';
import { pre } from '../../../../src/check/precondition/Pre';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure';

import * as stubArb from '../../stubs/arbitraries';
import * as stubRng from '../../stubs/generators';

describe('AsyncProperty', () => {
  it('Should fail if predicate fails', async () => {
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {
      return false;
    });
    expect(await p.run(p.generate(stubRng.mutable.nocall()).value)).not.toBe(null); // property fails
  });
  it('Should fail if predicate throws', async () => {
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {
      throw 'predicate throws';
    });
    expect(await p.run(p.generate(stubRng.mutable.nocall()).value)).toEqual('predicate throws');
  });
  it('Should fail if predicate throws an Error', async () => {
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {
      throw new Error('predicate throws');
    });
    const out = await p.run(p.generate(stubRng.mutable.nocall()).value);
    expect(out).toContain('predicate throws');
    expect(out).toContain('\n\nStack trace:');
  });
  it('Should forward failure of runs with failing precondition', async () => {
    let doNotResetThisValue: boolean = false;
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {
      pre(false);
      doNotResetThisValue = true;
      return false;
    });
    const out = await p.run(p.generate(stubRng.mutable.nocall()).value);
    expect(PreconditionFailure.isFailure(out)).toBe(true);
    expect(doNotResetThisValue).toBe(false); // does not run code after the failing precondition
  });
  it('Should succeed if predicate is true', async () => {
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {
      return true;
    });
    expect(await p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
  });
  it('Should succeed if predicate does not return anything', async () => {
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {});
    expect(await p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
  });
  it('Should wait until completion of the check to follow', async () => {
    const delay = () => new Promise((resolve, reject) => setTimeout(resolve, 0));

    let runnerHasCompleted = false;
    let resolvePromise: (t: boolean) => void = (null as any) as ((t: boolean) => void);
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {
      return await new Promise<boolean>(function(resolve, reject) {
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
      asyncProperty(stubArb.single(8), stubArb.single(8), <Arbitrary<any>>{}, async () => {})
    ).toThrowError());

  it('Should use the unbiased arbitrary by default', () => {
    const p = asyncProperty(
      new (class extends Arbitrary<number> {
        generate(): Shrinkable<number> {
          return new Shrinkable(69);
        }
        withBias(): Arbitrary<number> {
          throw 'Should not call withBias if not forced to';
        }
      })(),
      async () => {}
    );
    expect(p.generate(stubRng.mutable.nocall()).value).toEqual([69]);
  });
  it('Should use the biased arbitrary when asked to', () => {
    const p = asyncProperty(
      new (class extends Arbitrary<number> {
        generate(): Shrinkable<number> {
          return new Shrinkable(69);
        }
        withBias(freq: number): Arbitrary<number> {
          if (typeof freq !== 'number' || freq < 2) {
            throw new Error(`freq atribute must always be superior or equal to 2, got: ${freq}`);
          }
          return new (class extends Arbitrary<number> {
            generate(): Shrinkable<number> {
              return new Shrinkable(42);
            }
          })();
        }
      })(),
      async () => {}
    );
    expect(p.generate(stubRng.mutable.nocall(), 0).value).toEqual([42]);
    expect(p.generate(stubRng.mutable.nocall(), 2).value).toEqual([42]);
  });
  it('Should always execute beforeEach before the test', async () => {
    const prob = { beforeEachCalled: false };
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {
      const beforeEachCalled = prob.beforeEachCalled;
      prob.beforeEachCalled = false;
      return beforeEachCalled;
    }).beforeEach(async () => {
      prob.beforeEachCalled = true;
    });
    expect(await p.run(p.generate(stubRng.mutable.nocall()).value)).toBe(null);
  });
  it('Should execute afterEach after the test on success', async () => {
    const callOrder: string[] = [];
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {
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
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {
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
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {
      callOrder.push('test');
      throw new Error('uncaught');
    }).afterEach(async () => {
      callOrder.push('afterEach');
    });
    expect(await p.run(p.generate(stubRng.mutable.nocall()).value)).not.toBe(null);
    expect(callOrder).toEqual(['test', 'afterEach']);
  });
});
