import { Stream } from '../../../stream/Stream';
import { cloneMethod, hasCloneMethod, WithCloneMethod } from '../../symbols';

/**
 * A Shrinkable<T> holds an internal value of type `T`
 * and can shrink it to smaller `T` values
 */
export class Shrinkable<T> {
  /**
   * State storing the result of hasCloneMethod
   * If <true> the value will be cloned each time it gets accessed
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
   * Depending on {@link hasToBeCloned} it will either be {@link value_} or a clone of it
   */
  readonly value!: T;

  /**
   * @param value Internal value of the shrinkable
   * @param shrink Function producing Stream of shrinks associated to value
   */
  // tslint:disable-next-line:variable-name
  constructor(readonly value_: T, readonly shrink: () => Stream<Shrinkable<T>> = () => Stream.nil<Shrinkable<T>>()) {
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
   * @param mapper Map function, to produce a new element based on an old one
   * @returns New shrinkable with mapped elements
   */
  map<U>(mapper: (t: T) => U): Shrinkable<U> {
    return new Shrinkable<U>(this.applyMapper(mapper), () => this.shrink().map(v => v.map<U>(mapper)));
  }

  /**
   * Create another shrinkable
   * by filtering its shrunk values against `predicate`
   *
   * All the shrunk values produced by the resulting `Shrinkable<T>`
   * satisfy `predicate(value) == true`
   *
   * @param predicate Predicate, to test each produced element. Return true to keep the element, false otherwise
   * @returns New shrinkable filtered using predicate
   */
  filter(predicate: (t: T) => boolean): Shrinkable<T> {
    return new Shrinkable<T>(this.value, () =>
      this.shrink()
        .filter(v => predicate(v.value))
        .map(v => v.filter(predicate))
    );
  }
}
