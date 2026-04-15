import fc from 'fast-check';
import { Tree } from '../src/isSearchTree.js';

export const binaryTreeWithMaxDepth = (maxDepth: number): fc.Arbitrary<Tree<number>> => {
  const { tree } = fc.letrec((tie) => ({
    leaf: fc.record({
      value: fc.integer(),
      left: fc.constant(null),
      right: fc.constant(null),
    }),
    node: fc.record({ value: fc.integer(), left: tie('tree'), right: tie('tree') }),
    tree: fc.oneof({ maxDepth }, tie('leaf'), tie('node')),
  }));
  return tree as fc.Arbitrary<Tree<number>>;
};

export const binaryTreeWithoutMaxDepth = (): fc.Arbitrary<Tree<number>> => {
  const { tree } = fc.letrec((tie) => ({
    leaf: fc.record({
      value: fc.integer(),
      left: fc.constant(null),
      right: fc.constant(null),
    }),
    node: fc.record({ value: fc.integer(), left: tie('tree'), right: tie('tree') }),
    tree: fc.oneof({ depthSize: 'small' }, tie('leaf'), tie('node')),
  }));
  return tree as fc.Arbitrary<Tree<number>>;
};
