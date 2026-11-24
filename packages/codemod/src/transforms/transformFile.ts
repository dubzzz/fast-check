import type { API, Collection, FileInfo, JSCodeshift, Node } from 'jscodeshift';

export type Report = (node: Node, message: string) => void;

interface TransformFile {
  j: JSCodeshift;
  root: Collection;
  typescript: boolean;
  report: Report;
  print: (changed?: boolean) => string;
}

export function parseFile(file: FileInfo, api: API): TransformFile {
  const j = api.jscodeshift.withParser(/\.[cm]?ts$/.test(file.path) ? 'ts' : 'tsx');
  const root = j(file.source);
  return {
    j,
    root,
    typescript: /\.[cm]?tsx?$/.test(file.path),
    report(node, message) {
      const start = node.loc?.start;
      const location = start ? ` (${start.line}:${start.column + 1})` : '';
      api.report(`warning${location}: ${message}`);
    },
    print: (changed = true) => (changed ? root.toSource({ quote: 'single' }) : file.source),
  };
}
