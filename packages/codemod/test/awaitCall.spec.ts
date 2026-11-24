import jscodeshift from 'jscodeshift';
import { describe, expect, it } from 'vitest';
import { planAwait } from '../src/transforms/awaitCall.js';

const j = jscodeshift.withParser('ts');

describe('planAwait', () => {
  it('defers making the test callback async until the caller applies the edit', () => {
    const source = "import { test as spec } from 'vitest'; spec.each(cases)('name', (n) => run(n));";
    const root = j(source);
    const call = root.find(j.CallExpression, { callee: { name: 'run' } }).paths()[0];
    const apply = planAwait(j, call, 'test.ts');

    const callback = root.find(j.ArrowFunctionExpression).nodes()[0];
    expect(callback.async).toBe(false);
    expect(callback.body).toBe(call.node);
    const awaited = apply!();
    expect(callback.async).toBe(true);
    expect(awaited.type).toBe('AwaitExpression');
    expect(awaited.argument).toBe(call.node);
  });

  it.each([
    ['module.mts', 'run();', true],
    ['module.cts', 'run();', false],
    ['module.cjs', 'async function f() { run(); }', true],
    ['module.ts', 'async function f(arg = run()) {}', false],
    ['module.ts', 'class C { value = run(); }', false],
    ['module.ts', 'namespace N { run(); }', false],
    ['module.ts', "test('done callback', (done) => run());", false],
    ['module.ts', "function f(test) { test('local test', () => run()); }", false],
  ] as const)('handles %s containing %s', (filename, source, allowed) => {
    const call = j(source)
      .find(j.CallExpression, { callee: { name: 'run' } })
      .paths()[0];
    expect(planAwait(j, call, filename) !== undefined).toBe(allowed);
  });
});
