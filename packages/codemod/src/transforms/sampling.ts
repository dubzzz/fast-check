import type { ASTPath, CallExpression, JSCodeshift, ObjectExpression } from 'jscodeshift';
import { memberName } from './fastCheck.js';

const arbitraries = [
  'integer',
  'nat',
  'string',
  'boolean',
  'double',
  'constant',
  'constantFrom',
  'tuple',
  'array',
  'record',
  'oneof',
];

export function samplingInput(
  j: JSCodeshift,
  path: ASTPath<CallExpression>,
): { input: CallExpression; factory: string | undefined; property: boolean } | undefined {
  let input = path.node.arguments[0];
  let inputScope = path;
  if (j.Identifier.check(input)) {
    const binding = path.scope.lookup(input.name)?.getBindings()[input.name]?.[0]?.parent;
    if (
      !j.VariableDeclarator.check(binding?.node) ||
      binding.parent.node.kind !== 'const' ||
      !j.CallExpression.check(binding.node.init)
    )
      return;
    input = binding.node.init;
    inputScope = binding;
  }
  if (!j.CallExpression.check(input)) return;
  const factory = memberName(j, inputScope, input.callee);
  const property = factory === 'property' || factory === 'asyncProperty';
  if (!property && !arbitraries.includes(factory ?? '')) return;
  return { input, factory, property };
}

export function samplingOptions(
  j: JSCodeshift,
  params: CallExpression['arguments'][number] | undefined,
): { opts: ObjectExpression; keys: (string | undefined)[] } | undefined {
  if (params && !j.NumericLiteral.check(params) && !j.ObjectExpression.check(params)) return;
  const opts = j.ObjectExpression.check(params)
    ? params
    : j.objectExpression(params ? [j.objectProperty(j.identifier('numRuns'), params)] : []);
  const keys = opts.properties.map((p) =>
    j.ObjectProperty.check(p) && !p.computed && j.Identifier.check(p.key) ? p.key.name : undefined,
  );
  if (keys.includes(undefined) || new Set(keys).size !== keys.length || keys.includes('noPredicateExecution')) return;
  return { opts, keys };
}
