import * as assert from 'assert';

import { context } from '../../../../src/check/arbitrary/ContextArbitrary';

import * as stubRng from '../../stubs/generators';
import { hasCloneMethod, cloneMethod } from '../../../../src/check/symbols';

describe('ContextArbitrary', () => {
  describe('context', () => {
    it('Should generate a cloneable instance', () => {
      const mrng = stubRng.mutable.nocall();
      const g = context().generate(mrng).value;
      assert.ok(hasCloneMethod(g));
    });
    it('Should not reset its own logs on clone', () => {
      const mrng = stubRng.mutable.nocall();
      const g = context().generate(mrng).value;
      if (!hasCloneMethod(g)) throw new Error('context should be a cloneable instance');
      g.log('a');
      const gBeforeClone = String(g);
      assert.ok(g[cloneMethod]() != null);
      assert.equal(String(g), gBeforeClone);
      assert.equal(g.size(), 1);
    });
    it('Should produce a clone without any logs', () => {
      const mrng = stubRng.mutable.nocall();
      const g = context().generate(mrng).value;
      if (!hasCloneMethod(g)) throw new Error('context should be a cloneable instance');
      const gBeforeLogs = String(g);
      g.log('a');
      const g2 = g[cloneMethod]();
      assert.notEqual(String(g2), String(g));
      assert.equal(String(g2), gBeforeLogs);
      assert.equal(g2.size(), 0);
    });
  });
});
