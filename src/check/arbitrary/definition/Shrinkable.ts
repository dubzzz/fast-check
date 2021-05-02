import { Stream } from '../../../stream/Stream';
import { cloneMethod, hasCloneMethod, WithCloneMethod } from '../../symbols';

/**
 * A `Shrinkable<T, TShrink = T>` holds an internal value of type `T`
 * and can shrink it to smaller `TShrink` values
 *
 * @remarks Since 0.0.7
 * @public
 */
export class Shrinkable<T, TShrink extends T = T> {
  /**
   * State storing the result of hasCloneMethod
   * If `true` the value will be cloned each time it gets accessed
   * @remarks Since 1.8.0
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
   * @remarks Since 1.8.0
   */
  readonly value!: T;
  /**
   * Internal value of the shrinkable
   * @remarks Since 1.8.0
   */
  readonly value_: T;
  /**
   * Function producing Stream of shrinks associated to value
   * @remarks Since 0.0.1
   */
  readonly shrink: () => Stream<Shrinkable<TShrink>>;

  /**
   * @param value_ - Internal value of the shrinkable
   * @param shrink - Function producing Stream of shrinks associated to value
   * @param customGetValue - Limited to internal usages (to ease migration to next), it will be removed on next major
   */
  constructor(
    value_: T,
    shrink: () => Stream<Shrinkable<TShrink>> = () => Stream.nil<Shrinkable<TShrink>>(),
    customGetValue: (() => T) | undefined = undefined
  ) {
    this.value_ = value_;
    this.shrink = shrink;
    this.hasToBeCloned = hasCloneMethod(value_);
    this.readOnce = false;
    Object.defineProperty(this, 'value', { get: customGetValue !== undefined ? customGetValue : this.getValue });
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
        (out as any)[cloneMethod] = () => this.applyMapper(mapper);
      }
      return out;
    }
    return mapper(this.value);
  }

  /**
   * Create another shrinkable by mapping all values using the provided `mapper`
   * Both the original value and the shrunk ones are impacted
   * @param mapper - Map function, to produce a new element based on an old one
   * @returns New shrinkable with mapped elements
   * @remarks Since 0.0.1
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
   *
   * @remarks Since 1.23.0
   */
  filter<U extends TShrink>(refinement: (t: TShrink) => t is U): Shrinkable<T, U>;
  /**
   * Create another shrinkable
   * by filtering its shrunk values against `predicate`
   *
   * All the shrunk values produced by the resulting `Shrinkable<T>`
   * satisfy `predicate(value) == true`
   * @param predicate - Predicate, to test each produced element. Return true to keep the element, false otherwise
   * @returns New shrinkable filtered using predicate
   *
   * @remarks Since 0.0.1
   */
  filter(predicate: (t: TShrink) => boolean): Shrinkable<T, TShrink>;
  filter<U extends TShrink>(refinement: (t: TShrink) => t is U): Shrinkable<T, U> {
    const refinementOnShrinkable = (s: Shrinkable<TShrink, TShrink>): s is Shrinkable<U, U> => {
      return refinement(s.value_);
    };
    return new Shrinkable<T, U>(this.value, () =>
      this.shrink()
        .filter(refinementOnShrinkable)
        .map((v) => v.filter(refinement) /* touch .value */)
    );
  }
}
