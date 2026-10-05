type Entry<T> = { num: number; build: (idInGroup: number) => T };

type DicothomyEntry<T> = { from: number; to: number; entry: Pick<Entry<T>, 'build'> };

function buildDichotomyEntries<T>(entries: Entry<T>[]): DicothomyEntry<T>[] {
  let currentFrom = 0;
  const dichotomyEntries: DicothomyEntry<T>[] = [];
  for (const entry of entries) {
    const from = currentFrom;
    currentFrom = from + entry.num;
    const to = currentFrom - 1;
    dichotomyEntries.push({ from, to, entry });
  }
  return dichotomyEntries;
}

function findDichotomyEntry<T>(dichotomyEntries: DicothomyEntry<T>[], choiceIndex: number): DicothomyEntry<T> {
  let min = 0;
  let max = dichotomyEntries.length;
  while (max - min > 1) {
    const mid = ~~((min + max) / 2); // ~~ is Math.floor
    if (choiceIndex < dichotomyEntries[mid].from) {
      max = mid;
    } else {
      min = mid;
    }
  }
  return dichotomyEntries[min];
}

export function indexToMappedConstantMapperFor<T>(entries: Entry<T>[]): (choiceIndex: number) => T {
  const dichotomyEntries = buildDichotomyEntries(entries);
  return function indexToMappedConstantMapper(choiceIndex: number): T {
    const dichotomyEntry = findDichotomyEntry(dichotomyEntries, choiceIndex);
    return dichotomyEntry.entry.build(choiceIndex - dichotomyEntry.from);
  };
}

type ReverseMapping = { mapping: Map<unknown, number>; negativeZeroIndex: number | undefined };

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

export function indexToMappedConstantUnmapperFor<T>(
  entries: { num: number; build: (idInGroup: number) => T }[],
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
