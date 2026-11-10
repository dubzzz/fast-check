import { describe, expect, it } from 'vitest';
import jscodeshift from 'jscodeshift';
import transform from '../transforms/v5/no-asyncProperty.cjs';

function apply(source, path = 'test.js') {
  return transform({ source, path }, { jscodeshift });
}

describe('v5/no-asyncProperty', () => {
  it.each([
    ['default', "import fc from 'fast-check';", 'fc.asyncProperty', 'fc.property'],
    ['namespace', "import * as fc from 'fast-check';", 'fc.asyncProperty', 'fc.property'],
    ['renamed default', "import check from 'fast-check';", 'check.asyncProperty', 'check.property'],
    ['named default', "import { default as fc } from 'fast-check';", 'fc.asyncProperty', 'fc.property'],
  ])('migrates %s imports', (_name, declaration, before, after) => {
    const namespace = before.split('.')[0];
    const source = `${declaration}\ntest(async () => {\n  await ${namespace}.assert(${before}(${namespace}.integer(), async (n) => n === n));\n});\n`;
    const expected = source.replace(before, after);
    expect(apply(source)).toBe(expected);
    expect(apply(expected)).toBe(expected);
  });

  it.each([
    [
      'named imports',
      "import { assert, asyncProperty } from 'fast-check';\nawait assert(asyncProperty(arb, async (n) => n));",
      "import { assert, property } from 'fast-check';\nawait assert(property(arb, async (n) => n));",
    ],
    [
      'aliased named imports',
      "import { asyncProperty as ap } from 'fast-check';\nap(arb, async (n) => n);",
      "import { property as ap } from 'fast-check';\nap(arb, async (n) => n);",
    ],
    [
      'existing property imports',
      "import { property, asyncProperty } from 'fast-check';\nasyncProperty(arb, async (n) => n);",
      "import { property, property as asyncProperty } from 'fast-check';\nasyncProperty(arb, async (n) => n);",
    ],
    [
      'nested property bindings',
      "import { asyncProperty } from 'fast-check';\nfunction test(property) { return asyncProperty(arb, property); }",
      "import { property as asyncProperty } from 'fast-check';\nfunction test(property) { return asyncProperty(arb, property); }",
    ],
    [
      'global property references',
      "import { asyncProperty } from 'fast-check';\nproperty();\nasyncProperty(arb, predicate);",
      "import { property as asyncProperty } from 'fast-check';\nproperty();\nasyncProperty(arb, predicate);",
    ],
    [
      'shadowed default imports',
      "import fc from 'fast-check';\nfc.asyncProperty(arb, predicate);\nfunction test(fc) { return fc.asyncProperty(); }",
      "import fc from 'fast-check';\nfc.property(arb, predicate);\nfunction test(fc) { return fc.asyncProperty(); }",
    ],
    [
      'shadowed named imports',
      "import { asyncProperty } from 'fast-check';\nasyncProperty(arb, predicate);\nfunction test(asyncProperty) { return asyncProperty(); }",
      "import { property } from 'fast-check';\nproperty(arb, predicate);\nfunction test(asyncProperty) { return asyncProperty(); }",
    ],
    [
      'references and shorthand properties',
      "import { asyncProperty } from 'fast-check';\nconst api = { asyncProperty };\nconst build = asyncProperty;",
      "import { property } from 'fast-check';\nconst api = { asyncProperty: property };\nconst build = property;",
    ],
    [
      'unrelated property names',
      "import { asyncProperty } from 'fast-check';\nother.asyncProperty();\nconst api = { asyncProperty: asyncProperty };",
      "import { property } from 'fast-check';\nother.asyncProperty();\nconst api = { asyncProperty: property };",
    ],
    [
      'computed members',
      "import fc from 'fast-check';\nfc['asyncProperty'](arb, predicate);",
      "import fc from 'fast-check';\nfc['property'](arb, predicate);",
    ],
    [
      'optional members',
      "import fc from 'fast-check';\nfc?.asyncProperty(arb, predicate);",
      "import fc from 'fast-check';\nfc?.property(arb, predicate);",
    ],
  ])('migrates %s safely', (_name, source, expected) => {
    expect(apply(source)).toBe(expected);
    expect(apply(expected)).toBe(expected);
  });

  it.each([
    "import fc from 'another-library';\nfc.asyncProperty();",
    "import { asyncProperty } from 'another-library';\nasyncProperty();",
    'function asyncProperty() {}\nasyncProperty();',
    "import fc from 'fast-check';\nfc.property(arb, predicate);",
    "import fc from 'fast-check';\n// asyncProperty\nconst text = 'asyncProperty';\nfc[method]();",
    "import type { asyncProperty } from 'fast-check';",
    "import { type asyncProperty } from 'fast-check';",
  ])('leaves unrelated code unchanged: %s', (source) => {
    expect(apply(source)).toBe(source);
  });

  it.each(['ts', 'mts', 'cts'])("supports TypeScript in .%s files without interpreting '<T>' as JSX", (extension) => {
    const source =
      "import fc from 'fast-check';\nconst identity = <T>(n: T): T => n;\nfc.asyncProperty(arb, identity);";
    expect(apply(source, `test.${extension}`)).toBe(source.replace('fc.asyncProperty', 'fc.property'));
  });

  it.each(['jsx', 'tsx'])('supports JSX in .%s files', (extension) => {
    const source = "import fc from 'fast-check';\nfc.asyncProperty(arb, async (n) => <div>{n}</div>);";
    expect(apply(source, `test.${extension}`)).toBe(source.replace('fc.asyncProperty', 'fc.property'));
  });

  it('preserves comments and surrounding formatting', () => {
    const source = '// header\nimport fc from "fast-check"\n\nfc.asyncProperty( /* keep */ arb, predicate )\n';
    expect(apply(source)).toBe(source.replace('fc.asyncProperty', 'fc.property'));
  });
});
