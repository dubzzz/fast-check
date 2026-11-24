import jscodeshift from 'jscodeshift';
import { describe, expect, it } from 'vitest';
import { referencesOf } from '../src/transforms/bindings.js';
import { importedName } from '../src/transforms/fastCheck.js';
import { visibleNamedImport } from '../src/transforms/imports.js';

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

describe('importedName', () => {
  it('resolves value imports through aliases and distinguishes shadowed, computed and type-only uses', () => {
    const root = j(`import fc from 'fast-check';
      import * as ns from 'fast-check';
      import { sample as draw, type check as checkType } from 'fast-check';
      import type * as types from 'fast-check';
      import { sample as other } from 'another-module';
      fc.check(); ns.assert(); draw(); fc['check'](); checkType(); types.check(); other();
      { const draw = other; draw(); }
      draw();`);
    expect(
      root
        .find(j.CallExpression)
        .paths()
        .map((path) => importedName(j, path, path.node.callee)),
    ).toEqual(['check', 'assert', 'sample', undefined, undefined, undefined, undefined, undefined, 'sample']);
  });
});

describe('visibleNamedImport', () => {
  it('only reuses an alias that resolves to the same value import at every call', () => {
    const root = j(`import { property as other } from 'elsewhere';
      import type { property as typeOnly } from 'fast-check';
      import { type property as inlineType, property as first, property as second } from 'fast-check';
      use(); function one(first) { use(); } function two(second) { use(); }`);
    const imports = root.find(j.ImportDeclaration);
    const [outside, shadowsFirst, shadowsSecond] = root.find(j.CallExpression).paths();

    expect(visibleNamedImport(j, imports, 'fast-check', 'property', [outside])).toBe('first');
    expect(visibleNamedImport(j, imports, 'fast-check', 'property', [outside, shadowsFirst])).toBe('second');
    expect(visibleNamedImport(j, imports, 'fast-check', 'property', [shadowsFirst, shadowsSecond])).toBeUndefined();
  });
});
