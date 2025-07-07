import { LazyArbitrary } from './_internals/LazyArbitrary';
import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { safeHasOwnProperty } from '../utils/globals';
import { nat } from './nat.js';
import { record } from './record.js';
import { array } from './array.js';

const safeArrayIsArray = Array.isArray;
const safeObjectCreate = Object.create;
const safeObjectEntries = Object.entries;

/**
 * Type of the value produced by {@link letrec}
 * @remarks Since 3.0.0
 * @public
 */
export type LetrecValue<T> = {
  [K in keyof T]: Arbitrary<T[K]>;
};

/**
 * Strongly typed type for the `tie` function passed by {@link letrec} to the `builder` function we pass to it.
 * You may want also want to use its loosely typed version {@link LetrecLooselyTypedTie}.
 *
 * @remarks Since 3.0.0
 * @public
 */
export interface LetrecTypedTie<T> {
  <K extends keyof T>(key: K): Arbitrary<T[K]>;
  (key: string): Arbitrary<unknown>;
}
/**
 * Strongly typed type for the `builder` function passed to {@link letrec}.
 * You may want also want to use its loosely typed version {@link LetrecLooselyTypedBuilder}.
 *
 * @remarks Since 3.0.0
 * @public
 */
export type LetrecTypedBuilder<T> = (tie: LetrecTypedTie<T>) => LetrecValue<T>;

/**
 * Loosely typed type for the `tie` function passed by {@link letrec} to the `builder` function we pass to it.
 * You may want also want to use its strongly typed version {@link LetrecTypedTie}.
 *
 * @remarks Since 3.0.0
 * @public
 */
export type LetrecLooselyTypedTie = (key: string) => Arbitrary<unknown>;
/**
 * Loosely typed type for the `builder` function passed to {@link letrec}.
 * You may want also want to use its strongly typed version {@link LetrecTypedBuilder}.
 *
 * @remarks Since 3.0.0
 * @public
 */
export type LetrecLooselyTypedBuilder<T> = (tie: LetrecLooselyTypedTie) => LetrecValue<T>;

/**
 * Constraints to be applied on {@link letrec}
 * @remarks Since 4.2.0
 * @public
 */
export interface LetrecConstraints {
  /**
   * Generate objects with circular references
   * @defaultValue false
   * @remarks Since 4.2.0
   */
  circular?: boolean;
}

function nonCircularLetrec<T>(builder: LetrecLooselyTypedBuilder<T> | LetrecTypedBuilder<T>): LetrecValue<T> {
  const lazyArbs: { [K in keyof T]?: LazyArbitrary<unknown> } = safeObjectCreate(null);
  const tie = (key: keyof T): Arbitrary<any> => {
    if (!safeHasOwnProperty(lazyArbs, key)) {
      // Call to hasOwnProperty ensures that the property key will be defined
      lazyArbs[key] = new LazyArbitrary(String(key));
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return lazyArbs[key]!;
  };
  const strictArbs = builder(tie as any);
  for (const key in strictArbs) {
    if (!safeHasOwnProperty(strictArbs, key)) {
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

function circularLetrec<T>(builder: LetrecLooselyTypedBuilder<T> | LetrecTypedBuilder<T>): LetrecValue<T> {
  const lazyArbs: { [K in keyof T]?: LazyArbitrary<unknown> } = safeObjectCreate(null);
  const tie = (key: keyof T): Arbitrary<any> => {
    if (!safeHasOwnProperty(lazyArbs, key)) {
      // Call to hasOwnProperty ensures that the property key will be defined
      lazyArbs[key] = new LazyArbitrary(String(key));
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return lazyArbs[key]!;
  };
  const strictArbs = builder(tie as any);

  // Symbol to replace with a potentially circular reference later.
  const placeholderSymbol = Symbol('placeholder');
  const poolArbs: { [K in keyof T]: Arbitrary<unknown[]> } = safeObjectCreate(null);
  for (const key in strictArbs) {
    if (!safeHasOwnProperty(strictArbs, key)) {
      // Prevents accidental iteration over properties inherited from an object’s prototype
      continue;
    }
    const lazyAtKey: LazyArbitrary<unknown> | undefined = lazyArbs[key];
    const lazyArb = lazyAtKey !== undefined ? lazyAtKey : new LazyArbitrary(key);
    lazyArb.underlying = nat().map((index) => ({
      [placeholderSymbol]: { key, index },
    }));
    lazyArbs[key] = lazyArb;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    poolArbs[key] = array(strictArbs[key]!, { minLength: 1 });
  }

  for (const key in strictArbs) {
    if (!safeHasOwnProperty(strictArbs, key)) {
      // Prevents accidental iteration over properties inherited from an object’s prototype
      continue;
    }

    const poolsArb = record(poolArbs as any) as Arbitrary<{ [K in keyof T]: unknown[] }>;
    strictArbs[key] = poolsArb.map((pools) => {
      const visited = new WeakSet();
      function deref(value: unknown, source?: Record<PropertyKey, unknown>, sourceKey?: PropertyKey): unknown {
        if (typeof value !== 'object' || value === null) {
          return value;
        }

        if (visited.has(value)) {
          return value;
        }
        visited.add(value);

        if (safeHasOwnProperty(value, placeholderSymbol)) {
          const { key, index } = (
            value as {
              [placeholderSymbol]: { key: keyof T; index: number };
            }
          )[placeholderSymbol];
          const pool = pools[key];
          const poolValue = pool[index % pool.length];
          if (source !== undefined && sourceKey !== undefined) {
            source[sourceKey] = poolValue;
            return value;
          } else {
            return poolValue;
          }
        }

        if (safeArrayIsArray(value)) {
          for (let i = 0; i < value.length; i++) {
            deref(value[i], value as unknown as Record<PropertyKey, unknown>, i);
          }
        } else {
          for (const [key, item] of safeObjectEntries(value)) {
            deref(item, value as Record<PropertyKey, unknown>, key);
          }
        }

        return value;
      }

      // TODO: Do we need to clone here?
      deref(pools);
      return pools[key][0];
    }) as (typeof strictArbs)[typeof key];
  }

  return strictArbs;
}

/**
 * For mutually recursive types
 *
 * @example
 * ```typescript
 * type Leaf = number;
 * type Node = [Tree, Tree];
 * type Tree = Node | Leaf;
 * const { tree } = fc.letrec<{ tree: Tree, node: Node, leaf: Leaf }>(tie => ({
 *   tree: fc.oneof({depthSize: 'small'}, tie('leaf'), tie('node')),
 *   node: fc.tuple(tie('tree'), tie('tree')),
 *   leaf: fc.nat()
 * }));
 * // tree is 50% of node, 50% of leaf
 * // the ratio goes in favor of leaves as we go deeper in the tree (thanks to depthSize)
 * ```
 *
 * @param builder - Arbitraries builder based on themselves (through `tie`)
 *
 * @remarks Since 1.16.0
 * @public
 */
export function letrec<T>(
  builder: T extends Record<string, unknown> ? LetrecTypedBuilder<T> : never,
  constraints?: LetrecConstraints,
): LetrecValue<T>;
/**
 * For mutually recursive types
 *
 * @example
 * ```typescript
 * const { tree } = fc.letrec(tie => ({
 *   tree: fc.oneof({depthSize: 'small'}, tie('leaf'), tie('node')),
 *   node: fc.tuple(tie('tree'), tie('tree')),
 *   leaf: fc.nat()
 * }));
 * // tree is 50% of node, 50% of leaf
 * // the ratio goes in favor of leaves as we go deeper in the tree (thanks to depthSize)
 * ```
 *
 * @param builder - Arbitraries builder based on themselves (through `tie`)
 *
 * @remarks Since 1.16.0
 * @public
 */
export function letrec<T>(builder: LetrecLooselyTypedBuilder<T>, constraints?: LetrecConstraints): LetrecValue<T>;
export function letrec<T>(
  builder: LetrecLooselyTypedBuilder<T> | LetrecTypedBuilder<T>,
  constraints: LetrecConstraints = {},
): LetrecValue<T> {
  return (constraints.circular ? circularLetrec : nonCircularLetrec)(builder);
}
