import * as assert from 'assert';
import * as fc from '../../src/fast-check';

const seed = Date.now();
describe(`StateFullArbitraries (seed: ${seed})`, () => {
  describe('Never call with non-cloned cloneable instance', () => {
    it('normal property', () => {
      let nonClonedDetected = false;
      const status = fc.check(
        fc.property(fc.integer(), fc.context(), fc.integer(), (a, ctx, b) => {
          nonClonedDetected = nonClonedDetected || ctx.size() !== 0;
          ctx.log('logging stuff');
          return a < b;
        }), {seed}
      );
      assert.ok(status.failed);
      assert.ok(!nonClonedDetected);
    });
    it('fc.oneof', () => {
      let nonClonedDetected = false;
      const status = fc.check(
        fc.property(fc.integer(), fc.oneof(fc.context()), fc.integer(), (a, ctx, b) => {
          nonClonedDetected = nonClonedDetected || ctx.size() !== 0;
          ctx.log('logging stuff');
          return a < b;
        }), {seed}
      );
      assert.ok(status.failed);
      assert.ok(!nonClonedDetected);
    });
    it('fc.frequency', () => {
      let nonClonedDetected = false;
      const status = fc.check(
        fc.property(fc.integer(), fc.frequency({ weight: 1, arbitrary: fc.context() }), fc.integer(), (a, ctx, b) => {
          nonClonedDetected = nonClonedDetected || ctx.size() !== 0;
          ctx.log('logging stuff');
          return a < b;
        }), {seed}
      );
      assert.ok(status.failed);
      assert.ok(!nonClonedDetected);
    });
    it('fc.option', () => {
      let nonClonedDetected = false;
      const status = fc.check(
        fc.property(fc.integer(), fc.option(fc.context()), fc.integer(), (a, ctx, b) => {
          if (ctx != null) {
            nonClonedDetected = nonClonedDetected || ctx.size() !== 0;
            ctx.log('logging stuff');
          }
          return ctx != null && a < b;
        }), {seed}
      );
      assert.ok(status.failed);
      assert.ok(!nonClonedDetected);
    });
    it('fc.tuple', () => {
      let nonClonedDetected = false;
      const status = fc.check(
        fc.property(fc.integer(), fc.tuple(fc.nat(), fc.context(), fc.nat()), fc.integer(), (a, [_a, ctx, _b], b) => {
          nonClonedDetected = nonClonedDetected || ctx.size() !== 0;
          ctx.log('logging stuff');
          return a < b;
        }), {seed}
      );
      assert.ok(status.failed);
      assert.ok(!nonClonedDetected);
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
        }), {seed}
      );
      assert.ok(status.failed);
      assert.ok(!nonClonedDetected);
    });
    it('fc.array', () => {
      let nonClonedDetected = false;
      const status = fc.check(
        fc.property(fc.integer(), fc.array(fc.context()), fc.integer(), (a, ctxs, b) => {
          for (const ctx of ctxs) {
            nonClonedDetected = nonClonedDetected || ctx.size() !== 0;
            ctx.log('logging stuff');
          }
          return a < b;
        }), {seed}
      );
      assert.ok(status.failed);
      assert.ok(!nonClonedDetected);
    });
    it('fc.set', () => {
      let nonClonedDetected = false;
      const status = fc.check(
        fc.property(fc.integer(), fc.set(fc.context()), fc.integer(), (a, ctxs, b) => {
          for (const ctx of ctxs) {
            nonClonedDetected = nonClonedDetected || ctx.size() !== 0;
            ctx.log('logging stuff');
          }
          return a < b;
        }), {seed}
      );
      assert.ok(status.failed);
      assert.ok(!nonClonedDetected);
    });
    xit('fc.record', () => {
      let nonClonedDetected = false;
      const status = fc.check(
        fc.property(fc.integer(), fc.record({ ctx: fc.context() }), fc.integer(), (a, { ctx }, b) => {
          nonClonedDetected = nonClonedDetected || ctx.size() !== 0;
          ctx.log('logging stuff');
          return a < b;
        }), {seed}
      );
      assert.ok(status.failed);
      assert.ok(!nonClonedDetected);
    });
  });
  xit('fc.dictionary', () => {
    let nonClonedDetected = false;
    const status = fc.check(
      fc.property(fc.integer(), fc.dictionary(fc.string(), fc.context()), fc.integer(), (a, dict, b) => {
        for (const k in dict) {
          const ctx = dict[k];
          nonClonedDetected = nonClonedDetected || ctx.size() !== 0;
          ctx.log('logging stuff');
        }
        return a < b;
      }), {seed}
    );
    assert.ok(status.failed);
    assert.ok(!nonClonedDetected);
  });
});
