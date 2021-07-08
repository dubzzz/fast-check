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
import { keyValuePairsToObjectMapper, keyValuePairsToObjectUnmapper } from '../mappers/KeyValuePairsToObject';
import { QualifiedObjectConstraints } from '../helpers/QualifiedObjectConstraints';
import { convertFromNext, convertToNext } from '../../../check/arbitrary/definition/Converters';
import { arrayToMapMapper, arrayToMapUnmapper } from '../mappers/ArrayToMap';
import { arrayToSetMapper, arrayToSetUnmapper } from '../mappers/ArrayToSet';
import { objectToPrototypeLessMapper, objectToPrototypeLessUnmapper } from '../mappers/ObjectToPrototypeLess';

/** @internal */
function entriesOf<T, U>(keyArb: Arbitrary<T>, valueArb: Arbitrary<U>, maxKeys: number) {
  // TODO - Depending on the situation, the selected compare function might not be appropriate
  // eg.: in the case of Map, NaN is NaN but NaN !== NaN
  return convertToNext(set(tuple(keyArb, valueArb), { maxLength: maxKeys, compare: (t1, t2) => t1[0] === t2[0] }));
}

/** @internal */
function mapOf<T, U>(ka: Arbitrary<T>, va: Arbitrary<U>, maxKeys: number) {
  return convertFromNext(entriesOf(ka, va, maxKeys).map(arrayToMapMapper, arrayToMapUnmapper));
}

/** @internal */
function dictOf<U>(ka: Arbitrary<string>, va: Arbitrary<U>, maxKeys: number) {
  return convertFromNext(entriesOf(ka, va, maxKeys).map(keyValuePairsToObjectMapper, keyValuePairsToObjectUnmapper));
}

/** @internal */
function setOf<U>(va: Arbitrary<U>, maxKeys: number) {
  // TODO - The default compare function provided by the set is not appropriate (today) as it distintish NaN from NaN
  // While the Set does not and consider them to be the same values.
  return convertFromNext(convertToNext(set(va, { maxLength: maxKeys })).map(arrayToSetMapper, arrayToSetUnmapper));
}

/** @internal */
// eslint-disable-next-line @typescript-eslint/ban-types
function prototypeLessOf(objectArb: Arbitrary<object>) {
  // TODO - The default compare function provided by the set is not appropriate (today) as it distintish NaN from NaN
  // While the Set does not and consider them to be the same values.
  return convertFromNext(convertToNext(objectArb).map(objectToPrototypeLessMapper, objectToPrototypeLessUnmapper));
}

/** @internal */
function typedArray() {
  return oneof(
    int8Array(),
    uint8Array(),
    uint8ClampedArray(),
    int16Array(),
    uint16Array(),
    int32Array(),
    uint32Array(),
    float32Array(),
    float64Array()
  );
}

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

  const baseArb = oneof(...arbitrariesForBase);
  const arrayBaseArb = oneof(...arbitrariesForBase.map((arb) => array(arb, { maxLength: maxKeys })));
  const objectBaseArb = (n: number) => oneof(...arbitrariesForBase.map((arb) => dictOf(arbKeys(n), arb, maxKeys)));
  const setBaseArb = () => oneof(...arbitrariesForBase.map((arb) => setOf(arb, maxKeys)));
  const mapBaseArb = (n: number) => oneof(...arbitrariesForBase.map((arb) => mapOf(arbKeys(n), arb, maxKeys)));

  // base[] | anything[]
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const arrayArb = memo((n) => oneof(arrayBaseArb, array(anythingArb(n), { maxLength: maxKeys })));
  // Set<base> | Set<anything>
  const setArb = memo((n) =>
    oneof(
      setBaseArb(),
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      setOf(anythingArb(n), maxKeys)
    )
  );
  // Map<key, base> | (Map<key, anything> | Map<anything, anything>)
  const mapArb = memo((n) =>
    oneof(
      mapBaseArb(n),
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      oneof(mapOf(arbKeys(n), anythingArb(n), maxKeys), mapOf(anythingArb(n), anythingArb(n), maxKeys))
    )
  );
  // {[key:string]: base} | {[key:string]: anything}
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const objectArb = memo((n) => oneof(objectBaseArb(n), dictOf(arbKeys(n), anythingArb(n), maxKeys)));

  const anythingArb: Memo<unknown> = memo((n) => {
    if (n <= 0) return oneof(baseArb);
    return oneof(
      baseArb,
      arrayArb(),
      objectArb(),
      ...(constraints.withMap ? [mapArb()] : []),
      ...(constraints.withSet ? [setArb()] : []),
      ...(constraints.withObjectString ? [anythingArb().map((o) => stringify(o))] : []),
      ...(constraints.withNullPrototype ? [prototypeLessOf(objectArb())] : []),
      ...(constraints.withBigInt ? [bigInt()] : []),
      ...(constraints.withDate ? [date()] : []),
      ...(constraints.withTypedArray ? [typedArray()] : []),
      ...(constraints.withSparseArray ? [sparseArray(anythingArb())] : [])
    );
  });

  return anythingArb(maxDepth);
}
