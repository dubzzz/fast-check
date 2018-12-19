import { Shrinkable } from '../../../../src/check/arbitrary/definition/Shrinkable';
import { asyncProperty } from '../../../../src/check/property/AsyncProperty';
import { IProperty } from '../../../../src/check/property/IProperty';
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
    expect(await timeoutProp.run(timeoutProp.generate(stubRng.mutable.nocall()).value)).toBe(null);
  });
  it('Should not timeout if it fails in time', async () => {
    const p = asyncProperty(stubArb.single(0), async (arg: number) => {
      return await new Promise<boolean>(function(resolve, reject) {
        setTimeout(() => reject('plop'), 0);
      });
    });
    const timeoutProp = new TimeoutProperty(p, 100);
    expect(await timeoutProp.run(timeoutProp.generate(stubRng.mutable.nocall()).value)).toEqual('plop');
  });
  it('Should timeout if it takes to long', async () => {
    const p = asyncProperty(stubArb.single(0), async (arg: number) => {
      return await new Promise<boolean>(function(resolve, reject) {
        setTimeout(resolve, 100);
      });
    });
    const timeoutProp = new TimeoutProperty(p, 0);
    expect(await timeoutProp.run(timeoutProp.generate(stubRng.mutable.nocall()).value)).toEqual(
      `Property timeout: exceeded limit of 0 milliseconds`
    );
  });
  it('Should timeout if it never ends', async () => {
    const p = asyncProperty(stubArb.single(0), async (arg: number) => {
      return await new Promise<boolean>(function(resolve, reject) {});
    });
    const timeoutProp = new TimeoutProperty(p, 0);
    expect(await timeoutProp.run(timeoutProp.generate(stubRng.mutable.nocall()).value)).toEqual(
      `Property timeout: exceeded limit of 0 milliseconds`
    );
  });
  it('Should forward the frequency to the underlying (when set)', () => {
    let called = false;
    let calledWithRightId = false;
    const p = new class implements IProperty<number> {
      isAsync(): boolean {
        return true;
      }
      generate(mrng: any, runId?: number): Shrinkable<number> {
        called = true;
        calledWithRightId = runId === 50;
        return new Shrinkable(42);
      }
      run(v: number): string | Promise<string> {
        throw new Error('Method not implemented.');
      }
    }();
    const timeoutProp = new TimeoutProperty(p, 0);
    expect(timeoutProp.generate(stubRng.mutable.nocall(), 50).value).toEqual(42);
    expect(called).toBe(true);
    expect(calledWithRightId).toBe(true);
  });
  it('Should forward any frequency if not any', () => {
    let called = false;
    let calledWithRightId = false;
    const p = new class implements IProperty<number> {
      isAsync(): boolean {
        return true;
      }
      generate(mrng: any, runId?: number): Shrinkable<number> {
        called = true;
        calledWithRightId = runId === undefined;
        return new Shrinkable(42);
      }
      run(v: number): string | Promise<string> {
        throw new Error('Method not implemented.');
      }
    }();
    const timeoutProp = new TimeoutProperty(p, 0);
    expect(timeoutProp.generate(stubRng.mutable.nocall()).value).toEqual(42);
    expect(called).toBe(true);
    expect(calledWithRightId).toBe(true);
  });
});
