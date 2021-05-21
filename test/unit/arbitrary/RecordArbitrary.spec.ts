import * as prand from 'pure-rand';
import * as fc from '../../../lib/fast-check';

import { constant } from '../../../src/arbitrary/constant';
import { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary';
import { integer } from '../../../src/arbitrary/integer';
import { record, RecordConstraints } from '../../../src/arbitrary/record';
import { Random } from '../../../src/random/generator/Random';

import * as genericHelper from '../check/arbitrary/generic/GenericArbitraryHelper';

const keyArb: fc.Arbitrary<any> = fc
  .tuple(fc.string(), fc.boolean())
  .map(([name, symbol]) => (symbol ? Symbol.for(name) : name));

describe('RecordArbitrary', () => {
  describe('record', () => {
    it('Should produce a record with missing keys', () =>
      fc.assert(
        fc.property(fc.set(keyArb, { minLength: 1 }), fc.nat(), fc.integer(), (keys, missingIdx, seed) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          const recordModel: Record<string | symbol, Arbitrary<any>> = {};
          for (const k of keys) recordModel[k] = constant(k);

          const arb = record(recordModel, { withDeletedKeys: true });
          for (let idx = 0; idx != 1000; ++idx) {
            const g = arb.generate(mrng).value;
            if (!Object.prototype.hasOwnProperty.call(g, keys[missingIdx % keys.length])) return true;
          }
          return false;
        })
      ));
    it('Should produce a record with present keys', () =>
      fc.assert(
        fc.property(fc.set(keyArb, { minLength: 1 }), fc.nat(), fc.integer(), (keys, missingIdx, seed) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          const recordModel: Record<string | symbol, Arbitrary<any>> = {};
          for (const k of keys) {
            recordModel[k] = constant(k);
          }

          const arb = record(recordModel, { withDeletedKeys: true });
          for (let idx = 0; idx != 1000; ++idx) {
            const g = arb.generate(mrng).value;
            if (g[keys[missingIdx % keys.length]] === keys[missingIdx % keys.length]) return true;
          }
          return false;
        })
      ));
    it('Should reject configurations specifying non existing keys as required', () =>
      fc.assert(
        fc.property(fc.set(keyArb, { minLength: 1 }), keyArb, (keys, requiredKey) => {
          fc.pre(!keys.includes(requiredKey));

          const recordModel: Record<string | symbol, Arbitrary<any>> = {};
          for (const k of keys) {
            recordModel[k] = constant(k);
          }

          expect(() =>
            record(recordModel, {
              requiredKeys: [requiredKey],
            })
          ).toThrowError();
        })
      ));
    it('Should reject configurations specifying both requiredKeys and withDeletedKeys (even undefined)', () =>
      fc.assert(
        fc.property(
          fc.set(fc.record({ name: keyArb, required: fc.boolean() }), {
            minLength: 1,
            compare: (a, b) => a.name === b.name,
          }),
          fc.option(fc.constant(true), { nil: undefined }),
          fc.option(fc.boolean(), { nil: undefined }),
          (keys, withRequiredKeys, withDeletedKeys) => {
            const recordModel: Record<string | symbol, Arbitrary<any>> = {};
            for (const k of keys) {
              recordModel[k.name] = constant(k.name);
            }

            expect(() =>
              record(recordModel, {
                requiredKeys: withRequiredKeys ? keys.filter((k) => k.required).map((k) => k.name) : undefined,
                withDeletedKeys: withDeletedKeys,
              })
            ).toThrowError();
          }
        )
      ));
    it('Should accept empty keys configurations with empty requiredKeys', () => {
      const recordModel: Record<string | symbol, Arbitrary<any>> = {};
      expect(() => record(recordModel, { requiredKeys: [] })).not.toThrowError();
    });
    it.each`
      keyName
      ${'constructor'}
      ${'toString'}
      ${'__proto__'}
    `('Should reject configurations specifying non own properties ($keyName) as requiredKeys', ({ keyName }) => {
      const recordModel: Record<string | symbol, Arbitrary<any>> = {};
      expect(() => record(recordModel, { requiredKeys: [keyName] })).toThrowError();
    });
    it('Should reject configurations specifying non enumerable properties as requiredKeys', () => {
      const keyName = 'k';
      const recordModel: Record<string | symbol, Arbitrary<any>> = {};
      Object.defineProperty(recordModel, keyName, { value: fc.boolean(), enumerable: false });
      expect(() => record(recordModel, { requiredKeys: [keyName] })).toThrowError();
    });

    type Meta = { key: any; valueStart: number; kept: boolean };
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

    describe('Given a custom record configuration', () => {
      genericHelper.isValidArbitrary(
        ([metas, constraints]: [Meta[], RecordConstraints<any>]) => {
          const recordModel: Record<string | symbol, Arbitrary<number>> = {};
          for (const m of metas) {
            recordModel[m.key] = integer(m.valueStart, m.valueStart + 10);
          }
          return record(recordModel, constraints);
        },
        {
          seedGenerator: fc
            .tuple(metaArbitrary, constraintsArbitrary)
            .map(([metas, constraintsMeta]: [Meta[], { withDeletedKeys?: boolean; withRequiredKeys?: true }]) => {
              if ('withRequiredKeys' in constraintsMeta) {
                return [metas, { requiredKeys: metas.filter((m) => m.kept).map((m) => m.key) }] as [
                  Meta[],
                  RecordConstraints
                ];
              }
              return [metas, constraintsMeta] as [Meta[], RecordConstraints];
            }),
          isValidValue: (r: { [key: string]: number }, [metas, constraints]: [Meta[], RecordConstraints]) => {
            // Rq: getOwnPropertyNames will also get non enumerable properties, but there are none in our case
            for (const k of [...Object.getOwnPropertyNames(r), ...Object.getOwnPropertySymbols(r)]) {
              // generated object should not have more keys
              if (metas.findIndex((m) => m.key === k) === -1) return false;
            }
            for (const m of metas) {
              // optional keys can be missing in the generated instance
              if (
                'withDeletedKeys' in constraints &&
                constraints.withDeletedKeys === true &&
                !Object.prototype.hasOwnProperty.call(r, m.key)
              ) {
                continue;
              }
              if (
                'requiredKeys' in constraints &&
                constraints.requiredKeys !== undefined &&
                !constraints.requiredKeys.includes(m.key) &&
                !Object.prototype.hasOwnProperty.call(r, m.key)
              ) {
                continue;
              }
              // values are associated to the right key (if key required)
              if (typeof r[m.key] !== 'number') return false;
              if (r[m.key] < m.valueStart) return false;
              if (r[m.key] > m.valueStart + 10) return false;
            }
            return true;
          },
        }
      );
    });
  });
});
