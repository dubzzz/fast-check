import type { API, FileInfo } from 'jscodeshift';
import { reportUnsupported } from '../reportUnsupported.js';
import { memberName } from '../fastCheck.js';

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  const calls = root.find(j.CallExpression);
  // Global reporting can be overridden per run. Review the setup and its consumers together.
  const hasGlobal = calls.some((path) => memberName(j, path, path.node.callee) === 'configureGlobal');
  let changed = false;
  calls.forEach((path) => {
    const { callee, arguments: args } = path.node;
    const name = memberName(j, path, callee);
    if (!j.MemberExpression.check(callee) || (name !== 'assert' && name !== 'configureGlobal')) return;
    const indexOfOptions = name === 'assert' ? 1 : 0;
    const options = args[indexOfOptions];
    if (!j.ObjectExpression.check(options) || args.length !== indexOfOptions + 1) return;
    const keys = options.properties.map((p) =>
      j.ObjectProperty.check(p) && !p.computed && j.Identifier.check(p.key) ? p.key.name : undefined,
    );
    if (!keys.includes('includeErrorInReport')) return;
    if (hasGlobal) return reportUnsupported(api, options, 'Review global reporting and per-run overrides together.');
    if (
      keys.includes(undefined) ||
      new Set(keys).size !== keys.length ||
      ['reporter', 'asyncReporter', 'noDefaultPlugins', 'plugins'].some((name) => keys.includes(name))
    )
      return reportUnsupported(api, options, 'Review existing reporters and plugins before migrating the format.');
    const index = keys.indexOf('includeErrorInReport');
    const flag = options.properties[index];
    if (
      !j.ObjectProperty.check(flag) ||
      !j.BooleanLiteral.check(flag.value) ||
      flag.comments?.length ||
      flag.key.comments?.length ||
      flag.value.comments?.length
    )
      return reportUnsupported(api, options, 'Review the format flag before configuring the default reporter.');
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
