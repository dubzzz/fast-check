/**
 * Generated instances having a method [cloneMethod]
 * will be automatically cloned whenever necessary
 *
 * This is pretty useful for statefull generated values.
 * For instance, whenever you use a Stream you directly impact it.
 * Implementing [cloneMethod] on the generated Stream would force
 * the framework to clone it whenever it has to re-use it
 * (mainly required for chrinking process)
 */
export const cloneMethod = Symbol.for('fast-check/cloneMethod');

/** @internal */
export interface WithCloneMethod<T> {
  [cloneMethod]: () => T;
}

/** @internal */
export const hasCloneMethod = <T>(instance: T | WithCloneMethod<T>): instance is WithCloneMethod<T> => {
  // Valid values for `instanceof Object`:
  //   [], {}, () => {}, function() {}, async () => {}, async function() {}
  // Invalid ones:
  //   1, "", Symbol(), null, undefined
  return instance instanceof Object && typeof (instance as any)[cloneMethod] === 'function';
};
