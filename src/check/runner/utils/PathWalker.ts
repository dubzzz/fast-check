import { NextValue } from '../../../fast-check-default';
import { Stream, stream } from '../../../stream/Stream';

/** @internal */
export function pathWalk<Ts>(
  path: string,
  initialValues: IterableIterator<NextValue<Ts>>,
  shrink: (value: NextValue<Ts>) => Stream<NextValue<Ts>>
): IterableIterator<NextValue<Ts>> {
  let values: Stream<NextValue<Ts>> = stream(initialValues);
  const segments: number[] = path.split(':').map((text: string) => +text);
  if (segments.length === 0) return values;
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
