import { context } from '../../../src/arbitrary/context';

import * as stubRng from '../stubs/generators';
import { hasCloneMethod, cloneMethod } from '../../../src/check/symbols';

describe('ContextArbitrary', () => {
  describe('context', () => {
    it('Should generate a cloneable instance', () => {
      const mrng = stubRng.mutable.nocall();
      const g = context().generate(mrng).value;
      expect(hasCloneMethod(g)).toBe(true);
    });
    it('Should not reset its own logs on clone', () => {
      const mrng = stubRng.mutable.nocall();
      const g = context().generate(mrng).value;
      if (!hasCloneMethod(g)) throw new Error('context should be a cloneable instance');
      g.log('a');
      const gBeforeClone = String(g);
      expect(g[cloneMethod]()).toBeDefined();
      expect(String(g)).toEqual(gBeforeClone);
      expect(g.size()).toEqual(1);
    });
    it('Should produce a clone without any logs', () => {
      const mrng = stubRng.mutable.nocall();
      const g = context().generate(mrng).value;
      if (!hasCloneMethod(g)) throw new Error('context should be a cloneable instance');
      const gBeforeLogs = String(g);
      g.log('a');
      const g2 = g[cloneMethod]();
      expect(String(g2)).not.toEqual(String(g));
      expect(String(g2)).toEqual(gBeforeLogs);
      expect(g2.size()).toEqual(0);
    });
  });
});
