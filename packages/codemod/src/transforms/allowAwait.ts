import type { ASTPath, Function, JSCodeshift } from 'jscodeshift';
import { findBinding } from './fastCheck.js';

export function isTestApi(j: JSCodeshift, path: ASTPath, node: unknown, names: string[]): boolean {
  if (!j.Identifier.check(node)) return false;
  const scope = path.scope.lookup(node.name);
  if (!scope) return names.includes(node.name);
  const specifier = findBinding(j, path, node.name)?.parent;
  return (
    j.ImportSpecifier.check(specifier?.node) &&
    j.Identifier.check(specifier.node.imported) &&
    names.includes(specifier.node.imported.name) &&
    ['vitest', '@jest/globals', 'node:test'].includes(specifier.parent.node.source.value)
  );
}

function testCallee(j: JSCodeshift, path: ASTPath, node: unknown): { parameterized: boolean } | undefined {
  if (isTestApi(j, path, node, ['it', 'test'])) return { parameterized: false };
  if (j.MemberExpression.check(node) && !node.computed) return testCallee(j, path, node.object);
  const callee = j.CallExpression.check(node)
    ? node.callee
    : j.TaggedTemplateExpression.check(node)
      ? node.tag
      : undefined;
  if (
    j.MemberExpression.check(callee) &&
    !callee.computed &&
    j.Identifier.check(callee.property) &&
    ['each', 'skipIf', 'runIf'].includes(callee.property.name)
  ) {
    const test = testCallee(j, path, callee.object);
    if (test) return { parameterized: test.parameterized || callee.property.name === 'each' };
  }
}

// Plan first so a caller can validate every use of a shared property before changing callbacks.
export function awaitContext(
  j: JSCodeshift,
  path: ASTPath,
  filename: string,
): { functionToMakeAsync?: Function } | undefined {
  let child = path;
  for (let parent = path.parent; parent; child = parent, parent = parent.parent) {
    const node = parent.node;
    if (j.Function.check(node)) {
      if (child.node !== node.body) return undefined;
      if (node.async) return {};
      const test = parent.parent.node;
      const callee = j.CallExpression.check(test) ? testCallee(j, parent, test.callee) : undefined;
      if (
        !(j.ArrowFunctionExpression.check(node) || j.FunctionExpression.check(node)) ||
        !callee ||
        (!callee.parameterized && node.params.length) ||
        node.returnType ||
        node.generator ||
        !j.CallExpression.check(test) ||
        test.arguments[1] !== node
      )
        return undefined;
      return { functionToMakeAsync: node };
    }
    if (j.ClassBody.check(node) || j.TSModuleBlock.check(node)) return undefined;
    if (j.Program.check(node)) return /\.c[jt]s$/i.test(filename) ? undefined : {};
  }
}

// Make a test callback async only when the runner will observe its returned promise.
export function allowAwait(j: JSCodeshift, path: ASTPath, filename: string): boolean {
  const context = awaitContext(j, path, filename);
  if (!context) return false;
  if (context.functionToMakeAsync) context.functionToMakeAsync.async = true;
  return true;
}
