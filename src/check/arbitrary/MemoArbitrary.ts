import { Random } from '../../random/generator/Random';
import { Arbitrary } from './definition/Arbitrary';
import { biasWrapper } from './definition/BiasedArbitraryWrapper';
import { Shrinkable } from './definition/Shrinkable';

class MemoArbitrary<T> extends Arbitrary<T> {
  constructor(readonly underlying: Arbitrary<T>) {
    super();
  }
  generate(mrng: Random): Shrinkable<T> {
    return this.underlying.generate(mrng);
  }
  withBias(freq: number): Arbitrary<T> {
    return biasWrapper(freq, this, (unbiased: MemoArbitrary<T>) => unbiased.underlying.withBias(freq));
  }
}

export type Memo<T> = (cur?: number) => Arbitrary<T>;

let contextRemainingDepth = 20;
export const memo = <T>(f: (n: number) => Arbitrary<T>): Memo<T> => {
  const previous: { [depth: number]: Arbitrary<T> } = {};
  return ((maxDepth?: number): Arbitrary<T> => {
    const n = maxDepth || contextRemainingDepth;
    if (!previous.hasOwnProperty(n)) {
      const prev = contextRemainingDepth;
      contextRemainingDepth = n - 1;
      previous[n] = new MemoArbitrary(f(n));
      contextRemainingDepth = prev;
    }
    return previous[n];
  }) as Memo<T>;
};
