import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';

import { stringify } from '../../../utils/stringify';
import { array } from '../../array';
import { frequency } from '../../frequency';
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
import { letrec } from '../../letrec';

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
  const arbitrariesForBase = constraints.values;
  const maxDepth = constraints.maxDepth;
  const maxKeys = constraints.maxKeys;
  const baseArb = oneof(...arbitrariesForBase);

  return letrec((tie) => ({
    anything: oneof(
      { maxDepth },
      baseArb, // Final recursion case
      tie('array'),
      tie('object'),
      ...(constraints.withMap ? [tie('map')] : []),
      ...(constraints.withSet ? [tie('set')] : []),
      ...(constraints.withObjectString ? [tie('anything').map((o) => stringify(o))] : []),
      // eslint-disable-next-line @typescript-eslint/ban-types
      ...(constraints.withNullPrototype ? [prototypeLessOf(tie('object') as Arbitrary<object>)] : []),
      ...(constraints.withBigInt ? [bigInt()] : []),
      ...(constraints.withDate ? [date()] : []),
      ...(constraints.withTypedArray ? [typedArray()] : []),
      ...(constraints.withSparseArray ? [sparseArray(tie('anything'))] : [])
    ),
    // String keys
    keys: constraints.withObjectString
      ? frequency(
          { arbitrary: constraints.key, weight: 10 },
          { arbitrary: tie('anything').map((o) => stringify(o)), weight: 1 }
        )
      : constraints.key,
    // base[] | anything[]
    arrayBase: oneof(...arbitrariesForBase.map((arb) => array(arb, { maxLength: maxKeys }))),
    array: oneof(tie('arrayBase'), array(tie('anything'), { maxLength: maxKeys })),
    // Set<base> | Set<anything>
    setBase: oneof(...arbitrariesForBase.map((arb) => setOf(arb, maxKeys))),
    set: oneof(tie('setBase'), setOf(tie('anything'), maxKeys)),
    // Map<key, base> | (Map<key, anything> | Map<anything, anything>)
    mapBase: oneof(...arbitrariesForBase.map((arb) => mapOf(tie('keys') as Arbitrary<string>, arb, maxKeys))),
    map: oneof(
      tie('mapBase'),
      oneof(
        mapOf(tie('keys') as Arbitrary<string>, tie('anything'), maxKeys),
        mapOf(tie('anything'), tie('anything'), maxKeys)
      )
    ),
    // {[key:string]: base} | {[key:string]: anything}
    objectBase: oneof(...arbitrariesForBase.map((arb) => dictOf(tie('keys') as Arbitrary<string>, arb, maxKeys))),
    object: oneof(tie('objectBase'), dictOf(tie('keys') as Arbitrary<string>, tie('anything'), maxKeys)),
  })).anything;
}
