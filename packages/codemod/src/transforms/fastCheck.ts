import type { ASTPath, JSCodeshift } from 'jscodeshift';

export function isFastCheckNamespace(j: JSCodeshift, path: ASTPath, node: unknown): boolean {
  if (!j.Identifier.check(node)) return false;
  const binding = path.scope.lookup(node.name)?.getBindings()[node.name]?.[0];
  const specifier = binding?.parent.node;
  const declaration = binding?.parent.parent.node;
  return (
    (j.ImportNamespaceSpecifier.check(specifier) || j.ImportDefaultSpecifier.check(specifier)) &&
    j.ImportDeclaration.check(declaration) &&
    declaration.source.value === 'fast-check' &&
    declaration.importKind !== 'type'
  );
}

export function memberName(j: JSCodeshift, path: ASTPath, member: unknown): string | undefined {
  if (
    j.MemberExpression.check(member) &&
    !member.computed &&
    j.Identifier.check(member.property) &&
    isFastCheckNamespace(j, path, member.object)
  )
    return member.property.name;
}
