import fc from 'fast-check';
import { Tree } from '../src/isSearchTree';

export const binarySearchTreeWithMaxDepth = (maxDepth: number): fc.Arbitrary<Tree<number>> => {
  const leaf = (minValue: number, maxValue: number): fc.Arbitrary<Tree<number>> =>
    fc.record({
      value: fc.integer({ min: minValue, max: maxValue }),
      left: fc.constant(null),
      right: fc.constant(null),
    });

  const node = (minValue: number, maxValue: number): fc.Memo<Tree<number>> =>
    fc.memo((n) => {
      if (n <= 1) return leaf(minValue, maxValue);
      return fc.integer({ min: minValue, max: maxValue }).chain((v) => {
        // tree(minValue, v)(n - 1) is equivalent to tree(minValue, v)()
        return fc.record({
          value: fc.constant(v),
          left: minValue <= v ? tree(minValue, v)(n - 1) : fc.constant(null),
          right: v + 1 <= maxValue ? tree(v + 1, maxValue)(n - 1) : fc.constant(null),
        });
      });
    });

  const tree = (minValue: number, maxValue: number): fc.Memo<Tree<number>> =>
    fc.memo((n) => fc.oneof(leaf(minValue, maxValue), node(minValue, maxValue)(n)));

  return tree(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)(maxDepth);
};

export const binarySearchTreeWithMaxDepthOldWay = (
  maxDepth: number,
  minValue: number = Number.MIN_SAFE_INTEGER,
  maxValue: number = Number.MAX_SAFE_INTEGER
): fc.Arbitrary<Tree<number>> => {
  const valueArbitrary = fc.integer({ min: minValue, max: maxValue });
  if (maxDepth <= 0) {
    return fc.record({
      value: valueArbitrary,
      left: fc.constant(null),
      right: fc.constant(null),
    });
  }
  return valueArbitrary.chain((rootValue) => {
    const leftArb = binarySearchTreeWithMaxDepthOldWay(maxDepth - 1, minValue, rootValue);
    const rightArb =
      rootValue < maxValue
        ? binarySearchTreeWithMaxDepthOldWay(maxDepth - 1, rootValue + 1, maxValue)
        : fc.constant(null);
    return fc.record({
      value: fc.constant(rootValue),
      left: fc.oneof(fc.constant(null), leftArb),
      right: fc.oneof(fc.constant(null), rightArb),
    });
  });
};
