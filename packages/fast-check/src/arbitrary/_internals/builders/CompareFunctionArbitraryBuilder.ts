import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { escapeForMultilineComments } from '../helpers/TextEscaper';
import { cloneMethod } from '../../../check/symbols';
import { hash } from '../../../utils/hash';
import { stringify } from '../../../utils/stringify';
import { integer } from '../../integer';
import { tuple } from '../../tuple';

/** @internal */
export function buildCompareFunctionArbitrary<T, TOut>(
  cmp: (hA: number, hB: number) => TOut
): Arbitrary<(a: T, b: T) => TOut> {
  return tuple(integer().noShrink(), integer({ min: 1, max: 0xffffffff }).noShrink()).map(([seed, hashEnvSize]) => {
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
