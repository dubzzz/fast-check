import fc from 'fast-check';
import {
  segmentsToPathMapper,
  segmentsToPathUnmapper,
} from '../../../../../src/arbitrary/_internals/mappers/SegmentsToPath';

describe('segmentsToPathUnmapper', () => {
  it('should be able to unmap any mapped value', () =>
    fc.assert(
      fc.property(fc.array(fc.webSegment()), (segments) => {
        // Arrange
        const mapped = segmentsToPathMapper(segments);

        // Act
        const out = segmentsToPathUnmapper(mapped);

        // Assert
        expect(out).toEqual(segments);
      })
    ));
});
