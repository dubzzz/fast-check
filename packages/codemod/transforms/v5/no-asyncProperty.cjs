const traverse = require('@babel/traverse').default;

module.exports = function transform(file, api) {
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
        if (specifier.importKind === 'type') {
          continue;
        }
        const localName = specifier.local.name;
        const binding = path.scope.getBinding(localName);
        if (specifier.type === 'ImportSpecifier' && specifier.imported.name === 'asyncProperty') {
          // Keep aliases, including one when renaming would capture an existing `property`.
          if (
            localName === 'asyncProperty' &&
            !binding.scope.hasBinding('property') &&
            !binding.scope.hasGlobal('property') &&
            !binding.referencePaths.some((reference) => reference.scope.hasBinding('property'))
          ) {
            binding.scope.rename(localName, 'property');
          }
          const replacement = j.importSpecifier(j.identifier('property'), j.identifier(specifier.local.name));
          replacement.comments = specifier.comments;
          path.node.specifiers[index] = replacement;
          changed = true;
        } else if (
          specifier.type === 'ImportDefaultSpecifier' ||
          specifier.type === 'ImportNamespaceSpecifier' ||
          (specifier.type === 'ImportSpecifier' && specifier.imported.name === 'default')
        ) {
          for (const reference of binding.referencePaths) {
            const member = reference.parentPath.node;
            if (
              reference.key === 'object' &&
              (member.type === 'MemberExpression' || member.type === 'OptionalMemberExpression')
            ) {
              if (!member.computed && member.property.name === 'asyncProperty') {
                member.property.name = 'property';
                changed = true;
              } else if (member.computed && member.property.value === 'asyncProperty') {
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
};
