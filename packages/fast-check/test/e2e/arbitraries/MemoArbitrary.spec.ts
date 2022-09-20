import * as fc from '../../../src/fast-check';
import { seed } from '../seed';

type Tree = Node | Leaf;
type Node = {
  left: Tree;
  right: Tree;
};
type Leaf = number;

describe(`MemoArbitrary (seed: ${seed})`, () => {
  describe('memo', () => {
    it('Should be able to build deep tree instances (manual depth)', () => {
      const leaf = fc.nat;
      const tree: fc.Memo<Tree> = fc.memo((n) => fc.oneof(node(n), leaf()));
      const node: fc.Memo<Tree> = fc.memo((n) => {
        if (n <= 1) return fc.record({ left: leaf(), right: leaf() });
        return fc.record({ left: tree(), right: tree() }); // tree() is equivalent to tree(n-1)
      });

      const maxDepth = 3;
      const out = fc.check(
        fc.property(tree(maxDepth), (t) => {
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
      const tree: fc.Memo<Tree> = fc.memo((n) => fc.oneof(node(n), leaf()));
      const node: fc.Memo<Tree> = fc.memo((n) => {
        if (n <= 1) return fc.record({ left: leaf(), right: leaf() });
        return fc.record({ left: tree(), right: tree() }); // tree() is equivalent to tree(n-1)
      });

      const maxDepth = 3;
      const out = fc.check(
        fc.property(tree(maxDepth), (t) => {
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
    it('Should be able to shrink to smaller cases recursively', () => {
      const leaf = fc.nat;
      const tree: fc.Memo<Tree> = fc.memo((n) => fc.nat(1).chain((id) => (id === 0 ? leaf() : node(n))));
      const node: fc.Memo<Tree> = fc.memo((n) => {
        if (n <= 1) return fc.record({ left: leaf(), right: leaf() });
        return fc.record({ left: tree(), right: tree() }); // tree() is equivalent to tree(n-1)
      });

      const out = fc.check(
        fc.property(tree(), (t) => typeof t !== 'object'),
        { seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample![0]).toEqual({ left: 0, right: 0 });
    });
  });
});
