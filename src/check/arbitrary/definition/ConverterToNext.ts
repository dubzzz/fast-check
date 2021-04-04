import { Random } from '../../../random/generator/Random';
import { Stream } from '../../../stream/Stream';
import { Arbitrary } from './Arbitrary';
import { ConverterFromNext } from './ConverterFromNext';
import { NextArbitrary } from './NextArbitrary';
import { NextValue } from './NextValue';
import { Shrinkable } from './Shrinkable';

const identifier = '__ConverterToNext__';

/** @internal */
export class ConverterToNext<T> extends NextArbitrary<T> {
  [identifier] = true;
  static isConverterToNext<T>(arb: NextArbitrary<T>): arb is ConverterToNext<T> {
    return identifier in arb;
  }
  private static convertIfNeeded<T>(arb: Arbitrary<T>): NextArbitrary<T> {
    if (ConverterFromNext.isConverterFromNext(arb)) return arb.arb;
    else return new ConverterToNext(arb);
  }

  constructor(readonly arb: Arbitrary<T>) {
    super();
  }

  generate(mrng: Random, biasFactor: number | undefined): NextValue<T> {
    const g = biasFactor !== undefined ? this.arb.withBias(biasFactor).generate(mrng) : this.arb.generate(mrng);
    return new NextValue(g.value_, g, () => g.value);
  }

  canGenerate(_value: unknown): _value is T {
    return false;
  }

  shrink(_value: T, context?: unknown): Stream<NextValue<T>> {
    if (this.isSafeContext(context)) {
      return context.shrink().map((s) => new NextValue(s.value_, s, () => s.value));
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
    return ConverterToNext.convertIfNeeded(this.arb.filter(refinement));
  }

  map<U>(mapper: (t: T) => U): NextArbitrary<U> {
    return ConverterToNext.convertIfNeeded(this.arb.map(mapper));
  }

  chain<U>(fmapper: (t: T) => NextArbitrary<U>): NextArbitrary<U> {
    return ConverterToNext.convertIfNeeded(
      this.arb.chain((t) => {
        const fmapped = fmapper(t);
        if (ConverterToNext.isConverterToNext(fmapped)) return fmapped.arb;
        else return new ConverterFromNext(fmapped);
      })
    );
  }

  noShrink(): NextArbitrary<T> {
    return ConverterToNext.convertIfNeeded(this.arb.noShrink());
  }

  noBias(): NextArbitrary<T> {
    return ConverterToNext.convertIfNeeded(this.arb.noBias());
  }
}
