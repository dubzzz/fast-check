import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import type { RecordConstraints } from '../../../src/arbitrary/record';
import { record } from '../../../src/arbitrary/record';
import type { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary';
import { FakeIntegerArbitrary, fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/ArbitraryAssertions';

import * as PartialRecordArbitraryBuilderMock from '../../../src/arbitrary/_internals/builders/PartialRecordArbitraryBuilder';
import { declareCleaningHooksForSpies } from './__test-helpers__/SpyCleaner';

describe('record', () => {
  declareCleaningHooksForSpies();

  const keyArb: fc.Arbitrary<any> = fc
    .tuple(fc.string(), fc.boolean())
    .map(([name, symbol]) => (symbol ? Symbol.for(name) : name));

  it('should call buildPartialRecordArbitrary with keys=undefined when no constraints on keys', () =>
    fc.assert(
      fc.property(
        fc.uniqueArray(keyArb, { minLength: 1 }),
        fc.constantFrom(...([undefined, {}, { noNullPrototype: false }, { noNullPrototype: true }] as const)),
        (keys, constraints) => {
          // Arrange
          const recordModel: Record<string | symbol, Arbitrary<any>> = {};
          for (const k of keys) {
            const { instance } = fakeArbitrary();
            recordModel[k] = instance;
          }
          const { instance } = fakeArbitrary<any>();
          const buildPartialRecordArbitrary = vi.spyOn(
            PartialRecordArbitraryBuilderMock,
            'buildPartialRecordArbitrary',
          );
          buildPartialRecordArbitrary.mockReturnValue(instance);
          const noNullPrototype = constraints !== undefined && constraints.noNullPrototype;

          // Act
          const arb = constraints !== undefined ? record(recordModel, constraints) : record(recordModel);

          // Assert
          expect(arb).toBe(instance);
          expect(buildPartialRecordArbitrary).toHaveBeenCalledTimes(1);
          expect(buildPartialRecordArbitrary).toHaveBeenCalledWith(recordModel, undefined, !!noNullPrototype);
        },
      ),
    ));

  it('should call buildPartialRecordArbitrary with keys=requiredKeys when constraints defines valid requiredKeys', () =>
    fc.assert(
      fc.property(
        fc.uniqueArray(keyArb, { minLength: 1 }),
        fc.func(fc.boolean()),
        fc.option(fc.boolean(), { nil: undefined }),
        (keys, isRequired, noNullPrototype) => {
          // Arrange
          const recordModel: Record<string | symbol, Arbitrary<any>> = {};
          const requiredKeys: any[] = [];
          for (const k of keys) {
            const { instance } = fakeArbitrary();
            Object.defineProperty(recordModel, k, {
              value: instance,
              configurable: true,
              enumerable: true,
              writable: true,
            });
            if (isRequired(k)) {
              requiredKeys.push(k);
            }
          }
          const { instance } = fakeArbitrary<any>();
          const buildPartialRecordArbitrary = vi.spyOn(
            PartialRecordArbitraryBuilderMock,
            'buildPartialRecordArbitrary',
          );
          buildPartialRecordArbitrary.mockReturnValue(instance);

          // Act
          const arb = record(recordModel, { requiredKeys, noNullPrototype });

          // Assert
          expect(arb).toBe(instance);
          expect(buildPartialRecordArbitrary).toHaveBeenCalledTimes(1);
          expect(buildPartialRecordArbitrary).toHaveBeenCalledWith(recordModel, requiredKeys, !!noNullPrototype);
        },
      ),
    ));

  it('should reject configurations specifying non existing keys as required', () =>
    fc.assert(
      fc.property(fc.uniqueArray(keyArb, { minLength: 1 }), keyArb, (keys, requiredKey) => {
        // Arrange
        fc.pre(!keys.includes(requiredKey));
        const recordModel: Record<string | symbol, Arbitrary<any>> = {};
        for (const k of keys) {
          const { instance } = fakeArbitrary();
          recordModel[k] = instance;
        }

        // Act / Assert
        expect(() =>
          record(recordModel, {
            requiredKeys: [requiredKey],
          }),
        ).toThrowError();
      }),
    ));

  it('should accept empty keys configurations with empty requiredKeys', () => {
    // Arrange
    const recordModel: Record<string | symbol, Arbitrary<any>> = {};

    // Act / Assert
    expect(() => record(recordModel, { requiredKeys: [] })).not.toThrowError();
  });

  it.each`
    keyName
    ${'constructor'}
    ${'toString'}
    ${'__proto__'}
  `('should reject configurations specifying non own properties ($keyName) as requiredKeys', ({ keyName }) => {
    // Arrange
    const recordModel: Record<string | symbol, Arbitrary<any>> = {};

    // Act / Assert
    expect(() => record(recordModel, { requiredKeys: [keyName] })).toThrowError();
  });

  it('should reject configurations specifying non enumerable properties as requiredKeys', () => {
    // Arrange
    const keyName = 'k';
    const recordModel: Record<string | symbol, Arbitrary<any>> = {};
    Object.defineProperty(recordModel, keyName, { value: fc.boolean(), enumerable: false });

    // Act / Assert
    expect(() => record(recordModel, { requiredKeys: [keyName] })).toThrowError();
  });
});

describe('record (integration)', () => {
  type Meta = { key: any; valueStart: number; kept: boolean };
  type Extra = [Meta[], RecordConstraints<any>];

  const keyArb: fc.Arbitrary<any> = fc
    .tuple(fc.string(), fc.boolean())
    .map(([name, symbol]) => (symbol ? Symbol.for(name) : name));
  const metaArbitrary = fc.uniqueArray(
    fc.record({
      key: keyArb,
      valueStart: fc.nat(1000),
      kept: fc.boolean(),
    }),
    { selector: (entry) => entry.key },
  );
  const constraintsArbitrary = fc.record(
    { withRequiredKeys: fc.constant<true>(true), noNullPrototype: fc.boolean() },
    { requiredKeys: [] },
  );
  const extraParameters: fc.Arbitrary<Extra> = fc
    .tuple(metaArbitrary, constraintsArbitrary)
    .map(([metas, constraintsMeta]: [Meta[], { withRequiredKeys?: true }]) => {
      if ('withRequiredKeys' in constraintsMeta) {
        return [
          metas,
          {
            requiredKeys: metas.filter((m) => m.kept).map((m) => m.key),
            ...('noNullPrototype' in constraintsMeta ? { noNullPrototype: constraintsMeta.noNullPrototype } : {}),
          },
        ] as [Meta[], RecordConstraints];
      }
      return [metas, constraintsMeta] as [Meta[], RecordConstraints];
    });

  const isCorrect = (value: any, extra: Extra) => {
    const [metas, constraints] = extra;
    // Rq: getOwnPropertyNames will also get non enumerable properties, but there are none in our case
    for (const k of [...Object.getOwnPropertyNames(value), ...Object.getOwnPropertySymbols(value)]) {
      // generated object should not have more keys
      if (metas.findIndex((m) => m.key === k) === -1) return false;
    }
    for (const m of metas) {
      // optional keys can be missing in the generated instance
      if (
        'requiredKeys' in constraints &&
        constraints.requiredKeys !== undefined &&
        !constraints.requiredKeys.includes(m.key) &&
        !Object.prototype.hasOwnProperty.call(value, m.key)
      ) {
        continue;
      }
      // values are associated to the right key (if key required)
      if (typeof value[m.key] !== 'number') return false;
      if (value[m.key] < m.valueStart) return false;
      if (value[m.key] > m.valueStart + 10) return false;
    }
    if (constraints.noNullPrototype) {
      expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
    }
    return true;
  };

  const recordBuilder = (extra: Extra) => {
    const [metas, constraints] = extra;
    const recordModel: Record<string | symbol, Arbitrary<number>> = {};
    for (const m of metas) {
      const instance = new FakeIntegerArbitrary(m.valueStart, 10);
      Object.defineProperty(recordModel, m.key, {
        value: instance,
        configurable: true,
        enumerable: true,
        writable: true,
      });
    }
    return record(recordModel, constraints);
  };

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(recordBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(recordBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context (if underlyings do)', () => {
    assertProduceValuesShrinkableWithoutContext(recordBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context (if underlyings do)', () => {
    assertShrinkProducesSameValueWithoutInitialContext(recordBuilder, { extraParameters });
  });
});
