import type { API, FileInfo } from 'jscodeshift';
import {
  declarationOf,
  migratePluginCalls,
  type Expression,
  type PluginCall,
  type PluginEdit,
} from '../pluginMigration.ts';

function reporterPlugins(site: PluginCall): PluginEdit | undefined {
  const { j, options, runner, report } = site;
  const custom = ['reporter', 'asyncReporter'].filter((key) => options.has(key));
  const format = options.get('includeErrorInReport');
  if (runner === 'check' || (!custom.length && !format)) return undefined;
  const remove = format ? [...custom, 'includeErrorInReport'] : custom;
  if (custom.length > 1 || (custom.length && format) || options.has('noDefaultPlugins')) {
    report('Review the combination of reporting policies before migrating.');
    return undefined;
  }

  let plugin: Expression;
  if (format) {
    if (j.BooleanLiteral.check(format) && !format.value) return { remove, plugins: [] };
    plugin = j.callExpression(site.member('defaultReporter'), [
      j.objectExpression([j.objectProperty(j.identifier('includeErrorInReport'), format)]),
    ]);
  } else {
    const callback = options.get(custom[0]) as Expression;
    if (
      !j.Identifier.check(callback) &&
      !j.ArrowFunctionExpression.check(callback) &&
      !j.FunctionExpression.check(callback)
    ) {
      report('Review the expression that supplies the custom reporter.');
      return undefined;
    }
    const declaration = j.Identifier.check(callback) ? declarationOf(site.path, callback.name) : undefined;
    const init = j.VariableDeclarator.check(declaration?.node) ? declaration.node.init : undefined;
    const known = j.FunctionDeclaration.check(declaration?.node)
      ? declaration.node
      : j.FunctionExpression.check(init) || j.ArrowFunctionExpression.check(init)
        ? init
        : callback;
    if (
      j(known).find(j.ThisExpression).size() ||
      j(known).find(j.Super).size() ||
      j(known)
        .find(j.CallExpression)
        .some((path) =>
          ['defaultReportMessage', 'asyncDefaultReportMessage'].includes(site.importedName(path.node) ?? ''),
        )
    ) {
      report('Review the custom reporter: v5 changes its receiver and removes the default message formatters.');
      return undefined;
    }

    plugin = j.arrowFunctionExpression(
      [],
      j.objectExpression([j.objectProperty(j.identifier('onAllRunsComplete'), callback)]),
    );
    if (j.Identifier.check(callback)) {
      const definite =
        declaration?.node.type === 'FunctionDeclaration' ||
        (declaration?.parent.node.kind === 'const' &&
          (j.FunctionExpression.check(init) || j.ArrowFunctionExpression.check(init)));
      if (!definite) {
        // Capture the handler now: a mutable reference could change before the assessment completes.
        // Passing undefined selected the default reporter in v4.
        const capturedName = callback.name === 'reporterCallback' ? 'capturedReporter' : 'reporterCallback';
        const body = j.blockStatement([
          j.variableDeclaration('const', [j.variableDeclarator(j.identifier(capturedName), callback)]),
          j.returnStatement(
            j.conditionalExpression(
              j.binaryExpression('===', j.identifier(capturedName), j.unaryExpression('void', j.numericLiteral(0))),
              j.callExpression(site.member('defaultReporter'), []),
              j.arrowFunctionExpression(
                [],
                j.objectExpression([j.objectProperty(j.identifier('onAllRunsComplete'), j.identifier(capturedName))]),
              ),
            ),
          ),
        ]);
        plugin = j.callExpression(j.arrowFunctionExpression([], body), []);
      }
    }
  }
  return {
    remove,
    conflicts: ['reporter', 'asyncReporter', 'includeErrorInReport'],
    plugins: [{ value: plugin }],
    parameters: { noDefaultPlugins: j.booleanLiteral(true) },
    globalPosition: 'post',
  };
}

export default function transform(file: FileInfo, api: API): string {
  return migratePluginCalls(file, api, reporterPlugins);
}
