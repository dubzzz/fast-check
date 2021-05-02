/** @internal */
export function notCodePointAwareMapper(tab: string[]): string {
  return tab.join('');
}

/** @internal */
export function notCodePointAwareUnmapper(value: unknown): string[] {
  if (typeof value !== 'string') {
    throw new Error('Cannot unmap the passed value');
  }
  return value.split('');
}
