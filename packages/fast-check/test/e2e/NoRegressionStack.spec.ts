import fc from '../../src/fast-check';

const settings = { seed: 42, verbose: 0 };

describe(`NoRegressionStack`, () => {
  it('throw', () => {
    expect(
      sanitize(() =>
        fc.assert(
          fc.property(fc.nat(), fc.nat(), (a, b) => {
            if (a < b) {
              throw new Error('a must be >= b');
            }
          }),
          settings
        )
      )
    ).toThrowErrorMatchingSnapshot();
  });

  it('not a function', () => {
    expect(
      sanitize(() =>
        fc.assert(
          fc.property(fc.nat(), (v) => {
            (v as any)();
          }),
          settings
        )
      )
    ).toThrowErrorMatchingSnapshot();
  });
});

// Helpers

function sanitize(run: () => void) {
  return () => {
    try {
      run();
    } catch (err) {
      const initialMessage = (err as Error).message;
      throw new Error(
        initialMessage
          .replace(/\\/g, '/')
          .replace(/at [^(]*fast-check\/(packages|node_modules)(.*)/g, 'at $1$2')
          .replace(/at (.*) \(.*fast-check\/(packages|node_modules)(.*)\)/g, 'at $1 ($2$3)')
      );
    }
  };
}
