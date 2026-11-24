import jscodeshift from 'jscodeshift';
import { describe, expect, it } from 'vitest';
import { inspectOptions } from '../src/transforms/options.js';
import { applySamplingOptions, isPropertyInput, samplingOptions } from '../src/transforms/sampling.js';

const j = jscodeshift.withParser('ts');

describe('inspectOptions', () => {
  it('keeps duplicate entries in source order alongside unknown keys', () => {
    const object = j('run({flag: true, ...rest, flag: false, [key]: value})').find(j.ObjectExpression).nodes()[0];
    const { named, hasUnsupportedProperties } = inspectOptions(j, object);
    expect(hasUnsupportedProperties).toBe(true);
    expect([...named.keys()]).toEqual(['flag']);
    expect(named.get('flag')).toEqual([object.properties[0], object.properties[2]]);
  });
});

describe('sampling options', () => {
  it.each([
    'opts',
    '{...opts}',
    '{[key]: 1}',
    '{get seed() {}}',
    '{seed: 1, seed: 2}',
    '{noPredicateExecution: false}',
  ])('leaves %s for manual review', (source) => {
    const call = j(`sample(input, ${source})`).find(j.CallExpression).nodes()[0];
    expect(samplingOptions(j, call.arguments[1])).toBeUndefined();
  });

  it.each([
    ['sample(input, 12)', 1, false, [{ key: { name: 'numRuns' }, value: { value: 12 } }]],
    ['statistics(input, classify, {})', 2, false, undefined],
    ['statistics(input, classify)', 2, true, [{ key: { name: 'noPredicateExecution' }, value: { value: true } }]],
  ] as const)('writes the normalized options in %s', (source, index, property, expected) => {
    const call = j(source).find(j.CallExpression).nodes()[0];
    const inputs = call.arguments.slice(0, index);
    const options = samplingOptions(j, call.arguments[index]);
    applySamplingOptions(j, call, index, options!.object, property);
    expect(call.arguments.slice(0, index)).toEqual(inputs);
    if (expected) expect(call.arguments[index]).toMatchObject({ type: 'ObjectExpression', properties: expected });
    else expect(call.arguments).toHaveLength(index);
  });
});

describe('isPropertyInput', () => {
  it('follows constant factory aliases and leaves a mutable or shadowed input uncertain', () => {
    const root = j(`import { property as make, integer } from 'fast-check';
      const p = make(); let mutable = make();
      run(p); run(integer()); run(mutable);
      { const p = unknown(); run(p); }
      run(p);`);
    const calls = root.find(j.CallExpression, { callee: { name: 'run' } }).paths();
    expect(calls.map((path) => isPropertyInput(j, path))).toEqual([true, false, undefined, undefined, true]);
  });
});
