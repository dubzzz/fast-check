import * as prand from 'pure-rand';
import * as fc from '../../../../lib/fast-check';

import { constant } from '../../../../src/check/arbitrary/ConstantArbitrary';
import { oneof } from '../../../../src/check/arbitrary/OneOfArbitrary';
import {
  anything,
  object,
  jsonObject,
  unicodeJsonObject,
  json,
  unicodeJson,
  ObjectConstraints,
} from '../../../../src/check/arbitrary/ObjectArbitrary';

import { Random } from '../../../../src/random/generator/Random';

describe('ObjectArbitrary', () => {
  const assertShrinkedValue = (original: any, shrinked: any) => {
    expect(typeof shrinked).toEqual(typeof original);
    switch (typeof original) {
      case 'boolean':
        return expect(shrinked).toBe(false);
      case 'number':
        if (isNaN(original)) return expect(shrinked).toBeNaN();
        if (
          original == Number.EPSILON ||
          original === Number.MAX_VALUE ||
          original === Number.MIN_VALUE ||
          original === Number.MAX_SAFE_INTEGER ||
          original === Number.MIN_SAFE_INTEGER ||
          !Number.isFinite(original)
        ) {
          return expect([original, 0, -0]).toContain(shrinked); // towards zero or itself
        }
        return expect([0, -0]).toContain(shrinked); // towards 0 or -0
      case 'undefined':
        return expect(shrinked).toBe(undefined);
      case 'string':
        return expect(shrinked).toEqual('');
      default:
        if (original == null) return expect(shrinked).toBe(null);
        if (Array.isArray(original)) return expect(shrinked).toEqual([]);
        expect(typeof original).toEqual('object');
        return expect(shrinked).toEqual({});
    }
  };
  const checkCorrect = (allowedKeys: string[], allowedValues: string[]) => {
    const check = (value: any): boolean => {
      if (Array.isArray(value)) return value.every(check);
      if (allowedValues.findIndex((v) => v === value) !== -1) return true;
      const keys = Object.getOwnPropertyNames(value);
      return keys.every((k) => allowedKeys.indexOf(k) !== -1 && check(value[k]));
    };
    return check;
  };
  const evaluateDepth = (value: any): number => {
    if (Array.isArray(value)) return 1 + value.map(evaluateDepth).reduce((p, c) => Math.max(p, c), 0);
    if (typeof value === 'string') return 0;
    const keys = Object.getOwnPropertyNames(value);
    return 1 + keys.map((k) => evaluateDepth(value[k])).reduce((p, c) => Math.max(p, c), 0);
  };

  describe('anything', () => {
    it('Should only use provided keys and values', () =>
      fc.assert(
        fc.property(
          fc.integer(),
          fc.array(fc.string(), 1, 10),
          fc.array(fc.string(), 1, 10),
          (seed, allowedKeys, allowedValues) => {
            const mrng = new Random(prand.xorshift128plus(seed));

            const keyArb = oneof(...allowedKeys.map(constant));
            const baseArbs = [...allowedValues.map(constant)];
            const g = anything({ key: keyArb, values: baseArbs }).generate(mrng).value;

            return checkCorrect(allowedKeys, allowedValues)(g);
          }
        )
      ));
    it('Should respect the maximal depth parameter', () =>
      fc.assert(
        fc.property(
          fc.integer(),
          fc.integer(0, 5),
          fc.array(fc.string(), 1, 10),
          fc.array(fc.string(), 1, 10),
          (seed, depth, keys, values) => {
            const mrng = new Random(prand.xorshift128plus(seed));
            const keyArb = oneof(...keys.map(constant));
            const baseArbs = [...values.map(constant)];
            const g = anything({ key: keyArb, values: baseArbs, maxDepth: depth }).generate(mrng).value;
            return evaluateDepth(g) <= depth;
          }
        )
      ));
    it('Should respect the maximal keys parameter', () =>
      fc.assert(
        fc.property(
          fc.integer(),
          fc.integer(0, 5),
          fc.array(fc.string(), 1, 10),
          fc.array(fc.string(), 1, 10),
          (seed, maxKeys, keys, values) => {
            const mrng = new Random(prand.xorshift128plus(seed));
            const keyArb = oneof(...keys.map(constant));
            const baseArbs = [...values.map(constant)];
            const g = anything({ key: keyArb, values: baseArbs, maxKeys }).generate(mrng).value;
            const check = (obj: any) => {
              if (typeof obj !== 'object' || obj === null) {
                return;
              }
              if (Array.isArray(obj)) {
                if (obj.length > maxKeys) throw new Error(`Too many values in the array`);
                obj.forEach((v) => check(v));
                return;
              }
              const ks = Object.keys(obj);
              if (ks.length > maxKeys) throw new Error(`Too many values in the object`);
              ks.forEach((k) => check(obj[k]));
            };
            check(g);
          }
        )
      ));
    it('Should shrink towards minimal value of type', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          let shrinkable = anything().generate(mrng);
          const originalValue = shrinkable.value;
          while (shrinkable.shrink().has((_) => true)[0]) {
            shrinkable = shrinkable.shrink().next().value;
          } // only check one shrink path
          assertShrinkedValue(originalValue, shrinkable.value);
        })
      ));
    const checkProduce = (settings: ObjectConstraints, f: (v: any) => boolean) => {
      let numRuns = 0;
      const seed = 0;
      const mrng = new Random(prand.xorshift128plus(seed));
      const arb = anything(settings);
      while (++numRuns <= 1000) {
        if (f(arb.generate(mrng).value)) return;
      }
      fail('Failed to generate the expected value');
    };
    const checkProduceBoxed = <T>(className: string, basicValue: T) => {
      return checkProduce(
        { values: [constant(basicValue)], maxDepth: 0, withBoxedValues: true },
        (v) => typeof v === 'object' && Object.prototype.toString.call(v) === `[object ${className}]`
      );
    };
    const checkProduceUnboxed = <T>(basicValue: T) => {
      return checkProduce(
        { values: [constant(basicValue)], maxDepth: 0, withBoxedValues: true },
        (v) => v === basicValue
      );
    };
    it('Should be able to produce boxed Boolean', () => checkProduceBoxed('Boolean', true));
    it('Should be able to produce boxed Number', () => checkProduceBoxed('Number', 1));
    it('Should be able to produce boxed String', () => checkProduceBoxed('String', ''));
    it('Should be able to produce unboxed Boolean', () => checkProduceUnboxed(true));
    it('Should be able to produce unboxed Number', () => checkProduceUnboxed(1));
    it('Should be able to produce unboxed String', () => checkProduceUnboxed(''));
    it('Should be able to produce Set', () =>
      checkProduce({ values: [constant(0)], maxDepth: 1, withSet: true }, (v) => v instanceof Set));
    it('Should be able to produce Map', () =>
      checkProduce({ values: [constant(0)], maxDepth: 1, withMap: true }, (v) => v instanceof Map));
    it('Should not be able to produce Array if maxDepth is zero', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const settings = { maxDepth: 0 };
          const mrng = new Random(prand.xorshift128plus(seed));
          return !(anything(settings).generate(mrng).value instanceof Array);
        })
      ));
    it('Should not be able to produce Set if maxDepth is zero', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const settings = { maxDepth: 0, withSet: true };
          const mrng = new Random(prand.xorshift128plus(seed));
          return !(anything(settings).generate(mrng).value instanceof Set);
        })
      ));
    it('Should not be able to produce Map if maxDepth is zero', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const settings = { maxDepth: 0, withMap: true };
          const mrng = new Random(prand.xorshift128plus(seed));
          return !(anything(settings).generate(mrng).value instanceof Map);
        })
      ));
    it('Should take maxDepth into account whatever the other settings', () =>
      fc.assert(
        fc.property(
          fc.integer(),
          fc.nat(10),
          fc.record(
            {
              key: fc.constant(constant('single-key')),
              values: fc.constant([constant('single-value')]),
              withBoxedValues: fc.boolean(),
              withMap: fc.boolean(),
              withSet: fc.boolean(),
              withObjectString: fc.boolean(),
              withNullPrototype: fc.boolean(),
            },
            { withDeletedKeys: true }
          ),
          (seed, maxDepth, settings) => {
            const mrng = new Random(prand.xorshift128plus(seed));
            const v = anything({ ...settings, maxDepth }).generate(mrng).value;
            const depthEvaluator = (node: any): number => {
              const subNodes: any[] = [];
              if (Array.isArray(node)) subNodes.concat(node);
              else if (node instanceof Set) subNodes.concat(Array.from(node));
              else if (node instanceof Map)
                subNodes.concat(
                  Array.from(node).map((t) => t[0]),
                  Array.from(node).map((t) => t[1])
                );
              else if (Object.prototype.toString.call(node) === '[object Object]') {
                for (const k of Object.keys(node)) subNodes.push(node[k]);
              } else return 0;
              return subNodes.reduce((max, subNode) => Math.max(max, depthEvaluator(subNode)), 0) + 1;
            };
            return depthEvaluator(v) <= maxDepth;
          }
        )
      ));
    it('Should be correctly balanced', () => {
      const numTests = 1000;
      const seed = 0;
      const mrng = new Random(prand.xorshift128plus(seed));
      const arb = anything({ withMap: true, withSet: true });
      const counters = { numObjects: 0, numArrays: 0, numSets: 0, numMaps: 0, numOthers: 0 };
      for (let idx = 0; idx !== numTests; ++idx) {
        const v = arb.generate(mrng).value;
        switch (Object.prototype.toString.call(v)) {
          case '[object Array]':
            ++counters.numArrays;
            break;
          case '[object Map]':
            ++counters.numMaps;
            break;
          case '[object Object]':
            ++counters.numObjects;
            break;
          case '[object Set]':
            ++counters.numSets;
            break;
          default:
            ++counters.numOthers;
            break;
        }
      }
      // We check that each bucket receive at list 15 % of the values
      expect(counters.numArrays / numTests).toBeGreaterThanOrEqual(0.15);
      expect(counters.numMaps / numTests).toBeGreaterThanOrEqual(0.15);
      expect(counters.numObjects / numTests).toBeGreaterThanOrEqual(0.15);
      expect(counters.numSets / numTests).toBeGreaterThanOrEqual(0.15);
      expect(counters.numSets / numTests).toBeGreaterThanOrEqual(0.15);
    });
  });
  describe('json', () => {
    it('Should produce strings', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          const g = json().generate(mrng).value;
          return typeof g === 'string';
        })
      ));
    it('Should generate a parsable JSON', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          JSON.parse(json().generate(mrng).value);
        })
      ));
    it('Should shrink towards minimal value of type', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          let shrinkable = json().generate(mrng);
          const originalValue = shrinkable.value;
          while (shrinkable.shrink().has((_) => true)[0]) {
            shrinkable = shrinkable.shrink().next().value;
          } // only check one shrink path
          expect(typeof shrinkable.value).toEqual('string');
          assertShrinkedValue(JSON.parse(originalValue), JSON.parse(shrinkable.value));
        })
      ));
  });
  describe('unicodeJson', () => {
    it('Should produce strings', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          const g = unicodeJson().generate(mrng).value;
          return typeof g === 'string';
        })
      ));
    it('Should generate a parsable JSON', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          JSON.parse(unicodeJson().generate(mrng).value);
        })
      ));
    it('Should shrink towards minimal value of type', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          let shrinkable = unicodeJson().generate(mrng);
          const originalValue = shrinkable.value;
          while (shrinkable.shrink().has((_) => true)[0]) {
            shrinkable = shrinkable.shrink().next().value;
          } // only check one shrink path
          expect(typeof shrinkable.value).toEqual('string');
          assertShrinkedValue(JSON.parse(originalValue), JSON.parse(shrinkable.value));
        })
      ));
  });
  describe('jsonObject', () => {
    it('Should generate a stringifyable object', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          return typeof JSON.stringify(jsonObject().generate(mrng).value) === 'string';
        })
      ));
    it('Should be re-created from its json representation', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          const g = jsonObject().generate(mrng).value;
          expect(JSON.parse(JSON.stringify(g))).toStrictEqual(g as any);
        })
      ));
  });
  describe('unicodeJsonObject', () => {
    it('Should generate a stringifyable object', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          return typeof JSON.stringify(unicodeJsonObject().generate(mrng).value) === 'string';
        })
      ));
    it('Should be re-created from its json representation', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          const g = unicodeJsonObject().generate(mrng).value;
          expect(JSON.parse(JSON.stringify(g))).toStrictEqual(g as any);
        })
      ));
  });
  describe('object', () => {
    it('Should generate an object', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          const g = object().generate(mrng).value;
          return typeof g === 'object' && !Array.isArray(g);
        })
      ));
    it('Should only use provided keys and values', () =>
      fc.assert(
        fc.property(fc.integer(), fc.array(fc.string(), 1, 10), fc.array(fc.string(), 1, 10), (seed, keys, values) => {
          const allowedKeys = [...keys];
          const allowedValues = [...values];
          const mrng = new Random(prand.xorshift128plus(seed));

          const keyArb = oneof(...keys.map(constant));
          const baseArbs = [...allowedValues.map(constant)];
          const g = object({ key: keyArb, values: baseArbs }).generate(mrng).value;

          return checkCorrect(allowedKeys, allowedValues)(g);
        })
      ));
    it('Should respect the maximal depth parameter', () =>
      fc.assert(
        fc.property(
          fc.integer(),
          fc.integer(0, 5),
          fc.array(fc.string(), 1, 10),
          fc.array(fc.string(), 1, 10),
          (seed, depth, keys, values) => {
            const mrng = new Random(prand.xorshift128plus(seed));
            const keyArb = oneof(...keys.map(constant));
            const baseArbs = [...values.map(constant)];
            const g = object({ key: keyArb, values: baseArbs, maxDepth: depth }).generate(mrng).value;
            return evaluateDepth(g) <= depth + 1;
          }
        )
      ));
    it('Should shrink towards empty object', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          let shrinkable = object().generate(mrng);
          while (shrinkable.shrink().has((_) => true)[0]) {
            shrinkable = shrinkable.shrink().next().value;
          } // only check one shrink path
          return typeof shrinkable.value === 'object' && Object.keys(shrinkable.value).length === 0;
        })
      ));
    it('Should not suggest input in shrinked values', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          const shrinkable = object().generate(mrng);
          for (const s of shrinkable.shrink()) expect(s.value).not.toStrictEqual(shrinkable.value);
        })
      ));
  });
});
