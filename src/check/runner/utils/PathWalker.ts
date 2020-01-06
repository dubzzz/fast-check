import { Stream, stream } from '../../../stream/Stream';
import { Shrinkable } from '../../arbitrary/definition/Shrinkable';

/** @internal */
export function pathWalk<Ts>(
  path: string,
  initialValues: IterableIterator<Shrinkable<Ts>>
): IterableIterator<Shrinkable<Ts>> {
  let values: Stream<Shrinkable<Ts>> = stream(initialValues);
  const segments: number[] = path.split(':').map((text: string) => +text);
  if (segments.length === 0) return values;
  if (!segments.every(v => !Number.isNaN(v))) {
    throw new Error(`Unable to replay, got invalid path=${path}`);
  }
  values = values.drop(segments[0]);
  for (const s of segments.slice(1)) {
    const valueToShrink = values.getNthOrLast(0);
    if (valueToShrink == null) {
      throw new Error(`Unable to replay, got wrong path=${path}`);
    }
    values = valueToShrink.shrink().drop(s);
  }
  return values;
}
