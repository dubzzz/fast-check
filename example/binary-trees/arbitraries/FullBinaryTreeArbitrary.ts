import * as fc from '../../../lib/fast-check';

import { Tree } from '../models/BinaryTree';

// tree in which every node has either 0 or 2 children
export const fullBinaryTree = (maxDepth: number): fc.Arbitrary<Tree<number>> => {
  const valueArbitrary = fc.integer();
  if (maxDepth <= 0) {
    return fc.record({
      value: valueArbitrary,
      left: fc.constant(null),
      right: fc.constant(null)
    });
  }
  const subTree = fullBinaryTree(maxDepth - 1);
  return fc.boolean().chain((hasChildren: boolean): fc.Arbitrary<Tree<number>> => {
    if (hasChildren) {
      return fc.record({
        value: valueArbitrary,
        left: subTree,
        right: subTree
      });
    }
    return fc.record({
      value: valueArbitrary,
      left: fc.constant(null),
      right: fc.constant(null)
    });
  });
};
