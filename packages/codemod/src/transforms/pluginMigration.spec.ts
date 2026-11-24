import jscodeshift from 'jscodeshift';
import { describe, expect, it, vi } from 'vitest';
import lifecyclePlugins from './v5/lifecyclePlugins.js';
import runnerPlugins from './v5/runnerPlugins.js';

const j = jscodeshift.withParser('ts');

describe('plugin order', () => {
  it.each(['50', 'limit'])(
    'should insert lifecycle hooks before the runner plugin generated for timeout %s',
    (timeout) => {
      const api = { j: jscodeshift, jscodeshift, report: vi.fn(), stats: vi.fn() };
      const file = {
        path: 'test.ts',
        source: `import * as fc from 'fast-check';
      fc.assert(fc.property(fc.nat(), Number.isInteger).beforeEach(() => {}), {plugins: [custom], timeout: ${timeout}});`,
      };
      const source = runnerPlugins(file, api);
      const migrated = lifecyclePlugins({ ...file, source }, api);
      const plugins = j(migrated).find(j.ArrayExpression).nodes()[0];
      const timeoutCall = { type: 'CallExpression', callee: { property: { name: 'timeout' } } };
      expect(plugins.elements).toMatchObject([
        { type: 'Identifier', name: 'custom' },
        { type: 'CallExpression', callee: { property: { name: 'beforeEach' } } },
        timeout === 'limit'
          ? { type: 'SpreadElement', argument: { consequent: { elements: [timeoutCall] } } }
          : timeoutCall,
      ]);
      expect(api.report).not.toHaveBeenCalled();
    },
  );
});
