import { Arbitrary } from '../definition/Arbitrary';

/** @internal */
type Numeric = number | bigint;

/** @internal */
type NumericArbitrary<NType> = new (min: NType, max: NType, genMin: NType, genMax: NType) => Arbitrary<NType>;

/** @internal */
export function biasNumeric<NType extends Numeric>(
  min: NType,
  max: NType,
  Ctor: NumericArbitrary<NType>,
  logLike: (n: NType) => NType
) {
  if (min === max) {
    return new Ctor(min, max, min, max);
  }
  if (min < 0) {
    return max > 0
      ? new Ctor(min, max, -logLike(-min as any) as any, logLike(max)) // min and max != 0
      : new Ctor(min, max, (max - logLike((max - min) as any)) as any, max); // max-min != 0
  }
  // min >= 0, so max >= 0
  return new Ctor(min, max, min, (min as any) + logLike((max - min) as any)); // max-min != 0
}
