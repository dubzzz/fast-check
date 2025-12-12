import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import type { Value } from '../../../check/arbitrary/definition/Value.js';
import type { Random } from '../../../random/generator/Random.js';
import type { SlicedGenerator } from '../interfaces/SlicedGenerator.js';

/** @internal */
export class NoopSlicedGenerator<T> implements SlicedGenerator<T> {
  constructor(
    private readonly arb: Arbitrary<T>,
    private readonly mrng: Random,
    private readonly biasFactor: number | undefined,
  ) {}
  attemptExact(): void {
    return;
  }
  next(): Value<T> {
    return this.arb.generate(this.mrng, this.biasFactor);
  }
}
