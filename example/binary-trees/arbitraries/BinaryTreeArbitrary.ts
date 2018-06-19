import * as fc from '../../../lib/fast-check';

import { Tree } from '../models/BinaryTree';

export const binaryTree = (maxDepth: number): fc.Arbitrary<Tree<number>> => {
  const valueArbitrary = fc.integer();
  if (maxDepth <= 0) {
    return fc.record({
      value: valueArbitrary,
      left: fc.constant(null),
      right: fc.constant(null)
    });
  }
  const subTree = fc.oneof(fc.constant(null), binaryTree(maxDepth - 1));
  return fc.record({
    value: valueArbitrary,
    left: subTree,
    right: subTree
  });
};
