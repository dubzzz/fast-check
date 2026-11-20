import type { API, FileInfo } from 'jscodeshift';
import { allowAwait, isTestApi, memberName } from '../fastCheck.js';

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  let changed = false;

  root.find(j.CallExpression).forEach((path) => {
    const { callee } = path.node;
    if (memberName(j, path, callee) === 'asyncProperty' && j.MemberExpression.check(callee)) {
      callee.property = j.identifier('property');
      changed = true;
    }
    if (memberName(j, path, callee) !== 'assert') return;
    if (j.ExpressionStatement.check(path.parent.node)) {
      if (allowAwait(j, path, file.path)) {
        path.replace(j.awaitExpression(path.node));
        changed = true;
      }
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
