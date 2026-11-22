import type { API, ASTPath, FileInfo, JSCodeshift } from 'jscodeshift';
import { reportUnsupported } from '../reportUnsupported.js';
import { allowAwait, isTestApi, memberName } from '../fastCheck.js';

// Follow one local binding, in the scope where its initializer was written.
function definition(j: JSCodeshift, path: ASTPath): ASTPath {
  if (!j.Identifier.check(path.node)) return path;
  const bindings = path.scope.lookup(path.node.name)?.getBindings()[path.node.name];
  if (bindings?.length !== 1) return path;
  const binding = bindings[0];
  const decl = binding.parent;
  if (j.FunctionDeclaration.check(decl.node) && decl.node.id === binding.node) return decl;
  if (j.VariableDeclarator.check(decl.node) && decl.node.id === binding.node && decl.parent.node.kind === 'const')
    return decl.get('init');
  return path;
}

function isBooleanTest(j: JSCodeshift, path: ASTPath, node: unknown): boolean {
  return (
    j.MemberExpression.check(node) &&
    !node.computed &&
    j.Identifier.check(node.object) &&
    node.object.name === 'Number' &&
    !path.scope.lookup('Number') &&
    j.Identifier.check(node.property) &&
    ['isInteger', 'isFinite', 'isNaN', 'isSafeInteger'].includes(node.property.name)
  );
}

function isSyncProperty(j: JSCodeshift, argument: ASTPath): boolean {
  const property = definition(j, argument);
  const call = property.node;
  if (!j.CallExpression.check(call) || memberName(j, property, call.callee) !== 'property' || call.arguments.length < 2)
    return false;
  const predicate = definition(j, property.get('arguments', call.arguments.length - 1));
  const fn = predicate.node;
  if (!j.Function.check(fn)) return isBooleanTest(j, predicate, fn);
  if (fn.async || fn.generator) return false;
  if (j.TSTypeAnnotation.check(fn.returnType))
    return (
      j.TSBooleanKeyword.check(fn.returnType.typeAnnotation) || j.TSVoidKeyword.check(fn.returnType.typeAnnotation)
    );

  let result: unknown = fn.body;
  if (j.BlockStatement.check(result)) {
    if (!j(result).find(j.ReturnStatement).size()) return true;
    const last = result.body.at(-1);
    if (!j.ReturnStatement.check(last)) return false;
    if (!last.argument) return true;
    result = last.argument;
  }
  return (
    j.BooleanLiteral.check(result) ||
    j.BinaryExpression.check(result) ||
    j.UnaryExpression.check(result) ||
    (j.CallExpression.check(result) && isBooleanTest(j, predicate, result.callee))
  );
}

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  let changed = false;

  root.find(j.CallExpression).forEach((path) => {
    const { callee } = path.node;
    if (memberName(j, path, callee) !== 'assert') return;
    const argument = path.get('arguments', 0);
    if (!isSyncProperty(j, argument)) {
      const property = definition(j, argument);
      if (j.CallExpression.check(property.node) && memberName(j, property, property.node.callee) === 'property') {
        const predicate = definition(j, property.get('arguments', property.node.arguments.length - 1));
        if (j.Identifier.check(predicate.node))
          reportUnsupported(
            api,
            predicate.node,
            'Check whether this predicate is synchronous before awaiting assert().',
          );
      }
      return;
    }
    if (j.ExpressionStatement.check(path.parent.node)) {
      if (allowAwait(j, path, file.path)) {
        path.replace(j.awaitExpression(path.node));
        changed = true;
      } else reportUnsupported(api, path.node, 'Cannot await assert() inside this synchronous function.');
      return;
    }
    // expect(() => fc.assert(property)).toThrow(error)
    const thunk = path.parent;
    if (!j.ArrowFunctionExpression.check(thunk.node) || thunk.node.body !== path.node || thunk.node.params.length)
      return;
    const expect = thunk.parent;
    if (
      !j.CallExpression.check(expect.node) ||
      expect.node.arguments.length !== 1 ||
      !isTestApi(j, expect, expect.node.callee, ['expect'])
    )
      return;
    const matcher = expect.parent;
    if (
      !j.MemberExpression.check(matcher.node) ||
      matcher.node.computed ||
      !j.Identifier.check(matcher.node.property) ||
      !['toThrow', 'toThrowError'].includes(matcher.node.property.name)
    )
      return;
    const assertion = matcher.parent;
    if (!j.CallExpression.check(assertion.node) || assertion.node.callee !== matcher.node) return;
    const wrapping = assertion.parent.node;
    const observed =
      j.AwaitExpression.check(wrapping) ||
      j.ReturnStatement.check(wrapping) ||
      (j.ArrowFunctionExpression.check(wrapping) && wrapping.body === assertion.node);
    if (!observed && (!j.ExpressionStatement.check(wrapping) || !allowAwait(j, assertion, file.path))) return;
    expect.node.arguments = [path.node];
    matcher.node.object = j.memberExpression(expect.node, j.identifier('rejects'));
    if (!observed) assertion.replace(j.awaitExpression(assertion.node));
    changed = true;
  });
  return changed ? root.toSource({ quote: 'single' }) : file.source;
}
