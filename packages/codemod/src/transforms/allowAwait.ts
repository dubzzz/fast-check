import type { ASTPath, JSCodeshift } from 'jscodeshift';

function isTestApi(j: JSCodeshift, path: ASTPath, node: unknown, names: string[]): boolean {
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
