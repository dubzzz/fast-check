import { describe, it, expect } from 'vitest';
import fc from '../../src/fast-check.js';
import { asyncRunWithSanitizedStack } from './__test-helpers__/StackSanitizer.js';

const settings = { seed: 42, verbose: 0 };

describe(`NoRegressionStack`, () => {
  it('return false', async () => {
    await expect(
      asyncRunWithSanitizedStack(async () =>
        fc.assert(
          fc.property(fc.nat(), fc.nat(), (a, b) => {
            return a >= b;
          }),
          { ...settings, includeErrorInReport: true },
        ),
      )(),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('return false (with cause)', async () => {
    await expect(
      asyncRunWithSanitizedStack(async () =>
        fc.assert(
          fc.property(fc.nat(), fc.nat(), (a, b) => {
            return a >= b;
          }),
          settings,
        ),
      )(),
    ).rejects.toThrowErrorMatchingSnapshot();
  });
  it('throw', async () => {
    await expect(
      asyncRunWithSanitizedStack(async () =>
        fc.assert(
          fc.property(fc.nat(), fc.nat(), (a, b) => {
            if (a < b) {
              throw new Error('a must be >= b');
            }
          }),
          { ...settings, includeErrorInReport: true },
        ),
      )(),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('throw (with cause)', async () => {
    await expect(
      asyncRunWithSanitizedStack(async () =>
        fc.assert(
          fc.property(fc.nat(), fc.nat(), (a, b) => {
            if (a < b) {
              throw new Error('a must be >= b');
            }
          }),
          settings,
        ),
      )(),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('not a function', async () => {
    await expect(
      asyncRunWithSanitizedStack(async () =>
        fc.assert(
          fc.property(fc.nat(), (v) => {
            (v as any)();
          }),
          { ...settings, includeErrorInReport: true },
        ),
      )(),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('not a function (with cause)', async () => {
    await expect(
      asyncRunWithSanitizedStack(async () =>
        fc.assert(
          fc.property(fc.nat(), (v) => {
            (v as any)();
          }),
          settings,
        ),
      )(),
    ).rejects.toThrowErrorMatchingSnapshot();
  });
});
