/**
 * Typeguard to ensure a value is never there
 * @param value The value that should not exist
 * @param returnedValue The value to be returned
 */
export function noSuchValue<TReturn>(_value: never, returnedValue: TReturn): TReturn {
  return returnedValue;
}
