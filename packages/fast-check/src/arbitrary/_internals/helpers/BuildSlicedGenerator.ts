import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { Random } from '../../../random/generator/Random';
import { NoopSlicedGenerator } from '../implementations/NoopSlicedGenerator';
import { SlicedBasedGenerator } from '../implementations/SlicedBasedGenerator';
import { SlicedGenerator } from '../interfaces/SlicedGenerator';

/**
 * Build a {@link SlicedGenerator}
 *
 * @param arb - Arbitrary able to generate values
 * @param mrng - Random number generator
 * @param slices - Slices to be used (WARNING: while we accept no slices, slices themselves must never empty)
 * @param biasFactor - The current bias factor
 *
 * @internal
 */
export function buildSlicedGenerator<T>(
  arb: Arbitrary<T>,
  mrng: Random,
  slices: T[][],
  biasFactor: number | undefined
): SlicedGenerator<T> {
  // We by-pass any slice-based logic if one of:
  // - no bias
  // - no slices
  // - not our turn: we only apply the slices fallbacks on 1 run over biasFactor
  if (biasFactor === undefined || slices.length === 0 || mrng.nextInt(1, biasFactor) !== 1) {
    return new NoopSlicedGenerator(arb, mrng, biasFactor);
  }
  return new SlicedBasedGenerator(arb, mrng, slices, biasFactor);
}
