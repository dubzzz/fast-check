import type {
  ASTPath,
  AwaitExpression,
  CallExpression,
  JSCodeshift,
  ObjectExpression,
  ObjectProperty,
} from 'jscodeshift';
import { planAwait } from './awaitCall.js';
import { inputFactoryName, isPropertyFactory } from './fastCheck.js';
import { inspectOptions, setOptionsArgument } from './options.js';
import type { Report } from './transformFile.js';

export function prepareSamplingCall(
  j: JSCodeshift,
  path: ASTPath<CallExpression>,
  filename: string,
  method: 'sample' | 'statistics',
  report: Report,
): { result: AwaitExpression; property: boolean | undefined } | undefined {
  const result = j.AwaitExpression.check(path.parent.node)
    ? path.parent.node
    : planAwait(j, path, filename, report, `Cannot await ${method}() in this synchronous context.`)?.();
  if (!result) return;

  const input = path.get('arguments', 0);
  const factory = inputFactoryName(j, input, 'const');
  if (factory !== undefined) return { result, property: isPropertyFactory(factory) };
  if (j.Identifier.check(input.node) && /^arb|arb$/i.test(input.node.name) && !/prop/i.test(input.node.name))
    return { result, property: false };

  report(
    path.node,
    method === 'sample'
      ? 'If the sample input is a property, set noPredicateExecution to true.'
      : 'If the input is a property, set noPredicateExecution to true and adapt the classifier to receive separate arguments.',
  );
  return { result, property: undefined };
}

export function samplingOptions(
  j: JSCodeshift,
  params: CallExpression['arguments'][number] | undefined,
): { object: ObjectExpression; logger?: ObjectProperty } | undefined {
  if (params && !j.NumericLiteral.check(params) && !j.ObjectExpression.check(params)) return;
  const object = j.ObjectExpression.check(params)
    ? params
    : j.objectExpression(params ? [j.objectProperty(j.identifier('numRuns'), params)] : []);
  const { named, hasUnsupportedProperties } = inspectOptions(j, object);
  if (
    hasUnsupportedProperties ||
    named.has('noPredicateExecution') ||
    [...named.values()].some((entries) => entries.length > 1)
  )
    return;
  return { object, logger: named.get('logger')?.[0] };
}

export function applySamplingOptions(
  j: JSCodeshift,
  call: CallExpression,
  index: number,
  options: ObjectExpression,
  property: boolean | undefined,
): void {
  if (property) options.properties.push(j.objectProperty(j.identifier('noPredicateExecution'), j.booleanLiteral(true)));
  setOptionsArgument(call, index, options);
}
