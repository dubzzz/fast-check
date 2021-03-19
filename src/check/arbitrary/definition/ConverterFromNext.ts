import { Random } from '../../../fast-check-default';
import { Arbitrary } from './Arbitrary';
import { ConverterToNext } from './ConverterToNext';
import { NextArbitrary } from './NextArbitrary';
import { NextValue } from './NextValue';
import { Shrinkable } from './Shrinkable';

const identifier = '__ConverterFromNext__';

/** @internal */
export class ConverterFromNext<T> extends Arbitrary<T> {
  [identifier] = true;
  static isConverterFromNext<T>(arb: Arbitrary<T>): arb is ConverterFromNext<T> {
    return identifier in arb;
  }

  constructor(readonly arb: NextArbitrary<T>) {
    super();
  }

  generate(mrng: Random): Shrinkable<T, T> {
    const g = this.arb.generate(mrng);
    return this.toShrinkable(g);
  }
  private toShrinkable(v: NextValue<T>): Shrinkable<T, T> {
    return new Shrinkable(v.value_, () => this.arb.shrink(v.value_, v.context).map((nv) => this.toShrinkable(nv)));
  }

  filter<U extends T>(refinement: (t: T) => t is U): Arbitrary<U>;
  filter(predicate: (t: T) => boolean): Arbitrary<T>;
  filter<U extends T>(refinement: (t: T) => t is U): Arbitrary<U> {
    return new ConverterFromNext(this.arb.filter(refinement));
  }

  map<U>(mapper: (t: T) => U): Arbitrary<U> {
    return new ConverterFromNext(this.arb.map(mapper));
  }

  chain<U>(fmapper: (t: T) => Arbitrary<U>): Arbitrary<U> {
    return new ConverterFromNext(
      this.arb.chain((t) => {
        const fmapped = fmapper(t);
        if (ConverterFromNext.isConverterFromNext(fmapped)) return fmapped.arb;
        else return new ConverterToNext(fmapped);
      })
    );
  }

  noShrink(): Arbitrary<T> {
    return new ConverterFromNext(this.arb.noShrink());
  }

  withBias(freq: number): Arbitrary<T> {
    return new ConverterFromNext(this.arb.withBias(freq));
  }

  noBias(): Arbitrary<T> {
    return new ConverterFromNext(this.arb.noBias());
  }
}
