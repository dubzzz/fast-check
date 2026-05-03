export function readNumRunsOverride(): number | undefined {
  const raw = process.env.FAST_CHECK_VITEST_NUM_RUNS;
  if (raw === undefined) return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.floor(parsed);
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function functionNeedsG(fn: Function): boolean {
  if (fn.length === 0) return false;

  let src = fn.toString().trim();
  src = src.replace(/^async\s+/, '');
  src = src.replace(/^function\s*\w*\s*/, '');

  if (src.startsWith('(')) {
    let depth = 0;
    let end = -1;
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (c === '(') depth++;
      else if (c === ')') {
        if (--depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) return true;
    const params = src.slice(1, end);
    return /\bg\b/.test(params);
  }

  const m = /^(\w+)\s*=>/.exec(src);
  if (m) return m[1] === 'g';

  return true;
}
