import type { FileInfo, Identifier, ImportDeclaration, JSCodeshift, StringLiteral } from 'jscodeshift';

export default function transform(file: FileInfo, api: { jscodeshift: JSCodeshift }): string {
  const parser = /\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx';
  const j = api.jscodeshift.withParser(parser);
  const root = j(file.source);
  let changed = false;

  root.find(j.ImportDeclaration, { source: { value: 'fast-check' } }).forEach((path) => {
    const node = path.node;
    // Recast does not yet print import attributes; leave them intact.
    if ('attributes' in node && Array.isArray(node.attributes) && node.attributes.length !== 0) {
      return;
    }
    const imports: ImportDeclaration[] = [];
    const remainingSpecifiers = [];
    for (const specifier of node.specifiers ?? []) {
      // ast-types does not yet include string literals in its import name type.
      const imported =
        specifier.type === 'ImportSpecifier' ? (specifier.imported as Identifier | StringLiteral) : undefined;
      const isDefault =
        specifier.type === 'ImportDefaultSpecifier' ||
        (imported?.type === 'StringLiteral' ? imported.value === 'default' : imported?.name === 'default');
      if (!isDefault) {
        remainingSpecifiers.push(specifier);
        continue;
      }
      const namespace = j.importNamespaceSpecifier(specifier.local);
      namespace.comments = specifier.comments;
      imports.push({
        ...node,
        specifiers: [namespace],
        importKind: 'importKind' in specifier && specifier.importKind === 'type' ? 'type' : node.importKind,
        comments: null,
      });
    }
    if (imports.length === 0) {
      return;
    }
    if (remainingSpecifiers.length !== 0) {
      // Namespace and named imports cannot share a declaration.
      imports.push({ ...node, specifiers: remainingSpecifiers, comments: null });
    }
    // Keep the original declaration for its comments and formatting.
    node.specifiers = imports[0].specifiers;
    node.importKind = imports[0].importKind;
    path.replace(node, ...imports.slice(1));
    changed = true;
  });

  return changed ? root.toSource({ quote: 'single' }) : file.source;
}
