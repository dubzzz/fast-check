import babelTraverse from '@babel/traverse';
import type { FileInfo, JSCodeshift } from 'jscodeshift';

const traverse = 'default' in babelTraverse ? babelTraverse.default : babelTraverse;

export default function transform(file: FileInfo, api: { jscodeshift: JSCodeshift }): string {
  const parser = /\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx';
  const j = api.jscodeshift.withParser(parser);
  const root = j(file.source);
  let changed = false;

  traverse(root.get().node, {
    ImportDeclaration(path) {
      if (path.node.source.value !== 'fast-check' || path.node.importKind === 'type') {
        return;
      }
      for (const [index, specifier] of path.node.specifiers.entries()) {
        if (specifier.type === 'ImportSpecifier' && specifier.importKind === 'type') {
          continue;
        }
        const localName = specifier.local.name;
        const binding = path.scope.getBinding(localName);
        if (binding === undefined) {
          continue;
        }
        const importedName =
          specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier'
            ? specifier.imported.name
            : undefined;
        if (specifier.type === 'ImportSpecifier' && importedName === 'asyncProperty') {
          // Keep aliases, including one when renaming would capture an existing `property`.
          if (
            localName === 'asyncProperty' &&
            !binding.scope.hasBinding('property') &&
            !binding.scope.hasGlobal('property') &&
            !binding.referencePaths.some((reference) => reference.scope.hasBinding('property'))
          ) {
            binding.scope.rename(localName, 'property');
          }
          path.node.specifiers[index] = {
            type: 'ImportSpecifier',
            imported: { type: 'Identifier', name: 'property' },
            local: { type: 'Identifier', name: specifier.local.name },
            ...('comments' in specifier ? { comments: specifier.comments } : {}),
          };
          changed = true;
        } else if (
          specifier.type === 'ImportDefaultSpecifier' ||
          specifier.type === 'ImportNamespaceSpecifier' ||
          importedName === 'default'
        ) {
          for (const reference of binding.referencePaths) {
            const member = reference.parentPath?.node;
            if (
              reference.key === 'object' &&
              (member?.type === 'MemberExpression' || member?.type === 'OptionalMemberExpression')
            ) {
              if (
                !member.computed &&
                member.property.type === 'Identifier' &&
                member.property.name === 'asyncProperty'
              ) {
                member.property.name = 'property';
                changed = true;
              } else if (
                member.computed &&
                member.property.type === 'StringLiteral' &&
                member.property.value === 'asyncProperty'
              ) {
                member.property.value = 'property';
                changed = true;
              }
            }
          }
        }
      }
    },
  });

  return changed ? root.toSource({ quote: 'single' }) : file.source;
}
