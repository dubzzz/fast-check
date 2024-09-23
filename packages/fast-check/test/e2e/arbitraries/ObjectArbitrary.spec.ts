import { describe, it, expect } from 'vitest';
import * as fc from '../../../src/fast-check';
import { seed } from '../seed';

describe(`ObjectArbitrary (seed: ${seed})`, () => {
  describe('json', () => {
    const revJson = (json: string): string => {
      return json
        .split('')
        .map((c) => {
          switch (c) {
            case '{':
              return '}';
            case '}':
              return '{';
            case '[':
              return ']';
            case ']':
              return '[';
          }
          return c;
        })
        .reverse()
        .join('');
    };
    it('Should shrink on entity having a reverse JSON a valid JSON', () => {
      const out = fc.check(
        fc.property(fc.json(), (json: string) => {
          if (json[0] !== '{') return true;
          try {
            JSON.parse(revJson(json));
            return false;
          } catch {
            return true;
          }
        }),
        { seed: seed, numRuns: 1000 },
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).toEqual(['{}']);
    });
  });
  describe('object', () => {
    it('Should shrink on object in object', () => {
      const out = fc.check(
        fc.property(fc.object(), (obj: any) => {
          const isObject = (ins: any) => {
            return typeof ins === 'object' && !Array.isArray(ins) && ins !== null;
          };
          const objectInObject = (ins: any): boolean => {
            if (typeof ins !== 'object') return false;
            if (Array.isArray(ins)) return ins.map(objectInObject).some((v) => v === true);
            if (!isObject(ins)) return false;
            return Object.keys(ins)
              .map((k) => isObject(ins[k]) || objectInObject(ins[k]))
              .some((v) => v === true);
          };
          return !objectInObject(obj);
        }),
        { seed: seed },
      );
      expect(out.failed).toBe(true);
      // Here we can potentially have things like:
      // { '': {} } or { '': [ {  '': {} } ] } or ...
      // For the moment, there is no certainty to shrink to { '': {} }
      // as we don't have any fallbacking strategy to shrink an array onto an object.
      expect(out.counterexample).toStrictEqual([{ '': expect.anything() }]);
    });
  });
});
