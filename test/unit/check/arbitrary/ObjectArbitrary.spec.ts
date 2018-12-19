import * as fc from '../../../../lib/fast-check';

import { constant } from '../../../../src/check/arbitrary/ConstantArbitrary';
import { oneof } from '../../../../src/check/arbitrary/OneOfArbitrary';
import {
  anything,
  object,
  jsonObject,
  unicodeJsonObject,
  json,
  unicodeJson
} from '../../../../src/check/arbitrary/ObjectArbitrary';

import * as stubRng from '../../stubs/generators';

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
      if (allowedValues.findIndex(v => v === value) !== -1) return true;
      const keys = Object.getOwnPropertyNames(value);
      return keys.every(k => allowedKeys.indexOf(k) !== -1 && check(value[k]));
    };
    return check;
  };
  const evaluateDepth = (value: any): number => {
    if (Array.isArray(value)) return 1 + value.map(evaluateDepth).reduce((p, c) => Math.max(p, c), 0);
    if (typeof value === 'string') return 0;
    const keys = Object.getOwnPropertyNames(value);
    return 1 + keys.map(k => evaluateDepth(value[k])).reduce((p, c) => Math.max(p, c), 0);
  };

  describe('anything', () => {
    it('Should only use provided keys and values', () =>
      fc.assert(
        fc.property(
          fc.integer(),
          fc.array(fc.string(), 1, 10),
          fc.array(fc.string(), 1, 10),
          (seed, allowedKeys, allowedValues) => {
            const mrng = stubRng.mutable.fastincrease(seed);

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
            const mrng = stubRng.mutable.fastincrease(seed);
            const keyArb = oneof(...keys.map(constant));
            const baseArbs = [...values.map(constant)];
            const g = anything({ key: keyArb, values: baseArbs, maxDepth: depth }).generate(mrng).value;
            return evaluateDepth(g) <= depth;
          }
        )
      ));
    it('Should shrink towards minimal value of type', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          let shrinkable = anything().generate(mrng);
          const originalValue = shrinkable.value;
          while (shrinkable.shrink().has(v => true)[0]) {
            shrinkable = shrinkable.shrink().next().value;
          } // only check one shrink path
          assertShrinkedValue(originalValue, shrinkable.value);
        })
      ));
  });
  describe('json', () => {
    it('Should produce strings', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = json().generate(mrng).value;
          return typeof g === 'string';
        })
      ));
    it('Should generate a parsable JSON', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          JSON.parse(json().generate(mrng).value);
        })
      ));
    it('Should shrink towards minimal value of type', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          let shrinkable = json().generate(mrng);
          const originalValue = shrinkable.value;
          while (shrinkable.shrink().has(v => true)[0]) {
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
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = unicodeJson().generate(mrng).value;
          return typeof g === 'string';
        })
      ));
    it('Should generate a parsable JSON', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          JSON.parse(unicodeJson().generate(mrng).value);
        })
      ));
    it('Should shrink towards minimal value of type', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          let shrinkable = unicodeJson().generate(mrng);
          const originalValue = shrinkable.value;
          while (shrinkable.shrink().has(v => true)[0]) {
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
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          return typeof JSON.stringify(jsonObject().generate(mrng).value) === 'string';
        })
      ));
    it('Should be re-created from its json representation', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = jsonObject().generate(mrng).value;
          expect(JSON.parse(JSON.stringify(g))).toStrictEqual(g);
        })
      ));
  });
  describe('unicodeJsonObject', () => {
    it('Should generate a stringifyable object', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          return typeof JSON.stringify(unicodeJsonObject().generate(mrng).value) === 'string';
        })
      ));
    it('Should be re-created from its json representation', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = unicodeJsonObject().generate(mrng).value;
          expect(JSON.parse(JSON.stringify(g))).toStrictEqual(g);
        })
      ));
  });
  describe('object', () => {
    it('Should generate an object', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = object().generate(mrng).value;
          return typeof g === 'object' && !Array.isArray(g);
        })
      ));
    it('Should only use provided keys and values', () =>
      fc.assert(
        fc.property(fc.integer(), fc.array(fc.string(), 1, 10), fc.array(fc.string(), 1, 10), (seed, keys, values) => {
          const allowedKeys = [...keys];
          const allowedValues = [...values];
          const mrng = stubRng.mutable.fastincrease(seed);

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
            const mrng = stubRng.mutable.fastincrease(seed);
            const keyArb = oneof(...keys.map(constant));
            const baseArbs = [...values.map(constant)];
            const g = object({ key: keyArb, values: baseArbs, maxDepth: depth }).generate(mrng).value;
            return evaluateDepth(g) <= depth + 1;
          }
        )
      ));
    it('Should shrink towards empty object', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          let shrinkable = object().generate(mrng);
          while (shrinkable.shrink().has(v => true)[0]) {
            shrinkable = shrinkable.shrink().next().value;
          } // only check one shrink path
          return typeof shrinkable.value === 'object' && Object.keys(shrinkable.value).length === 0;
        })
      ));
    it('Should not suggest input in shrinked values', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const shrinkable = object().generate(mrng);
          for (const s of shrinkable.shrink()) expect(s.value).not.toStrictEqual(shrinkable.value);
        })
      ));
  });
});
