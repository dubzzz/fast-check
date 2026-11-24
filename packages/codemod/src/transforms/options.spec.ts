import jscodeshift from 'jscodeshift';
import { describe, expect, it } from 'vitest';
import { inspectOptions } from './options.js';

const j = jscodeshift.withParser('ts');

describe('inspectOptions', () => {
  it('should keep duplicate entries in source order and flag unknown keys', () => {
    const object = j('run({flag: true, ...rest, flag: false, [key]: value})').find(j.ObjectExpression).nodes()[0];
    const { named, hasUnsupportedProperties } = inspectOptions(j, object);
    expect(hasUnsupportedProperties).toBe(true);
    expect([...named.keys()]).toEqual(['flag']);
    expect(named.get('flag')).toEqual([object.properties[0], object.properties[2]]);
  });
});
