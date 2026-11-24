import type { API, ASTPath, CallExpression, FileInfo } from 'jscodeshift';
import { callsInsideOut, isNamedMember } from '../ast.js';
import { findBinding } from '../bindings.js';
import { resolveImport } from '../imports.js';
import { parseFile } from '../transformFile.js';

export default function transform(file: FileInfo, api: API): string {
  const { j, root, report, print } = parseFile(file, api);
  const expression = j.template.expression;
  function isFastCheckRandom(path: ASTPath<CallExpression>, name: string): boolean {
    const binding = findBinding(j, path, name);
    if (!binding) {
      return false;
    }
    const annotation = binding.node.typeAnnotation;
    if (!j.TSTypeAnnotation.check(annotation) || !j.TSTypeReference.check(annotation.typeAnnotation)) {
      return false;
    }
    const type = annotation.typeAnnotation.typeName;
    const qualified = j.TSQualifiedName.check(type);
    if (qualified && (!j.Identifier.check(type.right) || type.right.name !== 'Random')) {
      return false;
    }
    const imported = qualified ? type.left : type;
    if (!j.Identifier.check(imported) || binding.scope.lookupType(imported.name)) {
      return false;
    }
    const origin = resolveImport(j, binding, imported);
    return origin?.source === 'fast-check' && origin.namedExport === (qualified ? undefined : 'Random');
  }

  let changed = false;

  callsInsideOut(j, root).forEach((path) => {
    const { callee, arguments: args } = path.node;
    if (!isNamedMember(j, callee)) {
      return;
    }
    const rng = callee.object;
    if (!j.Identifier.check(rng) || !isFastCheckRandom(path, rng.name)) {
      return;
    }

    const method = callee.property.name;
    if (!['nextBoolean', 'nextInt', 'next', 'nextDouble'].includes(method)) {
      return;
    }
    // Bounded nextInt calls remain supported, including optional calls.
    if (method === 'nextInt' && args.length === 2 && args.every((arg) => j.Expression.check(arg))) {
      return;
    }
    if (path.node.type !== 'CallExpression' || callee.type !== 'MemberExpression') {
      report(path.node, `Cannot migrate optional Random.${method}() calls; preserve short-circuiting manually.`);
      return;
    }
    if (method === 'next' ? args.length !== 1 || !j.Expression.check(args[0]) : args.length !== 0) {
      report(path.node, `Cannot migrate Random.${method}() with these arguments.`);
      return;
    }

    switch (method) {
      case 'nextBoolean':
        path.replace(expression`${rng}.nextInt(0, 1) === 1`);
        break;
      case 'nextInt':
        path.replace(expression`${rng}.nextInt(-2147483648, 2147483647)`);
        break;
      case 'next':
        path.replace(expression`${rng}.nextInt(0, (1 << ${args[0]}) - 1)`);
        break;
      case 'nextDouble':
        // Draw the high 26 bits first and the low 27 bits second, just like Random.nextDouble.
        path.replace(expression`(${rng}.nextInt(0, 2 ** 26 - 1) * 2 ** 27 + ${rng}.nextInt(0, 2 ** 27 - 1)) / 2 ** 53`);
        break;
      default:
        return;
    }
    changed = true;
  });

  return print(changed);
}
