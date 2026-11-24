import type { API, FileInfo } from 'jscodeshift';
import { withComments } from '../ast.js';
import { parseFile } from '../transformFile.js';

export default function transform(file: FileInfo, api: API): string {
  const { j, root, report, print } = parseFile(file, api);
  let changed = false;

  root.find(j.ImportDeclaration, { source: { value: 'fast-check' } }).forEach((path) => {
    const node = path.node;
    const specifiers = node.specifiers ?? [];
    const defaultSpecifier = specifiers.find((specifier) => specifier.type === 'ImportDefaultSpecifier');
    if (defaultSpecifier === undefined) return;
    if ('attributes' in node && Array.isArray(node.attributes) && node.attributes.length !== 0) {
      report(node, 'Cannot migrate a fast-check default import with attributes; migrate it manually.');
      return;
    }

    const namespace = withComments(j.importNamespaceSpecifier(defaultSpecifier.local), defaultSpecifier);
    const remainingSpecifiers = specifiers.filter((specifier) => specifier !== defaultSpecifier);
    if (remainingSpecifiers.length !== 0) {
      // Namespace and named imports cannot share a declaration.
      path.insertAfter({ ...node, specifiers: remainingSpecifiers, comments: null });
    }
    node.specifiers = [namespace];
    changed = true;
  });

  return print(changed);
}
