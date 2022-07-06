import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../../check/arbitrary/definition/Value';
import { Random } from '../../../random/generator/Random';
import { SlicedGenerator } from '../interfaces/SlicedGenerator';

/** @internal */
export class SlicedBasedGenerator<T> implements SlicedGenerator<T> {
  private activeSliceIndex = 0;
  private nextIndexInSlice = 0; // the next index to take from the slice
  private lastIndexInSlice = -1; // the last index accepted for the current slice
  constructor(
    private readonly arb: Arbitrary<T>,
    private readonly mrng: Random,
    private readonly slices: T[][],
    private readonly biasFactor: number
  ) {}
  attemptExact(targetLength: number): void {
    if (targetLength !== 0 && this.mrng.nextInt(1, this.biasFactor) === 1) {
      // Let's setup the generator for exact matching if any possible
      const eligibleIndices: number[] = [];
      for (let index = 0; index !== this.slices.length; ++index) {
        const slice = this.slices[index];
        if (slice.length === targetLength) {
          eligibleIndices.push(index);
        }
      }
      if (eligibleIndices.length === 0) {
        return;
      }
      this.activeSliceIndex = eligibleIndices[this.mrng.nextInt(0, eligibleIndices.length - 1)];
      this.nextIndexInSlice = 0;
      this.lastIndexInSlice = targetLength - 1;
    }
  }
  next(): Value<T> {
    if (this.nextIndexInSlice <= this.lastIndexInSlice) {
      // We continue on the previously selected slice
      return new Value(this.slices[this.activeSliceIndex][this.nextIndexInSlice++], undefined);
    }
    if (this.mrng.nextInt(1, this.biasFactor) !== 1) {
      // We don't use the slices
      return this.arb.generate(this.mrng, this.biasFactor);
    }
    // We update the active slice
    this.activeSliceIndex = this.mrng.nextInt(0, this.slices.length - 1);
    const slice = this.slices[this.activeSliceIndex];
    if (this.mrng.nextInt(1, this.biasFactor) !== 1) {
      // We will consider the whole slice and not a sub-set of it
      this.nextIndexInSlice = 1;
      this.lastIndexInSlice = slice.length - 1;
      return new Value(slice[0], undefined);
    }
    const rangeBoundaryA = this.mrng.nextInt(0, slice.length - 1);
    const rangeBoundaryB = this.mrng.nextInt(0, slice.length - 1);
    this.nextIndexInSlice = Math.min(rangeBoundaryA, rangeBoundaryB);
    this.lastIndexInSlice = Math.max(rangeBoundaryA, rangeBoundaryB);
    return new Value(slice[this.nextIndexInSlice++], undefined);
  }
}
