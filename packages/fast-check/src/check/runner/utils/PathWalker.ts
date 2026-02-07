import type { Value } from '../../arbitrary/definition/Value.js';
import type { Stream } from '../../../stream/Stream.js';

/** @internal */
function produce<Ts>(producer: () => Value<Ts>): Value<Ts> {
  return producer();
}

/** @internal */
export function pathWalk<Ts>(
  path: string,
  initialProducers: Stream<() => Value<Ts>>,
  shrink: (value: Value<Ts>) => Stream<Value<Ts>>,
): Stream<Value<Ts>> {
  const producers: Stream<() => Value<Ts>> = initialProducers;
  const segments: number[] = path.split(':').map((text: string) => +text);
  if (segments.length === 0) {
    return producers.map(produce);
  }
  if (!segments.every((v) => !Number.isNaN(v))) {
    throw new Error(`Unable to replay, got invalid path=${path}`);
  }
  let values: Stream<Value<Ts>> = producers.drop(segments[0]).map(produce);
  for (const s of segments.slice(1)) {
    const valueToShrink = values.getNthOrLast(0);
    if (valueToShrink === null) {
      throw new Error(`Unable to replay, got wrong path=${path}`);
    }
    values = shrink(valueToShrink).drop(s);
  }
  return values;
}
