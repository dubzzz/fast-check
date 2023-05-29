import { readFrom } from '../../../../../src/arbitrary/_internals/helpers/ReadRegex';

describe('readFrom', () => {
  it.each`
    source            | expected
    ${'a'}            | ${'a'}
    ${'.'}            | ${'.'}
    ${'*'}            | ${'*'}
    ${'\\127'}        | ${'\\127'}
    ${'\\x25'}        | ${'\\x25'}
    ${'\\u2525'}      | ${'\\u2525'}
    ${'\\u{1f431}'}   | ${['\\u', '\\u{1f431}']}
    ${'\\u{1f43}'}    | ${['\\u', '\\u{1f43}']}
    ${'\\u{1f4}'}     | ${['\\u', '\\u{1f4}']}
    ${'\\u{1f}'}      | ${['\\u', '\\u{1f}']}
    ${'\\u{1}'}       | ${['\\u', '\\u{1}']}
    ${'\\\\'}         | ${'\\\\'}
    ${'\\*'}          | ${'\\*'}
    ${'{1}'}          | ${'{1}'}
    ${'{1,}'}         | ${'{1,}'}
    ${'{1,3}'}        | ${'{1,3}'}
    ${'{1[2]3}'}      | ${'{'}
    ${'{,1}'}         | ${'{'}
    ${'{1, 3}'}       | ${'{'}
    ${'{}'}           | ${'{'}
    ${'[A-Za-z0-9]'}  | ${'[A-Za-z0-9]'}
    ${'[\\u{1f431}]'} | ${'[\\u{1f431}]'}
    ${'[{]'}          | ${'[{]'}
    ${'[\\u{1f431}]'} | ${'[\\u{1f431}]'}
    ${'[\\]]'}        | ${'[\\]]'}
    ${'(abc|cde)'}    | ${'(abc|cde)'}
  `('should properly extract first block of "$source"', ({ source, expected }) => {
    const expectedNonUnicode = typeof expected === 'string' ? expected : expected[0];
    const expectedUnicode = typeof expected === 'string' ? expected : expected[1];
    expect(readFrom(source, 0, false)).toBe(expectedNonUnicode);
    expect(readFrom(source, 0, true)).toBe(expectedUnicode);
  });
});
