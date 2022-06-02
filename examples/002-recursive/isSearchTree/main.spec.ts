import fc from 'fast-check';
import * as _ from 'lodash';
import { binarySearchTreeWithMaxDepth } from './arbitraries/BinarySearchTreeArbitrary';
import { isSearchTree, Tree } from './src/isSearchTree';
import { binaryTreeWithMaxDepth, binaryTreeWithoutMaxDepth } from './arbitraries/BinaryTreeArbitrary';

describe('isSearchTree', () => {
  it('should always mark binary search trees as search trees', () => {
    fc.assert(
      fc.property(binarySearchTreeWithMaxDepth(3), (tree) => {
        return isSearchTree(tree);
      })
    );
  });

  it('should detect invalid search trees whenever tree traversal produces unordered arrays', () => {
    fc.assert(
      fc.property(binaryTreeWithMaxDepth(3), (tree) => {
        fc.pre(!isSorted(traversal(tree, (t) => t.value)));
        return !isSearchTree(tree);
      })
    );
  });

  it('should detect invalid search trees whenever tree traversal produces unordered arrays (2)', () => {
    fc.assert(
      fc.property(binaryTreeWithoutMaxDepth(), (tree) => {
        fc.pre(!isSorted(traversal(tree, (t) => t.value)));
        return !isSearchTree(tree);
      })
    );
  });

  it('should detect invalid search trees whenever one node in the tree has an invalid direct child', () => {
    fc.assert(
      fc.property(binaryTreeWithMaxDepth(3), (tree) => {
        fc.pre(
          traversal(tree, (t) => t).some(
            (t) => (t.left && t.left.value > t.value) || (t.right && t.right.value <= t.value)
          )
        );
        return !isSearchTree(tree);
      })
    );
  });
});

// Helpers

function traversal<TOut>(t: Tree<number>, extract: (node: Tree<number>) => TOut, out: TOut[] = []): TOut[] {
  if (t.left) traversal(t.left, extract, out);
  out.push(extract(t));
  if (t.right) traversal(t.right, extract, out);
  return out;
}

function isSorted(d: number[]): boolean {
  return _.isEqual(
    d,
    [...d].sort((a, b) => a - b)
  );
}
