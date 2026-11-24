import jscodeshift from 'jscodeshift';
import { describe, expect, it } from 'vitest';
import { referencesOf } from './bindings.js';

const j = jscodeshift.withParser('ts');

describe('referencesOf', () => {
  it('includes computed keys, shorthand values and local exports while respecting lexical shadows', () => {
    const root = j(`import { property as prop } from 'fast-check';
      const object = { prop: 1, [prop]: 2, prop };
      object.prop;
      { const prop = other; use(prop); }
      for (const prop of others) use(prop);
      function inner(prop) { return prop; }
      export { prop as factory };
      export { prop } from 'elsewhere';
      use(prop);`);
    const binding = root.find(j.ImportSpecifier).paths()[0].get('local');

    expect(referencesOf(j, binding).map((ref) => [ref.parent.node.type, ref.name])).toEqual([
      ['ObjectProperty', 'key'],
      ['ObjectProperty', 'value'],
      ['ExportSpecifier', 'local'],
      ['CallExpression', 0],
    ]);
  });
});
