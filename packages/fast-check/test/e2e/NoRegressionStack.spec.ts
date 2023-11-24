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
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });

  it('not a function', () => {
    expect(
      sanitize(() =>
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

// Helpers

function sanitize(run: () => void) {
  return () => {
    try {
      run();
    } catch (err) {
      const initialMessage = (err as Error).message;
      const lines = initialMessage
        .replace(/\\/g, '/')
        .replace(/at [^(]*fast-check\/(packages|node_modules)(.*):\d+:\d+/g, 'at $1$2:?:?') // line for the spec file itself
        .replace(/at (.*) \(.*fast-check\/(packages|node_modules)(.*):\d+:\d+\)/g, 'at $1 ($2$3:?:?)') // any import linked to internals of fast-check
        .replace(/at (.*) \(.*\/(\.yarn|Yarn)\/.*\/(node_modules\/.*):\d+:\d+\)/g, 'at $1 ($3:?:?)') // reducing risks of changes on bumps: .yarn (Linux and Mac), Yarn (Windows)
        .split('\n');
      throw new Error(
        lines
          .slice(
            0,
            // internals of jest, subject to regular changes
            // and OS dependent
            lines.findIndex((line) => line.includes('node_modules/jest-circus')),
          )
          .join('\n'),
      );
    }
  };
}
