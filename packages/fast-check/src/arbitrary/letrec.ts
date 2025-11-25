import { LazyArbitrary } from './_internals/LazyArbitrary';
import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { safeAdd, safeHas, safeHasOwnProperty, Map as SMap, safeMapSet, safeMapGet } from '../utils/globals';
import { invertSize, resolveSize, type SizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength';
import { nat } from './nat.js';
import { record } from './record.js';
import { array } from './array.js';
import { noShrink } from './noShrink.js';

const safeArrayIsArray = Array.isArray;
const safeObjectCreate = Object.create;
const safeObjectEntries = Object.entries;
const safeGetOwnPropertyNames = Object.getOwnPropertyNames;

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
   * @remarks Since 4.4.0
   */
  frequencySize?: Exclude<SizeForArbitrary, 'max'>;
}

/** @internal */
const placeholderSymbol = Symbol('placeholder');

/** @internal */
function createLazyArbsPool<T>() {
  const lazyArbsPool = new SMap<keyof T, LazyArbitrary<unknown>>();
  const getLazyFromPool = (key: keyof T): LazyArbitrary<unknown> => {
    let lazyArb = safeMapGet(lazyArbsPool, key);
    if (lazyArb !== undefined) {
      return lazyArb;
    }
    lazyArb = new LazyArbitrary(String(key));
    safeMapSet(lazyArbsPool, key, lazyArb);
    return lazyArb;
  };
  return getLazyFromPool;
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
  const withCycles = !!constraints.withCycles;

  const getLazyFromPool = createLazyArbsPool<T>();
  const strictArbs = builder(getLazyFromPool as any);
  const declaredArbitraryNames = safeGetOwnPropertyNames(strictArbs) as (keyof T)[]; // Own-only: to prevents accidental scan over properties inherited from an object’s prototype

  // Fill the "underlying" field for each arbitrary in the lazy pool
  for (const name of declaredArbitraryNames) {
    const lazyArb = getLazyFromPool(name);
    lazyArb.underlying = withCycles
      ? noShrink(nat().map((index) => ({ [placeholderSymbol]: { key: name, index } })))
      : strictArbs[name];
  }

  if (!withCycles) {
    return strictArbs;
  }

  // Symbol to replace with a potentially circular reference later.
  const frequencySize = typeof constraints.withCycles === 'object' ? constraints.withCycles.frequencySize : undefined;
  const poolArbs: { [K in keyof T]: Arbitrary<unknown[]> } = safeObjectCreate(null);
  const poolConstraints = {
    minLength: 1,
    // Higher cycle frequency is achieved by using a smaller pool of objects, so we invert the input `frequency`.
    size: invertSize(resolveSize(frequencySize)),
  };

  for (const name of declaredArbitraryNames) {
    poolArbs[name] = array(strictArbs[name], poolConstraints);
  }

  for (const name of declaredArbitraryNames) {
    const poolsArb = record<Record<keyof T, unknown[]>>(poolArbs);
    strictArbs[name] = poolsArb.map((pools) => {
      derefPools(pools, placeholderSymbol);
      return pools[name][0];
    }) as (typeof strictArbs)[typeof name];
  }

  return strictArbs;
}
