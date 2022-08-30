const safeObjectGetPrototypeOf = Object.getPrototypeOf;
const safeObjectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const untouchedPrototype = Function.prototype;
const untouchedApply = Function.prototype.apply;

const ApplySymbol = Symbol('apply');

/**
 * Equivalent to `f.apply(instance, args)` but temporary altering the instance
 * @internal
 */
function safeApplyHacky<T, TArgs extends unknown[], TReturn>(
  f: (this: T, ...args: TArgs) => TReturn,
  instance: T,
  args: TArgs
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
  args: TArgs
): TReturn {
  const fPrototype = safeObjectGetPrototypeOf(f);
  if (fPrototype === untouchedPrototype && safeObjectGetOwnPropertyDescriptor(f, 'apply') === undefined) {
    const functionApplyDesc = safeObjectGetOwnPropertyDescriptor(untouchedPrototype, 'apply');
    if (functionApplyDesc !== undefined && functionApplyDesc.value === untouchedApply) {
      return f.apply(instance, args);
    }
  }
  return safeApplyHacky(f, instance, args);
}
