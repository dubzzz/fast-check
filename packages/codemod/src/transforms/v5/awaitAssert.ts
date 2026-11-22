import type { API, ASTPath, FileInfo, JSCodeshift } from 'jscodeshift';
import { reportUnsupported } from '../reportUnsupported.js';
import { memberName } from '../fastCheck.js';

function namedImport(j: JSCodeshift, path: ASTPath, node: unknown, modules: string[]): string | undefined {
  if (!j.Identifier.check(node)) return;
  const bindings = path.scope.lookup(node.name)?.getBindings()[node.name];
  if (bindings?.length !== 1) return;
  const specifier = bindings[0].parent;
  const declaration = specifier.parent.node;
  if (
    j.ImportSpecifier.check(specifier.node) &&
    j.ImportDeclaration.check(declaration) &&
    modules.includes(String(declaration.source.value)) &&
    declaration.importKind !== 'type' &&
    !('importKind' in specifier.node && specifier.node.importKind === 'type')
  )
    return specifier.node.imported.name;
}

function isTestCallback(j: JSCodeshift, fn: ASTPath): boolean {
  const call = fn.parent.node;
  if (!j.CallExpression.check(call) || call.arguments[1] !== fn.node) return false;
  let callee = call.callee;
  // it.each(rows)(name, callback) and test.skipIf(condition)(name, callback)
  const curried = j.CallExpression.check(callee) ? callee.callee : undefined;
  if (curried) callee = curried;
  const fnNode = fn.node;
  if (!j.Function.check(fnNode)) return false;
  if (fnNode.params.length) {
    // A plain positional argument can be a completion callback (done).
    const each =
      j.MemberExpression.check(curried) &&
      !curried.computed &&
      j.Identifier.check(curried.property) &&
      curried.property.name === 'each';
    if (fnNode.params.length !== 1 || !(each || j.ObjectPattern.check(fnNode.params[0]))) return false;
  }
  while (j.MemberExpression.check(callee) && !callee.computed) callee = callee.object;
  if (!j.Identifier.check(callee)) return false;
  const name = fn.parent.scope.lookup(callee.name)
    ? namedImport(j, fn.parent, callee, ['vitest', '@jest/globals', 'node:test', 'mocha', 'bun:test'])
    : callee.name;
  return name === 'it' || name === 'test';
}

function allowAwait(j: JSCodeshift, path: ASTPath, filename: string): boolean {
  let child = path;
  for (let parent = child.parent; parent; child = parent, parent = parent.parent) {
    const node = parent.node;
    if (j.Function.check(node)) {
      if (child.node !== node.body) return false;
      if (node.async) return true;
      if (
        !(j.ArrowFunctionExpression.check(node) || j.FunctionExpression.check(node)) ||
        node.generator ||
        node.returnType ||
        !isTestCallback(j, parent)
      )
        return false;
      node.async = true;
      return true;
    }
    if (j.ClassBody.check(node) || j.TSModuleBlock.check(node)) return false;
    if (j.Program.check(node)) return !/\.c[jt]s$/.test(filename);
  }
  return false;
}

function endOfPromiseChain(j: JSCodeshift, path: ASTPath): ASTPath {
  let end = path;
  while (j.MemberExpression.check(end.parent.node)) {
    const member = end.parent;
    const call = member.parent;
    if (
      member.node.object !== end.node ||
      member.node.computed ||
      !j.Identifier.check(member.node.property) ||
      !['then', 'catch', 'finally'].includes(member.node.property.name) ||
      !j.CallExpression.check(call.node) ||
      call.node.callee !== member.node
    )
      break;
    end = call;
  }
  return end;
}

export function awaitAssertions(file: FileInfo, api: API, useAsyncProperty: boolean): string {
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  let changed = false;
  root.find(j.CallExpression).forEach((path) => {
    const {
      callee,
      arguments: [property],
    } = path.node;
    if ((memberName(j, path, callee) ?? namedImport(j, path, callee, ['fast-check'])) !== 'assert') return;
    const end = endOfPromiseChain(j, path);
    const awaited = j.AwaitExpression.check(end.parent.node);
    if (useAsyncProperty) {
      if (!j.CallExpression.check(property) || !j.MemberExpression.check(property.callee))
        return reportUnsupported(api, path.node, 'Cannot determine whether the asserted property is asynchronous.');
      const name = memberName(j, path, property.callee);
      if (name !== 'property' && name !== 'asyncProperty') return;
      if (!awaited && !allowAwait(j, path, file.path))
        return reportUnsupported(api, path.node, 'Cannot await assert() in this synchronous context.');
      if (name === 'property' && j.Identifier.check(property.callee.property)) {
        property.callee.property.name = 'asyncProperty';
        changed = true;
      }
    } else if (!awaited && !allowAwait(j, path, file.path))
      return reportUnsupported(api, path.node, 'Cannot await assert() in this synchronous context.');
    if (!awaited && j.CallExpression.check(end.node)) {
      end.replace(j.awaitExpression(end.node));
      changed = true;
    }
  });
  return changed ? root.toSource({ quote: 'single' }) : file.source;
}

export default function transform(file: FileInfo, api: API): string {
  return awaitAssertions(file, api, false);
}
