import { Random, Shrinkable, Stream } from '../../../fast-check-default';
import { Arbitrary } from './Arbitrary';
import { ConverterFromNext } from './ConverterFromNext';
import { NextArbitrary } from './NextArbitrary';
import { NextValue } from './NextValue';

const identifier = '__ConverterToNext__';

/** @internal */
export class ConverterToNext<T> extends NextArbitrary<T> {
  [identifier] = true;
  static isConverterToNext<T>(arb: NextArbitrary<T>): arb is ConverterToNext<T> {
    return identifier in arb;
  }

  constructor(readonly arb: Arbitrary<T>) {
    super();
  }

  generate(mrng: Random): NextValue<T> {
    const g = this.arb.generate(mrng);
    return new NextValue(g.value_, g);
  }

  canGenerate(_value: unknown): _value is T {
    return false;
  }

  shrink(_value: T, context?: unknown): Stream<NextValue<T>> {
    if (this.isSafeContext(context)) {
      return context.shrink().map((s) => new NextValue(s.value_, s));
    }
    return Stream.nil();
  }
  private isSafeContext(context: unknown): context is Shrinkable<T> {
    return (
      context != null && typeof context === 'object' && 'value' in (context as any) && 'shrink' in (context as any)
    );
  }

  filter<U extends T>(refinement: (t: T) => t is U): NextArbitrary<U>;
  filter(predicate: (t: T) => boolean): NextArbitrary<T>;
  filter<U extends T>(refinement: (t: T) => t is U): NextArbitrary<U> {
    return new ConverterToNext(this.arb.filter(refinement));
  }

  map<U>(mapper: (t: T) => U): NextArbitrary<U> {
    return new ConverterToNext(this.arb.map(mapper));
  }

  chain<U>(fmapper: (t: T) => NextArbitrary<U>): NextArbitrary<U> {
    return new ConverterToNext(
      this.arb.chain((t) => {
        const fmapped = fmapper(t);
        if (ConverterToNext.isConverterToNext(fmapped)) return fmapped.arb;
        else return new ConverterFromNext(fmapped);
      })
    );
  }

  noShrink(): NextArbitrary<T> {
    return new ConverterToNext(this.arb.noShrink());
  }

  withBias(freq: number): NextArbitrary<T> {
    return new ConverterToNext(this.arb.withBias(freq));
  }

  noBias(): NextArbitrary<T> {
    return new ConverterToNext(this.arb.noBias());
  }
}
