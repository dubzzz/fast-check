import { describe, expect, it } from 'vitest';
import jscodeshift from 'jscodeshift';
import transform from '../src/transforms/v5/checkToAssert.js';
import * as fc from '../../fast-check/src/fast-check.js';

function migrate(body: string) {
  const source = `import * as fc from 'fast-check';\n${body}\n`;
  const reports: string[] = [];
  const output = transform(
    { source, path: 'input.js' },
    { j: jscodeshift, jscodeshift, stats() {}, report: (message) => reports.push(message) },
  );
  return { output, reports };
}

function migratedRun(body: string): () => unknown {
  const { output, reports } = migrate(body);
  expect(reports).toEqual([]);
  expect(output).not.toContain('assertAndGetRunDetails');
  const root = jscodeshift(output);
  root.find(jscodeshift.ImportDeclaration).remove();
  return new Function('fc', `${root.toSource()}\nreturn run;`)(fc) as () => unknown;
}

describe('checkToAssert inline assertions on v5', () => {
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

  it('keeps a synchronous result when it is also awaited and passed elsewhere', async () => {
    const run = migratedRun(`
async function run() {
  let observed;
  function consume(value) { observed = value; }
  const out = fc.check(fc.property(fc.constant(42), () => false));
  consume(out);
  const awaited = await out;
  return { failed: out.failed, same: out === observed && out === awaited };
}`);
    await expect(run()).resolves.toEqual({ failed: true, same: true });
  });

  it('evaluates property and options once, in order, in conditional expressions', () => {
    const run = migratedRun(`
function run() {
  const events = [];
  function property() {
    events.push('property');
    return fc.property(fc.constant(42), () => false);
  }
  function options() { events.push('options'); return { seed: 123 }; }
  function receiver() {
    events.push('receiver');
    return { consume(skipped, failed) { return { skipped, failed, events }; } };
  }
  return receiver().consume(false && fc.check(property(), options()).failed, fc.check(property(), options()).failed);
}`);
    expect(run()).toEqual({ skipped: false, failed: true, events: ['receiver', 'property', 'options'] });
  });

  it('returns a promise for chained calls and retains asynchronous completion hooks', async () => {
    const run = migratedRun(`
function run() {
  let completed = false;
  const pending = fc.check(fc.asyncProperty(fc.constant(42), async () => false), {
    plugins: [() => ({ async onAllRunsComplete() { await Promise.resolve(); completed = true; } })],
  });
  return pending.then(out => ({ failed: out.failed, completed }));
}`);
    await expect(run()).resolves.toEqual({ failed: true, completed: true });
  });
});
