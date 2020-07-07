import { Arbitrary } from './definition/Arbitrary';
import { constantFrom } from './ConstantArbitrary';

type FalsyContraints = { withBigInt?: boolean };

// eslint-disable-next-line @typescript-eslint/ban-types
type FalsyType<TConstraints extends FalsyContraints = {}> =
  | false
  | null
  | 0
  | ''
  | typeof NaN
  | undefined
  | (TConstraints extends { withBigInt: true } ? 0n : never);

/**
 * For falsy values:
 * - ''
 * - 0
 * - NaN
 * - false
 * - null
 * - undefined
 * - 0n (whenever withBigInt: true)
 */
function falsy<TConstraints extends FalsyContraints>(constraints?: TConstraints): Arbitrary<FalsyType<TConstraints>> {
  if (!constraints || !constraints.withBigInt) return constantFrom<FalsyType>(false, null, undefined, 0, '', NaN);
  else return constantFrom<FalsyType<TConstraints>>(false, null, undefined, 0, '', NaN, BigInt(0) as any);
}

export { falsy };
