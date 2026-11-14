export function mergePaths(offsetPath: string, path: string): string {
  if (offsetPath.length === 0) return path;
  const offsetItems = offsetPath.split(':');
  const remainingItems = path.split(':');
  const middle = +offsetItems[offsetItems.length - 1] + +remainingItems[0];
  return [...offsetItems.slice(0, offsetItems.length - 1), `${middle}`, ...remainingItems.slice(1)].join(':');
}
