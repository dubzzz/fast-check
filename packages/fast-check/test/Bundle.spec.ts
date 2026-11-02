import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe(`Bundle`, () => {
  it('should not export check', () => {
    expect(fc).not.toHaveProperty('check');
  });

  it('should be packaged with the right commit SHA1', () => {
    // Arrange
    const expectedCommitHash = process.env.GITHUB_SHA;

    // Act / Assert
    if (process.env.EXPECT_COMMIT_HASH || process.env.GITHUB_ACTION) {
      expect(expectedCommitHash).toBeDefined();
      expect(fc.__commitHash).toBe(expectedCommitHash);
    }
  });
});
