import type { CallExpression, JSCodeshift, ObjectExpression, ObjectProperty } from 'jscodeshift';
import { isNamedProperty } from './ast.js';

export function inspectOptions(
  j: JSCodeshift,
  object: ObjectExpression,
): {
  named: Map<string, ObjectProperty[]>;
  hasUnsupportedProperties: boolean;
} {
  const known = object.properties.filter((entry) => isNamedProperty(j, entry));
  const named = Map.groupBy(known, (entry) => entry.key.name);
  return { named, hasUnsupportedProperties: known.length !== object.properties.length };
}

export function setOptionsArgument(call: CallExpression, index: number, options: ObjectExpression): void {
  if (options.properties.length) call.arguments[index] = options;
  else call.arguments.splice(index, 1);
}
