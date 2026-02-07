import { describe, it, expect } from 'vitest';
import { pre } from '../../../../src/check/precondition/Pre.js';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure.js';
import * as fc from 'fast-check';

describe('pre', () => {
  it('should not throw on thruthy condition', () => {
    expect(() => pre(true)).not.toThrow();
  });
  it('should throw a PreconditionFailure on falsy condition', () => {
    let failed = false;
    try {
      pre(false);
    } catch (err) {
      failed = true;
      expect(PreconditionFailure.isFailure(err)).toBe(true);
    }
    expect(failed).toBe(true);
  });
  it('should understand PreconditionFailure thrown by another instance of fast-check', () => {
    let failed = false;
    try {
      fc.pre(false);
    } catch (err) {
      failed = true;
      expect(PreconditionFailure.isFailure(err)).toBe(true);
    }
    expect(failed).toBe(true);
  });
});
