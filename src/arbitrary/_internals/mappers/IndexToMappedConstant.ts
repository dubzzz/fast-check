/** @internal */
export function indexToMappedConstantMapperFor<T>(
  entries: { num: number; build: (idInGroup: number) => T }[]
): (index: number) => T {
  return function indexToMappedConstantMapper(choiceIndex: number): T {
    let idx = -1;
    let numSkips = 0;
    while (choiceIndex >= numSkips) {
      numSkips += entries[++idx].num;
    }
    return entries[idx].build(choiceIndex - numSkips + entries[idx].num);
  };
}
