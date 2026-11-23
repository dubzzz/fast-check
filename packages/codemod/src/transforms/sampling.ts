import type { ASTPath, CallExpression, JSCodeshift, ObjectExpression } from 'jscodeshift';
import { findBinding, importedName } from './fastCheck.js';

export function isPropertyInput(j: JSCodeshift, path: ASTPath<CallExpression>): boolean | undefined {
  const input = path.get('arguments', 0);
  let definition = input;
  if (j.Identifier.check(input.node)) {
    const binding = findBinding(j, input, input.node.name)?.parent;
    if (j.VariableDeclarator.check(binding?.node) && binding.parent.node.kind === 'const')
      definition = binding.get('init');
  }
  if (j.CallExpression.check(definition.node)) {
    const factory = importedName(j, definition, definition.node.callee);
    if (factory !== undefined) return factory === 'property' || factory === 'asyncProperty';
  }
  if (j.Identifier.check(input.node) && /^arb|arb$/i.test(input.node.name) && !/prop/i.test(input.node.name))
    return false;
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
