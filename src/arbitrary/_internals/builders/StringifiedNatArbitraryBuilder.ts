import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../../../check/arbitrary/definition/Converters';
import { constantFrom } from '../../constantFrom';
import { nat } from '../../nat';
import { tuple } from '../../tuple';
import { natToStringifiedNatMapper, natToStringifiedNatUnmapper } from '../mappers/NatToStringifiedNat';

/** @internal */
export function buildStringifiedNatArbitrary(maxValue: number): Arbitrary<string> {
  return convertFromNext(
    convertToNext(tuple(constantFrom<('dec' | 'oct' | 'hex')[]>('dec', 'oct', 'hex'), nat(maxValue))).map(
      natToStringifiedNatMapper,
      natToStringifiedNatUnmapper
    )
  );
}
