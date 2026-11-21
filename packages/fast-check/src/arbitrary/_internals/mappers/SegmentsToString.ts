import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';

export function segmentsToStringUnmapperFor(arbs: Arbitrary<string>[]): (value: unknown) => string[] {
  const minimumLengths = arbs.map((arb) => (arb.canShrinkWithoutContext('') ? 0 : 1));
  const minimumSuffixLengths = new Array<number>(arbs.length + 1);
  minimumSuffixLengths[arbs.length] = 0;
  for (let index = arbs.length - 1; index >= 0; --index) {
    minimumSuffixLengths[index] = minimumLengths[index] + minimumSuffixLengths[index + 1];
  }

  return function segmentsToStringUnmapper(value: unknown): string[] {
    if (typeof value !== 'string') {
      throw new Error('Unsupported value');
    }
    if (arbs.length === 0 || value.length < minimumSuffixLengths[0]) {
      if (arbs.length === 0 && value.length === 0) return [];
      throw new Error('Unable to unmap received string');
    }

    const chunks: string[] = [];
    const failedStarts = arbs.map(() => new Set<number>());
    const stack = [{ startIndex: 0, nextEndIndex: arbs.length === 1 ? value.length : minimumLengths[0] }];
    while (stack.length !== 0) {
      const partIndex = stack.length - 1;
      const frame = stack[partIndex];
      if (frame.nextEndIndex > value.length - minimumSuffixLengths[partIndex + 1]) {
        failedStarts[partIndex].add(frame.startIndex);
        stack.pop();
        chunks.pop();
        continue;
      }

      const endIndex = frame.nextEndIndex++;
      const chunk = value.substring(frame.startIndex, endIndex);
      if (!arbs[partIndex].canShrinkWithoutContext(chunk)) {
        continue;
      }
      if (partIndex === arbs.length - 1) {
        return [...chunks, chunk];
      }
      if (!failedStarts[partIndex + 1].has(endIndex)) {
        chunks.push(chunk);
        stack.push({
          startIndex: endIndex,
          nextEndIndex: partIndex + 2 === arbs.length ? value.length : endIndex + minimumLengths[partIndex + 1],
        });
      }
    }
    throw new Error('Unable to unmap received string');
  };
}
