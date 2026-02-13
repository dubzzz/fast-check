import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';

import { stringify } from '../../../utils/stringify.js';
import { array } from '../../array.js';
import { oneof } from '../../oneof.js';
import { bigInt } from '../../bigInt.js';
import { date } from '../../date.js';
import { float32Array } from '../../float32Array.js';
import { float64Array } from '../../float64Array.js';
import { int16Array } from '../../int16Array.js';
import { int32Array } from '../../int32Array.js';
import { int8Array } from '../../int8Array.js';
import { uint16Array } from '../../uint16Array.js';
import { uint32Array } from '../../uint32Array.js';
import { uint8Array } from '../../uint8Array.js';
import { uint8ClampedArray } from '../../uint8ClampedArray.js';
import { sparseArray } from '../../sparseArray.js';
import type { QualifiedObjectConstraints } from '../helpers/QualifiedObjectConstraints.js';
import { letrec } from '../../letrec.js';
import type { SizeForArbitrary } from '../helpers/MaxLengthFromMinLength.js';
import type { DepthIdentifier } from '../helpers/DepthContext.js';
import { createDepthIdentifier } from '../helpers/DepthContext.js';
import { dictionary } from '../../dictionary.js';
import { set } from '../../set.js';
import { map } from '../../map.js';

/** @internal */
function dictOf<U>(
  ka: Arbitrary<string>,
  va: Arbitrary<U>,
  maxKeys: number | undefined,
  size: SizeForArbitrary | undefined,
  depthIdentifier: DepthIdentifier,
  withNullPrototype: boolean,
) {
  return dictionary(ka, va, {
    maxKeys,
    noNullPrototype: !withNullPrototype,
    size,
    depthIdentifier,
  });
}

/** @internal */
function typedArray(constraints: { maxLength: number | undefined; size: SizeForArbitrary }) {
  return oneof(
    int8Array(constraints),
    uint8Array(constraints),
    uint8ClampedArray(constraints),
    int16Array(constraints),
    uint16Array(constraints),
    int32Array(constraints),
    uint32Array(constraints),
    float32Array(constraints),
    float64Array(constraints),
  );
}

/** @internal */
export function anyArbitraryBuilder(constraints: QualifiedObjectConstraints): Arbitrary<unknown> {
  const arbitrariesForBase = constraints.values;
  const depthSize = constraints.depthSize;
  const depthIdentifier = createDepthIdentifier();
  const maxDepth = constraints.maxDepth;
  const maxKeys = constraints.maxKeys;
  const size = constraints.size;
  const baseArb = oneof(
    ...arbitrariesForBase,
    ...(constraints.withBigInt ? [bigInt()] : []),
    ...(constraints.withDate ? [date()] : []),
  );

  return letrec((tie) => ({
    anything: oneof(
      { maxDepth, depthSize, depthIdentifier },
      baseArb, // Final recursion case
      tie('array'),
      tie('object'),
      ...(constraints.withMap ? [tie('map')] : []),
      ...(constraints.withSet ? [tie('set')] : []),
      ...(constraints.withObjectString ? [tie('anything').map((o) => stringify(o))] : []),
      ...(constraints.withTypedArray ? [typedArray({ maxLength: maxKeys, size })] : []),
      ...(constraints.withSparseArray
        ? [sparseArray(tie('anything'), { maxNumElements: maxKeys, size, depthIdentifier })]
        : []),
    ),
    // String keys
    keys: constraints.withObjectString
      ? oneof(
          { arbitrary: constraints.key, weight: 10 },
          { arbitrary: tie('anything').map((o) => stringify(o)), weight: 1 },
        )
      : constraints.key,
    // anything[]
    array: array(tie('anything'), { maxLength: maxKeys, size, depthIdentifier }),
    // Set<anything>
    set: set(tie('anything'), { maxLength: maxKeys, size, depthIdentifier }),
    // Map<key, anything> | Map<anything, anything>
    map: oneof(
      map(tie('keys') as Arbitrary<string>, tie('anything'), { maxKeys, size, depthIdentifier }),
      map(tie('anything'), tie('anything'), { maxKeys, size, depthIdentifier }),
    ),
    // {[key:string]: anything}
    object: dictOf(
      tie('keys') as Arbitrary<string>,
      tie('anything'),
      maxKeys,
      size,
      depthIdentifier,
      constraints.withNullPrototype,
    ),
  })).anything;
}
