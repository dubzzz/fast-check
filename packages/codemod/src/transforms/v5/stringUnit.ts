import type { API, ASTPath, CallExpression, FileInfo } from 'jscodeshift';

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  function arbitraryName(path: ASTPath<CallExpression>): string | undefined {
    const { callee } = path.node;
    const member = j.MemberExpression.check(callee) && !callee.computed ? callee : undefined;
    const receiver = member ? member.object : callee;
    if (!j.Identifier.check(receiver)) return;

    const binding = path.scope.lookup(receiver.name)?.getBindings()[receiver.name]?.[0];
    const specifier = binding?.parent.node;
    const declaration = binding?.parent.parent.node;
    if (!j.ImportDeclaration.check(declaration) || declaration.source.value !== 'fast-check') return;
    if (!member && j.ImportSpecifier.check(specifier) && j.Identifier.check(specifier.imported))
      return specifier.imported.name;
    if (
      member &&
      j.Identifier.check(member.property) &&
      (j.ImportNamespaceSpecifier.check(specifier) || j.ImportDefaultSpecifier.check(specifier))
    ) {
      return member.property.name;
    }
  }

  let changed = false;

  root.find(j.CallExpression).forEach((path) => {
    const args = path.node.arguments;
    if (args.length !== 1 || !j.ObjectExpression.check(args[0])) return;

    const name = arbitraryName(path);
    const isJson = name === 'json' || name === 'jsonValue';
    if (!isJson && name !== 'object' && name !== 'anything') return;
    const flag = isJson ? 'noUnicodeString' : 'withUnicodeString';
    let property;
    let hasStringUnit = false;
    for (const entry of args[0].properties) {
      if (!j.ObjectProperty.check(entry) || entry.computed || !j.Identifier.check(entry.key)) return;
      if (entry.key.name === 'stringUnit') hasStringUnit = true;
      if (entry.key.name === flag) {
        if (property) return;
        property = entry;
      }
    }
    if (!property || !j.BooleanLiteral.check(property.value)) return;

    if (hasStringUnit) {
      args[0].properties = args[0].properties.filter((entry) => entry !== property);
    } else {
      const unicode = isJson ? !property.value.value : property.value.value;
      const value = j.stringLiteral(unicode ? 'binary' : 'grapheme-ascii');
      property.key = Object.assign(j.identifier('stringUnit'), { comments: property.key.comments });
      value.comments = property.value.comments;
      property.value = value;
    }
    changed = true;
  });

  return changed ? root.toSource({ quote: 'single' }) : file.source;
}
