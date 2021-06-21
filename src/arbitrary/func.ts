import { hash } from '../utils/hash';
import { asyncStringify, asyncToStringMethod, stringify, toStringMethod } from '../utils/stringify';
import { cloneMethod, hasCloneMethod } from '../check/symbols';
import { array } from './array';
import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { integer } from './integer';
import { tuple } from './tuple';
import { escapeForMultilineComments } from '../check/arbitrary/helpers/TextEscaper';

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
      function prettyPrint(stringifiedOuts: string): string {
        const seenValues = Object.keys(recorded)
          .sort()
          .map((k) => `${k} => ${stringify(recorded[k])}`)
          .map((line) => `/* ${escapeForMultilineComments(line)} */`);
        return `function(...args) {
  // With hash and stringify coming from fast-check${seenValues.length !== 0 ? `\n  ${seenValues.join('\n  ')}` : ''}
  const outs = ${stringifiedOuts};
  return outs[hash('${seed}' + stringify(args)) % outs.length];
}`;
      }
      return Object.defineProperties(f, {
        toString: { value: () => prettyPrint(stringify(outs)) },
        [toStringMethod]: { value: () => prettyPrint(stringify(outs)) },
        [asyncToStringMethod]: { value: async () => prettyPrint(await asyncStringify(outs)) },
        // We allow reconfiguration of the [cloneMethod] as caller might want to enforce its own
        [cloneMethod]: { value: producer, configurable: true },
      });
    };
    return producer();
  });
}
