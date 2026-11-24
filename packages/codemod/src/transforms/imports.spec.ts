import jscodeshift from 'jscodeshift';
import { describe, expect, it } from 'vitest';
import { visibleNamedImport } from './imports.js';

const j = jscodeshift.withParser('ts');

describe('visibleNamedImport', () => {
  it('should reuse an alias only when it resolves to the same value import at every call', () => {
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
