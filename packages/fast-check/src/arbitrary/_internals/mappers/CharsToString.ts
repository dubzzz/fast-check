export function charsToStringMapper(tab: string[]): string {
  return tab.join('');
}

export function charsToStringUnmapper(value: unknown): string[] {
  if (typeof value !== 'string') {
    throw new Error('Cannot unmap the passed value');
  }
  return value.split('');
}
