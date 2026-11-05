export function insertionSort(values: readonly number[]): number[] {
  const sorted: number[] = [];
  for (const value of values) {
    const index = sorted.findIndex((other) => other > value);
    if (index === -1) {
      sorted.push(value);
    } else {
      sorted.splice(index, 0, value);
    }
  }
  return sorted;
}
