import { cloneMethod, hasCloneMethod, WithCloneMethod } from '../../symbols';

/**
 * A `Value<T, TShrink = T>` holds an internal value of type `T`
 * and its associated context
 *
 * @remarks Since 3.0.0 (previously called `NextValue` in 2.15.0)
 * @public
 */
export class Value<T> {
  /**
   * State storing the result of hasCloneMethod
   * If `true` the value will be cloned each time it gets accessed
   * @remarks Since 2.15.0
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
   * @remarks Since 2.15.0
   */
  readonly value!: T;
  /**
   * Internal value of the shrinkable
   * @remarks Since 2.15.0
   */
  readonly value_: T;
  /**
   * Context for the generated value
   * TODO - Do we want to clone it too?
   * @remarks 2.15.0
   */
  readonly context: unknown;

  /**
   * @param value_ - Internal value of the shrinkable
   * @param context - Context associated to the generated value (useful for shrink)
   * @param customGetValue - Limited to internal usages (to ease migration to next), it will be removed on next major
   */
  constructor(value_: T, context: unknown, customGetValue: (() => T) | undefined = undefined) {
    this.value_ = value_;
    this.context = context;
    this.hasToBeCloned = customGetValue !== undefined || hasCloneMethod(value_);
    this.readOnce = false;
    if (this.hasToBeCloned) {
      Object.defineProperty(this, 'value', { get: customGetValue !== undefined ? customGetValue : this.getValue });
    } else {
      this.value = value_;
    }
  }

  /** @internal */
  private getValue() {
    if (this.hasToBeCloned) {
      if (!this.readOnce) {
        this.readOnce = true;
        return this.value_;
      }
      return (this.value_ as unknown as WithCloneMethod<T>)[cloneMethod]();
    }
    return this.value_;
  }
}
