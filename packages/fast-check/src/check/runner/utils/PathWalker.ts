import { Value } from '../../arbitrary/definition/Value';
import { Stream } from '../../../stream/Stream';

/** @internal */
export function pathWalk<Ts>(
  path: string,
  initialValues: Stream<Value<Ts>>,
  shrink: (value: Value<Ts>) => Stream<Value<Ts>>
): Stream<Value<Ts>> {
  let values: Stream<Value<Ts>> = initialValues;
  const segments: number[] = path.split(':').map((text: string) => +text);
  if (segments.length === 0) {
    return values;
  }
  if (!segments.every((v) => !Number.isNaN(v))) {
    throw new Error(`Unable to replay, got invalid path=${path}`);
  }
  values = values.drop(segments[0]);
  for (const s of segments.slice(1)) {
    const valueToShrink = values.getNthOrLast(0);
    if (valueToShrink == null) {
      throw new Error(`Unable to replay, got wrong path=${path}`);
    }
    values = shrink(valueToShrink).drop(s);
  }
  return values;
}
