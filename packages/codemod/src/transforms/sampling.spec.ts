import jscodeshift from 'jscodeshift';
import { describe, expect, it, vi } from 'vitest';
import { applySamplingOptions, prepareSamplingCall, samplingOptions } from './sampling.js';

const j = jscodeshift.withParser('ts');

describe('sampling options', () => {
  it.each([
    'opts',
    '{...opts}',
    '{[key]: 1}',
    '{get seed() {}}',
    '{seed: 1, seed: 2}',
    '{noPredicateExecution: false}',
  ])('should leave %s for manual review', (source) => {
    const call = j(`sample(input, ${source})`).find(j.CallExpression).nodes()[0];
    expect(samplingOptions(j, call.arguments[1])).toBeUndefined();
  });

  it.each([
    ['sample(input, 12)', 1, false, [{ key: { name: 'numRuns' }, value: { value: 12 } }]],
    ['statistics(input, classify, {})', 2, false, undefined],
    ['statistics(input, classify)', 2, true, [{ key: { name: 'noPredicateExecution' }, value: { value: true } }]],
  ] as const)('should write the normalized options in %s', (source, index, property, expected) => {
    const call = j(source).find(j.CallExpression).nodes()[0];
    const inputs = call.arguments.slice(0, index);
    const options = samplingOptions(j, call.arguments[index]);
    applySamplingOptions(j, call, index, options!.object, property);
    expect(call.arguments.slice(0, index)).toEqual(inputs);
    if (expected) {
      expect(call.arguments[index]).toMatchObject({ type: 'ObjectExpression', properties: expected });
    } else {
      expect(call.arguments).toHaveLength(index);
    }
  });
});

describe('prepareSamplingCall', () => {
  it('should follow constant factory aliases and report inputs of unknown origin', () => {
    const root = j(`import { property as make, integer } from 'fast-check';
      const p = make(); let mutable = make();
      run(p); run(integer()); run(mutable);
      { const p = unknown(); run(p); }
      run(p);`);
    const calls = root.find(j.CallExpression, { callee: { name: 'run' } }).paths();
    const report = vi.fn();
    const samples = calls.map((path) => prepareSamplingCall(j, path, 'test.ts', 'sample', report));
    expect(samples.map((sample) => sample!.property)).toEqual([true, false, undefined, undefined, true]);
    const message = 'If the sample input is a property, set noPredicateExecution to true.';
    expect(report.mock.calls).toEqual([
      [calls[2].node, message],
      [calls[3].node, message],
    ]);
  });

  it('should give classifier guidance for an unknown statistics input', () => {
    const path = j('statistics(input, classify)').find(j.CallExpression).paths()[0];
    const report = vi.fn();
    const sampling = prepareSamplingCall(j, path, 'test.ts', 'statistics', report);
    expect(sampling?.result.argument).toBe(path.node);
    expect(sampling?.property).toBeUndefined();
    expect(report.mock.calls).toEqual([
      [
        path.node,
        'If the input is a property, set noPredicateExecution to true and adapt the classifier to receive separate arguments.',
      ],
    ]);
  });

  it('should report only the await failure when the enclosing context is synchronous', () => {
    const path = j('function f() { sample(unknown); }').find(j.CallExpression).paths()[0];
    const report = vi.fn();
    expect(prepareSamplingCall(j, path, 'test.ts', 'sample', report)).toBeUndefined();
    expect(report.mock.calls).toEqual([[path.node, 'Cannot await sample() in this synchronous context.']]);
  });
});
