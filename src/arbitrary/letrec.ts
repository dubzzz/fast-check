import { LazyArbitrary } from './_internals/LazyArbitrary';
import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';

/**
 * For mutually recursive types
 *
 * @example
 * ```typescript
 * const { tree } = fc.letrec(tie => ({
 *   tree: fc.oneof({depthFactor: 0.5}, tie('leaf'), tie('node')),
 *   node: fc.tuple(tie('tree'), tie('tree')),
 *   leaf: fc.nat()
 * }));
 * // tree is 50% of node, 50% of leaf
 * // the ratio goes in favor of leaves as we go deeper in the tree (thanks to depthFactor)
 * ```
 *
 * @param builder - Arbitraries builder based on themselves (through `tie`)
 *
 * @remarks Since 1.16.0
 * @public
 */
export function letrec<T>(builder: (tie: (key: string) => Arbitrary<unknown>) => { [K in keyof T]: Arbitrary<T[K]> }): {
  [K in keyof T]: Arbitrary<T[K]>;
} {
  const lazyArbs: { [K in keyof T]?: LazyArbitrary<unknown> } = Object.create(null);
  const tie = (key: keyof T): Arbitrary<any> => {
    if (!Object.prototype.hasOwnProperty.call(lazyArbs, key)) {
      // Call to hasOwnProperty ensures that the property key will be defined
      lazyArbs[key] = new LazyArbitrary(String(key));
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return lazyArbs[key]!;
  };
  const strictArbs = builder(tie as any);
  for (const key in strictArbs) {
    if (!Object.prototype.hasOwnProperty.call(strictArbs, key)) {
      // Prevents accidental iteration over properties inherited from an object’s prototype
      continue;
    }
    const lazyAtKey: LazyArbitrary<unknown> | undefined = lazyArbs[key];
    const lazyArb = lazyAtKey !== undefined ? lazyAtKey : new LazyArbitrary(key);
    lazyArb.underlying = strictArbs[key];
    lazyArbs[key] = lazyArb;
  }
  return strictArbs;
}
