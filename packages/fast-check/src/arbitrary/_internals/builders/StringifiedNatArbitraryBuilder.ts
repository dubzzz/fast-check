import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { constantFrom } from '../../constantFrom.js';
import { nat } from '../../nat.js';
import { tuple } from '../../tuple.js';
import { natToStringifiedNatMapper, natToStringifiedNatUnmapper } from '../mappers/NatToStringifiedNat.js';

/** @internal */
export function buildStringifiedNatArbitrary(maxValue: number): Arbitrary<string> {
  return tuple(constantFrom('dec', 'oct', 'hex'), nat(maxValue)).map(
    natToStringifiedNatMapper,
    natToStringifiedNatUnmapper,
  );
}
