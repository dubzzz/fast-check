import { Arbitrary, assertIsArbitrary } from './Arbitrary';
import { ArbitraryWithContextualShrink } from './ArbitraryWithContextualShrink';
import { ConverterFromNext } from './ConverterFromNext';
import { ConverterToNext } from './ConverterToNext';
import { assertIsNextArbitrary, NextArbitrary } from './NextArbitrary';

export function convertFromNext<T>(arb: NextArbitrary<T>): Arbitrary<T> {
  if (ConverterToNext.isConverterToNext(arb)) {
    return arb.arb;
  }
  assertIsNextArbitrary(arb);
  return new ConverterFromNext(arb);
}

export function convertFromNextWithShrunkOnce<T>(
  arb: NextArbitrary<T>,
  legacyShrunkOnceContext: unknown
): ArbitraryWithContextualShrink<T> {
  if (ConverterToNext.isConverterToNext(arb)) {
    if (
      !('contextualShrink' in arb.arb) ||
      !('contextualShrinkableFor' in arb.arb) ||
      !('shrunkOnceContext' in arb.arb) ||
      !('shrink' in arb.arb) ||
      !('shrinkableFor' in arb.arb)
    ) {
      throw new Error('Conversion rejected: Underlying arbitrary is not compatible with ArbitraryWithContextualShrink');
    }
    return arb.arb;
  }
  assertIsNextArbitrary(arb);
  return new ConverterFromNext(arb, legacyShrunkOnceContext);
}

export function convertToNext<T>(arb: Arbitrary<T>): NextArbitrary<T> {
  if (ConverterFromNext.isConverterFromNext(arb)) {
    return arb.arb as NextArbitrary<T>;
  }
  assertIsArbitrary(arb);
  return new ConverterToNext(arb);
}
