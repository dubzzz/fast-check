import { describe, expect, it } from 'vitest';
import jscodeshift from 'jscodeshift';
import transform from '../src/transforms/v5/checkToAssert.js';
import * as fc from '../../fast-check/src/fast-check.js';

function migrate(body: string, path = 'input.ts') {
  const source = `import * as fc from 'fast-check';\n${body}\n`;
  const reports: string[] = [];
  const output = transform(
    { source, path },
    { j: jscodeshift, jscodeshift, stats() {}, report: (message) => reports.push(message) },
  );
  return { source, output, reports };
}

describe('checkToAssert consumption', () => {
  it.each([
    'await fc.check(property);',
    'fc.check(property).then(consume);',
    'fc.check(property).catch(consume);',
    'fc.check(property).finally(cleanup);',
    "fc.check(property)['then'](consume);",
    'const out = fc.check(property); await out;',
    'const out = fc.check(property); out.then(consume); out.finally(cleanup);',
    'await (fc.check(property) as Promise<fc.RunDetails<unknown>>);',
    'const out = fc.check(property); { const out = other; consume(out); } await out;',
  ])('uses the asynchronous helper for %s', (body) => {
    const { output, reports } = migrate(body);
    expect(reports).toEqual([]);
    expect(output).toContain('async function assertAndGetRunDetails');
    expect(output).not.toContain('assertAndGetRunDetailsSync');
    expect(output).not.toContain('fc.check(');
  });

  it.each([
    'const failed = fc.check(property).failed;',
    "const failed = fc.check(property)['failed'];",
    'const { failed, seed: initialSeed } = fc.check(property);',
    '({ counterexample } = fc.check(property));',
    'const out = fc.check(property); if (out.failed) consume(out.counterexample);',
    'const out = fc.check(property); const { seed } = out;',
    'const out = fc.check(property); consume(out?.failed);',
    'const out = fc.check(property); consume(out!.failed);',
    'const out = fc.check(property) as fc.RunDetails<unknown>; consume(out.failed);',
    'const out = fc.check(property); await out.failed;',
    'const out = fc.check(property); { const out = other; await out; } consume(out.failed);',
  ])('uses the synchronous helper for %s', (body) => {
    const { output, reports } = migrate(body);
    expect(reports).toEqual([]);
    expect(output).toContain('function assertAndGetRunDetailsSync');
    expect(output).not.toContain('async function assertAndGetRunDetails');
    expect(output).not.toContain('fc.check(');
  });

  it.each([
    'fc.check(property);',
    'const unused = fc.check(property);',
    'function run() { return fc.check(property); }',
    'consume(fc.check(property));',
    'export const out = fc.check(property); consume(out.failed);',
    'const out = fc.check(property); export { out };',
    'let out = fc.check(property); consume(out.failed);',
    'const out = fc.check(property); consume(out.failed); await out;',
    'const out = fc.check(property); consume(out.failed); out.then(consume);',
    'const out = fc.check(property); consume(out.failed); consume(out);',
    'const out = fc.check(property); const alias = out; consume(alias.failed);',
    'const out = fc.check(property); out.failed = true;',
    'const out = fc.check(property); consume(out[key]);',
    'const out = fc.check(property); consume(out.unknownField);',
    'const out = fc.check(property); const then = out.then;',
    'const out = fc.check(property); function consume(out) { return out.failed; }',
    'const {} = fc.check(property);',
    'const { then } = fc.check(property);',
    'const { ...out } = fc.check(property);',
    "import { check } from 'fast-check'; await check(property);",
    'const out = fc.check(fc.asyncProperty(fc.nat(), async () => false)); consume(out.failed);',
    'const property = fc.asyncProperty(fc.nat(), async () => false); const { failed } = fc.check(property);',
  ])('reports a dubious usage and leaves it unchanged: %s', (body) => {
    const { source, output, reports } = migrate(body);
    expect(output).toBe(source);
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatch(/^warning \(\d+:\d+\): Cannot /);
  });
});

function migratedRun(body: string): () => unknown {
  const { output, reports } = migrate(body, 'input.js');
  expect(reports).toEqual([]);
  const root = jscodeshift(output);
  root.find(jscodeshift.ImportDeclaration).remove();
  return new Function('fc', `${root.toSource()}\nreturn run;`)(fc) as () => unknown;
}

describe('checkToAssert generated helpers on v5', () => {
  it('returns details immediately for synchronous execution and retains local plugins', () => {
    const run = migratedRun(`
function run() {
  let observed;
  const out = fc.check(fc.property(fc.constant(42), () => false), {
    seed: 123,
    plugins: [() => ({ onAllRunsComplete(details) { observed = details; } })],
  });
  return { failed: out.failed, seed: out.seed, counterexample: out.counterexample, same: observed.counterexample === out.counterexample };
}`);
    expect(run()).toEqual({ failed: true, seed: 123, counterexample: [42], same: true });
  });

  it('awaits asynchronous execution and retains details', async () => {
    const run = migratedRun(`
async function run() {
  const out = await fc.check(fc.asyncProperty(fc.constant(42), async () => false));
  return { failed: out.failed, counterexample: out.counterexample };
}`);
    await expect(run()).resolves.toEqual({ failed: true, counterexample: [42] });
  });

  it('reports unexpected asynchronous execution instead of returning missing details', () => {
    const run = migratedRun(`
function makeProperty() { return fc.asyncProperty(fc.constant(42), async () => false); }
function run() {
  const out = fc.check(makeProperty());
  return out.failed;
}`);
    expect(run).toThrow('Expected synchronous check execution');
  });

  it('handles rejection after detecting an asynchronous completion hook', async () => {
    const run = migratedRun(`
function run() {
  const out = fc.check(fc.property(fc.constant(42), () => false), {
    plugins: [() => ({ async onAllRunsComplete() { throw new Error('late rejection'); } })],
  });
  return out.failed;
}`);
    expect(run).toThrow('Expected synchronous check execution');
    // Let the assertion finish: its rejection must not become an unhandled rejection.
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});
