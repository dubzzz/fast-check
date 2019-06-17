import * as fc from '../../../src/fast-check';

type Tree = Node | Leaf;
type Node = {
  left: Tree;
  right: Tree;
};
type Leaf = number;

const seed = Date.now();
describe(`MemoArbitrary (seed: ${seed})`, () => {
  describe('memo', () => {
    it('Should be able to build deep tree instances (manual depth)', () => {
      const leaf = fc.nat;

      // tree is 1 / 3 of node, 2 / 3 of leaf
      const tree: fc.Memo<Tree> = fc.memo(n => fc.oneof(node(n), leaf(), leaf()));
      const node: fc.Memo<Tree> = fc.memo(remaining => {
        const subTree = remaining > 1 ? tree : leaf;
        return fc.record({ left: subTree(), right: subTree() });
      });

      const maxDepth = 10;
      const out = fc.check(
        fc.property(tree(maxDepth), t => {
          const depth = (n: Tree): number => {
            if (typeof n === 'number') return 0;
            return 1 + Math.max(depth(n.left), depth(n.right));
          };
          return depth(t) < maxDepth;
        }),
        { seed }
      );
      expect(out.failed).toBe(true);
    });
    it('Should be able to build tree instances with limited depth (manual depth)', () => {
      const leaf = fc.nat;

      // tree is 1 / 3 of node, 2 / 3 of leaf
      const tree: fc.Memo<Tree> = fc.memo(n => fc.oneof(node(n), leaf(), leaf()));
      const node: fc.Memo<Tree> = fc.memo(remaining => {
        const subTree = remaining > 1 ? tree : leaf;
        return fc.record({ left: subTree(), right: subTree() });
      });

      const maxDepth = 10;
      const out = fc.check(
        fc.property(tree(maxDepth), t => {
          const depth = (n: Tree): number => {
            if (typeof n === 'number') return 0;
            return 1 + Math.max(depth(n.left), depth(n.right));
          };
          return depth(t) <= maxDepth;
        }),
        { seed }
      );
      expect(out.failed).toBe(false);
    });
  });
});
