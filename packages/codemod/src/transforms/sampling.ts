import type {
  ASTPath,
  AwaitExpression,
  CallExpression,
  JSCodeshift,
  Node,
  ObjectExpression,
  ObjectProperty,
} from 'jscodeshift';
import { planAwait } from './awaitCall.js';
import { inputFactoryName, isPropertyFactory } from './fastCheck.js';
import { inspectOptions, setOptionsArgument } from './options.js';

export function isPropertyInput(j: JSCodeshift, path: ASTPath<CallExpression>): boolean | undefined {
  const input = path.get('arguments', 0);
  const factory = inputFactoryName(j, input, 'const');
  if (factory !== undefined) return isPropertyFactory(factory);
  if (j.Identifier.check(input.node) && /^arb|arb$/i.test(input.node.name) && !/prop/i.test(input.node.name))
    return false;
}

export function awaitSamplingCall(
  j: JSCodeshift,
  path: ASTPath<CallExpression>,
  filename: string,
  method: string,
  report: (node: Node, message: string) => void,
): AwaitExpression | undefined {
  if (j.AwaitExpression.check(path.parent.node)) return path.parent.node;
  const awaitCall = planAwait(j, path, filename);
  if (awaitCall) return awaitCall();
  report(path.node, `Cannot await ${method}() in this synchronous context.`);
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
