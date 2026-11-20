import type { API, FileInfo } from 'jscodeshift';
import { migratePluginCalls, type Expression, type PluginCall, type PluginEdit } from '../pluginMigration.js';

function runnerPlugins({ j, member, options, report, runner, call }: PluginCall): PluginEdit | undefined {
  // v4 wraps the property in this order, regardless of the order of keys in Parameters.
  const names = ['ignoreEqualValues', 'skipEqualValues', 'interruptAfterTimeLimit', 'unbiased', 'timeout'];
  const remove = names.filter((name) => options.has(name));
  if (options.has('skipAllAfterTimeLimit')) {
    report('skipAllAfterTimeLimit has no equivalent skipping plugin.');
    return undefined;
  }
  const markFailure = options.get('markInterruptAsFailure');
  if (markFailure) {
    const disabled = j.BooleanLiteral.check(markFailure) && !markFailure.value;
    const usesRunDetails = runner !== 'assert' || options.has('reporter') || options.has('asyncReporter');
    if (!options.has('interruptAfterTimeLimit') || (!disabled && usesRunDetails)) {
      // In v4 the plugin can throw before check returns or a custom reporter receives the failed RunDetails.
      report('Review the interruption policy together with its v4 RunDetails consumers.');
      return undefined;
    }
  }
  if (!remove.length) {
    if (
      runner !== 'configureGlobal' &&
      call.arguments.length === 2 &&
      options.size === 0 &&
      !call.arguments[1].comments?.length
    )
      return { remove, plugins: [], shareLocalOptions: true };
    return undefined;
  }

  const plugins: PluginEdit['plugins'] = [];
  for (const name of remove) {
    const value = options.get(name) as Expression;
    if (name === 'timeout' || name === 'interruptAfterTimeLimit') {
      const maximum = 0x7fffffff;
      let delay = value;
      let when: Expression | undefined;
      if (j.NumericLiteral.check(value)) {
        if (value.value > maximum) delay = j.numericLiteral(maximum);
      } else if (j.Identifier.check(value)) {
        when = j.binaryExpression('!==', value, j.unaryExpression('void', j.numericLiteral(0)));
        delay = j.conditionalExpression(
          j.binaryExpression('>', value, j.numericLiteral(maximum)),
          j.numericLiteral(maximum),
          value,
        );
      } else {
        report('Review the time limit expression before moving it into a plugin.');
        return undefined;
      }
      const args = [delay];
      if (
        name === 'interruptAfterTimeLimit' &&
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
  if (markFailure) remove.push('markInterruptAsFailure');
  return {
    remove,
    plugins,
    shareLocalOptions: !markFailure,
    conflicts: remove.includes('interruptAfterTimeLimit') ? ['markInterruptAsFailure'] : [],
  };
}

export default function transform(file: FileInfo, api: API): string {
  return migratePluginCalls(file, api, runnerPlugins);
}
