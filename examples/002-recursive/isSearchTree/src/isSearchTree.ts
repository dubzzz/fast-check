export interface Tree<T> {
  value: T;
  left: Tree<T> | null;
  right: Tree<T> | null;
}

export function isSearchTree(t: Tree<number>, minValue?: number, maxValue?: number): boolean {
  if (minValue !== undefined && t.value <= minValue) {
    return false;
  }
  if (maxValue !== undefined && t.value > maxValue) {
    return false;
  }
  if (t.left !== null && !isSearchTree(t.left, minValue, t.value)) {
    return false;
  }
  if (t.right !== null && !isSearchTree(t.right, t.value, maxValue)) {
    return false;
  }
  return true;
}
