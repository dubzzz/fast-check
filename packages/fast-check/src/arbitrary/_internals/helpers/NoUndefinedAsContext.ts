import { Value } from '../../../check/arbitrary/definition/Value.js';

/** @internal */
export const UndefinedContextPlaceholder: unique symbol = Symbol('UndefinedContextPlaceholder');

/** @internal */
export function noUndefinedAsContext<Ts>(value: Value<Ts>): Value<Ts> {
  if (value.context !== undefined) {
    return value;
  }
  if (value.hasToBeCloned) {
    return new Value(value.value_, UndefinedContextPlaceholder, () => value.value);
  }
  return new Value(value.value_, UndefinedContextPlaceholder);
}
