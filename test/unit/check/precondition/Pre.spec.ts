import { pre } from '../../../../src/check/precondition/Pre';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure';
import * as assert from 'assert';

describe('pre', () => {
  it('should not throw on thruthy condition', () => {
    assert.doesNotThrow(() => pre(true));
  });
  it('should throw a PreconditionFailure on falsy condition', () => {
    let failed = false;
    try {
      pre(false);
    } catch (err) {
      failed = true;
      assert.ok(PreconditionFailure.isFailure(err));
    }
    assert.ok(failed);
  });
});
