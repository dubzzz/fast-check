import type { ASTPath, JSCodeshift } from 'jscodeshift';

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

export function isFastCheckNamespace(j: JSCodeshift, path: ASTPath, node: unknown): boolean {
  if (!j.Identifier.check(node)) return false;
  const enclosing = new Set<ASTPath>();
  for (let p = path; p; p = p.parentPath) enclosing.add(p);
  for (let scope = path.scope.lookup(node.name); scope; scope = scope.parent?.lookup(node.name)) {
    const bindings: ASTPath[] = scope.getBindings()[node.name];
    const visible = bindings.filter((binding) => enclosing.has(bindingRegion(j, binding, scope.path)));
    if (!visible.length) continue;
    if (visible.length !== 1) return false;
    const specifier = visible[0].parent;
    const declaration = specifier.parent.node;
    return (
      (j.ImportNamespaceSpecifier.check(specifier.node) || j.ImportDefaultSpecifier.check(specifier.node)) &&
      j.ImportDeclaration.check(declaration) &&
      declaration.source.value === 'fast-check' &&
      declaration.importKind !== 'type'
    );
  }
  return false;
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

export function isTestApi(j: JSCodeshift, path: ASTPath, node: unknown, names: string[]): boolean {
  if (!j.Identifier.check(node)) return false;
  const scope = path.scope.lookup(node.name);
  if (!scope) return names.includes(node.name);
  const specifier = scope.getBindings()[node.name]?.[0]?.parent;
  return (
    j.ImportSpecifier.check(specifier?.node) &&
    j.Identifier.check(specifier.node.imported) &&
    names.includes(specifier.node.imported.name) &&
    ['vitest', '@jest/globals', 'node:test'].includes(specifier.parent.node.source.value)
  );
}

// Make a test callback async only when the runner will observe its returned promise.
export function allowAwait(j: JSCodeshift, path: ASTPath, filename: string): boolean {
  let child = path;
  for (let parent = path.parent; parent; child = parent, parent = parent.parent) {
    const node = parent.node;
    if (j.Function.check(node)) {
      if (child.node !== node.body) return false;
      if (node.async) return true;
      const test = parent.parent.node;
      if (
        !(j.ArrowFunctionExpression.check(node) || j.FunctionExpression.check(node)) ||
        node.params.length ||
        node.returnType ||
        node.generator ||
        !j.CallExpression.check(test) ||
        test.arguments[1] !== node ||
        !isTestApi(j, parent, test.callee, ['it', 'test'])
      )
        return false;
      node.async = true;
      return true;
    }
    if (j.ClassBody.check(node) || j.TSModuleBlock.check(node)) return false;
    if (j.Program.check(node)) return !/\.[cC][jt]s$/.test(filename);
  }
  return false;
}
