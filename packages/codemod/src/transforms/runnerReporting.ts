import { declarationOf, type Expression, type PluginCall, type PluginEdit } from './pluginMigration.js';

export function reporting(site: PluginCall): PluginEdit | undefined {
  const { j, options, runner, report } = site;
  const custom = ['reporter', 'asyncReporter'].filter((key) => options.has(key));
  const format = options.get('includeErrorInReport');
  if (runner === 'check') {
    if (custom.length > 1) return undefined;
    const callback = options.get(custom[0]);
    if (custom.length && !j.ArrowFunctionExpression.check(callback) && !j.FunctionExpression.check(callback))
      return undefined;
    return { remove: [...custom, ...(format ? ['includeErrorInReport'] : [])], plugins: [] };
  }
  if (!custom.length) {
    if (j.BooleanLiteral.check(format) && !format.value) return { remove: ['includeErrorInReport'], plugins: [] };
    // v4 handles includeErrorInReport itself. Its configurable defaultReporter factory is a v5 API.
    return { remove: [], plugins: [] };
  }
  if (
    custom.length > 1 ||
    format ||
    options.has('noDefaultPlugins') ||
    (runner === 'configureGlobal' && site.hasCheck)
  ) {
    report('Review the reporting policy and its consumers before installing a completion hook.');
    return undefined;
  }
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
    : declaration?.parent.node.kind === 'const' &&
        (j.FunctionExpression.check(init) || j.ArrowFunctionExpression.check(init))
      ? init
      : callback;
  if (j.Identifier.check(known)) {
    report('Review the reporter reference: it may change or resolve to undefined.');
    return undefined;
  }
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

  // An interrupt plugin that throws would bypass the reporter's decision to accept a failure.
  // Present the legacy failed result to the callback without mutating details seen by other plugins.
  let handler = callback;
  const mark = options.get('markInterruptAsFailure');
  if (mark && !(j.BooleanLiteral.check(mark) && !mark.value)) {
    if (
      !j.BooleanLiteral.check(mark) ||
      (!j.FunctionExpression.check(callback) && !j.ArrowFunctionExpression.check(callback))
    )
      return undefined;
    const [details] = callback.params;
    if (!j.Identifier.check(details) || callback.params.length !== 1) return undefined;
    const id = j.identifier(details.name);
    const field = (name: string) => j.memberExpression(id, j.identifier(name));
    const body = j.BlockStatement.check(callback.body) ? callback.body.body : [j.returnStatement(callback.body)];
    const asFailure = j.objectExpression([
      j.spreadElement(id),
      j.objectProperty(j.identifier('failed'), j.booleanLiteral(true)),
      j.objectProperty(j.identifier('interrupted'), j.booleanLiteral(true)),
    ]);
    // Copy the callback: another global/local setting may still veto this edit.
    const guard = j.ifStatement(
      j.logicalExpression('&&', field('interrupted'), j.unaryExpression('!', field('failed'))),
      j.blockStatement([j.expressionStatement(j.assignmentExpression('=', id, asFailure))]),
    );
    handler = { ...callback, body: j.blockStatement([guard, ...body]), expression: false };
  }
  const factory = j.arrowFunctionExpression(
    [],
    j.objectExpression([j.objectProperty(j.identifier('onAllRunsComplete'), handler)]),
  );
  if (runner === 'configureGlobal' && site.typescript) {
    // installGlobalPlugin accepts a union of factory types, so its hook needs a contextual type.
    factory.returnType = j.tsTypeAnnotation(
      j.tsImportType(
        j.stringLiteral('fast-check'),
        j.identifier('PluginInstance'),
        j.tsTypeParameterInstantiation([j.tsUnknownKeyword()]),
      ),
    );
  }
  return {
    remove: custom,
    conflicts: ['reporter', 'asyncReporter', 'includeErrorInReport', 'markInterruptAsFailure'],
    plugins: [{ value: factory }],
    parameters: { noDefaultPlugins: j.booleanLiteral(true) },
  };
}
