import { Arbitrary, assertIsArbitrary } from './Arbitrary';
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

export function convertToNext<T>(arb: Arbitrary<T>): NextArbitrary<T> {
  if (ConverterFromNext.isConverterFromNext(arb)) {
    return arb.arb as NextArbitrary<T>;
  }
  assertIsArbitrary(arb);
  return new ConverterToNext(arb);
}
