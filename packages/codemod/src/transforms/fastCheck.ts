import type { ASTPath, Identifier, JSCodeshift, MemberExpression } from 'jscodeshift';
import { isNamedMember } from './ast.js';
import { findBinding, isConstDeclarator } from './bindings.js';
import { resolveImport } from './imports.js';

export function isFastCheckNamespace(j: JSCodeshift, path: ASTPath, node: unknown): node is Identifier {
  const binding = resolveImport(j, path, node);
  return binding?.source === 'fast-check' && !binding.typeOnly && binding.namedExport === undefined;
}

export function isFastCheckMember(
  j: JSCodeshift,
  path: ASTPath,
  node: unknown,
  name?: string,
): node is MemberExpression & { object: Identifier; property: Identifier } {
  return (
    isNamedMember(j, node) &&
    (name === undefined || node.property.name === name) &&
    isFastCheckNamespace(j, path, node.object)
  );
}

export function importedName(j: JSCodeshift, path: ASTPath, node: unknown): string | undefined {
  if (isFastCheckMember(j, path, node)) return node.property.name;
  const binding = resolveImport(j, path, node);
  if (binding?.source === 'fast-check' && !binding.typeOnly) return binding.namedExport;
}

export function isPropertyFactory(name: string | undefined): boolean {
  return name === 'property' || name === 'asyncProperty';
}

export function inputFactoryName(j: JSCodeshift, input: ASTPath, declarations: 'const' | 'any'): string | undefined {
  const declaration = j.Identifier.check(input.node) ? findBinding(j, input, input.node.name)?.parent : undefined;
  const definition =
    isConstDeclarator(j, declaration) || (declarations === 'any' && j.VariableDeclarator.check(declaration?.node))
      ? declaration.get('init')
      : input;
  if (j.CallExpression.check(definition.node)) return importedName(j, definition, definition.node.callee);
}
