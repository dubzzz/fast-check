import { describe, it, expect } from 'vitest';
import fc, { stringify } from 'fast-check';

import { anyArbitraryBuilder } from '../../../../../src/arbitrary/_internals/builders/AnyArbitraryBuilder';
import type { ObjectConstraints } from '../../../../../src/arbitrary/_internals/helpers/QualifiedObjectConstraints';
import { toQualifiedObjectConstraints } from '../../../../../src/arbitrary/_internals/helpers/QualifiedObjectConstraints';

import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceSomeSpecificValues,
  assertProduceValuesShrinkableWithoutContext,
} from '../../__test-helpers__/ArbitraryAssertions';
import { computeObjectDepth } from '../../__test-helpers__/ComputeObjectDepth';
import { computeObjectMaxKeys } from '../../__test-helpers__/ComputeObjectMaxKeys';
import { sizeArb } from '../../__test-helpers__/SizeHelpers';

describe('anyArbitraryBuilder (integration)', () => {
  it('should be able to produce Set (when asked to)', () => {
    assertProduceSomeSpecificValues(
      () => anyArbitraryBuilder(toQualifiedObjectConstraints({ maxDepth: 1, withSet: true })),
      isSet,
    );
  });

  it('should be able to produce Map (when asked to)', () => {
    assertProduceSomeSpecificValues(
      () => anyArbitraryBuilder(toQualifiedObjectConstraints({ maxDepth: 1, withMap: true })),
      isMap,
    );
  });

  it('should be able to produce Date (when asked to)', () => {
    assertProduceSomeSpecificValues(
      () => anyArbitraryBuilder(toQualifiedObjectConstraints({ maxDepth: 1, withDate: true })),
      isDate,
    );
  });

  it('should be able to produce typed arrays (when asked to)', () => {
    assertProduceSomeSpecificValues(
      () => anyArbitraryBuilder(toQualifiedObjectConstraints({ maxDepth: 1, withTypedArray: true })),
      isTypedArray,
    );
  });

  it('should be able to produce sparse array (when asked to)', () => {
    assertProduceSomeSpecificValues(
      () => anyArbitraryBuilder(toQualifiedObjectConstraints({ maxDepth: 1, withSparseArray: true })),
      isSparseArray,
    );
  });

  it('should be able to produce stringified representations of objects (when asked to)', () => {
    assertProduceSomeSpecificValues(
      () => anyArbitraryBuilder(toQualifiedObjectConstraints({ maxDepth: 1, withObjectString: true })),
      isStringified,
    );
  });

  it('should be able to produce stringified representations of objects as keys (when asked to)', () => {
    assertProduceSomeSpecificValues(
      () => anyArbitraryBuilder(toQualifiedObjectConstraints({ maxDepth: 1, withObjectString: true })),
      isStringifiedAsKeys,
    );
  });

  it('should be able to produce boxed values (when asked to)', () => {
    assertProduceSomeSpecificValues(
      () => anyArbitraryBuilder(toQualifiedObjectConstraints({ maxDepth: 1, withBoxedValues: true })),
      isBoxed,
    );
  });

  it('should be able to produce objects without any prototype values (when asked to)', () => {
    assertProduceSomeSpecificValues(
      () => anyArbitraryBuilder(toQualifiedObjectConstraints({ maxDepth: 1, withNullPrototype: true })),
      isNullPrototype,
    );
  });

  it('should be able to produce bigint (when asked to)', () => {
    assertProduceSomeSpecificValues(
      () => anyArbitraryBuilder(toQualifiedObjectConstraints({ maxDepth: 1, withBigInt: true })),
      isBigInt,
    );
  });

  type Extra = ObjectConstraints;
  const extraParameters: fc.Arbitrary<Extra> = fc
    .record(
      {
        depthSize: fc.oneof(fc.double({ min: 0.1, noNaN: true }), sizeArb),
        maxDepth: fc.nat({ max: 5 }),
        maxKeys: fc.nat({ max: 10 }),
        withBigInt: fc.boolean(),
        withBoxedValues: fc.boolean(),
        withDate: fc.boolean(),
        withMap: fc.boolean(),
        withNullPrototype: fc.boolean(),
        withObjectString: fc.boolean(),
        withSet: fc.boolean(),
        withSparseArray: fc.boolean(),
        withTypedArray: fc.boolean(),
        withUnicodeString: fc.boolean(),
        stringUnit: fc.constantFrom<ObjectConstraints['stringUnit']>(
          'grapheme',
          'grapheme-composite',
          'grapheme-ascii',
          'binary',
          'binary-ascii',
        ),
      },
      { requiredKeys: [] },
    )
    .filter((params) => {
      if (params.depthSize === undefined || (typeof params.depthSize === 'number' && params.depthSize <= 2)) {
        return true; // 0.5 is equivalent to small, the default
      }
      if (params.maxDepth !== undefined) {
        return true;
      }
      // No maxDepth and a depthSize relatively small can potentially lead to very very large
      // and deep structures. We want to avoid those cases in this test.
      return false;
    });

  const isCorrect = (v: unknown, extra: Extra) => {
    if (extra.maxDepth !== undefined) {
      expect(computeObjectDepth(v)).toBeLessThanOrEqual(extra.maxDepth);
    }
    if (extra.maxKeys !== undefined) {
      expect(computeObjectMaxKeys(v)).toBeLessThanOrEqual(extra.maxKeys);
    }
    if (!extra.withBigInt) {
      expect(isBigInt(v)).toBe(false);
    }
    if (!extra.withBoxedValues) {
      expect(isBoxed(v)).toBe(false);
    }
    if (!extra.withDate) {
      expect(isDate(v)).toBe(false);
    }
    if (!extra.withMap) {
      expect(isMap(v)).toBe(false);
    }
    if (!extra.withNullPrototype) {
      expect(isNullPrototype(v)).toBe(false);
    }
    if (!extra.withSet) {
      expect(isSet(v)).toBe(false);
    }
    if (!extra.withSparseArray) {
      expect(isSparseArray(v)).toBe(false);
    }
    if (!extra.withTypedArray) {
      expect(isTypedArray(v)).toBe(false);
    }
    if (!extra.withUnicodeString && !('stringUnit' in extra)) {
      expect(stringify(v)).toSatisfy(doesNotIncludeAnySurrogateCharacter);
    }
    // No check for !extra.withObjectString as nothing prevent normal string builders to build such strings
    // In the coming major releases withObjectString might even disappear
  };

  const anyArbitraryBuilderBuilder = (extra: Extra) => anyArbitraryBuilder(toQualifiedObjectConstraints(extra));

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(anyArbitraryBuilderBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(anyArbitraryBuilderBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(anyArbitraryBuilderBuilder, {
      // For the moment, we are not able to reverse "object-string" values.
      // In the future our fc.string() should be able to shrink them given it does not receive any constraint on the length
      // but for the moment it somehow assume that it cannot shrink strings having strictly more than 10 characters (value of maxLength when not specified).
      extraParameters: extraParameters.map((extra) => ({ ...extra, withObjectString: false })),
    });
  });
});

// Helpers

function doesNotIncludeAnySurrogateCharacter(s: string): boolean {
  // No character is a part of a surrogate pair
  return s.split('').every((c) => c < '\uD800' || c > '\uDFFF');
}

function isBigInt(v: unknown): boolean {
  return typeof v === 'bigint';
}

function isSet(v: unknown): boolean {
  return v instanceof Set;
}

function isMap(v: unknown): boolean {
  return v instanceof Map;
}

function isDate(v: unknown): boolean {
  return v instanceof Date;
}

function isTypedArray(v: unknown): boolean {
  return (
    v instanceof Int8Array ||
    v instanceof Uint8Array ||
    v instanceof Uint8ClampedArray ||
    v instanceof Int16Array ||
    v instanceof Uint16Array ||
    v instanceof Int32Array ||
    v instanceof Uint32Array ||
    v instanceof Float32Array ||
    v instanceof Float64Array
  );
}

function isSparseArray(v: unknown): boolean {
  return Array.isArray(v) && v.length !== Object.keys(v).length;
}

function isStringified(v: unknown): boolean {
  if (typeof v !== 'string') {
    return false; // non strings are not valid string representations for objects
  }
  try {
    eval(v);
    return true; // the string was correctly parsed
  } catch {
    return false; // not a valid representation
  }
}

function isStringifiedAsKeys(v: unknown): boolean {
  if (v === null || typeof v !== 'object') {
    return false; // not an object
  }
  for (const key of Object.keys(v!)) {
    try {
      eval(key);
      return true; // the string used as key the string representation of a JavaScript instance
    } catch {
      // not a valid representation
    }
  }
  return false;
}

function isBoxed(v: unknown): boolean {
  return v instanceof Boolean || v instanceof Number || v instanceof String;
}

function isNullPrototype(v: unknown): boolean {
  return v !== null && typeof v === 'object' && Object.getPrototypeOf(v) === null;
}
