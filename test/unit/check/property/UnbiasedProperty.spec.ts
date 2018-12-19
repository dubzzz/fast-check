import { Shrinkable } from '../../../../src/check/arbitrary/definition/Shrinkable';
import { IProperty } from '../../../../src/check/property/IProperty';
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

    expect(unbiasedAsyncProp.isAsync()).toBe(true);
    expect(unbiasedAsyncProp.generate(stubRng.mutable.nocall()).value).toEqual(42);
    expect(calledWithRunId).toBe(undefined);
    expect(unbiasedAsyncProp.generate(stubRng.mutable.nocall(), 52).value).toEqual(42);
    expect(calledWithRunId).toBe(undefined);
    expect(unbiasedAsyncProp.run(47)).toEqual('pAsync:47');
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

    expect(unbiasedSyncProp.isAsync()).toBe(false);
    expect(unbiasedSyncProp.generate(stubRng.mutable.nocall()).value).toEqual(48);
    expect(calledWithRunId).toBe(undefined);
    expect(unbiasedSyncProp.generate(stubRng.mutable.nocall(), 52).value).toEqual(48);
    expect(calledWithRunId).toBe(undefined);
    expect(unbiasedSyncProp.run(29)).toEqual('pSync:29');
  });
});
