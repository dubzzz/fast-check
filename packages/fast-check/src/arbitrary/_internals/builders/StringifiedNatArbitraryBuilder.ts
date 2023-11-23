import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { constantFrom } from '../../constantFrom';
import { nat } from '../../nat';
import { tuple } from '../../tuple';
import { natToStringifiedNatMapper, natToStringifiedNatUnmapper } from '../mappers/NatToStringifiedNat';

/** @internal */
export function buildStringifiedNatArbitrary(maxValue: number): Arbitrary<string> {
  return tuple(constantFrom('dec', 'oct', 'hex'), nat(maxValue)).map(
    natToStringifiedNatMapper,
    natToStringifiedNatUnmapper,
  );
}
