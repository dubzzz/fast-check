import * as assert from 'assert';

import Arbitrary from '../../../../src/check/arbitrary/definition/Arbitrary';
import Shrinkable from '../../../../src/check/arbitrary/definition/Shrinkable';
import IProperty from '../../../../src/check/property/IProperty';
import { UnbiasedProperty } from '../../../../src/check/property/UnbiasedProperty';

import * as stubRng from '../../stubs/generators';

describe('UnbiasedProperty', () => {
  it('Should forward parameters correctly (asynchronous property)', () => {
    let calledWithRunId: number | undefined = undefined;
    const pAsync = new class implements IProperty<number> {
      isAsync = () => true;
      generate = (mrng: any, runId?: number) => {
        calledWithRunId = runId;
        return new Shrinkable(42);
      };
      run = (v: number) => 'pAsync:' + v;
    }();

    const unbiasedAsyncProp = new UnbiasedProperty(pAsync);

    assert.equal(unbiasedAsyncProp.isAsync(), true);
    assert.equal(unbiasedAsyncProp.generate(stubRng.mutable.nocall()).value, 42);
    assert.strictEqual(calledWithRunId, undefined);
    assert.equal(unbiasedAsyncProp.generate(stubRng.mutable.nocall(), 52).value, 42);
    assert.strictEqual(calledWithRunId, undefined);
    assert.equal(unbiasedAsyncProp.run(47), 'pAsync:47');
  });
  it('Should forward parameters correctly (synchronous property)', () => {
    let calledWithRunId: number | undefined = undefined;
    const pSync = new class implements IProperty<number> {
      isAsync = () => false;
      generate = (mrng: any, runId?: number) => {
        calledWithRunId = runId;
        return new Shrinkable(48);
      };
      run = (v: number) => 'pSync:' + v;
    }();

    const unbiasedSyncProp = new UnbiasedProperty(pSync);

    assert.equal(unbiasedSyncProp.isAsync(), false);
    assert.equal(unbiasedSyncProp.generate(stubRng.mutable.nocall()).value, 48);
    assert.strictEqual(calledWithRunId, undefined);
    assert.equal(unbiasedSyncProp.generate(stubRng.mutable.nocall(), 52).value, 48);
    assert.strictEqual(calledWithRunId, undefined);
    assert.equal(unbiasedSyncProp.run(29), 'pSync:29');
  });
});
