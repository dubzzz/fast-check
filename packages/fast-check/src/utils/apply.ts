const untouchedApply = Function.prototype.apply;
const ApplySymbol = Symbol('apply');

/**
 * Extract apply or return undefined
 * @param f - Function to extract apply from
 * @internal
 */
function safeExtractApply<T, TArgs extends unknown[], TReturn>(
  f: (this: T, ...args: TArgs) => TReturn,
): ((thisArg: T) => TReturn) | undefined {
  try {
    return f.apply;
  } catch {
    return undefined;
  }
}

/**
 * Equivalent to `f.apply(instance, args)` but temporary altering the instance
 * @internal
 */
function safeApplyHacky<T, TArgs extends unknown[], TReturn>(
  f: (this: T, ...args: TArgs) => TReturn,
  instance: T,
  args: TArgs,
): TReturn {
  const ff: typeof f & { [ApplySymbol]?: typeof untouchedApply } = f;
  ff[ApplySymbol] = untouchedApply;
  const out = ff[ApplySymbol](instance, args);
  delete ff[ApplySymbol];
  return out;
}

/**
 * Equivalent to `f.apply(instance, args)`
 * @internal
 */
export function safeApply<T, TArgs extends unknown[], TReturn>(
  f: (this: T, ...args: TArgs) => TReturn,
  instance: T,
  args: TArgs,
): TReturn {
  // Not as safe as checking the descriptor of the property but much faster
  // Can be by-passed by an appropriate getter property on 'apply'
  if (safeExtractApply(f) === untouchedApply) {
    return f.apply(instance, args);
  }
  return safeApplyHacky(f, instance, args);
}
