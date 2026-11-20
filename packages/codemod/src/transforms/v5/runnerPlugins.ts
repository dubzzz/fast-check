import type { API, FileInfo } from 'jscodeshift';
import { migratePluginCalls, type Expression, type PluginCall, type PluginEdit } from '../pluginMigration.ts';

function runnerPlugins({ j, member, options, report, runner, call }: PluginCall): PluginEdit | undefined {
  // v4 wraps the property in this order, regardless of the order of keys in Parameters.
  const names = ['ignoreEqualValues', 'skipEqualValues', 'interruptAfterTimeLimit', 'unbiased', 'timeout'];
  const remove = names.filter((name) => options.has(name));
  if (options.has('skipAllAfterTimeLimit')) {
    report('skipAllAfterTimeLimit has no equivalent skipping plugin.');
    return undefined;
  }
  if (options.has('markInterruptAsFailure') && !options.has('interruptAfterTimeLimit')) {
    report('Pair markInterruptAsFailure with its interruptAfterTimeLimit before migrating.');
    return undefined;
  }
  if (!remove.length) {
    if (
      runner !== 'configureGlobal' &&
      call.arguments.length === 2 &&
      options.size === 0 &&
      !call.arguments[1].comments?.length
    )
      return { remove, plugins: [] };
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
      if (name === 'interruptAfterTimeLimit' && options.has('markInterruptAsFailure')) {
        const fail = options.get('markInterruptAsFailure') as Expression;
        if (!(j.BooleanLiteral.check(fail) && !fail.value))
          args.push(j.objectExpression([j.objectProperty(j.identifier('failOnInterrupt'), fail)]));
      }
      plugins.push({ value: j.callExpression(member(name), args), when });
    } else if (!j.BooleanLiteral.check(value) || value.value) {
      plugins.push({
        value: j.callExpression(member(name), []),
        when: j.BooleanLiteral.check(value) ? undefined : j.binaryExpression('===', value, j.booleanLiteral(true)),
      });
    }
  }
  if (options.has('markInterruptAsFailure')) remove.push('markInterruptAsFailure');
  return { remove, plugins, conflicts: remove.includes('interruptAfterTimeLimit') ? ['markInterruptAsFailure'] : [] };
}

export default function transform(file: FileInfo, api: API): string {
  return migratePluginCalls(file, api, runnerPlugins);
}
