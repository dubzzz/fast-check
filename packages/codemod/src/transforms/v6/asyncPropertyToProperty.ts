import type { API, FileInfo } from 'jscodeshift';
import { memberName } from '../fastCheck.js';

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  let changed = false;

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
      // Preserve the local binding so references and shadowed names can stay as written.
      changed = true;
      const local = j.identifier(j.Identifier.check(specifier.local) ? specifier.local.name : 'asyncProperty');
      const renamed = j.importSpecifier(j.identifier('property'), local);
      renamed.comments = specifier.comments;
      if ('importKind' in specifier) Object.assign(renamed, { importKind: specifier.importKind });
      return renamed;
    });
  });
  return changed ? root.toSource({ quote: 'single' }) : file.source;
}
