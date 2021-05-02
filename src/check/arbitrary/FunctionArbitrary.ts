import { hash } from '../../utils/hash';
import { stringify } from '../../utils/stringify';
import { cloneMethod, hasCloneMethod } from '../symbols';
import { array } from '../../arbitrary/array';
import { Arbitrary } from './definition/Arbitrary';
import { integer } from '../../arbitrary/integer';
import { tuple } from '../../arbitrary/tuple';
import { escapeForMultilineComments } from './helpers/TextEscaper';

/**
 * For pure functions
 *
 * @param arb - Arbitrary responsible to produce the values
 *
 * @remarks Since 1.6.0
 * @public
 */
export function func<TArgs extends any[], TOut>(arb: Arbitrary<TOut>): Arbitrary<(...args: TArgs) => TOut> {
  return tuple(array(arb, { minLength: 1 }), integer().noShrink()).map(([outs, seed]) => {
    const producer = () => {
      const recorded: { [key: string]: TOut } = {};
      const f = (...args: TArgs) => {
        const repr = stringify(args);
        const val = outs[hash(`${seed}${repr}`) % outs.length];
        recorded[repr] = val;
        return hasCloneMethod(val) ? val[cloneMethod]() : val;
      };
      return Object.assign(f, {
        toString: () => {
          const seenValues = Object.keys(recorded)
            .sort()
            .map((k) => `${k} => ${stringify(recorded[k])}`)
            .map((line) => `/* ${escapeForMultilineComments(line)} */`);
          return `function(...args) {
  // With hash and stringify coming from fast-check${seenValues.length !== 0 ? `\n  ${seenValues.join('\n  ')}` : ''}
  const outs = ${stringify(outs)};
  return outs[hash('${seed}' + stringify(args)) % outs.length];
}`;
        },
        [cloneMethod]: producer,
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
        toString: () => {
          const seenValues = Object.keys(recorded)
            .sort()
            .map((k) => `${k} => ${stringify(recorded[k])}`)
            .map((line) => `/* ${escapeForMultilineComments(line)} */`);
          return `function(a, b) {
  // With hash and stringify coming from fast-check${seenValues.length !== 0 ? `\n  ${seenValues.join('\n  ')}` : ''}
  const cmp = ${cmp};
  const hA = hash('${seed}' + stringify(a)) % ${hashEnvSize};
  const hB = hash('${seed}' + stringify(b)) % ${hashEnvSize};
  return cmp(hA, hB);
}`;
        },
        [cloneMethod]: producer,
      });
    };
    return producer();
  });
}

/**
 * For comparison functions
 *
 * A comparison function returns:
 * - negative value whenever `a < b`
 * - positive value whenever `a > b`
 * - zero whenever `a` and `b` are equivalent
 *
 * Comparison functions are transitive: `a < b and b < c => a < c`
 *
 * They also satisfy: `a < b <=> b > a` and `a = b <=> b = a`
 *
 * @remarks Since 1.6.0
 * @public
 */
export function compareFunc<T>(): Arbitrary<(a: T, b: T) => number> {
  return compareFuncImplem(
    Object.assign((hA: number, hB: number) => hA - hB, {
      toString() {
        // istanbul coverage tool may override the function for its needs (thus its string representation)
        // assigning explicitly a toString representation avoids this issue
        return '(hA, hB) => hA - hB';
      },
    })
  );
}

/**
 * For comparison boolean functions
 *
 * A comparison boolean function returns:
 * - `true` whenever `a < b`
 * - `false` otherwise (ie. `a = b` or `a > b`)
 *
 * @remarks Since 1.6.0
 * @public
 */
export function compareBooleanFunc<T>(): Arbitrary<(a: T, b: T) => boolean> {
  return compareFuncImplem(
    Object.assign((hA: number, hB: number) => hA < hB, {
      toString() {
        // istanbul coverage tool may override the function for its needs (thus its string representation)
        // assigning explicitly a toString representation avoids this issue
        return '(hA, hB) => hA < hB';
      },
    })
  );
}
