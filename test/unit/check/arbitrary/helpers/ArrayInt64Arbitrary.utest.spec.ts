import * as fc from '../../../../../lib/fast-check';

import { arrayInt64 as arrayInt64Old } from '../../../../../src/check/arbitrary/helpers/ArrayInt64Arbitrary';
import { ArrayInt64 } from '../../../../../src/check/arbitrary/helpers/ArrayInt64';
import { NextArbitrary } from '../../../../../src/check/arbitrary/definition/NextArbitrary';
import { convertToNext } from '../../../../../src/check/arbitrary/definition/Converters';

import { buildNextShrinkTree, buildShrinkTree, renderTree } from '../generic/ShrinkTree';
import { NextValue } from '../../../../../src/check/arbitrary/definition/NextValue';
import { fakeRandom } from '../generic/RandomHelpers';

function arrayInt64(...args: Parameters<typeof arrayInt64Old>): NextArbitrary<ArrayInt64> {
  return convertToNext(arrayInt64Old(...args));
}

function toArrayInt64(b: bigint, withNegativeZero: boolean): ArrayInt64 {
  const posB = b < BigInt(0) ? -b : b;
  return {
    sign: b < BigInt(0) || (withNegativeZero && b === BigInt(0)) ? -1 : 1,
    data: [Number(posB >> BigInt(32)), Number(posB & ((BigInt(1) << BigInt(32)) - BigInt(1)))],
  };
}

function toBigInt(a: ArrayInt64): bigint {
  return BigInt(a.sign) * ((BigInt(a.data[0]) << BigInt(32)) + BigInt(a.data[1]));
}

describe('arrayInt64', () => {
  if (typeof BigInt === 'undefined') {
    it('no test', () => {
      expect(true).toBe(true);
    });
    return;
  }

  const MinArrayIntValue = -(BigInt(2) ** BigInt(64)) + BigInt(1);
  const MaxArrayIntValue = BigInt(2) ** BigInt(64) - BigInt(1);

  describe('generate', () => {
    it('should always consider the full range when not biased', () =>
      fc.assert(
        fc.property(
          fc.bigInt(MinArrayIntValue, MaxArrayIntValue),
          fc.bigInt(MinArrayIntValue, MaxArrayIntValue),
          fc.bigInt(MinArrayIntValue, MaxArrayIntValue),
          fc.boolean(),
          fc.boolean(),
          (a, b, c, negMin, negMax) => {
            // Arrange
            const [min, mid, max] = [a, b, c].sort((a, b) => Number(a - b));
            const min64 = toArrayInt64(min, negMin);
            const mid64 = toArrayInt64(mid, false);
            const max64 = toArrayInt64(max, negMax);
            const { instance: mrng, nextArrayInt, nextInt } = fakeRandom();
            nextArrayInt.mockReturnValueOnce(mid64);

            // Act
            const arb = arrayInt64(min64, max64);
            const out = arb.generate(mrng, undefined);

            // Assert
            expect(out.value).toBe(mid64);
            expect(nextArrayInt).toHaveBeenCalledTimes(1);
            expect(nextArrayInt).toHaveBeenCalledWith(min64, max64);
            expect(nextInt).not.toHaveBeenCalled();
          }
        )
      ));

    it('should always consider the full range when bias should not apply', () =>
      fc.assert(
        fc.property(
          fc.bigInt(MinArrayIntValue, MaxArrayIntValue),
          fc.bigInt(MinArrayIntValue, MaxArrayIntValue),
          fc.bigInt(MinArrayIntValue, MaxArrayIntValue),
          fc.boolean(),
          fc.boolean(),
          fc.integer({ min: 2 }),
          (a, b, c, negMin, negMax, biasFactor) => {
            // Arrange
            const [min, mid, max] = [a, b, c].sort((a, b) => Number(a - b));
            const min64 = toArrayInt64(min, negMin);
            const mid64 = toArrayInt64(mid, false);
            const max64 = toArrayInt64(max, negMax);
            const { instance: mrng, nextArrayInt, nextInt } = fakeRandom();
            nextArrayInt.mockReturnValueOnce(mid64);
            nextInt.mockImplementationOnce((low, _high) => low + 1); // >low is no bias case

            // Act
            const arb = arrayInt64(min64, max64);
            const out = arb.generate(mrng, biasFactor);

            // Assert
            expect(out.value).toBe(mid64);
            expect(nextArrayInt).toHaveBeenCalledTimes(1);
            expect(nextArrayInt).toHaveBeenCalledWith(min64, max64);
            expect(nextInt).toHaveBeenCalledTimes(1);
            expect(nextInt).toHaveBeenCalledWith(1, biasFactor);
          }
        )
      ));

    it('should consider sub-ranges when bias applies', () =>
      fc.assert(
        fc.property(
          fc.bigInt(MinArrayIntValue, MaxArrayIntValue),
          fc.bigInt(MinArrayIntValue, MaxArrayIntValue),
          fc.boolean(),
          fc.boolean(),
          fc.integer({ min: 2 }),
          fc.nat(),
          (a, b, negMin, negMax, biasFactor, r) => {
            // Arrange
            const [min, max] = a < b ? [a, b] : [b, a];
            fc.pre(max - min >= BigInt(100)); // large enough range (arbitrary value)
            const min64 = toArrayInt64(min, negMin);
            const max64 = toArrayInt64(max, negMax);
            const { instance: mrng, nextArrayInt, nextInt } = fakeRandom();
            nextArrayInt.mockImplementationOnce((low, _high) => low);
            nextInt
              .mockImplementationOnce((low, _high) => low) // low is bias case for first call
              .mockImplementationOnce((low, high) => low + (r % (high - low + 1))); // random inside the provided range (bias selection step)

            // Act
            const arb = arrayInt64(min64, max64);
            arb.generate(mrng, biasFactor);

            // Assert
            expect(nextInt).toHaveBeenCalledTimes(2);
            expect(nextArrayInt).toHaveBeenCalledTimes(1);
            expect(nextArrayInt).not.toHaveBeenCalledWith(min64, max64);
            const receivedMin = toBigInt(nextArrayInt.mock.calls[0][0] as ArrayInt64);
            const receivedMax = toBigInt(nextArrayInt.mock.calls[0][1] as ArrayInt64);
            expect(receivedMin).toBeGreaterThanOrEqual(min);
            expect(receivedMin).toBeLessThanOrEqual(max);
            expect(receivedMax).toBeGreaterThanOrEqual(min);
            expect(receivedMax).toBeLessThanOrEqual(max);
          }
        )
      ));
  });

  describe('canGenerate', () => {
    it('should recognize any value it could have generated', () =>
      fc.assert(
        fc.property(
          fc.bigInt(MinArrayIntValue, MaxArrayIntValue),
          fc.bigInt(MinArrayIntValue, MaxArrayIntValue),
          fc.bigInt(MinArrayIntValue, MaxArrayIntValue),
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          (a, b, c, negMin, negMid, negMax) => {
            // Arrange
            const [min, mid, max] = [a, b, c].sort((a, b) => Number(a - b));

            // Act
            const arb = arrayInt64(toArrayInt64(min, negMin), toArrayInt64(max, negMax));
            const out = arb.canGenerate(toArrayInt64(mid, negMid));

            // Assert
            expect(out).toBe(true);
          }
        )
      ));

    it('should reject values outside of its range', () =>
      fc.assert(
        fc.property(
          fc.bigInt(MinArrayIntValue, MaxArrayIntValue),
          fc.bigInt(MinArrayIntValue, MaxArrayIntValue),
          fc.bigInt(MinArrayIntValue, MaxArrayIntValue),
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          fc.constantFrom(...(['lower', 'higher'] as const)),
          (a, b, c, negMin, negSelected, negMax, type) => {
            // Arrange
            const sorted = [a, b, c].sort((a, b) => Number(a - b));
            const [min, max, selected] =
              type === 'lower' ? [sorted[1], sorted[2], sorted[0]] : [sorted[0], sorted[1], sorted[2]];
            fc.pre(selected < min || selected > max);

            // Act
            const arb = arrayInt64(toArrayInt64(min, negMin), toArrayInt64(max, negMax));
            const out = arb.canGenerate(toArrayInt64(selected, negSelected));

            // Assert
            expect(out).toBe(false);
          }
        )
      ));
  });

  describe('shrink', () => {
    it('should shrink strictly positive value for positive range including zero', () => {
      // Arrange
      const arb = arrayInt64({ sign: 1, data: [0, 0] }, { sign: 1, data: [0, 10] });
      const source = new NextValue({ sign: 1, data: [0, 8] }); // no context

      // Act
      const tree = buildNextShrinkTree(arb, source);
      const renderedTree = renderTree(tree).join('\n');

      // Assert
      //   When there is no more option, the shrinker retry one time with the value
      //   current-1 to check if something that changed outside (another value not itself)
      //   may have changed the situation
      expect(renderedTree).toMatchInlineSnapshot(`
        "{\\"sign\\":1,\\"data\\":[0,8]}
        ├> {\\"sign\\":1,\\"data\\":[0,0]}
        ├> {\\"sign\\":1,\\"data\\":[0,4]}
        |  ├> {\\"sign\\":1,\\"data\\":[0,2]}
        |  |  └> {\\"sign\\":1,\\"data\\":[0,1]}
        |  |     └> {\\"sign\\":1,\\"data\\":[0,0]}
        |  └> {\\"sign\\":1,\\"data\\":[0,3]}
        |     └> {\\"sign\\":1,\\"data\\":[0,2]}
        |        ├> {\\"sign\\":1,\\"data\\":[0,0]}
        |        └> {\\"sign\\":1,\\"data\\":[0,1]}
        |           └> {\\"sign\\":1,\\"data\\":[0,0]}
        ├> {\\"sign\\":1,\\"data\\":[0,6]}
        |  └> {\\"sign\\":1,\\"data\\":[0,5]}
        |     └> {\\"sign\\":1,\\"data\\":[0,4]}
        |        ├> {\\"sign\\":1,\\"data\\":[0,0]}
        |        ├> {\\"sign\\":1,\\"data\\":[0,2]}
        |        |  └> {\\"sign\\":1,\\"data\\":[0,1]}
        |        |     └> {\\"sign\\":1,\\"data\\":[0,0]}
        |        └> {\\"sign\\":1,\\"data\\":[0,3]}
        |           └> {\\"sign\\":1,\\"data\\":[0,2]}
        |              ├> {\\"sign\\":1,\\"data\\":[0,0]}
        |              └> {\\"sign\\":1,\\"data\\":[0,1]}
        |                 └> {\\"sign\\":1,\\"data\\":[0,0]}
        └> {\\"sign\\":1,\\"data\\":[0,7]}
           └> {\\"sign\\":1,\\"data\\":[0,6]}
              ├> {\\"sign\\":1,\\"data\\":[0,0]}
              ├> {\\"sign\\":1,\\"data\\":[0,3]}
              |  └> {\\"sign\\":1,\\"data\\":[0,2]}
              |     └> {\\"sign\\":1,\\"data\\":[0,1]}
              |        └> {\\"sign\\":1,\\"data\\":[0,0]}
              └> {\\"sign\\":1,\\"data\\":[0,5]}
                 └> {\\"sign\\":1,\\"data\\":[0,4]}
                    └> {\\"sign\\":1,\\"data\\":[0,3]}
                       ├> {\\"sign\\":1,\\"data\\":[0,0]}
                       └> {\\"sign\\":1,\\"data\\":[0,2]}
                          └> {\\"sign\\":1,\\"data\\":[0,1]}
                             └> {\\"sign\\":1,\\"data\\":[0,0]}"
      `);
    });
    it('should shrink strictly positive value for range not including zero', () => {
      // Arrange
      const arb = arrayInt64({ sign: 1, data: [1, 10] }, { sign: 1, data: [1, 20] });
      const source = new NextValue({ sign: 1, data: [1, 18] }); // no context

      // Act
      const tree = buildNextShrinkTree(arb, source);
      const renderedTree = renderTree(tree).join('\n');

      // Assert
      //   As the range [[1,10], [1,20]] and the value [1,18]
      //   are just offset by +[1,10] compared to the first case,
      //   the rendered tree will be offset by [1,10] too
      expect(renderedTree).toMatchInlineSnapshot(`
        "{\\"sign\\":1,\\"data\\":[1,18]}
        ├> {\\"sign\\":1,\\"data\\":[1,10]}
        ├> {\\"sign\\":1,\\"data\\":[1,14]}
        |  ├> {\\"sign\\":1,\\"data\\":[1,12]}
        |  |  └> {\\"sign\\":1,\\"data\\":[1,11]}
        |  |     └> {\\"sign\\":1,\\"data\\":[1,10]}
        |  └> {\\"sign\\":1,\\"data\\":[1,13]}
        |     └> {\\"sign\\":1,\\"data\\":[1,12]}
        |        ├> {\\"sign\\":1,\\"data\\":[1,10]}
        |        └> {\\"sign\\":1,\\"data\\":[1,11]}
        |           └> {\\"sign\\":1,\\"data\\":[1,10]}
        ├> {\\"sign\\":1,\\"data\\":[1,16]}
        |  └> {\\"sign\\":1,\\"data\\":[1,15]}
        |     └> {\\"sign\\":1,\\"data\\":[1,14]}
        |        ├> {\\"sign\\":1,\\"data\\":[1,10]}
        |        ├> {\\"sign\\":1,\\"data\\":[1,12]}
        |        |  └> {\\"sign\\":1,\\"data\\":[1,11]}
        |        |     └> {\\"sign\\":1,\\"data\\":[1,10]}
        |        └> {\\"sign\\":1,\\"data\\":[1,13]}
        |           └> {\\"sign\\":1,\\"data\\":[1,12]}
        |              ├> {\\"sign\\":1,\\"data\\":[1,10]}
        |              └> {\\"sign\\":1,\\"data\\":[1,11]}
        |                 └> {\\"sign\\":1,\\"data\\":[1,10]}
        └> {\\"sign\\":1,\\"data\\":[1,17]}
           └> {\\"sign\\":1,\\"data\\":[1,16]}
              ├> {\\"sign\\":1,\\"data\\":[1,10]}
              ├> {\\"sign\\":1,\\"data\\":[1,13]}
              |  └> {\\"sign\\":1,\\"data\\":[1,12]}
              |     └> {\\"sign\\":1,\\"data\\":[1,11]}
              |        └> {\\"sign\\":1,\\"data\\":[1,10]}
              └> {\\"sign\\":1,\\"data\\":[1,15]}
                 └> {\\"sign\\":1,\\"data\\":[1,14]}
                    └> {\\"sign\\":1,\\"data\\":[1,13]}
                       ├> {\\"sign\\":1,\\"data\\":[1,10]}
                       └> {\\"sign\\":1,\\"data\\":[1,12]}
                          └> {\\"sign\\":1,\\"data\\":[1,11]}
                             └> {\\"sign\\":1,\\"data\\":[1,10]}"
      `);
    });
    it('should shrink strictly negative value for negative range including zero', () => {
      // Arrange
      const arb = arrayInt64({ sign: -1, data: [0, 10] }, { sign: 1, data: [0, 0] });
      const source = new NextValue({ sign: -1, data: [0, 8] }); // no context

      // Act
      const tree = buildNextShrinkTree(arb, source);
      const renderedTree = renderTree(tree).join('\n');

      // Assert
      //   As the range [-10, 0] and the value -8
      //   are the opposite of first case, the rendered tree will be the same except
      //   it contains opposite values
      expect(renderedTree).toMatchInlineSnapshot(`
        "{\\"sign\\":-1,\\"data\\":[0,8]}
        ├> {\\"sign\\":1,\\"data\\":[0,0]}
        ├> {\\"sign\\":-1,\\"data\\":[0,4]}
        |  ├> {\\"sign\\":-1,\\"data\\":[0,2]}
        |  |  └> {\\"sign\\":-1,\\"data\\":[0,1]}
        |  |     └> {\\"sign\\":1,\\"data\\":[0,0]}
        |  └> {\\"sign\\":-1,\\"data\\":[0,3]}
        |     └> {\\"sign\\":-1,\\"data\\":[0,2]}
        |        ├> {\\"sign\\":1,\\"data\\":[0,0]}
        |        └> {\\"sign\\":-1,\\"data\\":[0,1]}
        |           └> {\\"sign\\":1,\\"data\\":[0,0]}
        ├> {\\"sign\\":-1,\\"data\\":[0,6]}
        |  └> {\\"sign\\":-1,\\"data\\":[0,5]}
        |     └> {\\"sign\\":-1,\\"data\\":[0,4]}
        |        ├> {\\"sign\\":1,\\"data\\":[0,0]}
        |        ├> {\\"sign\\":-1,\\"data\\":[0,2]}
        |        |  └> {\\"sign\\":-1,\\"data\\":[0,1]}
        |        |     └> {\\"sign\\":1,\\"data\\":[0,0]}
        |        └> {\\"sign\\":-1,\\"data\\":[0,3]}
        |           └> {\\"sign\\":-1,\\"data\\":[0,2]}
        |              ├> {\\"sign\\":1,\\"data\\":[0,0]}
        |              └> {\\"sign\\":-1,\\"data\\":[0,1]}
        |                 └> {\\"sign\\":1,\\"data\\":[0,0]}
        └> {\\"sign\\":-1,\\"data\\":[0,7]}
           └> {\\"sign\\":-1,\\"data\\":[0,6]}
              ├> {\\"sign\\":1,\\"data\\":[0,0]}
              ├> {\\"sign\\":-1,\\"data\\":[0,3]}
              |  └> {\\"sign\\":-1,\\"data\\":[0,2]}
              |     └> {\\"sign\\":-1,\\"data\\":[0,1]}
              |        └> {\\"sign\\":1,\\"data\\":[0,0]}
              └> {\\"sign\\":-1,\\"data\\":[0,5]}
                 └> {\\"sign\\":-1,\\"data\\":[0,4]}
                    └> {\\"sign\\":-1,\\"data\\":[0,3]}
                       ├> {\\"sign\\":1,\\"data\\":[0,0]}
                       └> {\\"sign\\":-1,\\"data\\":[0,2]}
                          └> {\\"sign\\":-1,\\"data\\":[0,1]}
                             └> {\\"sign\\":1,\\"data\\":[0,0]}"
      `);
    });
  });

  describe('contextualShrinkableFor (old)', () => {
    it('should shrink, as context-less, strictly positive value for positive range including zero', () => {
      // Arrange
      const arbNew = arrayInt64({ sign: 1, data: [0, 0] }, { sign: 1, data: [0, 10] });
      const arbOld = arrayInt64Old({ sign: 1, data: [0, 0] }, { sign: 1, data: [0, 10] });
      const sourceValue: ArrayInt64 = { sign: 1, data: [0, 8] };

      // Act
      const treeNew = buildNextShrinkTree(arbNew, new NextValue(sourceValue));
      const treeOld = buildShrinkTree(arbOld.contextualShrinkableFor(sourceValue));

      // Assert
      expect(treeOld).toEqual(treeNew);
    });
    it('should shrink, as context-less, strictly positive value for range not including zero', () => {
      // Arrange
      const arbNew = arrayInt64({ sign: 1, data: [1, 10] }, { sign: 1, data: [1, 20] });
      const arbOld = arrayInt64Old({ sign: 1, data: [1, 10] }, { sign: 1, data: [1, 20] });
      const sourceValue: ArrayInt64 = { sign: 1, data: [1, 18] };

      // Act
      const treeNew = buildNextShrinkTree(arbNew, new NextValue(sourceValue));
      const treeOld = buildShrinkTree(arbOld.contextualShrinkableFor(sourceValue));

      // Assert
      expect(treeOld).toEqual(treeNew);
    });
    it('should shrink, as context-less, strictly negative value for negative range including zero', () => {
      // Arrange
      const arbNew = arrayInt64({ sign: -1, data: [0, 10] }, { sign: 1, data: [0, 0] });
      const arbOld = arrayInt64Old({ sign: -1, data: [0, 10] }, { sign: 1, data: [0, 0] });
      const sourceValue: ArrayInt64 = { sign: -1, data: [0, 8] };

      // Act
      const treeNew = buildNextShrinkTree(arbNew, new NextValue(sourceValue));
      const treeOld = buildShrinkTree(arbOld.contextualShrinkableFor(sourceValue));

      // Assert
      expect(treeOld).toEqual(treeNew);
    });
  });
});
