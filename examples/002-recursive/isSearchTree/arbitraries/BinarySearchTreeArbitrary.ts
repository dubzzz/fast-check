import fc from 'fast-check';
import { Tree } from '../src/isSearchTree.js';

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
