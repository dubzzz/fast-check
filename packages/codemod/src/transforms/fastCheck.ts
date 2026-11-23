import type { ASTPath, Identifier, JSCodeshift } from 'jscodeshift';

// ast-types groups block and loop declarations into the surrounding function or program.
function bindingRegion(j: JSCodeshift, binding: ASTPath, scope: ASTPath): ASTPath {
  for (let p = binding.parent; p && p !== scope; p = p.parent) {
    if (j.VariableDeclaration.check(p.node) && p.node.kind === 'var') return scope;
    if (
      j.BlockStatement.check(p.node) ||
      j.ForStatement.check(p.node) ||
      j.ForInStatement.check(p.node) ||
      j.ForOfStatement.check(p.node)
    )
      return p;
    if (j.SwitchCase.check(p.node)) return p.parentPath; // all cases share one lexical scope
  }
  return scope;
}

export function findBinding(j: JSCodeshift, path: ASTPath, name: string): ASTPath<Identifier> | undefined {
  const enclosing = new Set<ASTPath>();
  for (let p = path; p; p = p.parentPath) enclosing.add(p);
  for (let scope = path.scope.lookup(name); scope; scope = scope.parent?.lookup(name)) {
    const bindings: ASTPath<Identifier>[] = scope.getBindings()[name];
    const regions = new Map<ASTPath, ASTPath<Identifier>[]>();
    for (const binding of bindings) {
      const region = bindingRegion(j, binding, scope.path);
      const group = regions.get(region) ?? [];
      group.push(binding);
      regions.set(region, group);
    }
    // Inner lexical declarations shadow outer ones even when ast-types groups them into one scope.
    for (const region of enclosing) {
      const visible = regions.get(region);
      if (visible) return visible.length === 1 ? visible[0] : undefined;
    }
  }
}

export function isFastCheckNamespace(j: JSCodeshift, path: ASTPath, node: unknown): boolean {
  if (!j.Identifier.check(node)) return false;
  const specifier = findBinding(j, path, node.name)?.parent;
  const declaration = specifier?.parent.node;
  return (
    (j.ImportNamespaceSpecifier.check(specifier?.node) || j.ImportDefaultSpecifier.check(specifier?.node)) &&
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

export function importedName(j: JSCodeshift, path: ASTPath, node: unknown): string | undefined {
  if (!j.Identifier.check(node)) return memberName(j, path, node);
  const specifier = findBinding(j, path, node.name)?.parent;
  const declaration = specifier?.parent.node;
  if (
    j.ImportSpecifier.check(specifier?.node) &&
    j.Identifier.check(specifier.node.imported) &&
    specifier.node.importKind !== 'type' &&
    j.ImportDeclaration.check(declaration) &&
    declaration.source.value === 'fast-check' &&
    declaration.importKind !== 'type'
  )
    return specifier.node.imported.name;
}
