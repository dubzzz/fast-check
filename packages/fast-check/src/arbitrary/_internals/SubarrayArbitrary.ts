import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../check/arbitrary/definition/Value';
import { Random } from '../../random/generator/Random';
import { makeLazy } from '../../stream/LazyIterableIterator';
import { Stream } from '../../stream/Stream';
import { safeMap, safePush, safeSlice, safeSort, safeSplice } from '../../utils/globals';
import { isSubarrayOf } from './helpers/IsSubarrayOf';
import { IntegerArbitrary } from './IntegerArbitrary';

const safeMathFloor = Math.floor;
const safeMathLog = Math.log;
const safeArrayIsArray = Array.isArray;

/** @internal */
export class SubarrayArbitrary<T> extends Arbitrary<T[]> {
  readonly lengthArb: Arbitrary<number>;
  readonly biasedLengthArb: Arbitrary<number>;
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
    this.biasedLengthArb =
      minLength !== maxLength
        ? new IntegerArbitrary(
            minLength,
            minLength + safeMathFloor(safeMathLog(maxLength - minLength) / safeMathLog(2))
          )
        : this.lengthArb;
  }

  generate(mrng: Random, biasFactor: number | undefined): Value<T[]> {
    const lengthArb =
      biasFactor !== undefined && mrng.nextInt(1, biasFactor) === 1 ? this.biasedLengthArb : this.lengthArb;
    const size = lengthArb.generate(mrng, undefined);
    const sizeValue = size.value;

    const remainingElements = safeMap(this.originalArray, (_v, idx) => idx);
    const ids: number[] = [];
    for (let index = 0; index !== sizeValue; ++index) {
      const selectedIdIndex = mrng.nextInt(0, remainingElements.length - 1);
      safePush(ids, remainingElements[selectedIdIndex]);
      safeSplice(remainingElements, selectedIdIndex, 1);
    }
    if (this.isOrdered) {
      safeSort(ids, (a, b) => a - b);
    }

    return new Value(
      safeMap(ids, (i) => this.originalArray[i]),
      size.context
    );
  }

  canShrinkWithoutContext(value: unknown): value is T[] {
    if (!safeArrayIsArray(value)) {
      return false;
    }
    if (!this.lengthArb.canShrinkWithoutContext(value.length)) {
      return false;
    }
    return isSubarrayOf(this.originalArray, value);
  }

  shrink(value: T[], context: unknown): Stream<Value<T[]>> {
    // shrinking one by one is not the most comprehensive
    // but allows a reasonable number of entries in the shrink
    if (value.length === 0) {
      return Stream.nil<Value<T[]>>();
    }
    return this.lengthArb
      .shrink(value.length, context)
      .map((newSize) => {
        return new Value(
          safeSlice(value, value.length - newSize.value), // array of length newSize.value
          newSize.context // integer context for value newSize.value (the length)
        );
      })
      .join(
        value.length > this.minLength
          ? makeLazy(() =>
              this.shrink(safeSlice(value, 1), undefined)
                .filter((newValue) => this.minLength <= newValue.value.length + 1)
                .map((newValue) => new Value([value[0], ...newValue.value], undefined))
            )
          : Stream.nil<Value<T[]>>()
      );
  }
}
