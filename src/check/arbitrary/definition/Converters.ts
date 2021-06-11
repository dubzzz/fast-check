import { Arbitrary, assertIsArbitrary } from './Arbitrary';
import { ArbitraryWithContextualShrink } from './ArbitraryWithContextualShrink';
import { ConverterFromNext } from './ConverterFromNext';
import { ConverterToNext } from './ConverterToNext';
import { assertIsNextArbitrary, NextArbitrary } from './NextArbitrary';

/**
 * Convert an instance of NextArbitrary to an instance of Arbitrary
 * @param arb - The instance to be converted
 * @remarks Since 2.15.0
 * @public
 */
export function convertFromNext<T>(arb: NextArbitrary<T>): Arbitrary<T> {
  if (ConverterToNext.isConverterToNext(arb)) {
    return arb.arb;
  }
  assertIsNextArbitrary(arb);
  return new ConverterFromNext(arb);
}

/**
 * Convert an instance of NextArbitrary to an instance of ArbitraryWithContextualShrink
 * @param arb - The instance to be converted
 * @param legacyShrunkOnceContext - Default context to be returned when shrunk once
 * @remarks Since 2.15.0
 * @public
 */
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

/**
 * Convert an instance of Arbitrary to an instance of NextArbitrary
 * @param arb - The instance to be converted
 * @remarks Since 2.15.0
 * @public
 */
export function convertToNext<T>(arb: Arbitrary<T>): NextArbitrary<T> {
  if (ConverterFromNext.isConverterFromNext(arb)) {
    return arb.arb as NextArbitrary<T>;
  }
  assertIsArbitrary(arb);
  return new ConverterToNext(arb);
}
