import type { ASTPath, AwaitExpression, CallExpression, JSCodeshift } from 'jscodeshift';
import { isFunctionExpression, isNamedMember } from './ast.js';
import { resolveImport } from './imports.js';

function isTestApi(j: JSCodeshift, path: ASTPath, node: unknown, names: string[]): boolean {
  if (!j.Identifier.check(node)) return false;
  const scope = path.scope.lookup(node.name);
  if (!scope) return names.includes(node.name);
  const binding = resolveImport(j, path, node);
  return (
    binding?.namedExport !== undefined &&
    !binding.typeOnly &&
    names.includes(binding.namedExport) &&
    ['vitest', '@jest/globals', 'node:test'].includes(binding.source)
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
  if (isNamedMember(j, callee) && ['each', 'skipIf', 'runIf'].includes(callee.property.name)) {
    const test = testCallee(j, path, callee.object);
    if (test) return { parameterized: test.parameterized || callee.property.name === 'each' };
  }
}

// Applying the plan builds the await expression and makes the enclosing test callback async if needed.
export function planAwait(
  j: JSCodeshift,
  path: ASTPath<CallExpression>,
  filename: string,
): (() => AwaitExpression) | undefined {
  const call = path.node;
  const awaited = () => j.awaitExpression(call);

  let child: ASTPath = path;
  for (let parent = path.parent; parent; child = parent, parent = parent.parent) {
    const node = parent.node;
    if (j.Function.check(node)) {
      if (child.node !== node.body) return undefined;
      if (node.async) return awaited;
      const test = parent.parent.node;
      const callee = j.CallExpression.check(test) ? testCallee(j, parent, test.callee) : undefined;
      if (
        !isFunctionExpression(j, node) ||
        !callee ||
        (!callee.parameterized && node.params.length) ||
        node.returnType ||
        node.generator ||
        !j.CallExpression.check(test) ||
        test.arguments[1] !== node
      )
        return undefined;
      return () => {
        node.async = true;
        return awaited();
      };
    }
    if (j.ClassBody.check(node) || j.TSModuleBlock.check(node)) return undefined;
    if (j.Program.check(node)) return /\.c[jt]s$/i.test(filename) ? undefined : awaited;
  }
}
