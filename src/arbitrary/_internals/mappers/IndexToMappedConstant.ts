/** @internal */
export function indexToMappedConstantMapperFor<T>(
  entries: { num: number; build: (idInGroup: number) => T }[]
): (choiceIndex: number) => T {
  return function indexToMappedConstantMapper(choiceIndex: number): T {
    let idx = -1;
    let numSkips = 0;
    while (choiceIndex >= numSkips) {
      numSkips += entries[++idx].num;
    }
    return entries[idx].build(choiceIndex - numSkips + entries[idx].num);
  };
}

/** @internal */
type ReverseMapping = { mapping: Map<unknown, number>; negativeZeroIndex: number | undefined };

/** @internal */
function buildReverseMapping(entries: { num: number; build: (idInGroup: number) => unknown }[]): ReverseMapping {
  const reverseMapping: ReverseMapping = { mapping: new Map(), negativeZeroIndex: undefined };
  let choiceIndex = 0;
  for (let entryIdx = 0; entryIdx !== entries.length; ++entryIdx) {
    const entry = entries[entryIdx];
    for (let idxInEntry = 0; idxInEntry !== entry.num; ++idxInEntry) {
      const value = entry.build(idxInEntry);
      if (Object.is(value, -0)) {
        reverseMapping.negativeZeroIndex = choiceIndex;
      } else {
        reverseMapping.mapping.set(value, choiceIndex);
      }
      ++choiceIndex;
    }
  }
  return reverseMapping;
}

/** @internal */
export function indexToMappedConstantUnmapperFor<T>(
  entries: { num: number; build: (idInGroup: number) => T }[]
): (value: unknown) => number {
  let reverseMapping: ReverseMapping | null = null;
  return function indexToMappedConstantUnmapper(value: unknown): number {
    if (reverseMapping === null) {
      reverseMapping = buildReverseMapping(entries);
    }
    const choiceIndex = Object.is(value, -0) ? reverseMapping.negativeZeroIndex : reverseMapping.mapping.get(value);
    if (choiceIndex === undefined) {
      throw new Error('Unknown value encountered cannot be built using this mapToConstant');
    }
    return choiceIndex;
  };
}
