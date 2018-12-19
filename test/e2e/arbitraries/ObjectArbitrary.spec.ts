import * as fc from '../../../src/fast-check';

const seed = Date.now();
describe(`ObjectArbitrary (seed: ${seed})`, () => {
  describe('json', () => {
    const revJson = (json: string): string => {
      return json
        .split('')
        .map(c => {
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
          } catch (err) {
            return true;
          }
        }),
        { seed: seed, numRuns: 1000 }
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
            if (Array.isArray(ins)) return ins.map(objectInObject).some(v => v === true);
            if (!isObject(ins)) return false;
            return Object.keys(ins)
              .map(k => isObject(ins[k]) || objectInObject(ins[k]))
              .some(v => v === true);
          };
          return !objectInObject(obj);
        }),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).toStrictEqual([{ '': {} }]);
    });
  });
});
