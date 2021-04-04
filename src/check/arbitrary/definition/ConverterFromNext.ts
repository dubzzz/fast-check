import { Random } from '../../../random/generator/Random';
import { Stream } from '../../../stream/Stream';
import { Arbitrary } from './Arbitrary';
import { ArbitraryWithContextualShrink } from './ArbitraryWithContextualShrink';
import { ConverterToNext } from './ConverterToNext';
import { NextArbitrary } from './NextArbitrary';
import { NextValue } from './NextValue';
import { Shrinkable } from './Shrinkable';

const identifier = '__ConverterFromNext__';

/** @internal */
export class ConverterFromNext<T> extends ArbitraryWithContextualShrink<T> {
  [identifier] = true;
  static isConverterFromNext<T>(arb: Arbitrary<T>): arb is ConverterFromNext<T> {
    return identifier in arb;
  }
  private static convertIfNeeded<T>(arb: NextArbitrary<T>): Arbitrary<T> {
    if (ConverterToNext.isConverterToNext(arb)) return arb.arb;
    else return new ConverterFromNext(arb);
  }

  constructor(
    readonly arb: NextArbitrary<T>,
    readonly legacyShrunkOnceContext?: unknown,
    readonly biasFactor: number | undefined = undefined
  ) {
    super();
  }

  generate(mrng: Random): Shrinkable<T, T> {
    const g = this.arb.generate(mrng, this.biasFactor);
    return this.toShrinkable(g);
  }
  private toShrinkable(v: NextValue<T>): Shrinkable<T, T> {
    return new Shrinkable(
      v.value_,
      () => this.arb.shrink(v.value_, v.context).map((nv) => this.toShrinkable(nv)),
      () => v.value
    );
  }

  contextualShrink(value: T, context?: unknown): Stream<[T, unknown]> {
    return this.arb.shrink(value, context).map((v) => [v.value_, v.context]);
  }

  shrunkOnceContext(): unknown {
    return this.legacyShrunkOnceContext;
  }

  filter<U extends T>(refinement: (t: T) => t is U): Arbitrary<U>;
  filter(predicate: (t: T) => boolean): Arbitrary<T>;
  filter<U extends T>(refinement: (t: T) => t is U): Arbitrary<U> {
    return ConverterFromNext.convertIfNeeded(this.arb.filter(refinement));
  }

  map<U>(mapper: (t: T) => U): Arbitrary<U> {
    return ConverterFromNext.convertIfNeeded(this.arb.map(mapper));
  }

  chain<U>(fmapper: (t: T) => Arbitrary<U>): Arbitrary<U> {
    return ConverterFromNext.convertIfNeeded(
      this.arb.chain((t) => {
        const fmapped = fmapper(t);
        if (ConverterFromNext.isConverterFromNext(fmapped)) return fmapped.arb;
        else return new ConverterToNext(fmapped);
      })
    );
  }

  noShrink(): Arbitrary<T> {
    return ConverterFromNext.convertIfNeeded(this.arb.noShrink());
  }

  withBias(freq: number): Arbitrary<T> {
    return new ConverterFromNext(this.arb, this.legacyShrunkOnceContext, freq);
  }

  noBias(): Arbitrary<T> {
    return ConverterFromNext.convertIfNeeded(this.arb.noBias());
  }
}
