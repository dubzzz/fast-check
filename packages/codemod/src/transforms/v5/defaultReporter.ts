import type { API, FileInfo } from 'jscodeshift';
import { memberName } from '../fastCheck.js';

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  const calls = root.find(j.CallExpression);
  // Global reporting can be overridden per run. Review the setup and its consumers together.
  if (calls.some((path) => memberName(j, path, path.node.callee) === 'configureGlobal')) return file.source;
  let changed = false;
  calls.forEach((path) => {
    const { callee, arguments: args } = path.node;
    if (!j.MemberExpression.check(callee) || memberName(j, path, callee) !== 'assert') return;
    const options = args[1];
    if (!j.ObjectExpression.check(options) || args.length !== 2) return;
    const keys = options.properties.map((p) =>
      j.ObjectProperty.check(p) && !p.computed && j.Identifier.check(p.key) ? p.key.name : undefined,
    );
    if (
      keys.includes(undefined) ||
      new Set(keys).size !== keys.length ||
      ['reporter', 'asyncReporter', 'noDefaultPlugins', 'plugins'].some((name) => keys.includes(name))
    )
      return;
    const index = keys.indexOf('includeErrorInReport');
    const flag = options.properties[index];
    if (
      !j.ObjectProperty.check(flag) ||
      !j.BooleanLiteral.check(flag.value) ||
      flag.comments?.length ||
      flag.key.comments?.length ||
      flag.value.comments?.length
    )
      return;
    if (flag.value.value) {
      const reporter = j.template.expression`${callee.object}.defaultReporter({ includeErrorInReport: true })`;
      options.properties.splice(
        index,
        1,
        j.objectProperty(j.identifier('noDefaultPlugins'), j.booleanLiteral(true)),
        j.objectProperty(j.identifier('plugins'), j.arrayExpression([reporter])),
      );
    } else {
      options.properties.splice(index, 1);
      if (!options.properties.length && !options.comments?.length) args.pop();
    }
    changed = true;
  });
  return changed ? root.toSource({ quote: 'single' }) : file.source;
}
