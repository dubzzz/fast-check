import type { API, ASTPath, FileInfo, Identifier, JSCodeshift } from 'jscodeshift';
import { findBinding, memberName } from '../fastCheck.js';

function isVariable(j: JSCodeshift, path: ASTPath<Identifier>): boolean {
  const parent = path.parent.node;
  if (
    j.ImportSpecifier.check(parent) ||
    j.ImportDefaultSpecifier.check(parent) ||
    j.ImportNamespaceSpecifier.check(parent)
  )
    return path.name === 'local';
  if (j.ExportSpecifier.check(parent)) return path.name === 'local' && !path.parent.parent.node.source;
  if ((path.name === 'key' || path.name === 'property') && !parent.computed) return false;
  if (j.TSQualifiedName.check(parent) && path.name === 'right') return false;
  if (path.name === 'label') return false;
  return true;
}

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  let changed = false;
  const propertyInUse = root.find(j.Identifier, { name: 'property' }).some((path) => isVariable(j, path));

  root.find(j.MemberExpression).forEach((path) => {
    const key = path.node.property;
    if (j.Identifier.check(key) && memberName(j, path, path.node) === 'asyncProperty') {
      key.name = 'property';
      changed = true;
    }
  });
  root.find(j.ImportDeclaration, { source: { value: 'fast-check' } }).forEach(({ node }) => {
    node.specifiers = node.specifiers?.map((specifier) => {
      if (!j.ImportSpecifier.check(specifier) || specifier.imported.name !== 'asyncProperty') return specifier;
      let local = specifier.local;
      if (local?.name === 'asyncProperty' && !propertyInUse) {
        const references = root
          .find(j.Identifier, { name: 'asyncProperty' })
          .filter((path) => isVariable(j, path) && findBinding(j, path, 'asyncProperty')?.parent.node === specifier);
        references.forEach((path) => {
          const parent = path.parent.node;
          if ((j.Property.check(parent) || j.ObjectProperty.check(parent)) && parent.shorthand)
            parent.shorthand = false;
          const renamed = Object.assign(j.identifier('property'), { comments: path.node.comments });
          if (j.ExportSpecifier.check(parent))
            path.parent.replace(j.exportSpecifier.from({ ...parent, local: renamed }));
          else path.replace(renamed);
        });
        local = j.identifier('property');
      }
      changed = true;
      const renamed = j.importSpecifier(j.identifier('property'), local);
      renamed.comments = specifier.comments;
      if ('importKind' in specifier) Object.assign(renamed, { importKind: specifier.importKind });
      return renamed;
    });
  });
  return changed ? root.toSource({ quote: 'single' }) : file.source;
}
