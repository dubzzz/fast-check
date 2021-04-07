import { Stream } from '../../fast-check-default';
import { Random } from '../../random/generator/Random';
import { Arbitrary } from './definition/Arbitrary';
import { convertFromNext, convertToNext } from './definition/Converters';
import { NextArbitrary } from './definition/NextArbitrary';
import { NextValue } from './definition/NextValue';

/** @internal */
export class LazyArbitrary extends NextArbitrary<any> {
  underlying: NextArbitrary<any> | null = null;
  constructor(readonly name: string) {
    super();
  }
  generate(mrng: Random, biasFactor: number | undefined): NextValue<any> {
    if (!this.underlying) {
      throw new Error(`Lazy arbitrary ${JSON.stringify(this.name)} not correctly initialized`);
    }
    return this.underlying.generate(mrng, biasFactor);
  }
  canGenerate(value: unknown): value is any {
    if (!this.underlying) {
      throw new Error(`Lazy arbitrary ${JSON.stringify(this.name)} not correctly initialized`);
    }
    return this.underlying.canGenerate(value);
  }
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  shrink(value: any, context?: unknown): Stream<NextValue<any>> {
    if (!this.underlying) {
      throw new Error(`Lazy arbitrary ${JSON.stringify(this.name)} not correctly initialized`);
    }
    return this.underlying.shrink(value, context);
  }
}

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
export function letrec<T>(
  builder: (tie: (key: string) => Arbitrary<unknown>) => { [K in keyof T]: Arbitrary<T[K]> }
): { [K in keyof T]: Arbitrary<T[K]> } {
  const lazyArbs: { [K in keyof T]?: LazyArbitrary } = Object.create(null);
  const tie = (key: keyof T): Arbitrary<any> => {
    if (!Object.prototype.hasOwnProperty.call(lazyArbs, key)) {
      // Call to hasOwnProperty ensures that the property key will be defined
      lazyArbs[key] = new LazyArbitrary(key as any);
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return convertFromNext(lazyArbs[key]!);
  };
  const strictArbs = builder(tie as any);
  for (const key in strictArbs) {
    if (!Object.prototype.hasOwnProperty.call(strictArbs, key)) {
      // Prevents accidental iteration over properties inherited from an object’s prototype
      continue;
    }
    const lazyAtKey: LazyArbitrary | undefined = lazyArbs[key];
    const lazyArb = lazyAtKey !== undefined ? lazyAtKey : new LazyArbitrary(key);
    lazyArb.underlying = convertToNext(strictArbs[key]);
    lazyArbs[key] = lazyArb;
  }
  return strictArbs;
}
