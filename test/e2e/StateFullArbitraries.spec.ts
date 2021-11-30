import * as fc from '../../src/fast-check';
import { seed } from './seed';

describe(`StateFullArbitraries (seed: ${seed})`, () => {
  describe('Never call on generate', () => {
    const cloneableWithCount = (data: { counter: number }) =>
      new (class extends fc.Arbitrary<any> {
        generate() {
          const v = {
            [fc.cloneMethod]: () => {
              ++data.counter;
              return v;
            },
          };
          return new fc.Value(v, undefined);
        }
        canShrinkWithoutContext(value: unknown): value is any {
          return false;
        }
        shrink(): fc.Stream<fc.Value<any>> {
          return fc.Stream.nil();
        }
      })();
    it('normal property', () => {
      const data = { counter: 0 };
      fc.assert(fc.property(cloneableWithCount(data), () => {}));
      expect(data.counter).toEqual(0);
    });
    it('normal property with multiple cloneables', () => {
      const data = { counter: 0 };
      fc.assert(fc.property(cloneableWithCount(data), cloneableWithCount(data), () => {}));
      expect(data.counter).toEqual(0);
    });
    it('fc.clone', () => {
      const data = { counter: 0 };
      fc.assert(fc.property(fc.clone(cloneableWithCount(data), 3), () => {}));
      expect(data.counter).toEqual(0);
    });
    it('fc.tuple', () => {
      const data = { counter: 0 };
      fc.assert(fc.property(fc.tuple(cloneableWithCount(data)), () => {}));
      expect(data.counter).toEqual(0);
    });
    it('fc.array', () => {
      const data = { counter: 0 };
      fc.assert(fc.property(fc.array(cloneableWithCount(data)), () => {}));
      expect(data.counter).toEqual(0);
    });
  });
  describe('Never call with non-cloned instance and correct counterexample', () => {
    it('normal property', () => {
      let nonClonedDetected = false;
      const status = fc.check(
        fc.property(fc.integer(), fc.context(), fc.integer(), (a, ctx, b) => {
          nonClonedDetected = nonClonedDetected || ctx.size() !== 0;
          ctx.log('logging stuff');
          return a < b;
        }),
        { seed }
      );
      expect(status.failed).toBe(true);
      expect(nonClonedDetected).toBe(false);
      expect(status.counterexample![1].size()).toEqual(1);
    });
    it('fc.oneof', () => {
      let nonClonedDetected = false;
      const status = fc.check(
        fc.property(fc.integer(), fc.oneof(fc.context()), fc.integer(), (a, ctx, b) => {
          nonClonedDetected = nonClonedDetected || ctx.size() !== 0;
          ctx.log('logging stuff');
          return a < b;
        }),
        { seed }
      );
      expect(status.failed).toBe(true);
      expect(nonClonedDetected).toBe(false);
      expect(status.counterexample![1].size()).toEqual(1);
    });
    it('fc.frequency', () => {
      let nonClonedDetected = false;
      const status = fc.check(
        fc.property(fc.integer(), fc.frequency({ weight: 1, arbitrary: fc.context() }), fc.integer(), (a, ctx, b) => {
          nonClonedDetected = nonClonedDetected || ctx.size() !== 0;
          ctx.log('logging stuff');
          return a < b;
        }),
        { seed }
      );
      expect(status.failed).toBe(true);
      expect(nonClonedDetected).toBe(false);
      expect(status.counterexample![1].size()).toEqual(1);
    });
    it('fc.option', () => {
      let nonClonedDetected = false;
      const status = fc.check(
        fc.property(fc.integer(), fc.option(fc.context()), fc.integer(), (a, ctx, b) => {
          if (ctx != null) {
            nonClonedDetected = nonClonedDetected || ctx.size() !== 0;
            ctx.log('logging stuff');
          }
          return ctx == null || a < b;
        }),
        { seed }
      );
      expect(status.failed).toBe(true);
      expect(nonClonedDetected).toBe(false);
      expect(status.counterexample![1]!.size()).toEqual(1);
    });
    it('fc.clone', () => {
      let nonClonedDetected = false;
      const status = fc.check(
        fc.property(fc.integer(), fc.clone(fc.context(), 3), fc.integer(), (a, ctxs, b) => {
          for (const ctx of ctxs) {
            nonClonedDetected = nonClonedDetected || ctx.size() !== 0;
            ctx.log('logging stuff');
          }
          return a < b;
        }),
        { seed }
      );
      expect(status.failed).toBe(true);
      expect(nonClonedDetected).toBe(false);
      const ctxs = status.counterexample![1];
      for (const ctx of ctxs) {
        expect(ctx.size()).toEqual(1);
      }
    });
    it('fc.tuple', () => {
      let nonClonedDetected = false;
      const status = fc.check(
        fc.property(fc.integer(), fc.tuple(fc.nat(), fc.context(), fc.nat()), fc.integer(), (a, [_a, ctx, _b], b) => {
          nonClonedDetected = nonClonedDetected || ctx.size() !== 0;
          ctx.log('logging stuff');
          return a < b;
        }),
        { seed }
      );
      expect(status.failed).toBe(true);
      expect(nonClonedDetected).toBe(false);
      expect(status.counterexample![1][1].size()).toEqual(1);
    });
    it('fc.tuple (multiple cloneables)', () => {
      let nonClonedDetected = false;
      const status = fc.check(
        fc.property(fc.integer(), fc.tuple(fc.context(), fc.context(), fc.context()), fc.integer(), (a, ctxs, b) => {
          for (const ctx of ctxs) {
            nonClonedDetected = nonClonedDetected || ctx.size() !== 0;
            ctx.log('logging stuff');
          }
          return a < b;
        }),
        { seed }
      );
      expect(status.failed).toBe(true);
      expect(nonClonedDetected).toBe(false);
      expect(status.counterexample![1][0].size()).toEqual(1);
      expect(status.counterexample![1][1].size()).toEqual(1);
      expect(status.counterexample![1][2].size()).toEqual(1);
    });
    it('fc.array', () => {
      let nonClonedDetected = false;
      const status = fc.check(
        fc.property(fc.integer(), fc.array(fc.context(), { minLength: 1 }), fc.integer(), (a, ctxs, b) => {
          for (const ctx of ctxs) {
            nonClonedDetected = nonClonedDetected || ctx.size() !== 0;
            ctx.log('logging stuff');
          }
          return a < b;
        }),
        { seed }
      );
      expect(status.failed).toBe(true);
      expect(nonClonedDetected).toBe(false);
      expect(status.counterexample![1][0]!.size()).toEqual(1);
    });
    it('fc.set', () => {
      let nonClonedDetected = false;
      const status = fc.check(
        fc.property(fc.integer(), fc.set(fc.context(), { minLength: 1 }), fc.integer(), (a, ctxs, b) => {
          for (const ctx of ctxs) {
            nonClonedDetected = nonClonedDetected || ctx.size() !== 0;
            ctx.log('logging stuff');
          }
          return a < b;
        }),
        { seed }
      );
      expect(status.failed).toBe(true);
      expect(nonClonedDetected).toBe(false);
      expect(status.counterexample![1][0]!.size()).toEqual(1);
    });
    it('fc.record', () => {
      let nonClonedDetected = false;
      const status = fc.check(
        fc.property(fc.integer(), fc.record({ ctx: fc.context() }), fc.integer(), (a, { ctx }, b) => {
          nonClonedDetected = nonClonedDetected || ctx.size() !== 0;
          ctx.log('logging stuff');
          return a < b;
        }),
        { seed }
      );
      expect(status.failed).toBe(true);
      expect(nonClonedDetected).toBe(false);
      expect(status.counterexample![1].ctx.size()).toEqual(1);
    });
    it('fc.dictionary', () => {
      let nonClonedDetected = false;
      const status = fc.check(
        fc.property(fc.integer(), fc.dictionary(fc.string(), fc.context()), fc.integer(), (a, dict, b) => {
          for (const k in dict) {
            const ctx = dict[k];
            nonClonedDetected = nonClonedDetected || ctx.size() !== 0;
            ctx.log('logging stuff');
          }
          return Object.keys(dict).length === 0 || a < b;
        }),
        { seed }
      );
      expect(status.failed).toBe(true);
      expect(nonClonedDetected).toBe(false);
      const dict = status.counterexample![1];
      for (const k in dict) {
        expect(dict[k].size()).toEqual(1);
      }
    });
    it('fc.infiniteStream', () => {
      let alwaysWithElements = true;
      let nonClonedDetected = false;
      const status = fc.check(
        fc.property(fc.integer(), fc.infiniteStream(fc.context()), fc.integer(), (a, s, b) => {
          let accessedCtx = 0;
          for (const ctx of s.take(3)) {
            ++accessedCtx;
            nonClonedDetected = nonClonedDetected || ctx.size() !== 0;
            ctx.log('logging stuff'); // not really useful as streams are supposed to be cleaned
          }
          alwaysWithElements = alwaysWithElements && accessedCtx === 3;
          return a < b;
        }),
        { seed }
      );
      expect(status.failed).toBe(true);
      expect(nonClonedDetected).toBe(false);
      expect(alwaysWithElements).toBe(true);
    });
  });
});
