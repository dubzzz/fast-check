/**
 * @hidden
 * Find first element matching the predicate in the array, or null if none match
 * Equivalent to Array.prototype.find, but works on Internet Explorer 11.
 */
export function findOrUndefined<T> (ts: ArrayLike<T>, f: (t: T) => boolean): T | undefined {
  for (let i = 0; i < ts.length; i++) {
    const t = ts[i];
    if (f(t)) return t;
  }
  return undefined;
}