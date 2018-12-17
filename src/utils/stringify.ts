/** @hidden */
function stringifyOne<Ts>(value: Ts): string {
  if (typeof value === 'string') return JSON.stringify(value);

  const defaultRepr: string = `${value}`;
  if (/^\[object (Object|Null|Undefined)\]$/.exec(defaultRepr) === null) return defaultRepr;
  try {
    return JSON.stringify(value, (k, v) => {
      if (typeof v === 'bigint') {
        return v.toString() + 'n';
      } else {
        return v;
      }
    });
  } catch (err) {
    // ignored: object cannot be stringified using JSON.stringify
  }
  return defaultRepr;
}

/** @hidden */
export function stringify<Ts>(value: Ts): string {
  if (Array.isArray(value)) return `[${value.map(stringify).join(',')}]`;
  return stringifyOne(value);
}
