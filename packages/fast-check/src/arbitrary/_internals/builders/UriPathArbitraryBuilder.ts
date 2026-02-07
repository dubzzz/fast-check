import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import type { Size } from '../helpers/MaxLengthFromMinLength.js';
import { webSegment } from '../../webSegment.js';
import { array } from '../../array.js';
import { segmentsToPathMapper, segmentsToPathUnmapper } from '../mappers/SegmentsToPath.js';
import { oneof } from '../../oneof.js';

/** @internal */
function sqrtSize(size: Size): [Size, Size] {
  switch (size) {
    case 'xsmall':
      return ['xsmall', 'xsmall']; // 1 = 1 x 1
    case 'small':
      return ['small', 'xsmall']; // 10 = 10 x 1
    case 'medium':
      return ['small', 'small']; // 100 = 10 x 10
    case 'large':
      return ['medium', 'small']; // 1000 = 100 x 10
    case 'xlarge':
      return ['medium', 'medium']; // 1000 = 100 x 10
  }
}

/** @internal */
function buildUriPathArbitraryInternal(segmentSize: Size, numSegmentSize: Size): Arbitrary<string> {
  return array(webSegment({ size: segmentSize }), { size: numSegmentSize }).map(
    segmentsToPathMapper,
    segmentsToPathUnmapper,
  );
}

/** @internal */
export function buildUriPathArbitrary(resolvedSize: Size): Arbitrary<string> {
  const [segmentSize, numSegmentSize] = sqrtSize(resolvedSize);
  if (segmentSize === numSegmentSize) {
    return buildUriPathArbitraryInternal(segmentSize, numSegmentSize);
  }
  return oneof(
    buildUriPathArbitraryInternal(segmentSize, numSegmentSize),
    buildUriPathArbitraryInternal(numSegmentSize, segmentSize),
  );
}
