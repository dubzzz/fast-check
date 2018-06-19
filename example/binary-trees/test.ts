import * as fc from '../../lib/fast-check';

import { Tree } from './models/BinaryTree';

import { binarySearchTree } from './arbitraries/BinarySearchTreeArbitrary';
import { binaryTree } from './arbitraries/BinaryTreeArbitrary';
import { fullBinaryTree } from './arbitraries/FullBinaryTreeArbitrary';
import { perfectBinaryTree } from './arbitraries/PerfectBinaryTreeArbitrary';

const getMaxDepth = (tree: Tree<number>): number => {
  if (tree.left == null && tree.right == null) return 0;
  const leftDepth = tree.left == null ? -1 : getMaxDepth(tree.left);
  const rightDepth = tree.right == null ? -1 : getMaxDepth(tree.right);
  return Math.max(leftDepth, rightDepth) + 1;
};

const getNumNodes = (tree: Tree<number> | null): number => {
  if (tree == null) return 0;
  return 1 + getNumNodes(tree.left) + getNumNodes(tree.right);
};

const isBinarySearchTree = (tree: Tree<number>, min: number | null, max: number | null): boolean => {
  if (min != null && tree.value <= min) return false;
  if (max != null && tree.value > max) return false;
  return (
    (tree.left == null || isBinarySearchTree(tree.left, min, tree.value)) &&
    (tree.right == null || isBinarySearchTree(tree.right, tree.value, max))
  );
};

const isFullBinaryTree = (tree: Tree<number>): boolean => {
  if (tree.left == null && tree.right == null) return true;
  if (tree.left == null && tree.right != null) return false;
  if (tree.left != null && tree.right == null) return false;
  return isFullBinaryTree(tree.left!) && isFullBinaryTree(tree.right!);
};

const isPerfectBinaryTree = (tree: Tree<number>): boolean => {
  const h = getMaxDepth(tree);
  const n = getNumNodes(tree);
  return n === 2 ** (h + 1) - 1;
};

type TreeBuilder<T> = (maxDepth: number) => fc.Arbitrary<Tree<T>>;
const describeTree = (treeBuilder: TreeBuilder<number>) => {
  const maxTreeDepth = 5;
  it(`should have a non null root`, () => fc.assert(fc.property(treeBuilder(maxTreeDepth), tree => tree != null)));
  it(`should have a maximal depth of ${maxTreeDepth}`, () =>
    fc.assert(fc.property(treeBuilder(maxTreeDepth), tree => getMaxDepth(tree) <= maxTreeDepth)));
  it('should be a binary search tree', () =>
    fc.assert(fc.property(treeBuilder(maxTreeDepth), tree => isBinarySearchTree(tree, null, null))));
  it('should be a full binary tree', () => fc.assert(fc.property(treeBuilder(maxTreeDepth), isFullBinaryTree)));
  it('should be a perfect binary tree', () => fc.assert(fc.property(treeBuilder(maxTreeDepth), isPerfectBinaryTree)));
};

// Some of the following assumptions are winllingly wrong
// in order to let the user see what will happen in case of failure of the property

describe('BinaryTree', () => describeTree(binaryTree));
describe('BinarySearchTree', () => describeTree(binarySearchTree));
describe('FullBinaryTree', () => describeTree(fullBinaryTree));
describe('PerfectBinaryTree', () => describeTree(perfectBinaryTree));
