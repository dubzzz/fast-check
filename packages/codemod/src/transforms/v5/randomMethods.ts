import type { API, ASTPath, CallExpression, FileInfo } from 'jscodeshift';

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
    if (
      path.node.type !== 'CallExpression' ||
      callee.type !== 'MemberExpression' ||
      callee.computed ||
      !j.Identifier.check(callee.property)
    )
      return;
    const rng = callee.object;
    if (!j.Identifier.check(rng) || !isFastCheckRandom(path, rng.name)) return;

    switch (callee.property.name) {
      case 'nextBoolean':
        if (args.length !== 0) return;
        path.replace(expression`${rng}.nextInt(0, 1) === 1`);
        break;
      case 'nextInt':
        if (args.length !== 0) return;
        path.replace(expression`${rng}.nextInt(-2147483648, 2147483647)`);
        break;
      case 'next':
        if (args.length !== 1 || !j.Expression.check(args[0])) return;
        path.replace(expression`${rng}.nextInt(0, (1 << ${args[0]}) - 1)`);
        break;
      case 'nextDouble':
        if (args.length !== 0) return;
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
