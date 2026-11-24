import type { ASTPath, Collection, Identifier, JSCodeshift, VariableDeclarator } from 'jscodeshift';

export function isVariable(j: JSCodeshift, path: ASTPath<Identifier>): boolean {
  const parent = path.parent.node;
  if (
    j.ImportSpecifier.check(parent) ||
    j.ImportDefaultSpecifier.check(parent) ||
    j.ImportNamespaceSpecifier.check(parent)
  )
    return path.name === 'local';
  if (j.ExportSpecifier.check(parent)) return path.name === 'local' && !path.parent.parent.node.source;
  if ((path.name === 'key' || path.name === 'property') && !parent.computed) return false;
  if (j.TSQualifiedName.check(parent) && path.name === 'right') return false;
  if (path.name === 'label') return false;
  return true;
}

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
    const regions = Map.groupBy(bindings, (binding) => bindingRegion(j, binding, scope.path));
    // Inner lexical declarations shadow outer ones even when ast-types groups them into one scope.
    for (const region of enclosing) {
      const visible = regions.get(region);
      if (visible) return visible.length === 1 ? visible[0] : undefined;
    }
  }
}

export function referencesOf(j: JSCodeshift, binding: ASTPath<Identifier>): ASTPath<Identifier>[] {
  const { name } = binding.node;
  return j(binding.scope.path)
    .find(j.Identifier, { name })
    .filter(
      (ref) => ref.node !== binding.node && isVariable(j, ref) && findBinding(j, ref, name)?.node === binding.node,
    )
    .paths();
}

export function isConstDeclarator(j: JSCodeshift, path: ASTPath | undefined): path is ASTPath<VariableDeclarator> {
  return (
    j.VariableDeclarator.check(path?.node) &&
    j.VariableDeclaration.check(path.parent.node) &&
    path.parent.node.kind === 'const'
  );
}

export function localConstBinding(j: JSCodeshift, initializer: ASTPath): ASTPath<Identifier> | undefined {
  const declaration = initializer.parent;
  if (
    isConstDeclarator(j, declaration) &&
    declaration.node.init === initializer.node &&
    j.Identifier.check(declaration.node.id) &&
    !j.ExportNamedDeclaration.check(declaration.parent.parent.node)
  )
    return declaration.get('id');
}

export function identifierNames(j: JSCodeshift, root: Collection): Set<string> {
  return new Set(
    root
      .find(j.Identifier)
      .nodes()
      .map((node) => node.name),
  );
}

export function freshName(names: ReadonlySet<string>, base: string, suffix?: string): string {
  let name = base;
  for (let i = 2; names.has(name); ++i) name = suffix ? name + suffix : base + i;
  return name;
}
