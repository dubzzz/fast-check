import type { API, ASTPath, CallExpression, FileInfo } from 'jscodeshift';
import { reportUnsupported } from '../reportUnsupported.js';

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  const expression = j.template.expression;
  function isFastCheckRandom(path: ASTPath<CallExpression>, name: string): boolean {
    const bindings = path.scope.lookup(name)?.getBindings()[name];
    if (bindings?.length !== 1) return false;
    const binding = bindings[0];
    const annotation = binding.node.typeAnnotation?.typeAnnotation;
    if (!j.TSTypeReference.check(annotation)) return false;
    const type = annotation.typeName;
    const qualified = j.TSQualifiedName.check(type);
    if (qualified && (!j.Identifier.check(type.right) || type.right.name !== 'Random')) return false;
    const imported = qualified ? type.left : type;
    if (!j.Identifier.check(imported) || binding.scope.lookupType(imported.name)) return false;
    const specifierPath = binding.scope.lookup(imported.name)?.getBindings()[imported.name]?.[0]?.parent;
    const declaration = specifierPath?.parent.node;
    if (!j.ImportDeclaration.check(declaration) || declaration.source.value !== 'fast-check') return false;
    const specifier = specifierPath.node;
    return qualified
      ? j.ImportNamespaceSpecifier.check(specifier) || j.ImportDefaultSpecifier.check(specifier)
      : j.ImportSpecifier.check(specifier) && specifier.imported.name === 'Random';
  }

  let changed = false;

  // Rewrite inner draws before replacing the expression that contains them.
  const calls = root.find(j.CallExpression).paths().reverse();
  calls.forEach((path) => {
    const { callee, arguments: args } = path.node;
    if (!j.MemberExpression.check(callee) || callee.computed || !j.Identifier.check(callee.property)) return;
    const rng = callee.object;
    if (!j.Identifier.check(rng) || !isFastCheckRandom(path, rng.name)) return;

    const method = callee.property.name;
    if (!['nextBoolean', 'nextInt', 'next', 'nextDouble'].includes(method)) return;
    // Bounded nextInt calls remain supported, including optional calls.
    if (method === 'nextInt' && args.length === 2 && args.every((arg) => j.Expression.check(arg))) return;
    if (path.node.type !== 'CallExpression' || callee.type !== 'MemberExpression') {
      reportUnsupported(
        api,
        path.node,
        `Cannot migrate optional Random.${method}() calls; preserve short-circuiting manually.`,
      );
      return;
    }
    if (method === 'next' ? args.length !== 1 || !j.Expression.check(args[0]) : args.length !== 0) {
      reportUnsupported(api, path.node, `Cannot migrate Random.${method}() with these arguments.`);
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

  return changed ? root.toSource({ quote: 'single' }) : file.source;
}
