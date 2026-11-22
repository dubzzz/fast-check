import type { API, FileInfo } from 'jscodeshift';
import { reportUnsupported } from '../reportUnsupported.js';
import { memberName } from '../fastCheck.js';

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  root.find(j.CallExpression).forEach((path) => {
    const { callee, arguments: args } = path.node;
    if (memberName(j, path, callee) !== 'infiniteStream' || !j.MemberExpression.check(callee)) return;
    if (!j.Expression.check(args[0]) || args.length > 2 || path.scope.lookup('Infinity')) return;
    const options = args[1] ?? j.objectExpression([]);
    if (
      !j.ObjectExpression.check(options) ||
      options.properties.some(
        (p) => !j.ObjectProperty.check(p) || p.computed || !j.Identifier.check(p.key) || p.key.name !== 'noHistory',
      )
    ) {
      reportUnsupported(api, options, 'Review the iterator options before adding minLength.');
      return;
    }
    options.properties.unshift(j.objectProperty(j.identifier('minLength'), j.identifier('Infinity')));
    args[1] = options;
    callee.property = j.identifier('iterator');
  });
  return root.toSource({ quote: 'single' });
}
