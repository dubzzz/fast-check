import { stringToBase64Unmapper } from '../../../../../src/arbitrary/_internals/mappers/StringToBase64';

describe('stringToBase64Unmapper', () => {
  it.each`
    source        | expected
    ${'aaaa'}     | ${'aaaa'}
    ${'aaa='}     | ${'aaa'}
    ${'aa=='}     | ${'aa'}
    ${'abcdefgh'} | ${'abcdefgh'}
    ${'aàaa'}     | ${'aàaa' /* not rejected by this unmapper as it does not deal with first bytes */}
  `('should be able to unmap $source', ({ source, expected }) => {
    // Arrange / Act / Assert
    expect(stringToBase64Unmapper(source)).toEqual(expected);
  });

  it.each`
    source
    ${'aaaaa'}
    ${'a==='}
  `('should refuse to unmap invalid base64 strings like $source', ({ source }) => {
    // Arrange / Act / Assert
    expect(() => stringToBase64Unmapper(source)).toThrowError();
  });
});
