import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_REGEX_FLAGS,
  hasUnicodeSetsOnlyGrammar,
} from '../../../../../src/arbitrary/_internals/helpers/RegexFlags.js';

describe('SUPPORTED_REGEX_FLAGS', () => {
  it.each(['d', 'g', 'm', 's', 'u', 'v'])('should include the %s flag', (flag) => {
    expect(SUPPORTED_REGEX_FLAGS.has(flag)).toBe(true);
  });

  it.each(['i', 'y'])('should not include the %s flag', (flag) => {
    expect(SUPPORTED_REGEX_FLAGS.has(flag)).toBe(false);
  });
});

describe('hasUnicodeSetsOnlyGrammar', () => {
  it.each`
    source                         | label
    ${'[\\p{ASCII}&&\\p{Any}]'}    | ${'set intersection with property escapes'}
    ${'[a&&b]'}                    | ${'set intersection with literals'}
    ${'[\\p{ASCII}--\\p{Letter}]'} | ${'set difference'}
    ${'[a--b]'}                    | ${'set difference with literals'}
    ${'[[a-z]&&[^aeiou]]'}         | ${'nested character classes'}
    ${'[[abc]]'}                   | ${'minimal nested character class'}
    ${'[\\q{ab|cd}]'}              | ${'string-literal class'}
  `('should flag $label as v-only grammar', ({ source }: { source: string }) => {
    expect(hasUnicodeSetsOnlyGrammar(source)).toBe(true);
  });

  it.each`
    source             | label
    ${''}              | ${'empty source'}
    ${'abc'}           | ${'plain literals'}
    ${'[abc]'}         | ${'simple character class'}
    ${'[a-z]'}         | ${'character class with a range'}
    ${'[^abc]'}        | ${'negated character class'}
    ${'[a\\-b]'}       | ${'escaped dash in class'}
    ${'[a\\]b]'}       | ${'escaped closing bracket in class'}
    ${'[\\w\\d\\s]'}   | ${'meta characters in class'}
    ${'[\\p{Letter}]'} | ${'unicode property escape in class'}
    ${'[\\u{1f431}]'}  | ${'code-point escape in class'}
    ${'a&&b'}          | ${'double ampersand outside of class'}
    ${'a--b'}          | ${'double dash outside of class'}
    ${'\\q{foo}'}      | ${'backslash-q outside of class'}
    ${'[a\\-]'}        | ${'trailing escaped dash'}
    ${'[-a-]'}         | ${'leading and trailing literal dashes'}
  `('should accept $label', ({ source }: { source: string }) => {
    expect(hasUnicodeSetsOnlyGrammar(source)).toBe(false);
  });
});
