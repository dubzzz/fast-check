import { ArrayArbitrary, maxLengthFromMinLength } from './ArrayArbitrary';
import { Arbitrary } from './definition/Arbitrary';

/**
 * Build fully set SetConstraints from a partial data
 * @internal
 */
function buildCompleteSetConstraints<T>(constraints: SetConstraints<T>): Required<SetConstraints<T>> {
  const minLength = constraints.minLength !== undefined ? constraints.minLength : 0;
  const maxLength = constraints.maxLength !== undefined ? constraints.maxLength : maxLengthFromMinLength(minLength);
  const compare = constraints.compare !== undefined ? constraints.compare : (a: T, b: T) => a === b;
  return { minLength, maxLength, compare };
}

/**
 * Extract constraints from args received by set
 * @internal
 */
function extractSetConstraints<T>(
  args:
    | []
    | [number]
    | [number, number]
    | [(a: T, b: T) => boolean]
    | [number, (a: T, b: T) => boolean]
    | [number, number, (a: T, b: T) => boolean]
    | [SetConstraints<T>]
): SetConstraints<T> {
  if (args[0] === undefined) {
    // set(arb)
    return {};
  } // args.length > 0

  if (args[1] === undefined) {
    const sargs = args as typeof args & [unknown]; // exactly 1 arg specified
    if (typeof sargs[0] === 'number') return { maxLength: sargs[0] }; // set(arb, maxLength)
    if (typeof sargs[0] === 'function') return { compare: sargs[0] }; // set(arb, compare)
    return sargs[0]; // set(arb, constraints)
  } // args.length > 1

  if (args[2] === undefined) {
    const sargs = args as typeof args & [unknown, unknown]; // exactly 2 args specified
    if (typeof sargs[1] === 'number') return { minLength: sargs[0], maxLength: sargs[1] }; // set(arb, minLength, maxLength)
    return { maxLength: sargs[0], compare: sargs[1] }; // set(arb, maxLength, compare)
  } // args.length > 2

  const sargs = args as typeof args & [unknown, unknown, unknown];
  return { minLength: sargs[0], maxLength: sargs[1], compare: sargs[2] }; // set(arb, minLength, maxLength, compare)
}

/**
 * Constraints to be applied on {@link set}
 * @public
 */
export interface SetConstraints<T> {
  /** Lower bound of the generated array size */
  minLength?: number;
  /** Upper bound of the generated array size */
  maxLength?: number;
  /** Compare function - Return true when the two values are equals */
  compare?: (a: T, b: T) => boolean;
}

/**
 * For arrays of unique values coming from `arb`
 *
 * @param arb - Arbitrary used to generate the values inside the array
 *
 * @public
 */
function set<T>(arb: Arbitrary<T>): Arbitrary<T[]>;
/**
 * For arrays of unique values coming from `arb` having an upper bound size
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param maxLength - Upper bound of the generated array size
 *
 * @deprecated
 * Superceded by `fc.set(arb, {maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/master/codemods/unify-signatures | our codemod script}.
 *
 * @public
 */
function set<T>(arb: Arbitrary<T>, maxLength: number): Arbitrary<T[]>;
/**
 * For arrays of unique values coming from `arb` having lower and upper bound size
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param minLength - Lower bound of the generated array size
 * @param maxLength - Upper bound of the generated array size
 *
 * @deprecated
 * Superceded by `fc.set(arb, {minLength, maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/master/codemods/unify-signatures | our codemod script}.
 *
 * @public
 */
function set<T>(arb: Arbitrary<T>, minLength: number, maxLength: number): Arbitrary<T[]>;
/**
 * For arrays of unique values coming from `arb` - unicity defined by `compare`
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param compare - Return true when the two values are equals
 *
 * @deprecated
 * Superceded by `fc.set(arb, {compare})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/master/codemods/unify-signatures | our codemod script}.
 *
 * @public
 */
function set<T>(arb: Arbitrary<T>, compare: (a: T, b: T) => boolean): Arbitrary<T[]>;
/**
 * For arrays of unique values coming from `arb` having an upper bound size - unicity defined by `compare`
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param maxLength - Upper bound of the generated array size
 * @param compare - Return true when the two values are equals
 *
 * @deprecated
 * Superceded by `fc.array(arb, {maxLength, compare})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/master/codemods/unify-signatures | our codemod script}.
 *
 * @public
 */
function set<T>(arb: Arbitrary<T>, maxLength: number, compare: (a: T, b: T) => boolean): Arbitrary<T[]>;
/**
 * For arrays of unique values coming from `arb` having lower and upper bound size - unicity defined by `compare`
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param minLength - Lower bound of the generated array size
 * @param maxLength - Upper bound of the generated array size
 * @param compare - Return true when the two values are equals
 *
 * @deprecated
 * Superceded by `fc.array(arb, {minLength, maxLength, compare})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/master/codemods/unify-signatures | our codemod script}.
 *
 * @public
 */
function set<T>(
  arb: Arbitrary<T>,
  minLength: number,
  maxLength: number,
  compare: (a: T, b: T) => boolean
): Arbitrary<T[]>;
/**
 * For arrays of unique values coming from `arb`
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param constraints - Constraints to apply when building instances
 *
 * @public
 */
function set<T>(arb: Arbitrary<T>, constraints: SetConstraints<T>): Arbitrary<T[]>;
function set<T>(
  arb: Arbitrary<T>,
  ...args:
    | []
    | [number]
    | [number, number]
    | [(a: T, b: T) => boolean]
    | [number, (a: T, b: T) => boolean]
    | [number, number, (a: T, b: T) => boolean]
    | [SetConstraints<T>]
): Arbitrary<T[]> {
  const constraints = buildCompleteSetConstraints(extractSetConstraints(args));

  const minLength = constraints.minLength;
  const maxLength = constraints.maxLength;
  const compare = constraints.compare;

  const arrayArb = new ArrayArbitrary<T>(arb, minLength, maxLength, compare);
  if (minLength === 0) return arrayArb;
  return arrayArb.filter((tab) => tab.length >= minLength);
}

export { set };
