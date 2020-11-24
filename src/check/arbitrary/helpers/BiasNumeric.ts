import { Random } from '../../../random/generator/Random';
import { Arbitrary } from '../definition/Arbitrary';
import { Shrinkable } from '../definition/Shrinkable';

/** @internal */
type Numeric = number | bigint;

/** @internal */
type NumericArbitrary<NType> = new (min: NType, max: NType, genMin: NType, genMax: NType) => Arbitrary<NType>;

/** @internal */
export class BiasedNumericArbitrary<NType> extends Arbitrary<NType> {
  private readonly arbs: Arbitrary<NType>[];
  constructor(readonly arbCloseToZero: Arbitrary<NType>, ...arbs: Arbitrary<NType>[]) {
    super();
    this.arbs = arbs;
  }
  generate(mrng: Random): Shrinkable<NType> {
    const id = mrng.nextInt(-2 * this.arbs.length, this.arbs.length - 1); // 2 close to zero for 1 in others
    return id < 0 ? this.arbCloseToZero.generate(mrng) : this.arbs[id].generate(mrng);
  }
}

/** @internal */
export function biasNumeric<NType extends Numeric>(
  min: NType,
  max: NType,
  Ctor: NumericArbitrary<NType>,
  logLike: (n: NType) => NType
): Arbitrary<NType> {
  if (min === max) {
    return new Ctor(min, max, min, max);
  }
  if (min < 0 && max > 0) {
    // min < 0 && max > 0
    const logMin = logLike(-min as any); // min !== 0
    const logMax = logLike(max); // max !== 0
    return new BiasedNumericArbitrary(
      new Ctor(min, max, -logMin as any, logMax), // close to zero,
      new Ctor(min, max, (max - logMax) as any, max), // close to max
      new Ctor(min, max, min, (min as any) + logMin) // close to min
    );
  }
  // Either min < 0 && max <= 0
  // Or min >= 0, so max >= 0
  const logGap = logLike((max - min) as any); // max-min !== 0
  const arbCloseToMin = new Ctor(min, max, min, (min as any) + logGap); // close to min
  const arbCloseToMax = new Ctor(min, max, (max - logGap) as any, max); // close to max
  return min < 0
    ? new BiasedNumericArbitrary(arbCloseToMax, arbCloseToMin) // max is closer to zero
    : new BiasedNumericArbitrary(arbCloseToMin, arbCloseToMax); // min is closer to zero
}

/** @internal */
export function integerLogLike(v: number): number {
  return Math.floor(Math.log(v) / Math.log(2));
}

/** @internal */
export function bigIntLogLike(v: bigint): bigint {
  if (v === BigInt(0)) return BigInt(0);
  return BigInt(v.toString().length);
}
