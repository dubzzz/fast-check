import jscodeshift from 'jscodeshift';
import { describe, expect, it } from 'vitest';
import { findSingleConstBinding, referencesOf } from './bindings.js';

const j = jscodeshift.withParser('ts');

describe('referencesOf', () => {
  it('should find references in computed keys, shorthand values and local exports while respecting shadowing', () => {
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

describe('findSingleConstBinding', () => {
  it('should accept only a directly bound name in a single const declarator', () => {
    const root = j(`const single = 1; const first = 1, second = 2;
      const { item } = obj; let mutable = 1; use(single, first, second, item, mutable);`);
    const call = root.find(j.CallExpression).paths()[0];
    const names = ['single', 'first', 'second', 'item', 'mutable'];
    expect(names.map((name) => findSingleConstBinding(j, call, name)?.node.name)).toEqual([
      'single',
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });
});
