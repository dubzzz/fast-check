import { Stream, stream } from '../../../stream/Stream';
import Shrinkable from '../../arbitrary/definition/Shrinkable';

export function pathWalk<Ts>(
  path: string,
  initialValues: IterableIterator<Shrinkable<Ts>>
): IterableIterator<Shrinkable<Ts>> {
  let values: Stream<Shrinkable<Ts>> = stream(initialValues);
  const segments: number[] = path.split(':').map((text: string) => +text);
  if (segments.length === 0) return values;
  values = values.drop(segments[0]);
  for (const s of segments.slice(1)) {
    // tslint:disable-next-line:no-non-null-assertion
    values = values
      .getNthOrLast(0)!
      .shrink()
      .drop(s);
  }
  return values;
}
