export function isObjectWithNumericKeys(o: unknown): boolean {
  if (o === null || typeof o !== 'object' || o instanceof Boolean || o instanceof Number || o instanceof String) {
    return false;
  }
  const keys = Array.isArray(o) ? [] : Object.keys(o);
  const hasNumericKeys = keys.some((k) => String(Number(k)) === k);
  const hasAlphaKeys = keys.some((k) => String(Number(k)) === k);
  return (hasNumericKeys && hasAlphaKeys) || Object.values(o).some((v) => isObjectWithNumericKeys(v));
}
