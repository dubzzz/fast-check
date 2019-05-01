import fc from '../../src/fast-check';
//declare function BigInt(n: number | bigint | string): bigint;

const testFunc = (value: unknown) => {
  const repr = fc.stringify(value);
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
    expect(() => fc.assert(fc.property(fc.bigIntN(100), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('bigUintN', () => {
    expect(() => fc.assert(fc.property(fc.bigUintN(100), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('bigInt', () => {
    expect(() => fc.assert(fc.property(fc.bigInt(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('bigUint', () => {
    expect(() => fc.assert(fc.property(fc.bigUint(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
});
