import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';

/**
 * Output type for {@link memo}
 * @remarks Since 1.16.0
 * @public
 */
export type Memo<T> = (maxDepth?: number) => Arbitrary<T>;

/** @internal */
let contextRemainingDepth = 10;

/**
 * For mutually recursive types
 *
 * @example
 * ```typescript
 * // tree is 1 / 3 of node, 2 / 3 of leaf
 * const tree: fc.Memo<Tree> = fc.memo(n => fc.oneof(node(n), leaf(), leaf()));
 * const node: fc.Memo<Tree> = fc.memo(n => {
 *   if (n <= 1) return fc.record({ left: leaf(), right: leaf() });
 *   return fc.record({ left: tree(), right: tree() }); // tree() is equivalent to tree(n-1)
 * });
 * const leaf = fc.nat;
 * ```
 *
 * @param builder - Arbitrary builder taken the maximal depth allowed as input (parameter `n`)
 *
 * @remarks Since 1.16.0
 * @public
 */
export function memo<T>(builder: (maxDepth: number) => Arbitrary<T>): Memo<T> {
  const previous: { [depth: number]: Arbitrary<T> } = {};
  return ((maxDepth?: number): Arbitrary<T> => {
    const n = maxDepth !== undefined ? maxDepth : contextRemainingDepth;
    if (!Object.prototype.hasOwnProperty.call(previous, n)) {
      const prev = contextRemainingDepth;
      contextRemainingDepth = n - 1;
      previous[n] = builder(n);
      contextRemainingDepth = prev;
    }
    return previous[n];
  }) as Memo<T>;
}
