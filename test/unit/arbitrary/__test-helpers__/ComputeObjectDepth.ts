export function computeObjectDepth(o: unknown): number {
  if (o === null || typeof o !== 'object') {
    return 0;
  }
  return 1 + Math.max(...[...Object.values(o!)].map((v) => computeObjectDepth(v)));
}
