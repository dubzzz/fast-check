import { describe, expect, it } from 'vitest';
import jscodeshift from 'jscodeshift';
import { allowAwait, awaitContext } from '../../src/transforms/allowAwait.js';

const j = jscodeshift.withParser('ts');

function parseTarget(source: string) {
  const root = j(source);
  const calls = root.find(j.CallExpression, { callee: { type: 'Identifier', name: 'target' } });
  expect(calls.size()).toBe(1);
  return { root, call: calls.paths()[0] };
}

describe('awaitContext', () => {
  it.each(['example.ts', 'example.tsx', 'example.js', 'example.jsx', 'example.mjs', 'example.mts'])(
    'should allow top-level await in %s without changing the AST',
    (filename) => {
      const { root, call } = parseTarget('target();');
      const original = root.toSource();

      expect(awaitContext(j, call, filename)).toEqual({});
      expect(root.toSource()).toBe(original);
    },
  );

  it.each(['example.cjs', 'example.cts', 'example.CJS', 'example.CTS'])(
    'should reject top-level await in %s',
    (filename) => {
      const { call } = parseTarget('target();');

      expect(awaitContext(j, call, filename)).toBeUndefined();
    },
  );

  it.each([
    { name: 'function declaration', source: 'async function run() { target(); }' },
    { name: 'function expression', source: 'const run = async function () { target(); };' },
    { name: 'arrow function', source: 'const run = async () => target();' },
    { name: 'object method', source: 'const obj = { async run() { target(); } };' },
    { name: 'class method', source: 'class Runner { async run() { target(); } }' },
  ])('should allow await inside an async $name even in CommonJS', ({ source }) => {
    const { root, call } = parseTarget(source);
    const original = root.toSource();

    expect(awaitContext(j, call, 'example.cts')).toEqual({});
    expect(root.toSource()).toBe(original);
  });

  it.each([
    { name: 'global test', source: "test('name', () => { target(); });" },
    { name: 'global it', source: "it('name', () => { target(); });" },
    { name: 'function callback', source: "test('name', function () { target(); });" },
    { name: 'expression body', source: "test('name', () => target());" },
    {
      name: 'aliased Vitest import',
      source: "import { test as spec } from 'vitest'; spec('name', () => { target(); });",
    },
    {
      name: 'aliased Jest import',
      source: "import { it as spec } from '@jest/globals'; spec('name', () => { target(); });",
    },
    {
      name: 'Node test import',
      source: "import { test } from 'node:test'; test('name', () => { target(); });",
    },
    { name: 'skipped test', source: "test.skip('name', () => { target(); });" },
    { name: 'chained modifiers', source: "it.concurrent.only.fails('name', () => { target(); });" },
    { name: 'conditional skip', source: "test.skipIf(condition)('name', () => { target(); });" },
    { name: 'conditional run', source: "test.runIf(condition)('name', () => { target(); });" },
    {
      name: 'parameterized test',
      source: "test.each([[1, 2]])('name', (a, b) => { target(); });",
    },
    {
      name: 'parameterized test with destructuring',
      source: "it.skip.each([{ value: 1 }])('name', ({ value }) => { target(); });",
    },
    {
      name: 'tagged parameterized test',
      source: "it.each`value\n${1}`('name', ({ value }) => { target(); });",
    },
  ])('should plan an async callback for a $name without mutating it', ({ source }) => {
    const { root, call } = parseTarget(source);
    const callback = root.find(j.Function).nodes()[0];
    const original = root.toSource();

    const context = awaitContext(j, call, 'example.ts');

    expect(context?.functionToMakeAsync).toBe(callback);
    expect(callback.async).toBe(false);
    expect(root.toSource()).toBe(original);
  });

  it.each([
    { name: 'ordinary synchronous function', source: 'function run() { target(); }' },
    { name: 'ordinary arrow callback', source: 'consume(() => { target(); });' },
    {
      name: 'nested synchronous function in an async function',
      source: 'async function run() { function inner() { target(); } }',
    },
    { name: 'nested synchronous callback in a test', source: "test('name', () => { consume(() => { target(); }); });" },
    { name: 'done callback', source: "test('name', (done) => { target(); });" },
    { name: 'explicit return type', source: "test('name', (): void => { target(); });" },
    { name: 'generator callback', source: "test('name', function* () { target(); });" },
    { name: 'callback in the wrong argument position', source: "test(() => { target(); }, 'name');" },
    { name: 'computed test member', source: "test['skip']('name', () => { target(); });" },
    { name: 'unknown test factory', source: "test.extend({})('name', () => { target(); });" },
    { name: 'test from another package', source: "import { test } from 'other'; test('name', () => { target(); });" },
    { name: 'locally defined test', source: "const test = other; test('name', () => { target(); });" },
    {
      name: 'shadowed test import',
      source: "import { test } from 'vitest'; { const test = other; test('name', () => { target(); }); }",
    },
    { name: 'default parameter of an async function', source: 'async function run(value = target()) {}' },
    { name: 'default parameter of a parameterized test', source: "test.each([1])('name', (value = target()) => {});" },
    { name: 'class field initializer', source: 'class Runner { value = target(); }' },
    { name: 'class static block', source: 'class Runner { static { target(); } }' },
    { name: 'TypeScript namespace body', source: 'namespace Helpers { target(); }' },
  ])('should reject a $name without changing the AST', ({ source }) => {
    const { root, call } = parseTarget(source);
    const original = root.toSource();

    expect(awaitContext(j, call, 'example.ts')).toBeUndefined();
    expect(root.toSource()).toBe(original);
  });
});

describe('allowAwait', () => {
  it('should make only the containing test callback async without inserting await', () => {
    const { root, call } = parseTarget("describe('suite', () => { test('name', () => { target(); }); });");
    const [suite, test] = root.find(j.ArrowFunctionExpression).nodes();

    expect(allowAwait(j, call, 'example.ts')).toBe(true);
    expect(suite.async).toBe(false);
    expect(test.async).toBe(true);
    expect(root.find(j.AwaitExpression).size()).toBe(0);
  });

  it('should return true without changing an already async callback', () => {
    const { root, call } = parseTarget("test('name', async () => { target(); });");
    const original = root.toSource();

    expect(allowAwait(j, call, 'example.ts')).toBe(true);
    expect(root.toSource()).toBe(original);
  });

  it('should return true at module scope without changing the AST', () => {
    const { root, call } = parseTarget('target();');
    const original = root.toSource();

    expect(allowAwait(j, call, 'example.mts')).toBe(true);
    expect(root.toSource()).toBe(original);
  });

  it('should return false without changing an unsupported callback or its enclosing test', () => {
    const { root, call } = parseTarget("test('name', () => { consume(() => { target(); }); });");
    const original = root.toSource();

    expect(allowAwait(j, call, 'example.ts')).toBe(false);
    expect(root.toSource()).toBe(original);
  });

  it('should be idempotent when called again on the same AST', () => {
    const { root, call } = parseTarget("test.each([1])('name', (value) => { target(); });");

    expect(allowAwait(j, call, 'example.ts')).toBe(true);
    const migrated = root.toSource();
    expect(allowAwait(j, call, 'example.ts')).toBe(true);
    expect(awaitContext(j, call, 'example.ts')).toEqual({});
    expect(root.toSource()).toBe(migrated);
  });
});
