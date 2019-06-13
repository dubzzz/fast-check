import { Random } from '../../random/generator/Random';
import { Arbitrary } from './definition/Arbitrary';
import { Shrinkable } from './definition/Shrinkable';

class LazyArbitrary extends Arbitrary<any> {
  private static readonly MaxBiasLevels = 5;
  private numBiasLevels = 0;
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

    const numBefore = this.numBiasLevels;
    ++this.numBiasLevels;

    const biasedArb = this.underlying.withBias(freq);

    --this.numBiasLevels;
    if (this.numBiasLevels !== numBefore) {
      throw new Error(`Mismatched bias level for ${JSON.stringify(this.name)}`);
    }
    return biasedArb;
  }
}

function isLazyArbitrary(arb: Arbitrary<any>): arb is LazyArbitrary {
  return arb.hasOwnProperty('underlying');
}

export function letrec<T>(
  builder: (tie: (key: string) => Arbitrary<any>) => { [K in keyof T]: Arbitrary<T[K]> }
): { [K in keyof T]: Arbitrary<T[K]> } {
  const lazyArbs: { [K in keyof T]?: Arbitrary<T[K]> } = {};
  const tie = (key: keyof T): Arbitrary<any> => {
    if (!lazyArbs[key]) lazyArbs[key] = new LazyArbitrary(key as any);
    return lazyArbs[key]!;
  };
  const strictArbs = builder(tie as any);
  for (const key in lazyArbs) {
    if (!lazyArbs.hasOwnProperty(key)) {
      // Prevents accidental iteration over properties inherited from an object’s prototype
      continue;
    }
    const arb = strictArbs[key];
    const lazyArb = lazyArbs[key]!;
    if (!arb) {
      throw new Error(`Missing arbitrary for ${JSON.stringify(key)}`);
    }
    if (!isLazyArbitrary(lazyArb)) {
      throw new Error(`Invalid lazy arbitrary for ${JSON.stringify(key)}`);
    }
    lazyArb.underlying = arb;
  }
  return strictArbs;
}
