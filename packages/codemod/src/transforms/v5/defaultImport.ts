import type { API, FileInfo } from 'jscodeshift';
import { reportUnsupported } from '../reportUnsupported.js';

export default function transform(file: FileInfo, api: API): string {
  const parser = /\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx';
  const j = api.jscodeshift.withParser(parser);
  const root = j(file.source);
  let changed = false;

  root.find(j.ImportDeclaration, { source: { value: 'fast-check' } }).forEach((path) => {
    const node = path.node;
    const specifiers = node.specifiers ?? [];
    const defaultSpecifier = specifiers.find((specifier) => specifier.type === 'ImportDefaultSpecifier');
    if (defaultSpecifier === undefined) {
      return;
    }
    if ('attributes' in node && Array.isArray(node.attributes) && node.attributes.length !== 0) {
      reportUnsupported(api, node, 'Cannot migrate a fast-check default import with attributes; migrate it manually.');
      return;
    }

    const namespace = j.importNamespaceSpecifier(defaultSpecifier.local);
    namespace.comments = defaultSpecifier.comments;
    const remainingSpecifiers = specifiers.filter((specifier) => specifier !== defaultSpecifier);
    if (remainingSpecifiers.length !== 0) {
      // Namespace and named imports cannot share a declaration.
      path.insertAfter({ ...node, specifiers: remainingSpecifiers, comments: null });
    }
    node.specifiers = [namespace];
    changed = true;
  });

  return changed ? root.toSource({ quote: 'single' }) : file.source;
}
