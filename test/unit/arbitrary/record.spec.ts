import fc from '../../../lib/fast-check';
import { record, RecordConstraints } from '../../../src/arbitrary/record';
import { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary';
import { FakeIntegerArbitrary, fakeNextArbitrary } from './__test-helpers__/NextArbitraryHelpers';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/NextArbitraryAssertions';

import * as PartialRecordArbitraryBuilderMock from '../../../src/arbitrary/_internals/builders/PartialRecordArbitraryBuilder';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('record', () => {
  const keyArb: fc.Arbitrary<any> = fc
    .tuple(fc.string(), fc.boolean())
    .map(([name, symbol]) => (symbol ? Symbol.for(name) : name));

  it('should call buildPartialRecordArbitrary with keys=undefined when no constraints on keys', () =>
    fc.assert(
      fc.property(
        fc.set(keyArb, { minLength: 1 }),
        fc.constantFrom(...([undefined, {}] as const)),
        (keys, constraints) => {
          // Arrange
          const recordModel: Record<string | symbol, Arbitrary<any>> = {};
          for (const k of keys) {
            const { instance } = fakeNextArbitrary();
            recordModel[k] = instance;
          }
          const { instance } = fakeNextArbitrary<any>();
          const buildPartialRecordArbitrary = jest.spyOn(
            PartialRecordArbitraryBuilderMock,
            'buildPartialRecordArbitrary'
          );
          buildPartialRecordArbitrary.mockReturnValue(instance);

          // Act
          const arb = constraints !== undefined ? record(recordModel, constraints) : record(recordModel);

          // Assert
          expect(arb).toBe(instance);
          expect(buildPartialRecordArbitrary).toHaveBeenCalledTimes(1);
          expect(buildPartialRecordArbitrary).toHaveBeenCalledWith(recordModel, undefined);
        }
      )
    ));

  it('should call buildPartialRecordArbitrary with keys=[] when constraints defines withDeletedKeys=true', () =>
    fc.assert(
      fc.property(fc.set(keyArb, { minLength: 1 }), (keys) => {
        // Arrange
        const recordModel: Record<string | symbol, Arbitrary<any>> = {};
        for (const k of keys) {
          const { instance } = fakeNextArbitrary();
          recordModel[k] = instance;
        }
        const { instance } = fakeNextArbitrary<any>();
        const buildPartialRecordArbitrary = jest.spyOn(
          PartialRecordArbitraryBuilderMock,
          'buildPartialRecordArbitrary'
        );
        buildPartialRecordArbitrary.mockReturnValue(instance);

        // Act
        const arb = record(recordModel, { withDeletedKeys: true });

        // Assert
        expect(arb).toBe(instance);
        expect(buildPartialRecordArbitrary).toHaveBeenCalledTimes(1);
        expect(buildPartialRecordArbitrary).toHaveBeenCalledWith(recordModel, []);
      })
    ));

  it('should call buildPartialRecordArbitrary with keys=requiredKeys when constraints defines valid requiredKeys', () =>
    fc.assert(
      fc.property(fc.set(keyArb, { minLength: 1 }), fc.func(fc.boolean()), (keys, isRequired) => {
        // Arrange
        const recordModel: Record<string | symbol, Arbitrary<any>> = {};
        const requiredKeys: any[] = [];
        for (const k of keys) {
          const { instance } = fakeNextArbitrary();
          recordModel[k] = instance;
          if (isRequired(k)) {
            requiredKeys.push(k);
          }
        }
        const { instance } = fakeNextArbitrary<any>();
        const buildPartialRecordArbitrary = jest.spyOn(
          PartialRecordArbitraryBuilderMock,
          'buildPartialRecordArbitrary'
        );
        buildPartialRecordArbitrary.mockReturnValue(instance);

        // Act
        const arb = record(recordModel, { requiredKeys });

        // Assert
        expect(arb).toBe(instance);
        expect(buildPartialRecordArbitrary).toHaveBeenCalledTimes(1);
        expect(buildPartialRecordArbitrary).toHaveBeenCalledWith(recordModel, requiredKeys);
      })
    ));

  it('should reject configurations specifying non existing keys as required', () =>
    fc.assert(
      fc.property(fc.set(keyArb, { minLength: 1 }), keyArb, (keys, requiredKey) => {
        // Arrange
        fc.pre(!keys.includes(requiredKey));
        const recordModel: Record<string | symbol, Arbitrary<any>> = {};
        for (const k of keys) {
          const { instance } = fakeNextArbitrary();
          recordModel[k] = instance;
        }

        // Act / Assert
        expect(() =>
          record(recordModel, {
            requiredKeys: [requiredKey],
          })
        ).toThrowError();
      })
    ));

  it('should reject configurations specifying both requiredKeys and withDeletedKeys (even undefined)', () =>
    fc.assert(
      fc.property(
        fc.set(fc.record({ name: keyArb, required: fc.boolean() }), {
          minLength: 1,
          compare: (a, b) => a.name === b.name,
        }),
        fc.option(fc.constant(true), { nil: undefined }),
        fc.option(fc.boolean(), { nil: undefined }),
        (keys, withRequiredKeys, withDeletedKeys) => {
          // Arrange
          const recordModel: Record<string | symbol, Arbitrary<any>> = {};
          for (const k of keys) {
            const { instance } = fakeNextArbitrary();
            recordModel[k.name] = instance;
          }

          // Act / Assert
          expect(() =>
            record(recordModel, {
              requiredKeys: withRequiredKeys ? keys.filter((k) => k.required).map((k) => k.name) : undefined,
              withDeletedKeys: withDeletedKeys,
            })
          ).toThrowError();
        }
      )
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
  const metaArbitrary = fc.set(
    fc.record({
      key: keyArb,
      valueStart: fc.nat(1000),
      kept: fc.boolean(),
    }),
    { compare: (v1, v2) => v1.key === v2.key }
  );
  const constraintsArbitrary = fc.oneof(
    fc.record({ withDeletedKeys: fc.boolean() }, { requiredKeys: [] }),
    fc.record({ withRequiredKeys: fc.constant<true>(true) }, { requiredKeys: [] })
  );
  const extraParameters: fc.Arbitrary<Extra> = fc
    .tuple(metaArbitrary, constraintsArbitrary)
    .map(([metas, constraintsMeta]: [Meta[], { withDeletedKeys?: boolean; withRequiredKeys?: true }]) => {
      if ('withRequiredKeys' in constraintsMeta) {
        return [metas, { requiredKeys: metas.filter((m) => m.kept).map((m) => m.key) }] as [Meta[], RecordConstraints];
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
        'withDeletedKeys' in constraints &&
        constraints.withDeletedKeys === true &&
        !Object.prototype.hasOwnProperty.call(value, m.key)
      ) {
        continue;
      }
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
    return true;
  };

  const recordBuilder = (extra: Extra) => {
    const [metas, constraints] = extra;
    const recordModel: Record<string | symbol, Arbitrary<number>> = {};
    for (const m of metas) {
      const instance = new FakeIntegerArbitrary(m.valueStart, 10);
      recordModel[m.key] = instance;
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
