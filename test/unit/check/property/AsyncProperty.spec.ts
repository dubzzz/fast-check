import * as assert from 'assert';

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
    assert.notEqual(await p.run(p.generate(stubRng.mutable.nocall()).value), null, 'Property should fail');
  });
  it('Should fail if predicate throws', async () => {
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {
      throw 'predicate throws';
    });
    assert.equal(
      await p.run(p.generate(stubRng.mutable.nocall()).value),
      'predicate throws',
      'Property should fail and attach the exception as string'
    );
  });
  it('Should fail if predicate throws an Error', async () => {
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {
      throw new Error('predicate throws');
    });
    const out = await p.run(p.generate(stubRng.mutable.nocall()).value);
    assert.ok(
      (out as string).indexOf('predicate throws') !== -1,
      'Property should fail and attach the exception as string'
    );
    assert.ok(
      (out as string).indexOf('\n\nStack trace:') !== -1,
      `Property should include the stack trace when available, got: ${out}`
    );
  });
  it('Should forward failure of runs with failing precondition', async () => {
    let doNotResetThisValue: boolean = false;
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {
      pre(false);
      doNotResetThisValue = true;
      return false;
    });
    const out = await p.run(p.generate(stubRng.mutable.nocall()).value);
    assert.ok(PreconditionFailure.isFailure(out));
    assert.ok(!doNotResetThisValue, 'should not execute the code after the failing precondition');
  });
  it('Should succeed if predicate is true', async () => {
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {
      return true;
    });
    assert.equal(await p.run(p.generate(stubRng.mutable.nocall()).value), null, 'Property should succeed');
  });
  it('Should succeed if predicate does not return anything', async () => {
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {});
    assert.equal(await p.run(p.generate(stubRng.mutable.nocall()).value), null, 'Property should succeed');
  });
  it('Should wait until completion of the check to follow', async () => {
    const delay = () => new Promise((resolve, reject) => setTimeout(resolve, 0));

    let runnerHasCompleted = false;
    let resolvePromise: ((t: boolean) => void) = (null as any) as ((t: boolean) => void);
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {
      return await new Promise<boolean>(function(resolve, reject) {
        resolvePromise = resolve;
      });
    });
    const runner = p.run(p.generate(stubRng.mutable.nocall()).value);
    runner.then(() => (runnerHasCompleted = true));

    await delay(); // give back the control for other threads
    assert.equal(runnerHasCompleted, false, 'Runner should not have completed');

    resolvePromise(true);
    await delay(); // give back the control for other threads
    assert.equal(runnerHasCompleted, true, 'Runner should have completed');
    assert.equal(await runner, null, 'Property should succeed');
  });
  it('Should throw on invalid arbitrary', () =>
    assert.throws(() => asyncProperty(stubArb.single(8), stubArb.single(8), <Arbitrary<any>>{}, async () => {})));

  it('Should use the unbiased arbitrary by default', () => {
    const p = asyncProperty(
      new class extends Arbitrary<number> {
        generate(): Shrinkable<number> {
          return new Shrinkable(69);
        }
        withBias(): Arbitrary<number> {
          throw 'Should not call withBias if not forced to';
        }
      }(),
      async () => {}
    );
    assert.equal(p.generate(stubRng.mutable.nocall()).value, 69);
  });
  it('Should use the biased arbitrary when asked to', () => {
    const p = asyncProperty(
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
      async () => {}
    );
    assert.equal(p.generate(stubRng.mutable.nocall(), 0).value, 42);
    assert.equal(p.generate(stubRng.mutable.nocall(), 2).value, 42);
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
    assert.equal(await p.run(p.generate(stubRng.mutable.nocall()).value), null, 'Property should not fail');
  });
  it('Should execute afterEach after the test on success', async () => {
    const callOrder: string[] = [];
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {
      callOrder.push('test');
      return true;
    }).afterEach(async () => {
      callOrder.push('afterEach');
    });
    assert.equal(await p.run(p.generate(stubRng.mutable.nocall()).value), null, 'Property should not fail');
    assert.deepEqual(callOrder, ['test', 'afterEach']);
  });
  it('Should execute afterEach after the test on failure', async () => {
    const callOrder: string[] = [];
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {
      callOrder.push('test');
      return false;
    }).afterEach(async () => {
      callOrder.push('afterEach');
    });
    assert.notEqual(await p.run(p.generate(stubRng.mutable.nocall()).value), null, 'Property should fail');
    assert.deepEqual(callOrder, ['test', 'afterEach']);
  });
  it('Should execute afterEach after the test on uncaught exception', async () => {
    const callOrder: string[] = [];
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {
      callOrder.push('test');
      throw new Error('uncaught');
    }).afterEach(async () => {
      callOrder.push('afterEach');
    });
    assert.notEqual(await p.run(p.generate(stubRng.mutable.nocall()).value), null, 'Property should fail');
    assert.deepEqual(callOrder, ['test', 'afterEach']);
  });
});
