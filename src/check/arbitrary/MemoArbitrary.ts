import { Random } from '../../random/generator/Random';
import { Arbitrary } from './definition/Arbitrary';
import { Shrinkable } from './definition/Shrinkable';

export class MemoArbitrary<T> extends Arbitrary<T> {
  private lastFreq = -1;
  private lastBiased: Arbitrary<T> = this;
  constructor(readonly underlying: Arbitrary<T>) {
    super();
  }
  generate(mrng: Random): Shrinkable<T> {
    return this.underlying.generate(mrng);
  }
  withBias(freq: number): Arbitrary<T> {
    if (freq !== this.lastFreq) {
      this.lastFreq = freq;
      this.lastBiased = this.underlying.withBias(freq);
    }
    return this.lastBiased;
  }
}

export type Memo<T> = (cur?: number) => Arbitrary<T>;

let contextRemainingDepth = 10;
export const memo = <T>(f: (n: number) => Arbitrary<T>): Memo<T> => {
  const previous: { [depth: number]: Arbitrary<T> } = {};
  return ((maxDepth?: number): Arbitrary<T> => {
    const n = maxDepth !== undefined ? maxDepth : contextRemainingDepth;
    if (!previous.hasOwnProperty(n)) {
      const prev = contextRemainingDepth;
      contextRemainingDepth = n - 1;
      previous[n] = new MemoArbitrary(f(n));
      contextRemainingDepth = prev;
    }
    return previous[n];
  }) as Memo<T>;
};
