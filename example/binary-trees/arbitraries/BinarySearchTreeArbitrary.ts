import * as fc from '../../../lib/fast-check';

import { Tree } from '../models/BinaryTree';

export const binarySearchTree = (
  maxDepth: number,
  minValue: number = Number.MIN_SAFE_INTEGER,
  maxValue: number = Number.MAX_SAFE_INTEGER
): fc.Arbitrary<Tree<number>> => {
  const valueArbitrary = fc.integer(minValue, maxValue);
  if (maxDepth <= 0) {
    return fc.record({
      value: valueArbitrary,
      left: fc.constant(null),
      right: fc.constant(null)
    });
  }
  return valueArbitrary.chain(rootValue => {
    const leftArb = binarySearchTree(maxDepth - 1, minValue, rootValue);
    const rightArb = rootValue < maxValue ? binarySearchTree(maxDepth - 1, rootValue + 1, maxValue) : fc.constant(null);
    return fc.record({
      value: fc.constant(rootValue),
      left: fc.oneof(fc.constant(null), leftArb),
      right: fc.oneof(fc.constant(null), rightArb)
    });
  });
};
