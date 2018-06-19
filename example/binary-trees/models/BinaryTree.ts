export interface Tree<T> {
  value: T;
  left: Tree<T> | null;
  right: Tree<T> | null;
}
