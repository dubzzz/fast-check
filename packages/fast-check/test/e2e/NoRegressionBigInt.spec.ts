import fc from '../../src/fast-check';
//declare function BigInt(n: number | bigint | string): bigint;

const testFunc = (value: unknown) => {
  const repr = fc.stringify(value).replace(/^(|Big)(Int|Uint|Float)(8|16|32|64)(|Clamped)Array\.from\((.*)\)$/, '$5');
  for (let idx = 1; idx < repr.length; ++idx) {
    if (repr[idx - 1] === repr[idx] && repr[idx] !== '"') {
      return false;
    }
  }
  return true;
};

describe(`NoRegression BigInt`, () => {
  if (typeof BigInt === 'undefined') {
    it('no test', () => {
      expect(true).toBe(true);
    });
    return;
  }

  // Only runtimes with support for BigInt will reach that point
  // Adding those tests into NoRegression.spec.ts would require a specific snapshot for each version of node
  const settings = { seed: 42, verbose: 2 };

  it('bigIntN', () => {
    expect(() =>
      fc.assert(
        fc.property(fc.bigIntN(100), (v) => testFunc(v)),
        settings
      )
    ).toThrowErrorMatchingSnapshot();
  });
  it('bigUintN', () => {
    expect(() =>
      fc.assert(
        fc.property(fc.bigUintN(100), (v) => testFunc(v)),
        settings
      )
    ).toThrowErrorMatchingSnapshot();
  });
  it('bigInt', () => {
    expect(() =>
      fc.assert(
        fc.property(fc.bigInt(), (v) => testFunc(v)),
        settings
      )
    ).toThrowErrorMatchingSnapshot();
  });
  it('bigInt({min})', () => {
    expect(() =>
      fc.assert(
        fc.property(fc.bigInt({ min: BigInt(1) << BigInt(16) }), (v) => testFunc(v)),
        settings
      )
    ).toThrowErrorMatchingSnapshot();
  });
  it('bigInt({max})', () => {
    expect(() =>
      fc.assert(
        fc.property(fc.bigInt({ max: BigInt(1) << BigInt(64) }), (v) => testFunc(v)),
        settings
      )
    ).toThrowErrorMatchingSnapshot();
  });
  it('bigInt({min, max})', () => {
    expect(() =>
      fc.assert(
        fc.property(fc.bigInt({ min: BigInt(1) << BigInt(16), max: BigInt(1) << BigInt(64) }), (v) => testFunc(v)),
        settings
      )
    ).toThrowErrorMatchingSnapshot();
  });
  it('bigUint', () => {
    expect(() =>
      fc.assert(
        fc.property(fc.bigUint(), (v) => testFunc(v)),
        settings
      )
    ).toThrowErrorMatchingSnapshot();
  });
  it('bigUint({max})', () => {
    expect(() =>
      fc.assert(
        fc.property(fc.bigUint({ max: BigInt(1) << BigInt(96) }), (v) => testFunc(v)),
        settings
      )
    ).toThrowErrorMatchingSnapshot();
  });
  it('bigInt64Array', () => {
    expect(() =>
      fc.assert(
        fc.property(fc.bigInt64Array(), (v) => testFunc(v)),
        settings
      )
    ).toThrowErrorMatchingSnapshot();
  });
  it('bigUint64Array', () => {
    expect(() =>
      fc.assert(
        fc.property(fc.bigUint64Array(), (v) => testFunc(v)),
        settings
      )
    ).toThrowErrorMatchingSnapshot();
  });
  it('mixedCase', () => {
    expect(() =>
      fc.assert(
        fc.property(fc.mixedCase(fc.constant('cCbAabBAcaBCcCACcABaCAaAabBACaBcBb')), (v) => testFunc(v)),
        settings
      )
    ).toThrowErrorMatchingSnapshot();
  });
  it('mixedCase(stringOf)', () => {
    expect(() =>
      fc.assert(
        fc.property(fc.mixedCase(fc.stringOf(fc.constantFrom('a', 'b', 'c'))), (v) => testFunc(v)),
        settings
      )
    ).toThrowErrorMatchingSnapshot();
  });
});
