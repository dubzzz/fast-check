/** @internal - tab is supposed to be composed of valid code-points, not halved surrogate pairs */
export function codePointAwareMapper(tab: string[]): string {
  return tab.join('');
}

/** @internal */
export function codePointAwareUnmapper(value: unknown): string[] {
  if (typeof value !== 'string') {
    throw new Error('Cannot unmap the passed value');
  }
  return [...value];
}
