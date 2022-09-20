import { __commitHash } from 'fast-check';

describe(`Bundle`, () => {
  it('should be packaged with the right commit SHA1', () => {
    // Arrange
    const expectedCommitHash = process.env.GITHUB_SHA;

    // Act / Assert
    if (process.env.EXPECT_COMMIT_HASH || process.env.GITHUB_ACTION) {
      expect(expectedCommitHash).toBeDefined();
      expect(__commitHash).toBe(expectedCommitHash);
    }
  });
});
