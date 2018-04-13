import * as assert from 'power-assert';

import Arbitrary from '../../../../src/check/arbitrary/definition/Arbitrary';
import { asyncProperty } from '../../../../src/check/property/AsyncProperty';

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
  it('Should fail if predicate fails on asserts', async () => {
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {
      assert.ok(false);
    });
    let expected = '';
    try {
      assert.ok(false);
    } catch (err) {
      expected = `${err}`;
    }

    const out = await p.run(p.generate(stubRng.mutable.nocall()).value);
    assert.ok(out!.startsWith(expected), 'Property should fail and attach the exception as string');
    assert.ok(out!.indexOf('\n\nStack trace:') !== -1, 'Property should include the stack trace when available');
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
    let resolvePromise: ((boolean) => void) = null;
    const p = asyncProperty(stubArb.single(8), async (arg: number) => {
      return await new Promise<boolean>(function(resolve, reject) {
        resolvePromise = resolve;
      });
    });
    const runner: Promise<string> = p.run(p.generate(stubRng.mutable.nocall()).value);
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
});
