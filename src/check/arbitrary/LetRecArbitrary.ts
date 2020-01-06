import { Random } from '../../random/generator/Random';
import { Arbitrary } from './definition/Arbitrary';
import { Shrinkable } from './definition/Shrinkable';

/** @internal */
export class LazyArbitrary extends Arbitrary<any> {
  private static readonly MaxBiasLevels = 5;
  private numBiasLevels = 0;
  private lastBiasedArbitrary: {
    biasedArb: Arbitrary<any>;
    arb: Arbitrary<any>;
    lvl: number;
    freq: number;
  } | null = null;
  underlying: Arbitrary<any> | null = null;

  constructor(readonly name: string) {
    super();
  }
  generate(mrng: Random): Shrinkable<any> {
    if (!this.underlying) {
      throw new Error(`Lazy arbitrary ${JSON.stringify(this.name)} not correctly initialized`);
    }
    return this.underlying.generate(mrng);
  }
  withBias(freq: number): Arbitrary<any> {
    if (!this.underlying) {
      throw new Error(`Lazy arbitrary ${JSON.stringify(this.name)} not correctly initialized`);
    }
    if (this.numBiasLevels >= LazyArbitrary.MaxBiasLevels) {
      return this;
    }
    if (
      this.lastBiasedArbitrary !== null &&
      this.lastBiasedArbitrary.freq === freq &&
      this.lastBiasedArbitrary.arb === this.underlying &&
      this.lastBiasedArbitrary.lvl === this.numBiasLevels
    ) {
      return this.lastBiasedArbitrary.biasedArb;
    }
    ++this.numBiasLevels;
    const biasedArb = this.underlying.withBias(freq);
    --this.numBiasLevels;
    this.lastBiasedArbitrary = {
      arb: this.underlying,
      lvl: this.numBiasLevels,
      freq,
      biasedArb
    };
    return biasedArb;
  }
}

/** @internal */
function isLazyArbitrary(arb: Arbitrary<any> | undefined): arb is LazyArbitrary {
  return typeof arb === 'object' && arb !== null && Object.prototype.hasOwnProperty.call(arb, 'underlying');
}

/**
 * For mutually recursive types
 *
 * @example
 * ```typescript
 * const { tree } = fc.letrec(tie => ({
 *   tree: fc.oneof(tie('node'), tie('leaf'), tie('leaf')),
 *   node: fc.tuple(tie('tree'), tie('tree')),
 *   leaf: fc.nat()
 * })); // tree is 1 / 3 of node, 2 / 3 of leaf
 * ```
 *
 * @param builder Arbitraries builder based on themselves (through `tie`)
 */
export function letrec<T>(
  builder: (tie: (key: string) => Arbitrary<unknown>) => { [K in keyof T]: Arbitrary<T[K]> }
): { [K in keyof T]: Arbitrary<T[K]> } {
  const lazyArbs: { [K in keyof T]?: Arbitrary<T[K]> } = Object.create(null);
  const tie = (key: keyof T): Arbitrary<any> => {
    if (!Object.prototype.hasOwnProperty.call(lazyArbs, key)) lazyArbs[key] = new LazyArbitrary(key as any);
    return lazyArbs[key]!;
  };
  const strictArbs = builder(tie as any);
  for (const key in strictArbs) {
    if (!Object.prototype.hasOwnProperty.call(strictArbs, key)) {
      // Prevents accidental iteration over properties inherited from an object’s prototype
      continue;
    }
    const lazyAtKey = lazyArbs[key];
    const lazyArb = isLazyArbitrary(lazyAtKey) ? lazyAtKey : new LazyArbitrary(key);
    lazyArb.underlying = strictArbs[key];
    lazyArbs[key] = lazyArb;
  }
  return strictArbs;
}
