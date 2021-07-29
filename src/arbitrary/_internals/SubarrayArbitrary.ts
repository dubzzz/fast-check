import { NextArbitrary } from '../../check/arbitrary/definition/NextArbitrary';
import { NextValue } from '../../check/arbitrary/definition/NextValue';
import { Random } from '../../random/generator/Random';
import { makeLazy } from '../../stream/LazyIterableIterator';
import { Stream } from '../../stream/Stream';
import { isSubarrayOf } from './helpers/IsSubarrayOf';
import { IntegerArbitrary } from './IntegerArbitrary';

/** @internal */
export class SubarrayArbitrary<T> extends NextArbitrary<T[]> {
  readonly lengthArb: NextArbitrary<number>;
  readonly biasedLengthArb: NextArbitrary<number>;
  constructor(
    readonly originalArray: T[],
    readonly isOrdered: boolean,
    readonly minLength: number,
    readonly maxLength: number
  ) {
    super();
    if (minLength < 0 || minLength > originalArray.length)
      throw new Error(
        'fc.*{s|S}ubarrayOf expects the minimal length to be between 0 and the size of the original array'
      );
    if (maxLength < 0 || maxLength > originalArray.length)
      throw new Error(
        'fc.*{s|S}ubarrayOf expects the maximal length to be between 0 and the size of the original array'
      );
    if (minLength > maxLength)
      throw new Error('fc.*{s|S}ubarrayOf expects the minimal length to be inferior or equal to the maximal length');

    this.lengthArb = new IntegerArbitrary(minLength, maxLength);
    this.biasedLengthArb = new IntegerArbitrary(
      minLength,
      minLength + Math.floor(Math.log(maxLength - minLength) / Math.log(2))
    );
  }

  generate(mrng: Random, biasFactor: number | undefined): NextValue<T[]> {
    const lengthArb =
      biasFactor !== undefined && mrng.nextInt(1, biasFactor) === 1 ? this.biasedLengthArb : this.lengthArb;
    const size = lengthArb.generate(mrng, undefined);
    const sizeValue = size.value;

    const remainingElements = this.originalArray.map((_v, idx) => idx);
    const ids: number[] = [];
    for (let index = 0; index !== sizeValue; ++index) {
      const selectedIdIndex = mrng.nextInt(0, remainingElements.length - 1);
      ids.push(remainingElements[selectedIdIndex]);
      remainingElements.splice(selectedIdIndex, 1);
    }
    if (this.isOrdered) {
      ids.sort((a, b) => a - b);
    }

    return new NextValue(
      ids.map((i) => this.originalArray[i]),
      size.context
    );
  }

  canShrinkWithoutContext(value: unknown): value is T[] {
    if (!Array.isArray(value)) {
      return false;
    }
    if (!this.lengthArb.canShrinkWithoutContext(value.length)) {
      return false;
    }
    return isSubarrayOf(this.originalArray, value);
  }

  shrink(value: T[], context: unknown): Stream<NextValue<T[]>> {
    // shrinking one by one is not the most comprehensive
    // but allows a reasonable number of entries in the shrink
    if (value.length === 0) {
      return Stream.nil<NextValue<T[]>>();
    }
    return this.lengthArb
      .shrink(value.length, context)
      .map((newSize) => {
        return new NextValue(
          value.slice(value.length - newSize.value), // array of length newSize.value
          newSize.context // integer context for value newSize.value (the length)
        );
      })
      .join(
        value.length > this.minLength
          ? makeLazy(() =>
              this.shrink(value.slice(1), undefined)
                .filter((newValue) => this.minLength <= newValue.value.length + 1)
                .map((newValue) => new NextValue([value[0]].concat(newValue.value), undefined))
            )
          : Stream.nil<NextValue<T[]>>()
      );
  }
}
