import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';

import { stringify } from '../../../utils/stringify';
import { array } from '../../array';
import { frequency } from '../../frequency';
import { memo, Memo } from '../../memo';
import { oneof } from '../../oneof';
import { set } from '../../set';
import { tuple } from '../../tuple';
import { bigInt } from '../../bigInt';
import { date } from '../../date';
import { float32Array } from '../../float32Array';
import { float64Array } from '../../float64Array';
import { int16Array } from '../../int16Array';
import { int32Array } from '../../int32Array';
import { int8Array } from '../../int8Array';
import { uint16Array } from '../../uint16Array';
import { uint32Array } from '../../uint32Array';
import { uint8Array } from '../../uint8Array';
import { uint8ClampedArray } from '../../uint8ClampedArray';
import { sparseArray } from '../../sparseArray';
import { keyValuePairsToObjectMapper } from '../mappers/KeyValuePairsToObject';
import { QualifiedObjectConstraints } from '../helpers/QualifiedObjectConstraints';

/** @internal */
export function anyArbitraryBuilder(constraints: QualifiedObjectConstraints): Arbitrary<unknown> {
  const arbKeys = constraints.withObjectString
    ? memo((n) =>
        frequency(
          { arbitrary: constraints.key, weight: 10 },
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          { arbitrary: anythingArb(n).map((o) => stringify(o)), weight: 1 }
        )
      )
    : memo(() => constraints.key);
  const arbitrariesForBase = constraints.values;
  const maxDepth = constraints.maxDepth;
  const maxKeys = constraints.maxKeys;

  const entriesOf = <T, U>(keyArb: Arbitrary<T>, valueArb: Arbitrary<U>) =>
    set(tuple(keyArb, valueArb), { maxLength: maxKeys, compare: (t1, t2) => t1[0] === t2[0] });

  const mapOf = <T, U>(ka: Arbitrary<T>, va: Arbitrary<U>) => entriesOf(ka, va).map((v) => new Map(v));
  const dictOf = <U>(ka: Arbitrary<string>, va: Arbitrary<U>) =>
    entriesOf(ka, va).map((v) => keyValuePairsToObjectMapper(v));

  const baseArb = oneof(...arbitrariesForBase);
  const arrayBaseArb = oneof(...arbitrariesForBase.map((arb) => array(arb, { maxLength: maxKeys })));
  const objectBaseArb = (n: number) => oneof(...arbitrariesForBase.map((arb) => dictOf(arbKeys(n), arb)));
  const setBaseArb = () =>
    oneof(...arbitrariesForBase.map((arb) => set(arb, { maxLength: maxKeys }).map((v) => new Set(v))));
  const mapBaseArb = (n: number) => oneof(...arbitrariesForBase.map((arb) => mapOf(arbKeys(n), arb)));

  // base[] | anything[]
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const arrayArb = memo((n) => oneof(arrayBaseArb, array(anythingArb(n), { maxLength: maxKeys })));
  // Set<base> | Set<anything>
  const setArb = memo((n) =>
    oneof(
      setBaseArb(),

      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      set(anythingArb(n), { maxLength: maxKeys }).map((v) => new Set(v))
    )
  );
  // Map<key, base> | (Map<key, anything> | Map<anything, anything>)
  const mapArb = memo((n) =>
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    oneof(mapBaseArb(n), oneof(mapOf(arbKeys(n), anythingArb(n)), mapOf(anythingArb(n), anythingArb(n))))
  );
  // {[key:string]: base} | {[key:string]: anything}
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const objectArb = memo((n) => oneof(objectBaseArb(n), dictOf(arbKeys(n), anythingArb(n))));

  const anythingArb: Memo<unknown> = memo((n) => {
    if (n <= 0) return oneof(baseArb);
    return oneof(
      baseArb,
      arrayArb(),
      objectArb(),
      ...(constraints.withMap ? [mapArb()] : []),
      ...(constraints.withSet ? [setArb()] : []),
      ...(constraints.withObjectString ? [anythingArb().map((o) => stringify(o))] : []),
      ...(constraints.withNullPrototype ? [objectArb().map((o) => Object.assign(Object.create(null), o))] : []),
      ...(constraints.withBigInt ? [bigInt()] : []),
      ...(constraints.withDate ? [date()] : []),
      ...(constraints.withTypedArray
        ? [
            oneof(
              int8Array(),
              uint8Array(),
              uint8ClampedArray(),
              int16Array(),
              uint16Array(),
              int32Array(),
              uint32Array(),
              float32Array(),
              float64Array()
            ),
          ]
        : []),
      ...(constraints.withSparseArray ? [sparseArray(anythingArb())] : [])
    );
  });

  return anythingArb(maxDepth);
}
