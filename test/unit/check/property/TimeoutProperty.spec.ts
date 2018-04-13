import * as assert from 'assert';

import Arbitrary from '../../../../src/check/arbitrary/definition/Arbitrary';
import { asyncProperty } from '../../../../src/check/property/AsyncProperty';
import { TimeoutProperty } from '../../../../src/check/property/TimeoutProperty';

import * as stubArb from '../../stubs/arbitraries';
import * as stubRng from '../../stubs/generators';

describe('TimeoutProperty', () => {
  it('Should not timeout if it succeeds in time', async () => {
    const p = asyncProperty(stubArb.single(0), async (arg: number) => {
      return await new Promise<boolean>(function(resolve, reject) {
        setTimeout(resolve, 0);
      });
    });
    const timeoutProp = new TimeoutProperty(p, 100);
    assert.equal(await timeoutProp.run(timeoutProp.generate(stubRng.mutable.nocall()).value), null);
  });
  it('Should not timeout if it fails in time', async () => {
    const p = asyncProperty(stubArb.single(0), async (arg: number) => {
      return await new Promise<boolean>(function(resolve, reject) {
        setTimeout(() => reject('plop'), 0);
      });
    });
    const timeoutProp = new TimeoutProperty(p, 100);
    assert.equal(await timeoutProp.run(timeoutProp.generate(stubRng.mutable.nocall()).value), 'plop');
  });
  it('Should timeout if it takes to long', async () => {
    const p = asyncProperty(stubArb.single(0), async (arg: number) => {
      return await new Promise<boolean>(function(resolve, reject) {
        setTimeout(resolve, 100);
      });
    });
    const timeoutProp = new TimeoutProperty(p, 0);
    assert.equal(
      await timeoutProp.run(timeoutProp.generate(stubRng.mutable.nocall()).value),
      `Property timeout: exceeded limit of 0 milliseconds`
    );
  });
  it('Should timeout if it never ends', async () => {
    const p = asyncProperty(stubArb.single(0), async (arg: number) => {
      return await new Promise<boolean>(function(resolve, reject) {});
    });
    const timeoutProp = new TimeoutProperty(p, 0);
    assert.equal(
      await timeoutProp.run(timeoutProp.generate(stubRng.mutable.nocall()).value),
      `Property timeout: exceeded limit of 0 milliseconds`
    );
  });
});
