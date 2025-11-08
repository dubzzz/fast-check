import { LazyArbitrary } from './_internals/LazyArbitrary';
import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { safeAdd, safeHas, safeHasOwnProperty } from '../utils/globals';
import { invertSize, resolveSize, type SizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength';
import { nat } from './nat.js';
import { record } from './record.js';
import { array } from './array.js';
import { noShrink } from './noShrink.js';

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
 * @remarks Since 4.4.0
 * @public
 */
export interface LetrecConstraints {
  /**
   * Generate objects with circular references
   * @defaultValue false
   * @remarks Since 4.4.0
   */
  withCycles?: boolean | CycleConstraints;
}

/**
 * Constraints to be applied on {@link LetrecConstraints.withCycles}
 * @remarks Since 4.4.0
 * @public
 */
export interface CycleConstraints {
  /**
   * Define how frequently cycles should occur in the generated values (at max)
   * @remarks Since 4.2.0
   */
  frequencySize?: Exclude<SizeForArbitrary, 'max'>;
}

/** @internal */
function letrecWithoutCycles<T>(builder: LetrecLooselyTypedBuilder<T> | LetrecTypedBuilder<T>): LetrecValue<T> {
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

/** @internal */
export function derefPools<T>(pools: { [K in keyof T]: unknown[] }, placeholderSymbol: symbol): void {
  const visited = new Set();
  function deref(value: unknown, source?: Record<PropertyKey, unknown>, sourceKey?: PropertyKey) {
    if (typeof value !== 'object' || value === null) {
      return;
    }

    if (safeHas(visited, value)) {
      return;
    }
    safeAdd(visited, value);

    if (safeHasOwnProperty(value, placeholderSymbol)) {
      // This is a while loop because it's possible for an arbitrary to be defined as just `arb: tie('otherArb')`, in
      // which case what the `arb` generates is also a placeholder.
      let currentValue: unknown = value;
      do {
        const { key, index } = (currentValue as { [placeholderSymbol]: { key: keyof T; index: number } })[
          placeholderSymbol
        ];
        const pool = pools[key];
        currentValue = pool[index % pool.length];
        if (source !== undefined && sourceKey !== undefined) {
          source[sourceKey] = currentValue;
        }
      } while (safeHasOwnProperty(currentValue, placeholderSymbol));
      return;
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
  }
  deref(pools);
}

/** @internal */
function letrecWithCycles<T>(
  builder: LetrecLooselyTypedBuilder<T> | LetrecTypedBuilder<T>,
  constraints: CycleConstraints,
): LetrecValue<T> {
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
  const poolConstraints = {
    minLength: 1,
    // Higher cycle frequency is achieved by using a smaller pool of objects, so we invert the input `frequency`.
    size: invertSize(resolveSize(constraints.frequencySize)),
  };
  for (const key in strictArbs) {
    if (!safeHasOwnProperty(strictArbs, key)) {
      // Prevents accidental iteration over properties inherited from an object’s prototype
      continue;
    }
    const lazyAtKey: LazyArbitrary<unknown> | undefined = lazyArbs[key];
    const lazyArb = lazyAtKey !== undefined ? lazyAtKey : new LazyArbitrary(key);
    lazyArb.underlying = noShrink(nat().map((index) => ({ [placeholderSymbol]: { key, index } })));
    lazyArbs[key] = lazyArb;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    poolArbs[key] = array(strictArbs[key]!, poolConstraints);
  }

  for (const key in strictArbs) {
    if (!safeHasOwnProperty(strictArbs, key)) {
      // Prevents accidental iteration over properties inherited from an object’s prototype
      continue;
    }

    const poolsArb = record(poolArbs as any) as Arbitrary<{ [K in keyof T]: unknown[] }>;
    strictArbs[key] = poolsArb.map((pools) => {
      derefPools(pools, placeholderSymbol);
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
  return constraints.withCycles
    ? letrecWithCycles(builder, constraints.withCycles === true ? {} : constraints.withCycles)
    : letrecWithoutCycles(builder);
}
