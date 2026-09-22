import type { Value } from '../../arbitrary/definition/Value.js';
import { getNthOrLast } from '../../../utils/iterator.js';

/** @internal */
function produce<Ts>(producer: () => Value<Ts>): Value<Ts> {
  return producer();
}

/** @internal */
export function pathWalk<Ts>(
  path: string,
  initialProducers: IteratorObject<() => Value<Ts>>,
  shrink: (value: Value<Ts>) => IteratorObject<Value<Ts>>,
): IteratorObject<Value<Ts>> {
  const producers: IteratorObject<() => Value<Ts>> = initialProducers;
  const segments: number[] = path.split(':').map((text: string) => +text);
  if (segments.length === 0) {
    return producers.map(produce);
  }
  if (!segments.every((v) => !Number.isNaN(v))) {
    throw new Error(`Unable to replay, got invalid path=${path}`);
  }
  let values: IteratorObject<Value<Ts>> = producers.drop(segments[0]).map(produce);
  for (const s of segments.slice(1)) {
    const valueToShrink = getNthOrLast(values, 0);
    if (valueToShrink === null) {
      throw new Error(`Unable to replay, got wrong path=${path}`);
    }
    values = shrink(valueToShrink).drop(s);
  }
  return values;
}
