import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  segmentsToPathMapper,
  segmentsToPathUnmapper,
} from '../../../../../src/arbitrary/_internals/mappers/SegmentsToPath.js';

describe('segmentsToPathUnmapper', () => {
  it('should be able to unmap any mapped value', async () =>
    await fc.assert(
      fc.asyncProperty(fc.array(fc.webSegment()), (segments) => {
        // Arrange
        const mapped = segmentsToPathMapper(segments);

        // Act
        const out = segmentsToPathUnmapper(mapped);

        // Assert
        expect(out).toEqual(segments);
      }),
    ));
});
