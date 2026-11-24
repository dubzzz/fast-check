import type { API, FileInfo } from 'jscodeshift';
import { withComments } from '../ast.js';
import { isVariable, referencesOf } from '../bindings.js';
import { isFastCheckMember } from '../fastCheck.js';
import { namedImports, renameImport } from '../imports.js';
import { parseFile } from '../transformFile.js';

export default function transform(file: FileInfo, api: API): string {
  const { j, root, print } = parseFile(file, api);
  let changed = false;
  const propertyInUse = root.find(j.Identifier, { name: 'property' }).some((path) => isVariable(j, path));

  root.find(j.MemberExpression).forEach((path) => {
    if (isFastCheckMember(j, path, path.node, 'asyncProperty')) {
      path.node.property.name = 'property';
      changed = true;
    }
  });
  const imports = root.find(j.ImportDeclaration);
  namedImports(j, imports, 'fast-check', 'asyncProperty').forEach((path) => {
    const specifier = path.node;
    let local = specifier.local;
    if (local?.name === 'asyncProperty' && !propertyInUse) {
      const references = referencesOf(j, path.get('local'));
      references.forEach((path) => {
        const parent = path.parent.node;
        if ((j.Property.check(parent) || j.ObjectProperty.check(parent)) && parent.shorthand) parent.shorthand = false;
        const renamed = withComments(j.identifier('property'), path.node);
        if (j.ExportSpecifier.check(parent)) path.parent.replace(j.exportSpecifier.from({ ...parent, local: renamed }));
        else path.replace(renamed);
      });
      local = j.identifier('property');
    }
    changed = true;
    path.replace(renameImport(j, specifier, 'property', local));
  });
  return print(changed);
}
