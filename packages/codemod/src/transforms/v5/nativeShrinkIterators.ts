import type { API, FileInfo } from 'jscodeshift';
import { isFastCheckNamespace, memberName } from '../fastCheck.js';

const streamOnly = ['getNthOrLast', 'has', 'join', 'dropWhile', 'takeWhile'];

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  root.find(j.ClassMethod, { key: { name: 'shrink' } }).forEach((method) => {
    const owner = method.parent.parent.node;
    if (
      !(j.ClassDeclaration.check(owner) || j.ClassExpression.check(owner)) ||
      memberName(j, method, owner.superClass) !== 'Arbitrary' ||
      method.node.static ||
      method.node.computed
    )
      return;
    const body = j(method.get('body'));
    const unsupported = body
      .find(j.MemberExpression)
      .nodes()
      .find((m) => !m.computed && j.Identifier.check(m.property) && streamOnly.includes(m.property.name));
    if (unsupported && j.Identifier.check(unsupported.property)) {
      api.report(
        'Review shrink at line ' +
          method.node.loc?.start.line +
          ': ' +
          unsupported.property.name +
          ' has no direct iterator equivalent.',
      );
      return;
    }
    if (method.scope.lookup('Iterator') || method.scope.lookupType('IteratorObject')) return;

    body.find(j.CallExpression).forEach((path) => {
      const { callee, arguments: args } = path.node;
      if (!j.MemberExpression.check(callee) || callee.computed || !j.Identifier.check(callee.property)) return;
      if (memberName(j, path, callee) === 'stream') {
        if (args.length !== 1 || !j.Expression.check(args[0])) return;
      } else if (memberName(j, path, callee.object) === 'Stream') {
        if (callee.property.name !== 'of' && !(callee.property.name === 'nil' && args.length === 0)) return;
        path.node.arguments = [j.arrayExpression(args)];
      } else return;
      path.node.callee = j.memberExpression(j.identifier('Iterator'), j.identifier('from'));
    });
    const annotation = method.node.returnType;
    if (!j.TSTypeAnnotation.check(annotation) || !j.TSTypeReference.check(annotation.typeAnnotation)) return;
    const type = annotation.typeAnnotation.typeName;
    if (
      j.TSQualifiedName.check(type) &&
      j.Identifier.check(type.right) &&
      type.right.name === 'Stream' &&
      isFastCheckNamespace(j, method, type.left)
    )
      annotation.typeAnnotation.typeName = j.identifier('IteratorObject');
  });
  return root.toSource({ quote: 'single' });
}
