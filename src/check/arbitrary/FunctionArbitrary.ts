import { hash } from '../../utils/hash';
import { stringify } from '../../utils/stringify';
import { cloneMethod, hasCloneMethod } from '../symbols';
import { array } from './ArrayArbitrary';
import { Arbitrary } from './definition/Arbitrary';
import { integer } from './IntegerArbitrary';
import { tuple } from './TupleArbitrary';

/**
 * For pure functions
 *
 * @param arb Arbitrary responsible to produce the values
 */
export function func<TArgs extends any[], TOut>(arb: Arbitrary<TOut>): Arbitrary<(...args: TArgs) => TOut> {
  return tuple(array(arb, 1, 10), integer().noShrink()).map(([outs, seed]) => {
    const producer = () => {
      const recorded: { [key: string]: TOut } = {};
      const f = (...args: TArgs) => {
        const repr = stringify(args);
        const val = outs[hash(`${seed}${repr}`) % outs.length];
        recorded[repr] = val;
        return hasCloneMethod(val) ? val[cloneMethod]() : val;
      };
      return Object.assign(f, {
        toString: () =>
          '<function :: ' +
          Object.keys(recorded)
            .sort()
            .map(k => `${k} => ${stringify(recorded[k])}`)
            .join(', ') +
          '>',
        [cloneMethod]: producer
      });
    };
    return producer();
  });
}

/** @internal */
function compareFuncImplem<T, TOut>(cmp: (hA: number, hB: number) => TOut): Arbitrary<(a: T, b: T) => TOut> {
  return tuple(integer().noShrink(), integer(1, 0xffffffff).noShrink()).map(([seed, hashEnvSize]) => {
    const producer = () => {
      const recorded: { [key: string]: TOut } = {};
      const f = (a: T, b: T) => {
        const reprA = stringify(a);
        const reprB = stringify(b);
        const hA = hash(`${seed}${reprA}`) % hashEnvSize;
        const hB = hash(`${seed}${reprB}`) % hashEnvSize;
        const val = cmp(hA, hB);
        recorded[`[${reprA},${reprB}]`] = val;
        return val;
      };
      return Object.assign(f, {
        toString: () =>
          '<function :: ' +
          Object.keys(recorded)
            .sort()
            .map(k => `${k} => ${recorded[k]}`)
            .join(', ') +
          '>',
        [cloneMethod]: producer
      });
    };
    return producer();
  });
}

/**
 * For comparison functions
 *
 * A comparison function returns:
 * - negative value whenever a < b
 * - positive value whenever a > b
 * - zero whenever a and b are equivalent
 *
 * Comparison functions are transitive: `a < b and b < c => a < c`
 *
 * They also satisfy: `a < b <=> b > a` and `a = b <=> b = a`
 */
export function compareFunc<T>(): Arbitrary<(a: T, b: T) => number> {
  return compareFuncImplem((hA, hB) => hA - hB);
}

/**
 * For comparison boolean functions
 *
 * A comparison boolean function returns:
 * - true whenever a < b
 * - false otherwise (ie. a = b or a > b)
 */
export function compareBooleanFunc<T>(): Arbitrary<(a: T, b: T) => boolean> {
  return compareFuncImplem((hA, hB) => hA < hB);
}
