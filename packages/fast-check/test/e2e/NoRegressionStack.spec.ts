import fc from '../../src/fast-check';

const settings = { seed: 42, verbose: 0 };

describe(`NoRegressionStack`, () => {
  it('throw', () => {
    expect(() =>
      fc.assert(
        fc.property(fc.nat(), fc.nat(), (a, b) => {
          if (a < b) {
            throw new Error('a must be >= b');
          }
        }),
        settings
      )
    ).toThrowErrorMatchingSnapshot();
  });

  it('expect', () => {
    expect(() =>
      fc.assert(
        fc.property(fc.nat(), fc.nat(), (a, b) => {
          expect(a).toBeGreaterThanOrEqual(b);
        }),
        settings
      )
    ).toThrowErrorMatchingSnapshot();
  });

  it('not a function', () => {
    expect(() =>
      fc.assert(
        fc.property(fc.nat(), (v) => {
          (v as any)();
        }),
        settings
      )
    ).toThrowErrorMatchingSnapshot();
  });
});
