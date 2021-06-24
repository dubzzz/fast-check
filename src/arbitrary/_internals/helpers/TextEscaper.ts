/** @internal */
export function escapeForTemplateString(originalText: string): string {
  return originalText.replace(/([$`\\])/g, '\\$1').replace(/\r/g, '\\r');
}

/** @internal */
export function escapeForMultilineComments(originalText: string): string {
  return originalText.replace(/\*\//g, '*\\/');
}
