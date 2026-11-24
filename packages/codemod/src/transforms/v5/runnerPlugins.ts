import type { API, FileInfo } from 'jscodeshift';
import { isResultDiscarded } from '../ast.js';
import { migratePluginCalls, type Expression, type PluginCall, type PluginEdit } from '../pluginMigration.js';
import { reporting } from '../runnerReporting.js';

function runnerPlugins(site: PluginCall): PluginEdit | undefined {
  const { j, member, options, report, runner, call } = site;
  const reportingEdit = reporting(site);
  if (!reportingEdit) {
    return undefined;
  }
  // v4 wraps the property in this order, regardless of the order of keys in Parameters.
  const names = ['ignoreEqualValues', 'skipEqualValues', 'interruptAfterTimeLimit', 'unbiased', 'timeout'];
  const remove = names.filter((name) => options.has(name));
  if (options.has('skipAllAfterTimeLimit')) {
    report('skipAllAfterTimeLimit has no equivalent skipping plugin.');
    return undefined;
  }
  const markFailure = options.get('markInterruptAsFailure');
  const customReporter = options.has('reporter') || options.has('asyncReporter');
  if (markFailure && !options.has('interruptAfterTimeLimit')) {
    report('Review the interruption policy without an explicit time limit.');
    return undefined;
  }
  const emptyLocalOptions =
    runner !== 'configureGlobal' &&
    call.arguments.length === 2 &&
    options.size === 0 &&
    !call.arguments[1].comments?.length;
  if (!remove.length && !reportingEdit.remove.length && !emptyLocalOptions) {
    return undefined;
  }

  const plugins: PluginEdit['plugins'] = [];
  for (const name of remove) {
    const value = options.get(name) as Expression;
    if (name === 'timeout' || name === 'interruptAfterTimeLimit') {
      let when: Expression | undefined;
      if (j.Identifier.check(value)) {
        when = j.binaryExpression('!==', value, j.unaryExpression('void', j.numericLiteral(0)));
      } else if (!j.NumericLiteral.check(value)) {
        report('Review the time limit expression before moving it into a plugin.');
        return undefined;
      }
      const args: Expression[] = [value];
      if (
        name === 'interruptAfterTimeLimit' &&
        runner === 'assert' &&
        !customReporter &&
        markFailure &&
        !(j.BooleanLiteral.check(markFailure) && !markFailure.value)
      ) {
        args.push(j.objectExpression([j.objectProperty(j.identifier('failOnInterrupt'), markFailure)]));
      }
      plugins.push({ value: j.callExpression(member(name), args), when });
    } else if (!j.BooleanLiteral.check(value) || value.value) {
      plugins.push({
        value: j.callExpression(member(name), []),
        when: j.BooleanLiteral.check(value) ? undefined : j.binaryExpression('===', value, j.booleanLiteral(true)),
      });
    }
  }
  // When callers read check's result, v4 must mark the interruption without throwing from a hook.
  const ignoresCheckResult = runner === 'check' && isResultDiscarded(j, site.path);
  if (
    markFailure &&
    (runner === 'assert' ||
      ignoresCheckResult ||
      (runner === 'configureGlobal' && customReporter) ||
      (j.BooleanLiteral.check(markFailure) && !markFailure.value))
  ) {
    remove.push('markInterruptAsFailure');
  }
  return {
    remove: [...remove, ...reportingEdit.remove],
    plugins: [...plugins, ...reportingEdit.plugins],
    parameters: reportingEdit.parameters,
    shareLocalOptions: !markFailure && !reportingEdit.remove.length,
    conflicts: [
      ...(reportingEdit.conflicts ?? []),
      ...(remove.includes('interruptAfterTimeLimit') ? ['markInterruptAsFailure'] : []),
    ],
  };
}

export default function transform(file: FileInfo, api: API): string {
  return migratePluginCalls(file, api, runnerPlugins);
}
