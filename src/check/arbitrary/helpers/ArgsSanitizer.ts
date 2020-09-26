/**
 * Filter out trailing undefined values in args (if any).
 * They might cause wrong recognition of the signature that was called by the user.
 *
 * Our code is expecting to be called with:
 *   function code(a: number, b: number, c: number) {}
 * And we also have an override with d:
 *   function code(a: number, b: number, c: number, d: number) {}
 *
 * In order to distinguish between the two we can either check for the length of received arguments
 * or check for nullity of d.
 *
 * In the past, for some arbitraries:
 *   calling code(1, 2, 3, undefined) would have been equivalent to code(1, 2, 3)
 *   rq: calling code(1, 2, 3, undefined) is illegal in ts but may be done with plain js
 * because we checked for nullity of d to know the signature in use.
 * Following the unification of signatures of our arbitraries we more and more used
 * the args length solution to distinguich between signatures.
 *
 * sanitizeArgs is just there to prevent those possibly existing calls would not be broken
 * by a bump of the minor of fast-check.
 *
 * @internal
 */
export function sanitizeArgs<T extends unknown[] | [unknown]>(args: T): T {
  if (args.length === 0 || args[args.length - 1] !== undefined) {
    return args;
  }
  for (let index = args.length - 1; index >= 0; --index) {
    if (args[index] !== undefined) {
      return args.slice(0, index + 1) as typeof args;
    }
  }
  return args.slice(0, 0) as typeof args; // equivalent to empty array
}
