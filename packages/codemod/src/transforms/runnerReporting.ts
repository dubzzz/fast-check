import { isFunctionExpression } from './ast.js';
import { callbackStatements, resolveCallback, usesReceiver } from './callbacks.js';
import type { Expression, PluginCall, PluginEdit } from './pluginMigration.js';

export function reporting(site: PluginCall): PluginEdit | undefined {
  const { j, options, runner, report } = site;
  const custom = ['reporter', 'asyncReporter'].filter((key) => options.has(key));
  if (!custom.length) {
    return { remove: [], plugins: [] };
  }
  const format = options.get('includeErrorInReport');
  // v4 bypasses the default reporter, but still evaluates the option expression.
  const remove = format && j.BooleanLiteral.check(format) ? [...custom, 'includeErrorInReport'] : custom;
  if (runner === 'check') {
    if (custom.length > 1) {
      return undefined;
    }
    const callback = options.get(custom[0]);
    if (!isFunctionExpression(j, callback)) {
      return undefined;
    }
    return { remove, plugins: [] };
  }
  if (custom.length > 1 || options.has('noDefaultPlugins') || (runner === 'configureGlobal' && site.hasCheck)) {
    report('Review the reporting policy and its consumers before installing a completion hook.');
    return undefined;
  }
  const callback = options.get(custom[0]) as Expression;
  if (!j.Identifier.check(callback) && !isFunctionExpression(j, callback)) {
    report('Review the expression that supplies the custom reporter.');
    return undefined;
  }
  const known = resolveCallback(j, site.path, callback);
  if (!known) {
    report('Review the reporter reference: it may change or resolve to undefined.');
    return undefined;
  }
  if (usesReceiver(j, known)) {
    report('Review the custom reporter: v5 changes its receiver.');
    return undefined;
  }

  // An interrupt plugin that throws would bypass the reporter's decision to accept a failure.
  // Present the legacy failed result to the callback without mutating details seen by other plugins.
  let handler = callback;
  const mark = options.get('markInterruptAsFailure');
  if (mark && !(j.BooleanLiteral.check(mark) && !mark.value)) {
    if (!j.BooleanLiteral.check(mark) || !isFunctionExpression(j, callback)) {
      return undefined;
    }
    const [details] = callback.params;
    if (!j.Identifier.check(details) || callback.params.length !== 1) {
      return undefined;
    }
    const id = j.identifier(details.name);
    const field = (name: string) => j.memberExpression(id, j.identifier(name));
    const body = callbackStatements(j, callback.body);
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
    const plugin = j.identifier('PluginInstance');
    const args = j.tsTypeParameterInstantiation([j.tsUnknownKeyword()]);
    factory.returnType = j.tsTypeAnnotation(
      site.typeNamespace
        ? j.tsTypeReference(j.tsQualifiedName(j.identifier(site.typeNamespace), plugin), args)
        : j.tsImportType(j.stringLiteral('fast-check'), plugin, args),
    );
  }
  return {
    remove,
    conflicts: ['reporter', 'asyncReporter', 'markInterruptAsFailure'],
    plugins: [{ value: factory }],
    parameters: { noDefaultPlugins: j.booleanLiteral(true) },
  };
}
