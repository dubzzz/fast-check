import { Stream } from '../../../stream/Stream';
import { cloneMethod, hasCloneMethod, WithCloneMethod } from '../../symbols';

/**
 * A `Shrinkable<T, TShrink = T>` holds an internal value of type `T`
 * and can shrink it to smaller `TShrink` values
 *
 * @public
 */
export class Shrinkable<T, TShrink extends T = T> {
  /**
   * State storing the result of hasCloneMethod
   * If `true` the value will be cloned each time it gets accessed
   */
  readonly hasToBeCloned: boolean;
  /**
   * Flag indicating whether or not the this.value has already been called once
   * If so, the underlying will be cloned
   * Only set when hasToBeCloned = true
   */
  private readOnce: boolean;
  /**
   * Safe value of the shrinkable
   * Depending on `hasToBeCloned` it will either be `value_` or a clone of it
   */
  readonly value!: T;

  /**
   * @param value - Internal value of the shrinkable
   * @param shrink - Function producing Stream of shrinks associated to value
   */
  // tslint:disable-next-line:variable-name
  constructor(
    readonly value_: T,
    readonly shrink: () => Stream<Shrinkable<TShrink>> = () => Stream.nil<Shrinkable<TShrink>>()
  ) {
    this.hasToBeCloned = hasCloneMethod(value_);
    this.readOnce = false;
    Object.defineProperty(this, 'value', { get: this.getValue });
  }

  /** @internal */
  private getValue() {
    if (this.hasToBeCloned) {
      if (!this.readOnce) {
        this.readOnce = true;
        return this.value_;
      }
      return ((this.value_ as unknown) as WithCloneMethod<T>)[cloneMethod]();
    }
    return this.value_;
  }

  /** @internal */
  private applyMapper<U>(mapper: (t: T) => U): U {
    if (this.hasToBeCloned) {
      const out = mapper(this.value);
      if (out instanceof Object) {
        (out as any)[cloneMethod] = () => mapper(this.value);
      }
      return out;
    }
    return mapper(this.value);
  }

  /**
   * Create another shrinkable by mapping all values using the provided `mapper`
   * Both the original value and the shrunk ones are impacted
   *
   * @param mapper - Map function, to produce a new element based on an old one
   * @returns New shrinkable with mapped elements
   */
  map<U>(mapper: (t: T) => U): Shrinkable<U> {
    return new Shrinkable<U>(this.applyMapper(mapper), () => this.shrink().map((v) => v.map<U>(mapper)));
  }

  /**
   * Create another shrinkable
   * by filtering its shrunk values against `predicate`
   *
   * All the shrunk values produced by the resulting `Shrinkable<T>`
   * satisfy `predicate(value) == true`
   *
   * WARNING:
   * When using refinement - `(t: T) => t is U` - only the shrunk values are ensured to be of type U.
   * The type of the current value of the Shrinkable is your responsability.
   *
   * @param refinement - Predicate, to test each produced element. Return true to keep the element, false otherwise
   * @returns New shrinkable filtered using predicate
   */
  filter<U extends TShrink>(refinement: (t: TShrink) => t is U): Shrinkable<T, U>;
  /**
   * Create another shrinkable
   * by filtering its shrunk values against `predicate`
   *
   * All the shrunk values produced by the resulting `Shrinkable<T>`
   * satisfy `predicate(value) == true`
   *
   * @param predicate - Predicate, to test each produced element. Return true to keep the element, false otherwise
   * @returns New shrinkable filtered using predicate
   */
  filter(predicate: (t: TShrink) => boolean): Shrinkable<T, TShrink>;
  filter<U extends TShrink>(refinement: (t: TShrink) => t is U): Shrinkable<T, U> {
    const refinementOnShrinkable = (s: Shrinkable<TShrink, TShrink>): s is Shrinkable<U, U> => {
      return refinement(s.value);
    };
    return new Shrinkable<T, U>(this.value, () =>
      this.shrink()
        .filter(refinementOnShrinkable)
        .map((v) => v.filter(refinement))
    );
  }
}
