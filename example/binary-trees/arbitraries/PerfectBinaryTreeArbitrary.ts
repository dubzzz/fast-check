import * as fc from 'fast-check';

import { Tree } from '../models/BinaryTree';

// tree in which all interior nodes have two children and all leaves have the same depth
export const perfectBinaryTree = (depth: number): fc.Arbitrary<Tree<number>> => {
  const valueArbitrary = fc.integer();
  if (depth <= 0) {
    return fc.record({
      value: valueArbitrary,
      left: fc.constant(null),
      right: fc.constant(null)
    });
  }
  const subTree = perfectBinaryTree(depth - 1);
  return fc.record({
    value: valueArbitrary,
    left: subTree,
    right: subTree
  });
};
