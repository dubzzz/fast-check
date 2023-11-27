import fc from '../../src/fast-check';
import { runWithSanitizedStack } from './__test-helpers__/StackSanitizer';

const settings = { seed: 42, verbose: 0 };

describe(`NoRegressionStack`, () => {
  it('throw', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.nat(), fc.nat(), (a, b) => {
            if (a < b) {
              throw new Error('a must be >= b');
            }
          }),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });

  it('not a function', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.nat(), (v) => {
            (v as any)();
          }),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
});
