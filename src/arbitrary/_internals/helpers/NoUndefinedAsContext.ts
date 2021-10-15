import { NextValue } from '../../../check/arbitrary/definition/NextValue';

/** @internal */
export const UndefinedContextPlaceholder = Symbol('UndefinedContextPlaceholder');

/** @internal */
export function noUndefinedAsContext<Ts>(value: NextValue<Ts>): NextValue<Ts> {
  if (value.context !== undefined) {
    return value;
  }
  if (value.hasToBeCloned) {
    return new NextValue(value.value_, UndefinedContextPlaceholder, () => value.value);
  }
  return new NextValue(value.value_, UndefinedContextPlaceholder);
}
