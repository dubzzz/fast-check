import type { API, Node } from 'jscodeshift';

export function reportUnsupported(api: API, node: Node, message: string): void {
  const start = node.loc?.start;
  const location = start ? ` (${start.line}:${start.column + 1})` : '';
  // The jscodeshift runner prefixes reports with the current file path.
  api.report(`warning${location}: ${message}`);
}
