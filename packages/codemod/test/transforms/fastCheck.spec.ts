import { describe, expect, it } from 'vitest';
import jscodeshift from 'jscodeshift';
import { findBinding, importedName, isFastCheckNamespace, memberName } from '../../src/transforms/fastCheck.js';

const j = jscodeshift.withParser('ts');

function parseReference(source: string) {
  const root = j(source);
  const calls = root.find(j.CallExpression, { callee: { type: 'Identifier', name: 'inspect' } });
  expect(calls.size()).toBe(1);
  return { root, reference: calls.paths()[0].get('arguments', 0) };
}

describe('findBinding', () => {
  it.each([
    { name: 'program binding', source: "const value = 'outer'; inspect(value);", index: 0 },
    {
      name: 'binding from an enclosing function',
      source: "function outer() { const value = 'outer'; function inner() { inspect(value); } }",
      index: 0,
    },
    {
      name: 'nearest block binding',
      source: "const value = 'outer'; { const value = 'inner'; inspect(value); }",
      index: 1,
    },
    {
      name: 'outer binding after a shadowing block',
      source: "const value = 'outer'; { const value = 'inner'; } inspect(value);",
      index: 0,
    },
    {
      name: 'outer binding in a sibling block',
      source: "const value = 'outer'; { const value = 'inner'; } { inspect(value); }",
      index: 0,
    },
    {
      name: 'var binding outside its declaring block',
      source: 'function run() { { var value = 1; } inspect(value); }',
      index: 0,
    },
    {
      name: 'for loop binding',
      source: "const value = 'outer'; for (let value = 0; value < 1; ++value) { inspect(value); }",
      index: 1,
    },
    {
      name: 'for-of binding',
      source: "const value = 'outer'; for (const value of values) { inspect(value); }",
      index: 1,
    },
    {
      name: 'for-in binding',
      source: "const value = 'outer'; for (const value in values) { inspect(value); }",
      index: 1,
    },
    {
      name: 'outer binding after a loop',
      source: "const value = 'outer'; for (const value of values) {} inspect(value);",
      index: 0,
    },
    {
      name: 'binding shared between switch cases',
      source: "const value = 'outer'; switch (key) { case 0: let value = 1; break; default: inspect(value); }",
      index: 1,
    },
    {
      name: 'outer binding after a switch',
      source: "const value = 'outer'; switch (key) { case 0: let value = 1; } inspect(value);",
      index: 0,
    },
  ])('should resolve the $name', ({ source, index }) => {
    const { root, reference } = parseReference(source);
    const declarations = root.find(j.VariableDeclarator, { id: { type: 'Identifier', name: 'value' } });

    const binding = findBinding(j, reference, 'value');

    expect(binding).toBeDefined();
    expect(binding?.node).toBe(declarations.nodes()[index].id);
  });

  it('should resolve an aliased import to its local identifier', () => {
    const { root, reference } = parseReference("import { property as value } from 'fast-check'; inspect(value);");
    const original = root.toSource();

    expect(findBinding(j, reference, 'value')?.node).toBe(root.find(j.ImportSpecifier).nodes()[0].local);
    expect(root.toSource()).toBe(original);
  });

  it('should prefer a function parameter over an outer binding', () => {
    const { root, reference } = parseReference('const value = 1; function run(value) { inspect(value); }');

    expect(findBinding(j, reference, 'value')?.node).toBe(root.find(j.FunctionDeclaration).nodes()[0].params[0]);
  });

  it('should resolve a catch parameter', () => {
    const { root, reference } = parseReference('try { run(); } catch (value) { inspect(value); }');

    expect(findBinding(j, reference, 'value')?.node).toBe(root.find(j.CatchClause).nodes()[0].param);
  });

  it.each([
    { name: 'undeclared identifier', source: 'inspect(value);' },
    { name: 'binding confined to another block', source: '{ const value = 1; } inspect(value);' },
    { name: 'ambiguous declarations in the same scope', source: 'var value; var value; inspect(value);' },
  ])('should return undefined for $name', ({ source }) => {
    const { reference } = parseReference(source);

    expect(findBinding(j, reference, 'value')).toBeUndefined();
  });
});

describe('isFastCheckNamespace', () => {
  it.each([
    { name: 'namespace import', source: "import * as fc from 'fast-check'; inspect(fc);", expected: true },
    { name: 'default import', source: "import fc from 'fast-check'; inspect(fc);", expected: true },
    { name: 'renamed namespace', source: "import * as renamed from 'fast-check'; inspect(renamed);", expected: true },
    { name: 'different package', source: "import * as fc from 'other'; inspect(fc);", expected: false },
    { name: 'type-only namespace', source: "import type * as fc from 'fast-check'; inspect(fc);", expected: false },
    { name: 'type-only default import', source: "import type fc from 'fast-check'; inspect(fc);", expected: false },
    { name: 'named import', source: "import { property as fc } from 'fast-check'; inspect(fc);", expected: false },
    { name: 'unbound name', source: 'inspect(fc);', expected: false },
    { name: 'local object', source: 'const fc = {}; inspect(fc);', expected: false },
    {
      name: 'shadowing parameter',
      source: "import * as fc from 'fast-check'; function run(fc) { inspect(fc); }",
      expected: false,
    },
    {
      name: 'shadowing block binding',
      source: "import * as fc from 'fast-check'; { const fc = other; inspect(fc); }",
      expected: false,
    },
    {
      name: 'sibling block shadow',
      source: "import * as fc from 'fast-check'; { const fc = other; } { inspect(fc); }",
      expected: true,
    },
    {
      name: 'non-identifier expression',
      source: "import * as fc from 'fast-check'; inspect(fc.property);",
      expected: false,
    },
  ])('should identify a $name correctly', ({ source, expected }) => {
    const { reference } = parseReference(source);

    expect(isFastCheckNamespace(j, reference, reference.node)).toBe(expected);
  });
});

describe('memberName', () => {
  it.each([
    {
      name: 'namespace member',
      source: "import * as fc from 'fast-check'; inspect(fc.property);",
      expected: 'property',
    },
    { name: 'default import member', source: "import fc from 'fast-check'; inspect(fc.check);", expected: 'check' },
    {
      name: 'computed literal',
      source: "import * as fc from 'fast-check'; inspect(fc['property']);",
      expected: undefined,
    },
    { name: 'computed identifier', source: "import * as fc from 'fast-check'; inspect(fc[key]);", expected: undefined },
    {
      name: 'member of another library',
      source: "import * as fc from 'other'; inspect(fc.property);",
      expected: undefined,
    },
    {
      name: 'bare identifier',
      source: "import { property } from 'fast-check'; inspect(property);",
      expected: undefined,
    },
    {
      name: 'nested member',
      source: "import * as fc from 'fast-check'; inspect(fc.random.property);",
      expected: undefined,
    },
    {
      name: 'shadowed namespace',
      source: "import * as fc from 'fast-check'; function run(fc) { inspect(fc.property); }",
      expected: undefined,
    },
  ])('should resolve a $name', ({ source, expected }) => {
    const { reference } = parseReference(source);

    expect(memberName(j, reference, reference.node)).toBe(expected);
  });
});

describe('importedName', () => {
  it.each([
    { name: 'named import', source: "import { property } from 'fast-check'; inspect(property);", expected: 'property' },
    {
      name: 'aliased named import',
      source: "import { property as asyncProperty } from 'fast-check'; inspect(asyncProperty);",
      expected: 'property',
    },
    { name: 'namespace member', source: "import * as fc from 'fast-check'; inspect(fc.assert);", expected: 'assert' },
    { name: 'default import member', source: "import fc from 'fast-check'; inspect(fc.sample);", expected: 'sample' },
    { name: 'unbound identifier', source: 'inspect(property);', expected: undefined },
    { name: 'local function', source: 'function property() {} inspect(property);', expected: undefined },
    { name: 'other package', source: "import { property } from 'other'; inspect(property);", expected: undefined },
    {
      name: 'type-only declaration',
      source: "import type { property } from 'fast-check'; inspect(property);",
      expected: undefined,
    },
    {
      name: 'type-only specifier',
      source: "import { type property } from 'fast-check'; inspect(property);",
      expected: undefined,
    },
    {
      name: 'shadowed named import',
      source: "import { property } from 'fast-check'; { const property = other; inspect(property); }",
      expected: undefined,
    },
    {
      name: 'named import after a sibling shadow',
      source: "import { property } from 'fast-check'; { const property = other; } inspect(property);",
      expected: 'property',
    },
    {
      name: 'computed namespace member',
      source: "import * as fc from 'fast-check'; inspect(fc['property']);",
      expected: undefined,
    },
  ])('should resolve a $name', ({ source, expected }) => {
    const { root, reference } = parseReference(source);
    const original = root.toSource();

    expect(importedName(j, reference, reference.node)).toBe(expected);
    expect(root.toSource()).toBe(original);
  });
});
